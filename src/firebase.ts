import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Reemplazá estos datos con los de tu consola de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "classcode-tracker.firebaseapp.com",
  projectId: "classcode-tracker",
  storageBucket: "classcode-tracker.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);