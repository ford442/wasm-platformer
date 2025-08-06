// src/App.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from './firebase-config';
import { P2PNetwork } from './network';
import { GameCanvas } from './GameCanvas'; // We will create this next

function App() {
    const [games, setGames] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
    const [gameId, setGameId] = useState<string | null>(null);
    const [gameName, setGameName] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    // Create a single, stable instance of the network class
    const network = useMemo(() => new P2PNetwork(), []);

    // Effect to listen for available games from Firestore
    useEffect(() => {
        const gamesCollection = collection(db, 'games');
        const q = query(collection(db, "games"), where("status", "==", "waiting"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setGames(snapshot.docs);
        });
        return () => unsubscribe(); // Clean up listener on component unmount
    }, []);

    // Effect to handle network events
    useEffect(() => {
        network.onConnectionStateChange = (state) => {
            setIsConnected(state === 'connected');
        };
        // Clean up on component unmount
        return () => network.cleanup();
    }, [network]);

    const handleCreateGame = async () => {
        if (gameName) {
            const newGameId = await network.createGame(gameName);
            setGameId(newGameId);
        }
    };

    const handleJoinGame = async (id: string) => {
        setGameId(id);
        await network.joinGame(id);
    };

    // The Lobby View
    if (!gameId) {
        return (
            <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                <h1>WASM Platformer Lobby</h1>
                <div>
                    <input
                        type="text"
                        placeholder="Enter Game Name"
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        style={{ padding: '8px', marginRight: '10px' }}
                    />
                    <button onClick={handleCreateGame} style={{ padding: '8px 12px' }}>Create Game</button>
                </div>
                <hr style={{ margin: '20px 0' }} />
                <h2>Available Games</h2>
                <ul>
                    {games.length === 0 && <p>No available games. Create one!</p>}
                    {games.map((game) => (
                        <li key={game.id} style={{ marginBottom: '10px' }}>
                            {game.data().name}
                            <button onClick={() => handleJoinGame(game.id)} style={{ marginLeft: '10px' }}>Join</button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
    
    // The Game View
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Playing Game: {gameId}</h1>
            <p>Status: {isConnected ? '✅ Connected' : '⌛ Connecting...'}</p>
            {isConnected && <GameCanvas network={network} />}
        </div>
    );
}

export default App;
