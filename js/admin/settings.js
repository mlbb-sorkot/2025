// Admin Settings JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the admin settings page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load settings data
    loadSettings();
});

// Initialize event listeners
function initEventListeners() {
    // Save settings button
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    
    // Reset settings button
    document.getElementById('reset-settings-btn').addEventListener('click', resetSettings);
    
    // Logo upload
    document.getElementById('logo-upload').addEventListener('change', handleLogoUpload);
    
    // Banner upload
    document.getElementById('banner-upload').addEventListener('change', handleBannerUpload);
    
    // Tab buttons
    document.getElementById('general-tab').addEventListener('click', function() {
        switchTab('general-settings');
    });
    
    document.getElementById('appearance-tab').addEventListener('click', function() {
        switchTab('appearance-settings');
    });
    
    document.getElementById('tournament-tab').addEventListener('click', function() {
        switchTab('tournament-settings');
    });
    
    document.getElementById('advanced-tab').addEventListener('click', function() {
        switchTab('advanced-settings');
    });
}

// Function to switch tabs
function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.settings-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).style.display = 'block';
    
    // Add active class to selected tab button
    document.getElementById(`${tabId.replace('-settings', '')}-tab`).classList.add('active');
}

// Function to load settings
async function loadSettings() {
    try {
        const settingsContainer = document.querySelector('.settings-container');
        
        // Show loading
        settingsContainer.innerHTML = '<div class="loading">Memuat pengaturan...</div>';
        
        // Get settings document
        const settingsDoc = await db.collection('settings').doc('general').get();
        
        // If settings document doesn't exist, create it with default values
        if (!settingsDoc.exists) {
            await createDefaultSettings();
            return loadSettings(); // Reload settings
        }
        
        const settings = settingsDoc.data();
        
        // Restore original content
        settingsContainer.innerHTML = document.getElementById('settings-template').innerHTML;
        
        // Re-initialize event listeners
        initEventListeners();
        
        // Populate form fields
        populateSettingsForm(settings);
        
    } catch (error) {
        console.error("Error loading settings:", error);
        document.querySelector('.settings-container').innerHTML = 
            '<div class="no-data">Gagal memuat pengaturan</div>';
    }
}

// Function to create default settings
async function createDefaultSettings() {
    try {
        const defaultSettings = {
            // General settings
            tournamentName: 'MLBB Kapolresta Sorong Kota Cup',
            organizerName: 'Kapolresta Sorong Kota',
            contactEmail: 'info@mlbbsorkot.com',
            contactPhone: '+62 123 4567 890',
            
            // Appearance settings
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            logoUrl: '../img/logo.png',
            bannerUrl: '../img/banner.jpg',
            
            // Tournament settings
            tournamentStartDate: firebase.firestore.Timestamp.fromDate(new Date()),
            tournamentEndDate: firebase.firestore.Timestamp.fromDate(new Date(new Date().setMonth(new Date().getMonth() + 1))),
            maxTeams: 16,
            playoffEnabled: false,
            registrationOpen: true,
            
            // Advanced settings
            maintenanceMode: false,
            analyticsEnabled: true,
            cacheTimeout: 3600,
            
            // System settings
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('settings').doc('general').set(defaultSettings);
        
        showAlert('success', 'Pengaturan default telah dibuat');
        
        // Log activity
        logActivity('settings', 'Pengaturan default telah dibuat');
        
    } catch (error) {
        console.error("Error creating default settings:", error);
        showAlert('error', 'Gagal membuat pengaturan default');
    }
}

// Function to populate settings form
function populateSettingsForm(settings) {
    // General settings
    document.getElementById('tournament-name').value = settings.tournamentName || '';
    document.getElementById('organizer-name').value = settings.organizerName || '';
    document.getElementById('contact-email').value = settings.contactEmail || '';
    document.getElementById('contact-phone').value = settings.contactPhone || '';
    
    // Appearance settings
    document.getElementById('primary-color').value = settings.primaryColor || '#007bff';
    document.getElementById('secondary-color').value = settings.secondaryColor || '#6c757d';
    
    // Show logo preview
    if (settings.logoUrl) {
        document.getElementById('logo-preview').src = settings.logoUrl;
        document.getElementById('logo-preview').style.display = 'block';
    }
    
    // Show banner preview
    if (settings.bannerUrl) {
        document.getElementById('banner-preview').src = settings.bannerUrl;
        document.getElementById('banner-preview').style.display = 'block';
    }
    
    // Tournament settings
    if (settings.tournamentStartDate) {
        const startDate = settings.tournamentStartDate.toDate();
        document.getElementById('tournament-start-date').value = formatDateForInput(startDate);
    }
    
    if (settings.tournamentEndDate) {
        const endDate = settings.tournamentEndDate.toDate();
        document.getElementById('tournament-end-date').value = formatDateForInput(endDate);
    }
    
    document.getElementById('max-teams').value = settings.maxTeams || 16;
    document.getElementById('playoff-enabled').checked = settings.playoffEnabled || false;
    document.getElementById('registration-open').checked = settings.registrationOpen || false;
    
    // Advanced settings
    document.getElementById('maintenance-mode').checked = settings.maintenanceMode || false;
    document.getElementById('analytics-enabled').checked = settings.analyticsEnabled || false;
    document.getElementById('cache-timeout').value = settings.cacheTimeout || 3600;
}

// Function to save settings
async function saveSettings() {
    try {
        // Show loading
        document.getElementById('save-settings-btn').disabled = true;
        document.getElementById('save-settings-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        // Get form data
        const settings = {
            // General settings
            tournamentName: document.getElementById('tournament-name').value,
            organizerName: document.getElementById('organizer-name').value,
            contactEmail: document.getElementById('contact-email').value,
            contactPhone: document.getElementById('contact-phone').value,
            
            // Appearance settings
            primaryColor: document.getElementById('primary-color').value,
            secondaryColor: document.getElementById('secondary-color').value,
            
            // Tournament settings
            tournamentStartDate: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('tournament-start-date').value)),
            tournamentEndDate: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('tournament-end-date').value)),
            maxTeams: parseInt(document.getElementById('max-teams').value),
            playoffEnabled: document.getElementById('playoff-enabled').checked,
            registrationOpen: document.getElementById('registration-open').checked,
            
            // Advanced settings
            maintenanceMode: document.getElementById('maintenance-mode').checked,
            analyticsEnabled: document.getElementById('analytics-enabled').checked,
            cacheTimeout: parseInt(document.getElementById('cache-timeout').value),
            
            // System settings
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Validate form
        if (!settings.tournamentName) {
            showAlert('error', 'Nama turnamen tidak boleh kosong');
            return;
        }
        
        if (!settings.organizerName) {
            showAlert('error', 'Nama penyelenggara tidak boleh kosong');
            return;
        }
        
        // Get current settings to preserve logo and banner URLs
        const settingsDoc = await db.collection('settings').doc('general').get();
        const currentSettings = settingsDoc.exists ? settingsDoc.data() : {};
        
        // Preserve logo and banner URLs if not changed
        settings.logoUrl = currentSettings.logoUrl || '';
        settings.bannerUrl = currentSettings.bannerUrl || '';
        
        // Update settings
        await db.collection('settings').doc('general').update(settings);
        
        showAlert('success', 'Pengaturan berhasil disimpan');
        
        // Log activity
        logActivity('settings', 'Pengaturan telah diperbarui');
        
        // Apply theme changes
        applyThemeChanges(settings);
        
    } catch (error) {
        console.error("Error saving settings:", error);
        showAlert('error', 'Gagal menyimpan pengaturan');
    } finally {
        // Reset button
        document.getElementById('save-settings-btn').disabled = false;
        document.getElementById('save-settings-btn').innerHTML = 'Simpan Pengaturan';
    }
}

