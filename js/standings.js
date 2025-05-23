// Standings JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the standings page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Load standings data
    loadStandings();
    
    // Load recent results
    loadRecentResults();
});

// Function to load standings
async function loadStandings() {
    try {
        const standingsBody = document.getElementById('standings-body');
        
        // Clear any existing content
        standingsBody.innerHTML = '<tr><td colspan="6" class="loading">Memuat data klasemen...</td></tr>';
        
        // Query teams
        const teamsSnapshot = await db.collection('teams')
            .orderBy('points', 'desc')
            .orderBy('wins', 'desc')
            .get();
        
        if (teamsSnapshot.empty) {
            standingsBody.innerHTML = '<tr><td colspan="6" class="no-data">Belum ada data klasemen</td></tr>';
            return;
        }
        
        // Clear loading message
        standingsBody.innerHTML = '';
        
        // Process each team
        let rank = 1;
        teamsSnapshot.forEach(doc => {
            const team = doc.data();
            
            // Calculate matches played
            const matchesPlayed = (team.wins || 0) + (team.losses || 0);
            
            // Create table row
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${rank}</td>
                <td>
                    <div class="team-info">
                        <img src="${team.logo || 'images/team-placeholder.png'}" alt="${team.name}">
                        <span>${team.name}</span>
                    </div>
                </td>
                <td>${matchesPlayed}</td>
                <td>${team.wins || 0}</td>
                <td>${team.losses || 0}</td>
                <td>${team.points || 0}</td>
            `;
            
            // Add click event to view team details
            row.addEventListener('click', () => {
                window.location.href = `teams.html?id=${doc.id}`;
            });
            
            standingsBody.appendChild(row);
            rank++;
        });
        
    } catch (error) {
        console.error("Error loading standings:", error);
        document.getElementById('standings-body').innerHTML = 
            '<tr><td colspan="6" class="no-data">Gagal memuat data klasemen</td></tr>';
    }
}

// Function to load recent results
async function loadRecentResults() {
    try {
        const resultsGrid = document.getElementById('results-grid');
        
        // Clear any existing content
        resultsGrid.innerHTML = '<div class="loading">Memuat hasil pertandingan terbaru...</div>';
        
        // Get current date
        const now = new Date();
        
        // Query recent completed matches
        const matchesSnapshot = await db.collection('matches')
            .where('isCompleted', '==', true)
            .orderBy('date', 'desc')
            .limit(6)
            .get();
        
        if (matchesSnapshot.empty) {
            resultsGrid.innerHTML = '<div class="no-data">Belum ada hasil pertandingan</div>';
            return;
        }
        
        // Clear loading message
        resultsGrid.innerHTML = '';
        
        // Process each match
        const matchPromises = matchesSnapshot.docs.map(async (doc) => {
            const match = doc.data();
            
            // Get team data
            const team1Doc = await db.collection('teams').doc(match.team1Id).get();
            const team2Doc = await db.collection('teams').doc(match.team2Id).get();
            
            const team1 = team1Doc.exists ? team1Doc.data() : { name: 'TBD', logo: 'images/team-placeholder.png' };
            const team2 = team2Doc.exists ? team2Doc.data() : { name: 'TBD', logo: 'images/team-placeholder.png' };
            
            // Create result card
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            
            resultCard.innerHTML = `
                <div class="result-header">
                    <span class="result-date">${formatDate(match.date)}</span>
                </div>
                <div class="result-teams">
                    <div class="team ${match.team1Score > match.team2Score ? 'winner' : ''}">
                        <img src="${team1.logo || 'images/team-placeholder.png'}" alt="${team1.name}">
                        <span>${team1.name}</span>
                    </div>
                    <div class="result-score">
                        ${match.team1Score || 0} - ${match.team2Score || 0}
                    </div>
                    <div class="team ${match.team2Score > match.team1Score ? 'winner' : ''}">
                        <img src="${team2.logo || 'images/team-placeholder.png'}" alt="${team2.name}">
                        <span>${team2.name}</span>
                    </div>
                </div>
            `;
            
            return resultCard;
        });
        
        // Wait for all promises to resolve
        const resultCards = await Promise.all(matchPromises);
        
        // Add result cards to container
        resultCards.forEach(card => {
            resultsGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error("Error loading recent results:", error);
        document.getElementById('results-grid').innerHTML = 
            '<div class="no-data">Gagal memuat hasil pertandingan terbaru</div>';
    }
}