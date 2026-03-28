import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyANOVBE_HiRJ_k-XGp6PddniFlP06mSlb8",
  authDomain: "hardy-pattern-227717.firebaseapp.com",
  projectId: "hardy-pattern-227717",
  storageBucket: "hardy-pattern-227717.firebasestorage.app",
  messagingSenderId: "366405768049",
  appId: "1:366405768049:web:5220ba8e02db5e15cadcd0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
