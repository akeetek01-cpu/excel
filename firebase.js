// Firebase configuration and initialization
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAo3EOTHcXCRNgA4Y6LooTdJi_uK9Y5xvY",
  authDomain: "excel-bhush.firebaseapp.com",
  databaseURL: "https://excel-bhush-default-rtdb.firebaseio.com", // <-- Add this line
  projectId: "excel-bhush",
  storageBucket: "excel-bhush.firebasestorage.app",
  messagingSenderId: "653127275390",
  appId: "1:653127275390:web:8ae1624c1a934ca6b4592f",
  measurementId: "G-9WFZVE8GGV"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

module.exports = db;
