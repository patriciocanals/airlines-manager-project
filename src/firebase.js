// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCMrxYFd_I7UuvSpm7W_ppoasoEwGcW0ZI",
    authDomain: "airlinemanager-3e15f.firebaseapp.com",
    projectId: "airlinemanager-3e15f",
    storageBucket: "airlinemanager-3e15f.firebasestorage.app",
    messagingSenderId: "814358217042",
    appId: "1:814358217042:web:82ed3b5dd392b58b96ba8b",
    measurementId: "G-STCX9RNVC0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const analytics = getAnalytics(app);