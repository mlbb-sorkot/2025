// Admin Matches JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the admin matches page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load matches data
    loadMatches();
});

// Initialize event listeners
function initEventListeners() {
    // Save result button
    document.getElementById('save-result-btn').addEventListener('click', saveMatchResult);
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    // Filter buttons
    document.getElementById('filter-all').addEventListener('click', function() {
        setActiveFilter(this);
        loadMatches('all');
    });
    
    document.getElementById('filter-upcoming').addEventListener('click', function() {
        setActiveFilter(this);
        loadMatches('upcoming');
    });
    
    document.getElementById('filter-completed').addEventListener('click', function() {
        setActiveFilter(this);
        loadMatches('completed');
    });
    
    document.getElementById('filter-today').addEventListener('click', function() {
        setActiveFilter(this);
        loadMatches('today');
    });
}

// Function to set active filter
function setActiveFilter(button) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    button.classList.add('active');
}

// Function to load matches
async function loadMatches(filter = 'all') {
    try {
        const matchesContainer = document.getElementById('matches-container');
        
        // Clear existing content
        matchesContainer.innerHTML = '<div class="loading">Memuat pertandingan...</div>';
        
        // Create query based on filter
        let query;
        
        if (filter === 'upcoming') {
            // Upcoming matches
            query = db.collection('matches')
                .where('isCompleted', '==', false)
                .orderBy('date', 'asc');
        } else if (filter === 'completed') {
            // Completed matches
            query = db.collection('matches')
                .where('isCompleted', '==', true)
                .orderBy('date', 'desc');
        } else if (filter === 'today') {
            // Today's matches
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            query = db.collection('matches')
                .where('date', '>=', today)
                .where('date', '<', tomorrow)
                .orderBy('date', 'asc');
        } else {
            // All matches
            query = db.collection('matches').orderBy('date', 'asc');
        }
        
        // Get matches
        const matchesSnapshot = await query.get();
        
        if (matchesSnapshot.empty) {
            matchesContainer.innerHTML = '<div class="no-data">Tidak ada pertandingan yang sesuai dengan filter</div>';
            return;
        }
        
        // Clear loading message
        matchesContainer.innerHTML = '';
        
        // Process each match
        const matchPromises = matchesSnapshot.docs.map(async (doc) => {
            const match = doc.data();
            match.id = doc.id;
            
            // Get team data
            const team1Doc = await db.collection('teams').doc(match.team1Id).get();
            const team2Doc = await db.collection('teams').doc(match.team2Id).get();
            
            const team1 = team1Doc.exists ? team1Doc.data() : { name: 'Unknown Team' };
            const team2 = team2Doc.exists ? team2Doc.data() : { name: 'Unknown Team' };
            
            // Create match card
            const matchCard = document.createElement('div');
            matchCard.className = 'match-card';
            
            // Format date and time
            const matchDate = match.date.toDate();
            const dateString = formatDate(matchDate);
            const timeString = matchDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            matchCard.innerHTML = `
                <div class="match-header">
                    <span class="match-date">${dateString}</span>
                    <span class="match-time">${timeString}</span>
                </div>
                <div class="match-teams">
                    <div class="team ${match.winnerId === match.team1Id ? 'winner' : ''}">
                        <span>${team1.name}</span>
                        ${match.isCompleted ? `<span class="score">${match.team1Score || 0}</span>` : ''}
                    </div>
                    <div class="vs">VS</div>
                    <div class="team ${match.winnerId === match.team2Id ? 'winner' : ''}">
                        <span>${team2.name}</span>
                        ${match.isCompleted ? `<span class="score">${match.team2Score || 0}</span>` : ''}
                    </div>
                </div>
                <div class="match-actions">
                    ${!match.isCompleted ? 
                        `<button class="btn btn-primary update-result-btn" data-id="${match.id}">Update Hasil</button>` : 
                        `<button class="btn btn-secondary edit-result-btn" data-id="${match.id}">Edit Hasil</button>`
                    }
                </div>
            `;
            
            return matchCard;
        });
        
        // Wait for all promises to resolve
        const matchCards = await Promise.all(matchPromises);
        
        // Add match cards to container
        matchCards.forEach(card => {
            matchesContainer.appendChild(card);
        });
        
        // Add event listeners to buttons
        addMatchButtonEventListeners();
        
    } catch (error) {
        console.error("Error loading matches:", error);
        document.getElementById('matches-container').innerHTML = 
            '<div class="no-data">Gagal memuat pertandingan</div>';
    }
}

// Function to add event listeners to match buttons
function addMatchButtonEventListeners() {
    // Update result buttons
    document.querySelectorAll('.update-result-btn, .edit-result-btn').forEach(button => {
        button.addEventListener('click', function() {
            const matchId = this.dataset.id;
            showUpdateResultModal(matchId);
        });
    });
}

