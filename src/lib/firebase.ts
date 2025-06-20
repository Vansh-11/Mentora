// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };