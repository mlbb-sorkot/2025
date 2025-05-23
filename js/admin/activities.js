// Admin Activities JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the admin activities page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load activities data
    loadActivities();
});

// Initialize event listeners
function initEventListeners() {
    // Filter buttons
    document.getElementById('filter-all').addEventListener('click', function() {
        setActiveFilter(this);
        loadActivities('all');
    });
    
    document.getElementById('filter-team').addEventListener('click', function() {
        setActiveFilter(this);
        loadActivities('team');
    });
    
    document.getElementById('filter-player').addEventListener('click', function() {
        setActiveFilter(this);
        loadActivities('player');
    });
    
    document.getElementById('filter-match').addEventListener('click', function() {
        setActiveFilter(this);
        loadActivities('match');
    });
    
    document.getElementById('filter-settings').addEventListener('click', function() {
        setActiveFilter(this);
        loadActivities('settings');
    });
    
    document.getElementById('filter-export').addEventListener('click', function() {
        setActiveFilter(this);
        loadActivities('export');
    });
    
    document.getElementById('filter-standings').addEventListener('click', function() {
        setActiveFilter(this);
        loadActivities('standings');
    });
    
    document.getElementById('filter-playoff').addEventListener('click', function() {
        setActiveFilter(this);
        loadActivities('playoff');
    });
    
    // Clear activities button
    document.getElementById('clear-activities-btn').addEventListener('click', clearActivities);
    
    // Export activities button
    document.getElementById('export-activities-btn').addEventListener('click', exportActivities);
}

// Function to set active filter
function setActiveFilter(button) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    button.classList.add('active');
}

// Function to load activities
async function loadActivities(filter = 'all') {
    try {
        const activitiesContainer = document.getElementById('activities-container');
        
        // Clear existing content
        activitiesContainer.innerHTML = '<div class="loading">Memuat aktivitas...</div>';
        
        // Create query based on filter
        let query;
        
        if (filter === 'all') {
            // All activities
            query = db.collection('activities').orderBy('timestamp', 'desc').limit(100);
        } else {
            // Filtered activities
            query = db.collection('activities')
                .where('type', '==', filter)
                .orderBy('timestamp', 'desc')
                .limit(100);
        }
        
        // Get activities
        const activitiesSnapshot = await query.get();
        
        if (activitiesSnapshot.empty) {
            activitiesContainer.innerHTML = '<div class="no-data">Tidak ada aktivitas yang sesuai dengan filter</div>';
            return;
        }
        
        // Create activities list
        const activitiesList = document.createElement('ul');
        activitiesList.className = 'activities-list';
        
        activitiesSnapshot.forEach(doc => {
            const activity = doc.data();
            activity.id = doc.id;
            
            const activityItem = document.createElement('li');
            activityItem.className = 'activity-item';
            
            // Format timestamp
            const timestamp = activity.timestamp ? activity.timestamp.toDate() : new Date();
            const timeString = formatTimeAgo(timestamp);
            
            // Get icon based on activity type
            const icon = getActivityIcon(activity.type);
            
            activityItem.innerHTML = `
                <div class="activity-icon ${activity.type}">
                    <i class="${icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-message">${activity.message}</div>
                    <div class="activity-time">${timeString}</div>
                </div>
            `;
            
            activitiesList.appendChild(activityItem);
        });
        
        // Clear loading message and add list
        activitiesContainer.innerHTML = '';
        activitiesContainer.appendChild(activitiesList);
        
    } catch (error) {
        console.error("Error loading activities:", error);
        document.getElementById('activities-container').innerHTML = 
            '<div class="no-data">Gagal memuat aktivitas</div>';
    }
}

// Function to get activity icon
function getActivityIcon(type) {
    switch (type) {
        case 'team':
            return 'fas fa-users';
        case 'player':
            return 'fas fa-user';
        case 'match':
            return 'fas fa-gamepad';
        case 'settings':
            return 'fas fa-cog';
        case 'export':
            return 'fas fa-file-export';
        case 'standings':
            return 'fas fa-list-ol';
        case 'playoff':
            return 'fas fa-trophy';
        default:
            return 'fas fa-info-circle';
    }
}

