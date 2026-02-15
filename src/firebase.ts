import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvgP3faCITiZTTTOKQodyg3crItsf-maY", // Sacada de tu config
  authDomain: "interactions-71fba.firebaseapp.com",
  projectId: "interactions-71fba", // Tu ID real
  storageBucket: "interactions-71fba.firebasestorage.app",
  messagingSenderId: "661620450070", // Tu número de proyecto
  appId: "1:661620450070:web:0f36f5a2adcd58f6c8a637", // Tu App ID
  measurementId: "G-R4WPG3BQ1Q"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);