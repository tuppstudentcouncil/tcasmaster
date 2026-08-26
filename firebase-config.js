import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { getStorage } from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8gwn21DGs7_tW1m3Kb5pPPjUQ06cIH0o",
  authDomain: "blue-penguin-9d870.firebaseapp.com",
  projectId: "blue-penguin-9d870",
  storageBucket: "blue-penguin-9d870.firebasestorage.app",
  messagingSenderId: "301823516280",
  appId: "1:301823516280:web:79f393ca07ede103a4978d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);