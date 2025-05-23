// Admin Players JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the admin players page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load teams for select
    loadTeamsSelect();
    
    // Load players data
    loadPlayers();
});

// Initialize event listeners
function initEventListeners() {
    // Add player button
    document.getElementById('add-player-btn').addEventListener('click', showAddPlayerModal);
    
    // Save player button
    document.getElementById('save-player-btn').addEventListener('click', savePlayer);
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    // Player photo file input
    document.getElementById('player-photo').addEventListener('change', handlePhotoUpload);
    
    // Team filter
    document.getElementById('team-filter').addEventListener('change', function() {
        loadPlayers(this.value);
    });
}

// Function to load teams for select
async function loadTeamsSelect() {
    try {
        const teamSelect = document.getElementById('player-team');
        const teamFilter = document.getElementById('team-filter');
        
        // Clear existing options
        teamSelect.innerHTML = '<option value="">Pilih Tim</option>';
        teamFilter.innerHTML = '<option value="">Semua Tim</option>';
        
        // Get teams
        const teamsSnapshot = await db.collection('teams').orderBy('name').get();
        
        if (teamsSnapshot.empty) {
            showAlert('warning', 'Belum ada tim yang terdaftar');
            return;
        }
        
        // Add teams to select options
        teamsSnapshot.forEach(doc => {
            const team = doc.data();
            
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = team.name;
            
            const filterOption = option.cloneNode(true);
            
            teamSelect.appendChild(option);
            teamFilter.appendChild(filterOption);
        });
    } catch (error) {
        console.error("Error loading teams:", error);
        showAlert('error', 'Gagal memuat daftar tim');
    }
}

