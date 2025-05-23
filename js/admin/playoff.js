// Admin Playoff JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the admin playoff page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load playoff data
    loadPlayoffSettings();
    loadPlayoffTeams();
    loadPlayoffMatches();
});

// Initialize event listeners
function initEventListeners() {
    // Playoff status toggle
    document.getElementById('playoff-status-toggle').addEventListener('change', togglePlayoffStatus);
    
    // Generate bracket button
    document.getElementById('generate-bracket-btn').addEventListener('click', generateBracket);
    
    // Add match button
    document.getElementById('add-match-btn').addEventListener('click', showAddMatchModal);
    
    // Save match button
    document.getElementById('save-match-btn').addEventListener('click', saveMatch);
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    // Update match result button
    document.getElementById('update-result-btn').addEventListener('click', updateMatchResult);
}

// Function to load playoff settings
async function loadPlayoffSettings() {
    try {
        const settingsDoc = await db.collection('settings').doc('playoff').get();
        
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            document.getElementById('playoff-status-toggle').checked = settings.isActive;
            
            // Update status text
            updatePlayoffStatusText(settings.isActive);
        } else {
            // Create default settings if not exists
            await db.collection('settings').doc('playoff').set({
                isActive: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            document.getElementById('playoff-status-toggle').checked = false;
            updatePlayoffStatusText(false);
        }
    } catch (error) {
        console.error("Error loading playoff settings:", error);
        showAlert('error', 'Gagal memuat pengaturan playoff');
    }
}

// Function to update playoff status text
function updatePlayoffStatusText(isActive) {
    const statusText = document.getElementById('playoff-status-text');
    if (isActive) {
        statusText.textContent = 'Playoff Aktif';
        statusText.className = 'status-active';
    } else {
        statusText.textContent = 'Playoff Tidak Aktif';
        statusText.className = 'status-inactive';
    }
}

// Function to toggle playoff status
async function togglePlayoffStatus() {
    const isActive = document.getElementById('playoff-status-toggle').checked;
    
    try {
        await db.collection('settings').doc('playoff').update({
            isActive: isActive,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        updatePlayoffStatusText(isActive);
        showAlert('success', `Playoff telah ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error) {
        console.error("Error updating playoff status:", error);
        showAlert('error', 'Gagal mengubah status playoff');
        
        // Revert toggle
        document.getElementById('playoff-status-toggle').checked = !isActive;
        updatePlayoffStatusText(!isActive);
    }
}

// Function to load playoff teams
async function loadPlayoffTeams() {
    try {
        const teamsSelect = document.getElementById('team1-select');
        const teamsSelect2 = document.getElementById('team2-select');
        
        // Clear existing options
        teamsSelect.innerHTML = '<option value="">Pilih Tim</option>';
        teamsSelect2.innerHTML = '<option value="">Pilih Tim</option>';
        
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
            
            const option2 = option.cloneNode(true);
            
            teamsSelect.appendChild(option);
            teamsSelect2.appendChild(option2);
        });
    } catch (error) {
        console.error("Error loading teams:", error);
        showAlert('error', 'Gagal memuat daftar tim');
    }
}

// Function to load playoff matches
async function loadPlayoffMatches() {
    try {
        const matchesContainer = document.getElementById('playoff-matches');
        
        // Clear existing content
        matchesContainer.innerHTML = '<div class="loading">Memuat pertandingan playoff...</div>';
        
        // Get playoff matches
        const matchesSnapshot = await db.collection('playoff_matches')
            .orderBy('round', 'asc')
            .orderBy('matchNumber', 'asc')
            .get();
        
        if (matchesSnapshot.empty) {
            matchesContainer.innerHTML = '<div class="no-data">Belum ada pertandingan playoff</div>';
            return;
        }
        
        // Clear loading message
        matchesContainer.innerHTML = '';
        
        // Process each match
        const matchPromises = matchesSnapshot.docs.map(async (doc) => {
            const match = doc.data();
            match.id = doc.id;
            
            // Get team data
            let team1 = { name: 'TBD' };
            let team2 = { name: 'TBD' };
            
            if (match.team1Id) {
                const team1Doc = await db.collection('teams').doc(match.team1Id).get();
                if (team1Doc.exists) team1 = team1Doc.data();
            }
            
            if (match.team2Id) {
                const team2Doc = await db.collection('teams').doc(match.team2Id).get();
                if (team2Doc.exists) team2 = team2Doc.data();
            }
            
            // Determine round name
            let roundName = '';
            if (match.round === 1) roundName = 'Semi Final';
            else if (match.round === 2) roundName = 'Final';
            
            // Create match card
            const matchCard = document.createElement('div');
            matchCard.className = 'match-card';
            matchCard.dataset.id = match.id;
            
            matchCard.innerHTML = `
                <div class="match-header">
                    <span class="match-round">${roundName} - Match ${match.matchNumber}</span>
                    <span class="match-date">${formatDate(match.date)}</span>
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
                        `<button class="btn btn-primary update-match-btn" data-id="${match.id}">Update Hasil</button>` : 
                        `<span class="match-status completed">Selesai</span>`
                    }
                    <button class="btn btn-danger delete-match-btn" data-id="${match.id}">Hapus</button>
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
        
        // Add event listeners to match cards
        addMatchCardEventListeners();
        
    } catch (error) {
        console.error("Error loading playoff matches:", error);
        document.getElementById('playoff-matches').innerHTML = 
            '<div class="no-data">Gagal memuat pertandingan playoff</div>';
    }
}

// Function to add event listeners to match cards
function addMatchCardEventListeners() {
    // Update match result buttons
    document.querySelectorAll('.update-match-btn').forEach(button => {
        button.addEventListener('click', function() {
            const matchId = this.dataset.id;
            showUpdateResultModal(matchId);
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
    document.getElementById('add-match-modal').style.display = 'block';
    
    // Reset form
    document.getElementById('match-form').reset();
    document.getElementById('match-id').value = '';
    
    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    document.getElementById('match-date').value = formattedDate;
}

// Function to show update result modal
async function showUpdateResultModal(matchId) {
    try {
        const matchDoc = await db.collection('playoff_matches').doc(matchId).get();
        
        if (!matchDoc.exists) {
            showAlert('error', 'Pertandingan tidak ditemukan');
            return;
        }
        
        const match = matchDoc.data();
        
        // Get team data
        let team1 = { name: 'TBD' };
        let team2 = { name: 'TBD' };
        
        if (match.team1Id) {
            const team1Doc = await db.collection('teams').doc(match.team1Id).get();
            if (team1Doc.exists) team1 = team1Doc.data();
        }
        
        if (match.team2Id) {
            const team2Doc = await db.collection('teams').doc(match.team2Id).get();
            if (team2Doc.exists) team2 = team2Doc.data();
        }
        
        // Set modal data
        document.getElementById('result-match-id').value = matchId;
        document.getElementById('team1-name').textContent = team1.name;
        document.getElementById('team2-name').textContent = team2.name;
        document.getElementById('team1-score').value = match.team1Score || 0;
        document.getElementById('team2-score').value = match.team2Score || 0;
        
        // Show modal
        document.getElementById('update-result-modal').style.display = 'block';
        
    } catch (error) {
        console.error("Error loading match details:", error);
        showAlert('error', 'Gagal memuat detail pertandingan');
    }
}

// Function to close all modals
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Function to save match
async function saveMatch() {
    // Get form data
    const matchId = document.getElementById('match-id').value;
    const round = parseInt(document.getElementById('match-round').value);
    const matchNumber = parseInt(document.getElementById('match-number').value);
    const team1Id = document.getElementById('team1-select').value;
    const team2Id = document.getElementById('team2-select').value;
    const matchDate = document.getElementById('match-date').value;
    
    // Validate form
    if (!round || !matchNumber || !team1Id || !team2Id || !matchDate) {
        showAlert('error', 'Semua field harus diisi');
        return;
    }
    
    if (team1Id === team2Id) {
        showAlert('error', 'Tim 1 dan Tim 2 tidak boleh sama');
        return;
    }
    
    try {
        // Create match data
        const matchData = {
            round: round,
            matchNumber: matchNumber,
            team1Id: team1Id,
            team2Id: team2Id,
            date: new Date(matchDate),
            isCompleted: false,
            team1Score: 0,
            team2Score: 0,
            winnerId: null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (matchId) {
            // Update existing match
            await db.collection('playoff_matches').doc(matchId).update(matchData);
            showAlert('success', 'Pertandingan berhasil diupdate');
        } else {
            // Add created timestamp for new match
            matchData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            
            // Create new match
            await db.collection('playoff_matches').add(matchData);
            showAlert('success', 'Pertandingan berhasil ditambahkan');
        }
        
        // Close modal and reload matches
        closeModals();
        loadPlayoffMatches();
        
    } catch (error) {
        console.error("Error saving match:", error);
        showAlert('error', 'Gagal menyimpan pertandingan');
    }
}

// Function to update match result
async function updateMatchResult() {
    // Get form data
    const matchId = document.getElementById('result-match-id').value;
    const team1Score = parseInt(document.getElementById('team1-score').value);
    const team2Score = parseInt(document.getElementById('team2-score').value);
    
    // Validate form
    if (isNaN(team1Score) || isNaN(team2Score)) {
        showAlert('error', 'Skor harus berupa angka');
        return;
    }
    
    if (team1Score === team2Score) {
        showAlert('error', 'Skor tidak boleh sama (tidak boleh seri)');
        return;
    }
    
    try {
        // Get match data
        const matchDoc = await db.collection('playoff_matches').doc(matchId).get();
        
        if (!matchDoc.exists) {
            showAlert('error', 'Pertandingan tidak ditemukan');
            return;
        }
        
        const match = matchDoc.data();
        
        // Determine winner
        const winnerId = team1Score > team2Score ? match.team1Id : match.team2Id;
        
        // Update match
        await db.collection('playoff_matches').doc(matchId).update({
            team1Score: team1Score,
            team2Score: team2Score,
            winnerId: winnerId,
            isCompleted: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // If this is a semi-final match, update the final match
        if (match.round === 1) {
            await updateNextRoundMatch(match, winnerId);
        }
        
        showAlert('success', 'Hasil pertandingan berhasil diupdate');
        
        // Close modal and reload matches
        closeModals();
        loadPlayoffMatches();
        
    } catch (error) {
        console.error("Error updating match result:", error);
        showAlert('error', 'Gagal mengupdate hasil pertandingan');
    }
}

// Function to update next round match
async function updateNextRoundMatch(currentMatch, winnerId) {
    try {
        // Find the final match
        const finalMatchesSnapshot = await db.collection('playoff_matches')
            .where('round', '==', 2)
            .get();
        
        if (finalMatchesSnapshot.empty) {
            console.log("Final match not found");
            return;
        }
        
        const finalMatch = finalMatchesSnapshot.docs[0];
        
        // Determine which team slot to update based on the semi-final match number
        let updateData = {};
        
        if (currentMatch.matchNumber === 1) {
            updateData = { team1Id: winnerId };
        } else if (currentMatch.matchNumber === 2) {
            updateData = { team2Id: winnerId };
        }
        
        // Update the final match
        await db.collection('playoff_matches').doc(finalMatch.id).update(updateData);
        
    } catch (error) {
        console.error("Error updating next round match:", error);
        throw error;
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
        await db.collection('playoff_matches').doc(matchId).delete();
        showAlert('success', 'Pertandingan berhasil dihapus');
        loadPlayoffMatches();
    } catch (error) {
        console.error("Error deleting match:", error);
        showAlert('error', 'Gagal menghapus pertandingan');
    }
}

// Function to generate bracket
async function generateBracket() {
    if (!confirm('Apakah Anda yakin ingin membuat bracket playoff? Ini akan menghapus semua pertandingan playoff yang sudah ada.')) {
        return;
    }
    
    try {
        // Show loading
        document.getElementById('generate-bracket-btn').disabled = true;
        document.getElementById('generate-bracket-btn').textContent = 'Generating...';
        
        // Delete existing playoff matches
        const existingMatches = await db.collection('playoff_matches').get();
        
        const batch = db.batch();
        
        existingMatches.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        // Get top 4 teams from standings
        const teamsSnapshot = await db.collection('teams')
            .orderBy('points', 'desc')
            .orderBy('goalDifference', 'desc')
            .limit(4)
            .get();
        
        if (teamsSnapshot.size < 4) {
            showAlert('error', 'Tidak cukup tim untuk membuat bracket playoff (minimal 4 tim)');
            return;
        }
        
        const teams = [];
        teamsSnapshot.forEach(doc => {
            teams.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Create semi-final matches
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        
        // Semi-final 1: 1st vs 4th
        await db.collection('playoff_matches').add({
            round: 1,
            matchNumber: 1,
            team1Id: teams[0].id,
            team2Id: teams[3].id,
            date: tomorrow,
            isCompleted: false,
            team1Score: 0,
            team2Score: 0,
            winnerId: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Semi-final 2: 2nd vs 3rd
        await db.collection('playoff_matches').add({
            round: 1,
            matchNumber: 2,
            team1Id: teams[1].id,
            team2Id: teams[2].id,
            date: tomorrow,
            isCompleted: false,
            team1Score: 0,
            team2Score: 0,
            winnerId: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Create final match (TBD vs TBD)
        await db.collection('playoff_matches').add({
            round: 2,
            matchNumber: 1,
            team1Id: null,
            team2Id: null,
            date: dayAfterTomorrow,
            isCompleted: false,
            team1Score: 0,
            team2Score: 0,
            winnerId: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Activate playoff
        await db.collection('settings').doc('playoff').update({
            isActive: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        document.getElementById('playoff-status-toggle').checked = true;
        updatePlayoffStatusText(true);
        
        showAlert('success', 'Bracket playoff berhasil dibuat');
        loadPlayoffMatches();
        
    } catch (error) {
        console.error("Error generating bracket:", error);
        showAlert('error', 'Gagal membuat bracket playoff');
    } finally {
        // Reset button
        document.getElementById('generate-bracket-btn').disabled = false;
        document.getElementById('generate-bracket-btn').textContent = 'Generate Bracket';
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