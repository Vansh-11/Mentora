// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQn4EiPvTp7TFIXlNP_QRBNtKU_RbKoig",
  authDomain: "mentora-462812.firebaseapp.com",
  projectId: "mentora-462812",
  storageBucket: "mentora-462812.firebasestorage.app",
  messagingSenderId: "964746627577",
  appId: "1:964746627577:web:866d55e0f8e9d5b7a39528",
  measurementId: "G-4H8HVHQGSL"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export { app, auth, db, analytics };

