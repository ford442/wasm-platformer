// src/firebase-config.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyD7cKR72AuqHP5CXThhHthMMd6KX51mabg",
  authDomain: "wasm-platformer.firebaseapp.com",
  projectId: "wasm-platformer",
  storageBucket: "wasm-platformer.firebasestorage.app",
  messagingSenderId: "418926785670",
  appId: "1:418926785670:web:2008ff3b96a4ba82d40d07",
  measurementId: "G-09ZG4PSTKT"
};
// ---------------------------------------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the firestore database instance
export const db = getFirestore(app);