// Function to load players
async function loadPlayers(teamId = '') {
    try {
        const playersContainer = document.getElementById('players-container');
        
        // Clear existing content
        playersContainer.innerHTML = '<div class="loading">Memuat data pemain...</div>';
        
        // Create query
        let query = db.collection('players').orderBy('name');
        
        // Filter by team if specified
        if (teamId) {
            query = db.collection('players').where('teamId', '==', teamId).orderBy('name');
        }
        
        // Get players
        const playersSnapshot = await query.get();
        
        if (playersSnapshot.empty) {
            playersContainer.innerHTML = '<div class="no-data">Belum ada pemain yang terdaftar</div>';
            return;
        }
        
        // Clear loading message
        playersContainer.innerHTML = '';
        
        // Create players table
        const table = document.createElement('table');
        table.className = 'data-table';
        
        // Add table header
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Foto</th>
                    <th>Nama</th>
                    <th>Tim</th>
                    <th>Posisi</th>
                    <th>Nomor</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        // Add players to table
        const tableBody = table.querySelector('tbody');
        
        const playerPromises = playersSnapshot.docs.map(async (doc) => {
            const player = doc.data();
            player.id = doc.id;
            
            // Get team data
            let teamName = 'Unknown Team';
            if (player.teamId) {
                const teamDoc = await db.collection('teams').doc(player.teamId).get();
                if (teamDoc.exists) {
                    teamName = teamDoc.data().name;
                }
            }
            
            // Create table row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${player.photo || '../images/player-placeholder.png'}" alt="${player.name}" class="player-photo-small">
                </td>
                <td>${player.name}</td>
                <td>${teamName}</td>
                <td>${player.position || '-'}</td>
                <td>${player.number || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-player-btn" data-id="${player.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-player-btn" data-id="${player.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            return row;
        });
        
        // Wait for all promises to resolve
        const playerRows = await Promise.all(playerPromises);
        
        // Add rows to table
        playerRows.forEach(row => {
            tableBody.appendChild(row);
        });
        
        // Add table to container
        playersContainer.appendChild(table);
        
        // Add event listeners to buttons
        addPlayerButtonEventListeners();
        
    } catch (error) {
        console.error("Error loading players:", error);
        document.getElementById('players-container').innerHTML = 
            '<div class="no-data">Gagal memuat data pemain</div>';
    }
}

// Function to add event listeners to player buttons
function addPlayerButtonEventListeners() {
    // Edit player buttons
    document.querySelectorAll('.edit-player-btn').forEach(button => {
        button.addEventListener('click', function() {
            const playerId = this.dataset.id;
            editPlayer(playerId);
        });
    });
    
    // Delete player buttons
    document.querySelectorAll('.delete-player-btn').forEach(button => {
        button.addEventListener('click', function() {
            const playerId = this.dataset.id;
            confirmDeletePlayer(playerId);
        });
    });
}

// Function to show add player modal
function showAddPlayerModal() {
    document.getElementById('player-modal').style.display = 'block';
    
    // Reset form
    document.getElementById('player-form').reset();
    document.getElementById('player-id').value = '';
    document.getElementById('player-photo-preview').src = '../images/player-placeholder.png';
    document.getElementById('player-modal-title').textContent = 'Tambah Pemain';
}

// Function to edit player
async function editPlayer(playerId) {
    try {
        const playerDoc = await db.collection('players').doc(playerId).get();
        
        if (!playerDoc.exists) {
            showAlert('error', 'Pemain tidak ditemukan');
            return;
        }
        
        const player = playerDoc.data();
        
        // Set form values
        document.getElementById('player-id').value = playerId;
        document.getElementById('player-name').value = player.name || '';
        document.getElementById('player-team').value = player.teamId || '';
        document.getElementById('player-position').value = player.position || '';
        document.getElementById('player-number').value = player.number || '';
        document.getElementById('player-photo-preview').src = player.photo || '../images/player-placeholder.png';
        
        // Update modal title
        document.getElementById('player-modal-title').textContent = 'Edit Pemain';
        
        // Show modal
        document.getElementById('player-modal').style.display = 'block';
        
    } catch (error) {
        console.error("Error loading player details:", error);
        showAlert('error', 'Gagal memuat detail pemain');
    }
}

// Function to handle photo upload
function handlePhotoUpload(event) {
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
        document.getElementById('player-photo-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Function to save player
async function savePlayer() {
    // Get form data
    const playerId = document.getElementById('player-id').value;
    const playerName = document.getElementById('player-name').value;
    const teamId = document.getElementById('player-team').value;
    const position = document.getElementById('player-position').value;
    const number = document.getElementById('player-number').value;
    const photoFile = document.getElementById('player-photo').files[0];
    
    // Validate form
    if (!playerName) {
        showAlert('error', 'Nama pemain harus diisi');
        return;
    }
    
    if (!teamId) {
        showAlert('error', 'Tim harus dipilih');
        return;
    }
    
    try {
        // Show loading
        document.getElementById('save-player-btn').disabled = true;
        document.getElementById('save-player-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        let photoUrl = null;
        
        // Upload photo if selected
        if (photoFile) {
            // Create storage reference
            const storageRef = firebase.storage().ref();
            const photoRef = storageRef.child(`player-photos/${Date.now()}_${photoFile.name}`);
            
            // Upload file
            await photoRef.put(photoFile);
            
            // Get download URL
            photoUrl = await photoRef.getDownloadURL();
        }
        
        // Create player data
        const playerData = {
            name: playerName,
            teamId: teamId,
            position: position,
            number: number ? parseInt(number) : null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add photo URL if uploaded
        if (photoUrl) {
            playerData.photo = photoUrl;
        }
        
        if (playerId) {
            // Update existing player
            await db.collection('players').doc(playerId).update(playerData);
            
            // Log activity
            logActivity('player', `Pemain ${playerName} telah diperbarui`);
            
            showAlert('success', 'Pemain berhasil diperbarui');
        } else {
            // Add created timestamp for new player
            playerData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            
            // Create new player
            const newPlayerRef = await db.collection('players').add(playerData);
            
            // Log activity
            logActivity('player', `Pemain baru ${playerName} telah ditambahkan`);
            
            showAlert('success', 'Pemain berhasil ditambahkan');
        }
        
        // Close modal and reload players
        closeModals();
        loadPlayers(document.getElementById('team-filter').value);
        
    } catch (error) {
        console.error("Error saving player:", error);
        showAlert('error', 'Gagal menyimpan pemain');
    } finally {
        // Reset button
        document.getElementById('save-player-btn').disabled = false;
        document.getElementById('save-player-btn').innerHTML = 'Simpan';
    }
}

// Function to confirm delete player
function confirmDeletePlayer(playerId) {
    if (confirm('Apakah Anda yakin ingin menghapus pemain ini?')) {
        deletePlayer(playerId);
    }
}

// Function to delete player
async function deletePlayer(playerId) {
    try {
        // Get player name for activity log
        const playerDoc = await db.collection('players').doc(playerId).get();
        const playerName = playerDoc.exists ? playerDoc.data().name : 'Unknown Player';
        
        // Delete player
        await db.collection('players').doc(playerId).delete();
        
        // Log activity
        logActivity('player', `Pemain ${playerName} telah dihapus`);
        
        showAlert('success', 'Pemain berhasil dihapus');
        loadPlayers(document.getElementById('team-filter').value);
    } catch (error) {
        console.error("Error deleting player:", error);
        showAlert('error', 'Gagal menghapus pemain');
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