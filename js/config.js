// Firebase Configuration
// This file initializes the Firebase connection for the MLBB Kapolresta Sorong Kota Cup website

// Initialize Firebase with your project configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Helper function to format dates
function formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('id-ID', options) + ' WIT';
}

// Helper function to format dates without time
function formatDateOnly(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
    };
    
    return date.toLocaleDateString('id-ID', options);
}

// Helper function to get today's date at midnight for comparison
function getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

// Helper function to check if a date is today
function isToday(timestamp) {
    if (!timestamp) return false;
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
}

// Helper function to create a placeholder image element
function createPlaceholderImage(alt = 'Placeholder') {
    const img = document.createElement('img');
    img.src = '../images/placeholder.png';
    img.alt = alt;
    return img;
}