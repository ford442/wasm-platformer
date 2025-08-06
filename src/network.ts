// src/network.ts

import { db } from './firebase-config';
import { doc, setDoc, onSnapshot, updateDoc, Timestamp, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import Peer from 'simple-peer';


export class P2PNetwork {
    private peer: Peer.Instance | null = null;
    private unsubscribe: (() => void) | null = null;
    public onGameState: (state: any) => void = () => {};
    public onConnectionStateChange: (state: 'connected' | 'disconnected') => void = () => {};

  
    /**
     * Creates a new game lobby in Firestore and returns its unique ID.
     */
    async createGame(gameName: string): Promise<string> {
        const gameId = `game_${Math.random().toString(36).substr(2, 9)}`;
        const gameDocRef = doc(db, 'games', gameId);

        this.peer = new Peer({ initiator: true, trickle: false });

        this.peer.on('signal', async (offer) => {
            await setDoc(gameDocRef, {
                name: gameName,
                hostOffer: JSON.stringify(offer),
                guestAnswer: null,
                status: 'waiting',
                lastUpdated: Timestamp.now()
            });
        });

        // Listen for the guest's answer to appear in the document
        this.unsubscribe = onSnapshot(gameDocRef, (snapshot) => {
            const data = snapshot.data();
            if (data?.guestAnswer && this.peer && !this.peer.connected) {
                this.peer.signal(JSON.parse(data.guestAnswer));
            }
        });

        this.setupPeerEvents();
        return gameId;
    }

  
    /**
     * Joins an existing game lobby from Firestore.
     */
    async joinGame(gameId: string) {
        const gameDocRef = doc(db, 'games', gameId);
        this.peer = new Peer({ initiator: false, trickle: false });

        // Listen for the host's offer to appear
        const unsub = onSnapshot(gameDocRef, (snapshot) => {
            const gameData = snapshot.data();
            if (gameData?.hostOffer && this.peer && !this.peer.connected) {
                this.peer.signal(JSON.parse(gameData.hostOffer));
                unsub(); // We only need the offer once
            }
        });

        // When we generate our answer, update the document
        this.peer.on('signal', async (answer) => {
            await updateDoc(gameDocRef, {
                guestAnswer: JSON.stringify(answer),
                status: 'connected',
                lastUpdated: Timestamp.now()
            });
        });

        this.setupPeerEvents();
    }


    /**
     * A helper to set up all the event listeners for a peer connection.
     */
    private setupPeerEvents() {
        if (!this.peer) return;

        this.peer.on('connect', () => {
            console.log('✅ PEER CONNECTED!');
            this.onConnectionStateChange('connected');
        });

        this.peer.on('data', (data) => {
            const gameState = JSON.parse(new TextDecoder().decode(data));
            this.onGameState(gameState);
        });

        this.peer.on('close', () => {
            this.onConnectionStateChange('disconnected');
            this.cleanup();
        });

        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            this.onConnectionStateChange('disconnected');
            this.cleanup();
        });
    }

  
    /**
     * Sends the current game state to the other connected peer.
     */
    public sendGameState(state: any) {
        if (this.peer && this.peer.connected) {
            this.peer.send(JSON.stringify(state));
        }
    }

  
    /**
     * Cleans up listeners and connections.
     */
    public cleanup() {
        if (this.unsubscribe) this.unsubscribe();
        this.peer?.destroy();
        this.peer = null;
    }
}