// Function to show update result modal
async function showUpdateResultModal(matchId) {
    try {
        const matchDoc = await db.collection('matches').doc(matchId).get();
        
        if (!matchDoc.exists) {
            showAlert('error', 'Pertandingan tidak ditemukan');
            return;
        }
        
        const match = matchDoc.data();
        
        // Get team data
        const team1Doc = await db.collection('teams').doc(match.team1Id).get();
        const team2Doc = await db.collection('teams').doc(match.team2Id).get();
        
        const team1 = team1Doc.exists ? team1Doc.data() : { name: 'Unknown Team' };
        const team2 = team2Doc.exists ? team2Doc.data() : { name: 'Unknown Team' };
        
        // Set modal data
        document.getElementById('match-id').value = matchId;
        document.getElementById('team1-name').textContent = team1.name;
        document.getElementById('team2-name').textContent = team2.name;
        document.getElementById('team1-score').value = match.team1Score || 0;
        document.getElementById('team2-score').value = match.team2Score || 0;
        
        // Format date and time
        const matchDate = match.date.toDate();
        const dateString = formatDate(matchDate);
        const timeString = matchDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        document.getElementById('match-date-time').textContent = `${dateString} ${timeString}`;
        
        // Update modal title
        document.getElementById('result-modal-title').textContent = match.isCompleted ? 'Edit Hasil Pertandingan' : 'Update Hasil Pertandingan';
        
        // Show modal
        document.getElementById('result-modal').style.display = 'block';
        
    } catch (error) {
        console.error("Error loading match details:", error);
        showAlert('error', 'Gagal memuat detail pertandingan');
    }
}

// Function to save match result
async function saveMatchResult() {
    // Get form data
    const matchId = document.getElementById('match-id').value;
    const team1Score = parseInt(document.getElementById('team1-score').value);
    const team2Score = parseInt(document.getElementById('team2-score').value);
    
    // Validate form
    if (isNaN(team1Score) || isNaN(team2Score)) {
        showAlert('error', 'Skor harus berupa angka');
        return;
    }
    
    if (team1Score < 0 || team2Score < 0) {
        showAlert('error', 'Skor tidak boleh negatif');
        return;
    }
    
    try {
        // Show loading
        document.getElementById('save-result-btn').disabled = true;
        document.getElementById('save-result-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        // Get match data
        const matchDoc = await db.collection('matches').doc(matchId).get();
        
        if (!matchDoc.exists) {
            showAlert('error', 'Pertandingan tidak ditemukan');
            return;
        }
        
        const match = matchDoc.data();
        
        // Determine winner
        let winnerId = null;
        if (team1Score > team2Score) {
            winnerId = match.team1Id;
        } else if (team2Score > team1Score) {
            winnerId = match.team2Id;
        }
        
        // Update match
        await db.collection('matches').doc(matchId).update({
            team1Score: team1Score,
            team2Score: team2Score,
            winnerId: winnerId,
            isCompleted: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update team statistics
        await updateTeamStats(match.team1Id, match.team2Id, team1Score, team2Score, winnerId);
        
        // Get team names for activity log
        const team1Doc = await db.collection('teams').doc(match.team1Id).get();
        const team2Doc = await db.collection('teams').doc(match.team2Id).get();
        
        const team1Name = team1Doc.exists ? team1Doc.data().name : 'Unknown Team';
        const team2Name = team2Doc.exists ? team2Doc.data().name : 'Unknown Team';
        
        // Log activity
        logActivity('match', `Hasil pertandingan ${team1Name} vs ${team2Name} telah diperbarui: ${team1Score}-${team2Score}`);
        
        showAlert('success', 'Hasil pertandingan berhasil disimpan');
        
        // Close modal and reload matches
        closeModals();
        
        // Get active filter
        const activeFilter = document.querySelector('.filter-btn.active').id.replace('filter-', '');
        loadMatches(activeFilter);
        
    } catch (error) {
        console.error("Error saving match result:", error);
        showAlert('error', 'Gagal menyimpan hasil pertandingan');
    } finally {
        // Reset button
        document.getElementById('save-result-btn').disabled = false;
        document.getElementById('save-result-btn').innerHTML = 'Simpan Hasil';
    }
}

// Function to update team statistics
async function updateTeamStats(team1Id, team2Id, team1Score, team2Score, winnerId) {
    try {
        // Get team data
        const team1Doc = await db.collection('teams').doc(team1Id).get();
        const team2Doc = await db.collection('teams').doc(team2Id).get();
        
        if (!team1Doc.exists || !team2Doc.exists) {
            console.error("One or both teams not found");
            return;
        }
        
        const team1 = team1Doc.data();
        const team2 = team2Doc.data();
        
        // Update team 1 stats
        const team1Update = {
            played: (team1.played || 0) + 1,
            goalsFor: (team1.goalsFor || 0) + team1Score,
            goalsAgainst: (team1.goalsAgainst || 0) + team2Score,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update team 2 stats
        const team2Update = {
            played: (team2.played || 0) + 1,
            goalsFor: (team2.goalsFor || 0) + team2Score,
            goalsAgainst: (team2.goalsAgainst || 0) + team1Score,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update win/draw/loss stats
        if (winnerId === team1Id) {
            // Team 1 won
            team1Update.won = (team1.won || 0) + 1;
            team1Update.points = (team1.points || 0) + 3;
            team2Update.lost = (team2.lost || 0) + 1;
        } else if (winnerId === team2Id) {
            // Team 2 won
            team1Update.lost = (team1.lost || 0) + 1;
            team2Update.won = (team2.won || 0) + 1;
            team2Update.points = (team2.points || 0) + 3;
        } else {
            // Draw
            team1Update.drawn = (team1.drawn || 0) + 1;
            team1Update.points = (team1.points || 0) + 1;
            team2Update.drawn = (team2.drawn || 0) + 1;
            team2Update.points = (team2.points || 0) + 1;
        }
        
        // Calculate goal difference
        team1Update.goalDifference = team1Update.goalsFor - team1Update.goalsAgainst;
        team2Update.goalDifference = team2Update.goalsFor - team2Update.goalsAgainst;
        
        // Update teams
        await db.collection('teams').doc(team1Id).update(team1Update);
        await db.collection('teams').doc(team2Id).update(team2Update);
        
    } catch (error) {
        console.error("Error updating team stats:", error);
        throw error;
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