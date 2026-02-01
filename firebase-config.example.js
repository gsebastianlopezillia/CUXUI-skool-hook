// Firebase Configuration - EXAMPLE FILE
// 1. Copy this file to firebase-config.js
// 2. Replace with your actual Firebase config from Firebase Console
// 3. NEVER commit firebase-config.js to git (it's in .gitignore)

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Export for use in other files
export { app, auth };