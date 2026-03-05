// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDfsdTER5cL0Dx5cRRmYEgcWB41C8WK5_o",
  authDomain: "chatapp-a31af.firebaseapp.com",
  projectId: "chatapp-a31af",
  storageBucket: "chatapp-a31af.appspot.com",
  messagingSenderId: "148447727351",
  appId: "1:148447727351:web:750099df297cb6755d8df2",
  measurementId: "G-ZJXYEEPQLR",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { auth, storage, analytics };
