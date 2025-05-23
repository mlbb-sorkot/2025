// Admin Teams JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the admin teams page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load teams data
    loadTeams();
});

// Initialize event listeners
function initEventListeners() {
    // Add team button
    document.getElementById('add-team-btn').addEventListener('click', showAddTeamModal);
    
    // Save team button
    document.getElementById('save-team-btn').addEventListener('click', saveTeam);
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    // Team logo file input
    document.getElementById('team-logo').addEventListener('change', handleLogoUpload);
}

// Function to load teams
async function loadTeams() {
    try {
        const teamsContainer = document.getElementById('teams-container');
        
        // Clear existing content
        teamsContainer.innerHTML = '<div class="loading">Memuat data tim...</div>';
        
        // Get teams
        const teamsSnapshot = await db.collection('teams').orderBy('name').get();
        
        if (teamsSnapshot.empty) {
            teamsContainer.innerHTML = '<div class="no-data">Belum ada tim yang terdaftar</div>';
            return;
        }
        
        // Clear loading message
        teamsContainer.innerHTML = '';
        
        // Create teams table
        const table = document.createElement('table');
        table.className = 'data-table';
        
        // Add table header
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Logo</th>
                    <th>Nama Tim</th>
                    <th>Pemain</th>
                    <th>Main</th>
                    <th>M</th>
                    <th>S</th>
                    <th>K</th>
                    <th>Poin</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        // Add teams to table
        const tableBody = table.querySelector('tbody');
        
        const teamPromises = teamsSnapshot.docs.map(async (doc) => {
            const team = doc.data();
            team.id = doc.id;
            
            // Get player count
            const playersSnapshot = await db.collection('players')
                .where('teamId', '==', team.id)
                .get();
            
            const playerCount = playersSnapshot.size;
            
            // Create table row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${team.logo || '../images/team-placeholder.png'}" alt="${team.name}" class="team-logo-small">
                </td>
                <td>${team.name}</td>
                <td>${playerCount}</td>
                <td>${team.played || 0}</td>
                <td>${team.won || 0}</td>
                <td>${team.drawn || 0}</td>
                <td>${team.lost || 0}</td>
                <td>${team.points || 0}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-team-btn" data-id="${team.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-team-btn" data-id="${team.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            return row;
        });
        
        // Wait for all promises to resolve
        const teamRows = await Promise.all(teamPromises);
        
        // Add rows to table
        teamRows.forEach(row => {
            tableBody.appendChild(row);
        });
        
        // Add table to container
        teamsContainer.appendChild(table);
        
        // Add event listeners to buttons
        addTeamButtonEventListeners();
        
    } catch (error) {
        console.error("Error loading teams:", error);
        document.getElementById('teams-container').innerHTML = 
            '<div class="no-data">Gagal memuat data tim</div>';
    }
}

// Function to add event listeners to team buttons
function addTeamButtonEventListeners() {
    // Edit team buttons
    document.querySelectorAll('.edit-team-btn').forEach(button => {
        button.addEventListener('click', function() {
            const teamId = this.dataset.id;
            editTeam(teamId);
        });
    });
    
    // Delete team buttons
    document.querySelectorAll('.delete-team-btn').forEach(button => {
        button.addEventListener('click', function() {
            const teamId = this.dataset.id;
            confirmDeleteTeam(teamId);
        });
    });
}

// Function to show add team modal
function showAddTeamModal() {
    document.getElementById('team-modal').style.display = 'block';
    
    // Reset form
    document.getElementById('team-form').reset();
    document.getElementById('team-id').value = '';
    document.getElementById('team-logo-preview').src = '../images/team-placeholder.png';
    document.getElementById('team-modal-title').textContent = 'Tambah Tim';
}

// Function to edit team
async function editTeam(teamId) {
    try {
        const teamDoc = await db.collection('teams').doc(teamId).get();
        
        if (!teamDoc.exists) {
            showAlert('error', 'Tim tidak ditemukan');
            return;
        }
        
        const team = teamDoc.data();
        
        // Set form values
        document.getElementById('team-id').value = teamId;
        document.getElementById('team-name').value = team.name || '';
        document.getElementById('team-logo-preview').src = team.logo || '../images/team-placeholder.png';
        
        // Update modal title
        document.getElementById('team-modal-title').textContent = 'Edit Tim';
        
        // Show modal
        document.getElementById('team-modal').style.display = 'block';
        
    } catch (error) {
        console.error("Error loading team details:", error);
        showAlert('error', 'Gagal memuat detail tim');
    }
}

// Function to handle logo upload
function handleLogoUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image.*')) {
        showAlert('error', 'File harus berupa gambar (JPG, PNG, GIF)');
        return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showAlert('error', 'Ukuran file maksimal 2MB');
        return;
    }
    
    // Preview image
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('team-logo-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Function to save team
async function saveTeam() {
    // Get form data
    const teamId = document.getElementById('team-id').value;
    const teamName = document.getElementById('team-name').value;
    const logoFile = document.getElementById('team-logo').files[0];
    
    // Validate form
    if (!teamName) {
        showAlert('error', 'Nama tim harus diisi');
        return;
    }
    
    try {
        // Show loading
        document.getElementById('save-team-btn').disabled = true;
        document.getElementById('save-team-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        let logoUrl = null;
        
        // Upload logo if selected
        if (logoFile) {
            // Create storage reference
            const storageRef = firebase.storage().ref();
            const logoRef = storageRef.child(`team-logos/${Date.now()}_${logoFile.name}`);
            
            // Upload file
            await logoRef.put(logoFile);
            
            // Get download URL
            logoUrl = await logoRef.getDownloadURL();
        }
        
        // Create team data
        const teamData = {
            name: teamName,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add logo URL if uploaded
        if (logoUrl) {
            teamData.logo = logoUrl;
        }
        
        // Initialize team stats if new team
        if (!teamId) {
            teamData.played = 0;
            teamData.won = 0;
            teamData.drawn = 0;
            teamData.lost = 0;
            teamData.points = 0;
            teamData.goalsFor = 0;
            teamData.goalsAgainst = 0;
            teamData.goalDifference = 0;
            teamData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        if (teamId) {
            // Update existing team
            await db.collection('teams').doc(teamId).update(teamData);
            
            // Log activity
            logActivity('team', `Tim ${teamName} telah diperbarui`);
            
            showAlert('success', 'Tim berhasil diperbarui');
        } else {
            // Create new team
            const newTeamRef = await db.collection('teams').add(teamData);
            
            // Log activity
            logActivity('team', `Tim baru ${teamName} telah ditambahkan`);
            
            showAlert('success', 'Tim berhasil ditambahkan');
        }
        
        // Close modal and reload teams
        closeModals();
        loadTeams();
        
    } catch (error) {
        console.error("Error saving team:", error);
        showAlert('error', 'Gagal menyimpan tim');
    } finally {
        // Reset button
        document.getElementById('save-team-btn').disabled = false;
        document.getElementById('save-team-btn').innerHTML = 'Simpan';
    }
}

// Function to confirm delete team
function confirmDeleteTeam(teamId) {
    if (confirm('Apakah Anda yakin ingin menghapus tim ini? Semua pemain dan pertandingan terkait juga akan dihapus.')) {
        deleteTeam(teamId);
    }
}

// Function to delete team
async function deleteTeam(teamId) {
    try {
        // Get team name for activity log
        const teamDoc = await db.collection('teams').doc(teamId).get();
        const teamName = teamDoc.exists ? teamDoc.data().name : 'Unknown Team';
        
        // Delete team
        await db.collection('teams').doc(teamId).delete();
        
        // Log activity
        logActivity('team', `Tim ${teamName} telah dihapus`);
        
        showAlert('success', 'Tim berhasil dihapus');
        loadTeams();
    } catch (error) {
        console.error("Error deleting team:", error);
        showAlert('error', 'Gagal menghapus tim');
    }
}

// Function to close all modals
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
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