// Function to reset settings
async function resetSettings() {
    try {
        // Confirm reset
        if (!confirm('Apakah Anda yakin ingin mengatur ulang semua pengaturan ke nilai default? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }
        
        // Show loading
        document.getElementById('reset-settings-btn').disabled = true;
        document.getElementById('reset-settings-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengatur Ulang...';
        
        // Delete current settings
        await db.collection('settings').doc('general').delete();
        
        // Create default settings
        await createDefaultSettings();
        
        // Reload settings
        await loadSettings();
        
        showAlert('success', 'Pengaturan telah diatur ulang ke nilai default');
        
        // Log activity
        logActivity('settings', 'Pengaturan telah diatur ulang ke nilai default');
        
    } catch (error) {
        console.error("Error resetting settings:", error);
        showAlert('error', 'Gagal mengatur ulang pengaturan');
    } finally {
        // Reset button
        document.getElementById('reset-settings-btn').disabled = false;
        document.getElementById('reset-settings-btn').innerHTML = 'Atur Ulang Pengaturan';
    }
}

// Function to handle logo upload
function handleLogoUpload(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // Validate file type
    if (!file.type.match('image.*')) {
        showAlert('error', 'File harus berupa gambar (JPG, PNG, GIF)');
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showAlert('error', 'Ukuran file tidak boleh lebih dari 2MB');
        return;
    }
    
    // Show loading
    document.getElementById('logo-upload-label').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunggah...';
    
    // Create file reader
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // Show preview
        document.getElementById('logo-preview').src = e.target.result;
        document.getElementById('logo-preview').style.display = 'block';
        
        // Upload to Firebase Storage
        uploadLogo(file);
    };
    
    reader.readAsDataURL(file);
}

// Function to upload logo to Firebase Storage
async function uploadLogo(file) {
    try {
        // Create storage reference
        const storageRef = firebase.storage().ref();
        const logoRef = storageRef.child(`settings/logo_${Date.now()}`);
        
        // Upload file
        const snapshot = await logoRef.put(file);
        
        // Get download URL
        const logoUrl = await snapshot.ref.getDownloadURL();
        
        // Update settings
        await db.collection('settings').doc('general').update({
            logoUrl: logoUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showAlert('success', 'Logo berhasil diunggah');
        
        // Log activity
        logActivity('settings', 'Logo telah diperbarui');
        
    } catch (error) {
        console.error("Error uploading logo:", error);
        showAlert('error', 'Gagal mengunggah logo');
    } finally {
        // Reset button
        document.getElementById('logo-upload-label').innerHTML = '<i class="fas fa-upload"></i> Unggah Logo';
    }
}

// Function to handle banner upload
function handleBannerUpload(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // Validate file type
    if (!file.type.match('image.*')) {
        showAlert('error', 'File harus berupa gambar (JPG, PNG, GIF)');
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showAlert('error', 'Ukuran file tidak boleh lebih dari 2MB');
        return;
    }
    
    // Show loading
    document.getElementById('banner-upload-label').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunggah...';
    
    // Create file reader
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // Show preview
        document.getElementById('banner-preview').src = e.target.result;
        document.getElementById('banner-preview').style.display = 'block';
        
        // Upload to Firebase Storage
        uploadBanner(file);
    };
    
    reader.readAsDataURL(file);
}

// Function to upload banner to Firebase Storage
async function uploadBanner(file) {
    try {
        // Create storage reference
        const storageRef = firebase.storage().ref();
        const bannerRef = storageRef.child(`settings/banner_${Date.now()}`);
        
        // Upload file
        const snapshot = await bannerRef.put(file);
        
        // Get download URL
        const bannerUrl = await snapshot.ref.getDownloadURL();
        
        // Update settings
        await db.collection('settings').doc('general').update({
            bannerUrl: bannerUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showAlert('success', 'Banner berhasil diunggah');
        
        // Log activity
        logActivity('settings', 'Banner telah diperbarui');
        
    } catch (error) {
        console.error("Error uploading banner:", error);
        showAlert('error', 'Gagal mengunggah banner');
    } finally {
        // Reset button
        document.getElementById('banner-upload-label').innerHTML = '<i class="fas fa-upload"></i> Unggah Banner';
    }
}

// Function to apply theme changes
function applyThemeChanges(settings) {
    // Create or update CSS variables
    const root = document.documentElement;
    
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
}

// Function to format date for input field
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Function to log activity
async function logActivity(type, message) {
    try {
        await db.collection('activities').add({
            type: type,
            message: message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
}

// Function to show alert
function showAlert(type, message) {
    const alertBox = document.createElement('div');
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    
    document.querySelector('.alert-container').appendChild(alertBox);
    
    // Remove alert after 3 seconds
    setTimeout(() => {
        alertBox.remove();
    }, 3000);
}