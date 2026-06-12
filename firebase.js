// Firebase configuration and initialization
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDLfrp-89vElULCo3mxH3LaZiG6Z54HNkE",
  authDomain: "excel-4c142.firebaseapp.com",
  databaseURL: "https://excel-4c142-default-rtdb.firebaseio.com",
  projectId: "excel-4c142",
  storageBucket: "excel-4c142.firebasestorage.app",
  messagingSenderId: "332372580946",
  appId: "1:332372580946:web:58757ba9c24b04636a9d8b",
  measurementId: "G-MRQJ8K917N"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

module.exports = db;
