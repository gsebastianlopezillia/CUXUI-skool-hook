// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeCNeJQpZ86UKxVKfJkowAbSgaMAFBfe0",
  authDomain: "cuxui-skool-router.firebaseapp.com",
  projectId: "cuxui-skool-router",
  storageBucket: "cuxui-skool-router.firebasestorage.app",
  messagingSenderId: "401192401910",
  appId: "1:401192401910:web:cd9383e75d5dbcc6c925d7",
  measurementId: "G-KZTPP6TJ2M"
};

// Initialize Firebase (only if config is valid)
if (firebaseConfig.apiKey !== "your-api-key-here") {
  // Initialize Firebase App
  firebase.initializeApp(firebaseConfig);

  // Initialize services globally
  window.firebaseApp = firebase.app();
  window.firebaseAuth = firebase.auth();
  window.firebaseFirestore = firebase.firestore();
  window.firebaseStorage = firebase.storage();
  window.firebaseAnalytics = firebase.analytics();

  console.log("✅ Firebase initialized successfully");
  console.log("🔥 Project ID:", firebaseConfig.projectId);
} else {
  console.warn("⚠️ Firebase not configured. Please add your Firebase config to firebase-config.js");
}