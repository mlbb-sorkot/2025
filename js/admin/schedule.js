// Admin Schedule JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the admin schedule page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load teams for select
    loadTeamsSelect();
    
    // Load schedule data
    loadSchedule();
});

// Initialize event listeners
function initEventListeners() {
    // Add match button
    document.getElementById('add-match-btn').addEventListener('click', showAddMatchModal);
    
    // Save match button
    document.getElementById('save-match-btn').addEventListener('click', saveMatch);
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    // Date filter
    document.getElementById('date-filter').addEventListener('change', function() {
        loadSchedule(this.value);
    });
    
    // Team filter
    document.getElementById('team-filter').addEventListener('change', function() {
        loadSchedule(document.getElementById('date-filter').value, this.value);
    });
}

// Function to load teams for select
async function loadTeamsSelect() {
    try {
        const team1Select = document.getElementById('match-team1');
        const team2Select = document.getElementById('match-team2');
        const teamFilter = document.getElementById('team-filter');
        
        // Clear existing options
        team1Select.innerHTML = '<option value="">Pilih Tim</option>';
        team2Select.innerHTML = '<option value="">Pilih Tim</option>';
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
            
            const option1 = document.createElement('option');
            option1.value = doc.id;
            option1.textContent = team.name;
            
            const option2 = option1.cloneNode(true);
            const filterOption = option1.cloneNode(true);
            
            team1Select.appendChild(option1);
            team2Select.appendChild(option2);
            teamFilter.appendChild(filterOption);
        });
    } catch (error) {
        console.error("Error loading teams:", error);
        showAlert('error', 'Gagal memuat daftar tim');
    }
}

