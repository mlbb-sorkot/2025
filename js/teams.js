// Teams JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the teams page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a team ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('id');
    
    if (teamId) {
        // If team ID exists, load team details
        loadTeamDetails(teamId);
    } else {
        // Otherwise, load all teams
        loadAllTeams();
    }
});

// Function to load all teams
async function loadAllTeams() {
    try {
        const teamsGrid = document.getElementById('teams-full-grid');
        
        // Clear any existing content
        teamsGrid.innerHTML = '';
        
        // Query teams
        const teamsSnapshot = await db.collection('teams')
            .orderBy('name', 'asc')
            .get();
        
        if (teamsSnapshot.empty) {
            teamsGrid.innerHTML = '<div class="no-data">Belum ada tim terdaftar</div>';
            return;
        }
        
        // Process each team
        teamsSnapshot.forEach(doc => {
            const team = doc.data();
            
            // Create team card
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card';
            
            teamCard.innerHTML = `
                <img src="${team.logo || 'images/team-placeholder.png'}" alt="${team.name}">
                <h3>${team.name}</h3>
            `;
            
            // Add click event to view team details
            teamCard.addEventListener('click', () => {
                window.location.href = `teams.html?id=${doc.id}`;
            });
            
            teamsGrid.appendChild(teamCard);
        });
        
    } catch (error) {
        console.error("Error loading teams:", error);
        document.getElementById('teams-full-grid').innerHTML = 
            '<div class="no-data">Gagal memuat data tim</div>';
    }
}

// Function to load team details
async function loadTeamDetails(teamId) {
    try {
        // Show team details section
        document.getElementById('team-details').style.display = 'block';
        
        // Get team data
        const teamDoc = await db.collection('teams').doc(teamId).get();
        
        if (!teamDoc.exists) {
            alert('Tim tidak ditemukan');
            window.location.href = 'teams.html';
            return;
        }
        
        const team = teamDoc.data();
        
        // Update team profile
        document.getElementById('team-logo').src = team.logo || 'images/team-placeholder.png';
        document.getElementById('team-logo').alt = team.name;
        document.getElementById('team-name').textContent = team.name;
        document.getElementById('team-matches').textContent = (team.wins || 0) + (team.losses || 0);
        document.getElementById('team-wins').textContent = team.wins || 0;
        document.getElementById('team-losses').textContent = team.losses || 0;
        document.getElementById('team-points').textContent = team.points || 0;
        
        // Load team players
        loadTeamPlayers(teamId);
        
        // Load team matches
        loadTeamMatches(teamId);
        
    } catch (error) {
        console.error("Error loading team details:", error);
        alert('Gagal memuat detail tim');
    }
}

// Function to load team players
async function loadTeamPlayers(teamId) {
    try {
        const playersGrid = document.getElementById('players-grid');
        
        // Clear any existing content
        playersGrid.innerHTML = '';
        
        // Query players for this team
        const playersSnapshot = await db.collection('players')
            .where('teamId', '==', teamId)
            .orderBy('name', 'asc')
            .get();
        
        if (playersSnapshot.empty) {
            playersGrid.innerHTML = '<div class="no-data">Belum ada pemain terdaftar</div>';
            return;
        }
        
        // Process each player
        playersSnapshot.forEach(doc => {
            const player = doc.data();
            
            // Create player card
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            
            playerCard.innerHTML = `
                <img src="${player.photo || 'images/player-placeholder.png'}" alt="${player.name}">
                <h4>${player.name}</h4>
                <p>${player.role || 'Pemain'}</p>
            `;
            
            playersGrid.appendChild(playerCard);
        });
        
    } catch (error) {
        console.error("Error loading team players:", error);
        document.getElementById('players-grid').innerHTML = 
            '<div class="no-data">Gagal memuat data pemain</div>';
    }
}

// Function to load team matches
async function loadTeamMatches(teamId) {
    try {
        const matchesList = document.getElementById('team-matches-list');
        
        // Clear any existing content
        matchesList.innerHTML = '';
        
        // Query matches for this team
        const matchesSnapshot = await db.collection('matches')
            .where('teams', 'array-contains', teamId)
            .orderBy('date', 'desc')
            .get();
        
        if (matchesSnapshot.empty) {
            matchesList.innerHTML = '<div class="no-data">Belum ada pertandingan</div>';
            return;
        }
        
        // Process each match
        const matchPromises = matchesSnapshot.docs.map(async (doc) => {
            const match = doc.data();
            
            // Get opponent team data
            const opponentId = match.team1Id === teamId ? match.team2Id : match.team1Id;
            const opponentDoc = await db.collection('teams').doc(opponentId).get();
            
            const opponent = opponentDoc.exists ? opponentDoc.data() : { name: 'TBD', logo: 'images/team-placeholder.png' };
            
            // Create match card
            const matchCard = document.createElement('div');
            matchCard.className = 'match-card';
            
            // Determine if match has been played
            const isPlayed = match.isCompleted;
            
            // Determine if this team won
            let result = '';
            if (isPlayed) {
                if (match.team1Id === teamId) {
                    result = match.team1Score > match.team2Score ? 'Menang' : 'Kalah';
                } else {
                    result = match.team2Score > match.team1Score ? 'Menang' : 'Kalah';
                }
            }
            
            // Get team scores
            const teamScore = match.team1Id === teamId ? match.team1Score : match.team2Score;
            const opponentScore = match.team1Id === teamId ? match.team2Score : match.team1Score;
            
            matchCard.innerHTML = `
                <div class="match-header">
                    <span class="match-date">${formatDate(match.date)}</span>
                    ${isPlayed ? `<span class="match-result ${result === 'Menang' ? 'win' : 'loss'}">${result}</span>` : ''}
                </div>
                <div class="match-teams">
                    <div class="team">
                        <img src="${team.logo || 'images/team-placeholder.png'}" alt="${team.name}">
                        <span>${team.name}</span>
                        ${isPlayed ? `<span class="score">${teamScore}</span>` : ''}
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <img src="${opponent.logo || 'images/team-placeholder.png'}" alt="${opponent.name}">
                        <span>${opponent.name}</span>
                        ${isPlayed ? `<span class="score">${opponentScore}</span>` : ''}
                    </div>
                </div>
            `;
            
            return matchCard;
        });
        
        // Wait for all promises to resolve
        const matchCards = await Promise.all(matchPromises);
        
        // Add match cards to container
        matchCards.forEach(card => {
            matchesList.appendChild(card);
        });
        
    } catch (error) {
        console.error("Error loading team matches:", error);
        document.getElementById('team-matches-list').innerHTML = 
            '<div class="no-data">Gagal memuat data pertandingan</div>';
    }
}