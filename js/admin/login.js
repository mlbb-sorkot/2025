// Login JavaScript for the MLBB Kapolresta Sorong Kota Cup admin panel
// This file handles the login functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners
    initEventListeners();
    
    // Check for URL parameters
    checkUrlParams();
    
    // Check if user is already logged in
    checkLoggedInState();
});

// Initialize event listeners
function initEventListeners() {
    // Login form submission
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Show/hide password toggle
    const togglePassword = document.getElementById('toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icon
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Input validation
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    emailInput.addEventListener('input', function() {
        validateEmail(this);
    });

    passwordInput.addEventListener('input', function() {
        validatePassword(this);
    });
}

// Validate email format
function validateEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(input.value);
    
    if (!isValid && input.value) {
        input.classList.add('invalid');
        showFieldError(input, 'Format email tidak valid');
    } else {
        input.classList.remove('invalid');
        hideFieldError(input);
    }
    return isValid;
}

// Validate password
function validatePassword(input) {
    const isValid = input.value.length >= 6;
    
    if (!isValid && input.value) {
        input.classList.add('invalid');
        showFieldError(input, 'Password minimal 6 karakter');
    } else {
        input.classList.remove('invalid');
        hideFieldError(input);
    }
    return isValid;
}

// Show field error message
function showFieldError(input, message) {
    let errorDiv = input.parentElement.querySelector('.field-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        input.parentElement.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

// Hide field error message
function hideFieldError(input) {
    const errorDiv = input.parentElement.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Check URL parameters for error messages
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error === 'unauthorized') {
        showAlert('error', 'Anda tidak memiliki akses admin');
    } else if (error === 'server') {
        showAlert('error', 'Terjadi kesalahan server, silakan coba lagi');
    } else if (error === 'session_expired') {
        showAlert('warning', 'Sesi Anda telah berakhir, silakan login kembali');
    }
}

// Check if user is already logged in
function checkLoggedInState() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is logged in, check if they are an admin
            checkAdminRole(user);
        } else {
            // User is not logged in, show login form
            document.getElementById('loading-spinner').style.display = 'none';
            document.getElementById('login-container').style.display = 'block';
        }
    });
}

// Check if user has admin role
async function checkAdminRole(user) {
    try {
        const userDoc = await db.collection('admins').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // User is not an admin, sign out
            await firebase.auth().signOut();
            document.getElementById('loading-spinner').style.display = 'none';
            document.getElementById('login-container').style.display = 'block';
            showAlert('error', 'Anda tidak memiliki akses admin');
            return;
        }
        
        // User is an admin, redirect to dashboard
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error("Error checking admin role:", error);
        // On error, sign out
        await firebase.auth().signOut();
        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('login-container').style.display = 'block';
        showAlert('error', 'Terjadi kesalahan server, silakan coba lagi');
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    // Get form data
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    
    // Validate form
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
        showAlert('error', 'Mohon periksa kembali email dan password Anda');
        return;
    }
    
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    
    try {
        // Attempt to sign in
        await firebase.auth().signInWithEmailAndPassword(email.value, password.value);
        
        // Sign-in successful, checkAdminRole will handle the redirect
        
    } catch (error) {
        console.error("Login error:", error);
        
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        
        // Show appropriate error message
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                showAlert('error', 'Email atau password salah');
                break;
            case 'auth/too-many-requests':
                showAlert('error', 'Terlalu banyak percobaan login. Silakan coba lagi nanti');
                break;
            default:
                showAlert('error', 'Terjadi kesalahan saat login. Silakan coba lagi');
        }
    }
}

// Show alert message
function showAlert(type, message) {
    const alertElement = document.getElementById('login-error');
    alertElement.textContent = message;
    alertElement.className = `form-error ${type}`;
    alertElement.style.display = 'block';
}