// Function to load schedule
async function loadSchedule(dateFilter = '', teamFilter = '') {
    try {
        const scheduleContainer = document.getElementById('schedule-container');
        
        // Clear existing content
        scheduleContainer.innerHTML = '<div class="loading">Memuat jadwal pertandingan...</div>';
        
        // Create query
        let query = db.collection('matches').orderBy('date', 'asc');
        
        // Apply date filter if specified
        if (dateFilter) {
            const startDate = new Date(dateFilter);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(dateFilter);
            endDate.setHours(23, 59, 59, 999);
            
            query = db.collection('matches')
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .orderBy('date', 'asc');
        }
        
        // Get matches
        const matchesSnapshot = await query.get();
        
        if (matchesSnapshot.empty) {
            scheduleContainer.innerHTML = '<div class="no-data">Belum ada jadwal pertandingan</div>';
            return;
        }
        
        // Filter by team if specified
        let matches = [];
        matchesSnapshot.forEach(doc => {
            const match = doc.data();
            match.id = doc.id;
            
            // Apply team filter
            if (teamFilter && match.team1Id !== teamFilter && match.team2Id !== teamFilter) {
                return;
            }
            
            matches.push(match);
        });
        
        if (matches.length === 0) {
            scheduleContainer.innerHTML = '<div class="no-data">Tidak ada pertandingan yang sesuai dengan filter</div>';
            return;
        }
        
        // Clear loading message
        scheduleContainer.innerHTML = '';
        
        // Group matches by date
        const matchesByDate = {};
        
        matches.forEach(match => {
            const matchDate = match.date.toDate();
            const dateString = matchDate.toISOString().split('T')[0];
            
            if (!matchesByDate[dateString]) {
                matchesByDate[dateString] = [];
            }
            
            matchesByDate[dateString].push(match);
        });
        
        // Process each date group
        const datePromises = Object.keys(matchesByDate).map(async (dateString) => {
            const dateMatches = matchesByDate[dateString];
            
            // Create date section
            const dateSection = document.createElement('div');
            dateSection.className = 'date-section';
            
            // Format date
            const date = new Date(dateString);
            const formattedDate = formatDate(date);
            
            dateSection.innerHTML = `<h3 class="date-header">${formattedDate}</h3>`;
            
            // Create matches container
            const matchesContainer = document.createElement('div');
            matchesContainer.className = 'matches-container';
            
            // Process each match
            const matchPromises = dateMatches.map(async (match) => {
                // Get team data
                const team1Doc = await db.collection('teams').doc(match.team1Id).get();
                const team2Doc = await db.collection('teams').doc(match.team2Id).get();
                
                const team1 = team1Doc.exists ? team1Doc.data() : { name: 'Unknown Team' };
                const team2 = team2Doc.exists ? team2Doc.data() : { name: 'Unknown Team' };
                
                // Create match card
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';
                
                // Format time
                const matchTime = match.date.toDate();
                const timeString = matchTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                
                matchCard.innerHTML = `
                    <div class="match-time">${timeString}</div>
                    <div class="match-teams">
                        <div class="team">
                            <span>${team1.name}</span>
                        </div>
                        <div class="vs">VS</div>
                        <div class="team">
                            <span>${team2.name}</span>
                        </div>
                    </div>
                    <div class="match-actions">
                        <button class="btn btn-sm btn-primary edit-match-btn" data-id="${match.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-match-btn" data-id="${match.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                return matchCard;
            });
            
            // Wait for all match promises to resolve
            const matchCards = await Promise.all(matchPromises);
            
            // Add match cards to matches container
            matchCards.forEach(card => {
                matchesContainer.appendChild(card);
            });
            
            // Add matches container to date section
            dateSection.appendChild(matchesContainer);
            
            return dateSection;
        });
        
        // Wait for all date promises to resolve
        const dateSections = await Promise.all(datePromises);
        
        // Add date sections to schedule container
        dateSections.forEach(section => {
            scheduleContainer.appendChild(section);
        });
        
        // Add event listeners to buttons
        addMatchButtonEventListeners();
        
    } catch (error) {
        console.error("Error loading schedule:", error);
        document.getElementById('schedule-container').innerHTML = 
            '<div class="no-data">Gagal memuat jadwal pertandingan</div>';
    }
}

// Function to add event listeners to match buttons
function addMatchButtonEventListeners() {
    // Edit match buttons
    document.querySelectorAll('.edit-match-btn').forEach(button => {
        button.addEventListener('click', function() {
            const matchId = this.dataset.id;
            editMatch(matchId);
        });
    });
    
    // Delete match buttons
    document.querySelectorAll('.delete-match-btn').forEach(button => {
        button.addEventListener('click', function() {
            const matchId = this.dataset.id;
            confirmDeleteMatch(matchId);
        });
    });
}

// Function to show add match modal
function showAddMatchModal() {
    document.getElementById('match-modal').style.display = 'block';
    
    // Reset form
    document.getElementById('match-form').reset();
    document.getElementById('match-id').value = '';
    document.getElementById('match-modal-title').textContent = 'Tambah Pertandingan';
    
    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    document.getElementById('match-date').value = formattedDate;
    
    // Set default time to next hour
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    const formattedTime = nextHour.toTimeString().substr(0, 5);
    document.getElementById('match-time').value = formattedTime;
}

// Function to edit match
async function editMatch(matchId) {
    try {
        const matchDoc = await db.collection('matches').doc(matchId).get();
        
        if (!matchDoc.exists) {
            showAlert('error', 'Pertandingan tidak ditemukan');
            return;
        }
        
        const match = matchDoc.data();
        
        // Set form values
        document.getElementById('match-id').value = matchId;
        document.getElementById('match-team1').value = match.team1Id || '';
        document.getElementById('match-team2').value = match.team2Id || '';
        
        // Format date and time
        const matchDate = match.date.toDate();
        const formattedDate = matchDate.toISOString().substr(0, 10);
        const formattedTime = matchDate.toTimeString().substr(0, 5);
        
        document.getElementById('match-date').value = formattedDate;
        document.getElementById('match-time').value = formattedTime;
        
        // Update modal title
        document.getElementById('match-modal-title').textContent = 'Edit Pertandingan';
        
        // Show modal
        document.getElementById('match-modal').style.display = 'block';
        
    } catch (error) {
        console.error("Error loading match details:", error);
        showAlert('error', 'Gagal memuat detail pertandingan');
    }
}

// Function to save match
async function saveMatch() {
    // Get form data
    const matchId = document.getElementById('match-id').value;
    const team1Id = document.getElementById('match-team1').value;
    const team2Id = document.getElementById('match-team2').value;
    const matchDate = document.getElementById('match-date').value;
    const matchTime = document.getElementById('match-time').value;
    
    // Validate form
    if (!team1Id || !team2Id || !matchDate || !matchTime) {
        showAlert('error', 'Semua field harus diisi');
        return;
    }
    
    if (team1Id === team2Id) {
        showAlert('error', 'Tim 1 dan Tim 2 tidak boleh sama');
        return;
    }
    
    try {
        // Show loading
        document.getElementById('save-match-btn').disabled = true;
        document.getElementById('save-match-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        // Combine date and time
        const dateTime = new Date(`${matchDate}T${matchTime}:00`);
        
        // Create match data
        const matchData = {
            team1Id: team1Id,
            team2Id: team2Id,
            date: dateTime,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Initialize match data if new match
        if (!matchId) {
            matchData.isCompleted = false;
            matchData.team1Score = 0;
            matchData.team2Score = 0;
            matchData.winnerId = null;
            matchData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // Get team names for activity log
        const team1Doc = await db.collection('teams').doc(team1Id).get();
        const team2Doc = await db.collection('teams').doc(team2Id).get();
        
        const team1Name = team1Doc.exists ? team1Doc.data().name : 'Unknown Team';
        const team2Name = team2Doc.exists ? team2Doc.data().name : 'Unknown Team';
        
        if (matchId) {
            // Update existing match
            await db.collection('matches').doc(matchId).update(matchData);
            
            // Log activity
            logActivity('match', `Jadwal pertandingan ${team1Name} vs ${team2Name} telah diperbarui`);
            
            showAlert('success', 'Pertandingan berhasil diperbarui');
        } else {
            // Create new match
            const newMatchRef = await db.collection('matches').add(matchData);
            
            // Log activity
            logActivity('match', `Jadwal pertandingan baru ${team1Name} vs ${team2Name} telah ditambahkan`);
            
            showAlert('success', 'Pertandingan berhasil ditambahkan');
        }
        
        // Close modal and reload schedule
        closeModals();
        loadSchedule(document.getElementById('date-filter').value, document.getElementById('team-filter').value);
        
    } catch (error) {
        console.error("Error saving match:", error);
        showAlert('error', 'Gagal menyimpan pertandingan');
    } finally {
        // Reset button
        document.getElementById('save-match-btn').disabled = false;
        document.getElementById('save-match-btn').innerHTML = 'Simpan';
    }
}

// Function to confirm delete match
function confirmDeleteMatch(matchId) {
    if (confirm('Apakah Anda yakin ingin menghapus pertandingan ini?')) {
        deleteMatch(matchId);
    }
}

// Function to delete match
async function deleteMatch(matchId) {
    try {
        // Get match details for activity log
        const matchDoc = await db.collection('matches').doc(matchId).get();
        
        if (!matchDoc.exists) {
            showAlert('error', 'Pertandingan tidak ditemukan');
            return;
        }
        
        const match = matchDoc.data();
        
        // Get team names
        const team1Doc = await db.collection('teams').doc(match.team1Id).get();
        const team2Doc = await db.collection('teams').doc(match.team2Id).get();
        
        const team1Name = team1Doc.exists ? team1Doc.data().name : 'Unknown Team';
        const team2Name = team2Doc.exists ? team2Doc.data().name : 'Unknown Team';
        
        // Delete match
        await db.collection('matches').doc(matchId).delete();
        
        // Log activity
        logActivity('match', `Pertandingan ${team1Name} vs ${team2Name} telah dihapus`);
        
        showAlert('success', 'Pertandingan berhasil dihapus');
        loadSchedule(document.getElementById('date-filter').value, document.getElementById('team-filter').value);
    } catch (error) {
        console.error("Error deleting match:", error);
        showAlert('error', 'Gagal menghapus pertandingan');
    }
}

// Function to close all modals
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Function to format date
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
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