// Function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return `${diffInSeconds} detik yang lalu`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    
    if (diffInMinutes < 60) {
        return `${diffInMinutes} menit yang lalu`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    
    if (diffInHours < 24) {
        return `${diffInHours} jam yang lalu`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays < 30) {
        return `${diffInDays} hari yang lalu`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    
    if (diffInMonths < 12) {
        return `${diffInMonths} bulan yang lalu`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    
    return `${diffInYears} tahun yang lalu`;
}

// Function to clear activities
async function clearActivities() {
    try {
        // Confirm clear
        if (!confirm('Apakah Anda yakin ingin menghapus semua aktivitas? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }
        
        // Show loading
        document.getElementById('clear-activities-btn').disabled = true;
        document.getElementById('clear-activities-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
        
        // Get all activities
        const activitiesSnapshot = await db.collection('activities').get();
        
        if (activitiesSnapshot.empty) {
            showAlert('info', 'Tidak ada aktivitas untuk dihapus');
            return;
        }
        
        // Delete activities in batches
        const batch = db.batch();
        let count = 0;
        
        activitiesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
            count++;
        });
        
        await batch.commit();
        
        showAlert('success', `${count} aktivitas berhasil dihapus`);
        
        // Reload activities
        loadActivities();
        
    } catch (error) {
        console.error("Error clearing activities:", error);
        showAlert('error', 'Gagal menghapus aktivitas');
    } finally {
        // Reset button
        document.getElementById('clear-activities-btn').disabled = false;
        document.getElementById('clear-activities-btn').innerHTML = 'Hapus Semua Aktivitas';
    }
}

// Function to export activities
async function exportActivities() {
    try {
        // Show loading
        document.getElementById('export-activities-btn').disabled = true;
        document.getElementById('export-activities-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengekspor...';
        
        // Get active filter
        const activeFilter = document.querySelector('.filter-btn.active').id.replace('filter-', '');
        
        // Create query based on filter
        let query;
        
        if (activeFilter === 'all') {
            // All activities
            query = db.collection('activities').orderBy('timestamp', 'desc');
        } else {
            // Filtered activities
            query = db.collection('activities')
                .where('type', '==', activeFilter)
                .orderBy('timestamp', 'desc');
        }
        
        // Get activities
        const activitiesSnapshot = await query.get();
        
        if (activitiesSnapshot.empty) {
            showAlert('error', 'Tidak ada aktivitas untuk diekspor');
            return;
        }
        
        // Process activities
        const activities = [];
        
        activitiesSnapshot.forEach(doc => {
            const activity = doc.data();
            
            // Format timestamp
            const timestamp = activity.timestamp ? activity.timestamp.toDate() : new Date();
            const dateString = timestamp.toLocaleString('id-ID');
            
            activities.push({
                type: activity.type,
                message: activity.message,
                timestamp: dateString
            });
        });
        
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        // Create worksheet data
        const wsData = [
            ['Tipe', 'Pesan', 'Waktu']
        ];
        
        activities.forEach(activity => {
            wsData.push([
                activity.type,
                activity.message,
                activity.timestamp
            ]);
        });
        
        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Aktivitas');
        
        // Generate filename with date
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const filename = `Aktivitas_MLBB_Kapolresta_Sorong_Kota_Cup_${dateStr}.xlsx`;
        
        // Export to Excel file
        XLSX.writeFile(wb, filename);
        
        showAlert('success', 'Aktivitas berhasil diekspor');
        
        // Log activity
        logActivity('export', 'Aktivitas telah diekspor ke Excel');
        
    } catch (error) {
        console.error("Error exporting activities:", error);
        showAlert('error', 'Gagal mengekspor aktivitas');
    } finally {
        // Reset button
        document.getElementById('export-activities-btn').disabled = false;
        document.getElementById('export-activities-btn').innerHTML = 'Ekspor Aktivitas';
    }
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