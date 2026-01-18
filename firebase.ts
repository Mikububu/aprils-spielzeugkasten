import * as firebaseApp from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: REPLACE WITH YOUR KEYS FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let app;
let auth;
let db;
let storage;
let googleProvider;

try {
    app = firebaseApp.initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
} catch (e) {
    console.warn("Firebase not initialized. Did you add your keys in firebase.ts?");
}

export { auth, db, storage, googleProvider };

export const signIn = async () => {
    if (!auth) return alert("Firebase setup required in firebase.ts");
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error(error);
        alert("Login failed");
    }
};