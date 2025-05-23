// Auth Check JavaScript for the MLBB Kapolresta Sorong Kota Cup admin panel
// This file handles authentication checks for admin pages

// Check if user is authenticated
function checkAuth() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            // User is not logged in, redirect to login page
            window.location.href = 'login.html';
        } else {
            // User is logged in, check if they are an admin
            checkAdminRole(user);
        }
    });
}

// Check if user has admin role
async function checkAdminRole(user) {
    try {
        const userDoc = await db.collection('admins').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // User is not an admin, sign out and redirect to login
            await firebase.auth().signOut();
            window.location.href = 'login.html?error=unauthorized';
            return;
        }
        
        // User is an admin, update UI
        updateAdminUI(user, userDoc.data());
        
    } catch (error) {
        console.error("Error checking admin role:", error);
        // On error, sign out and redirect to login
        await firebase.auth().signOut();
        window.location.href = 'login.html?error=server';
    }
}

// Update UI with admin info
function updateAdminUI(user, adminData) {
    // Set admin name in sidebar
    const adminNameElement = document.getElementById('admin-name');
    if (adminNameElement) {
        adminNameElement.textContent = adminData.name || user.displayName || user.email;
    }
    
    // Set admin role in sidebar
    const adminRoleElement = document.getElementById('admin-role');
    if (adminRoleElement) {
        adminRoleElement.textContent = adminData.role || 'Admin';
    }
    
    // Show admin content (hide loading spinner if exists)
    const loadingElement = document.getElementById('loading-spinner');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    const contentElement = document.getElementById('admin-content');
    if (contentElement) {
        contentElement.style.display = 'block';
    }
}

// Handle logout
function logout() {
    firebase.auth().signOut().then(function() {
        // Sign-out successful, redirect to login page
        window.location.href = 'login.html';
    }).catch(function(error) {
        // An error happened
        console.error("Error signing out:", error);
    });
}

// Add logout event listener
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});