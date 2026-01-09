import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

export const firebaseConfig = {
    apiKey: "AIzaSyB4xVaZ6I3vZkFgEwWkAHgup0L8rmIL5Ds",
    authDomain: "digital-planter.firebaseapp.com",
    projectId: "digital-planter",
    storageBucket: "digital-planter.firebasestorage.app",
    messagingSenderId: "29726605054",
    appId: "1:29726605054:web:4e66333bbca115c18aefaf",
    measurementId: "G-03BNN2H421"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'en';
const db = getFirestore(app);

export { app, auth, db };
