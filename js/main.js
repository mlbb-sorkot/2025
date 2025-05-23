// Main JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the homepage functionality

document.addEventListener('DOMContentLoaded', function() {
    // Load upcoming matches
    loadUpcomingMatches();
    
    // Load teams overview
    loadTeamsOverview();
    
    // Load standings
    loadStandings();
});

// Function to load upcoming matches
async function loadUpcomingMatches() {
    try {
        const matchesContainer = document.getElementById('upcoming-matches');
        
        // Clear any existing content
        matchesContainer.innerHTML = '';
        
        // Get current date
        const now = new Date();
        
        // Query upcoming matches (matches that haven't been played yet)
        const matchesSnapshot = await db.collection('matches')
            .where('date', '>=', now)
            .orderBy('date', 'asc')
            .limit(4)
            .get();
        
        if (matchesSnapshot.empty) {
            matchesContainer.innerHTML = '<div class="no-data">Tidak ada pertandingan mendatang</div>';
            return;
        }
        
        // Process each match
        const matchPromises = matchesSnapshot.docs.map(async (doc) => {
            const match = doc.data();
            
            // Get team data
            const team1Doc = await db.collection('teams').doc(match.team1Id).get();
            const team2Doc = await db.collection('teams').doc(match.team2Id).get();
            
            const team1 = team1Doc.exists ? team1Doc.data() : { name: 'TBD', logo: 'images/team-placeholder.png' };
            const team2 = team2Doc.exists ? team2Doc.data() : { name: 'TBD', logo: 'images/team-placeholder.png' };
            
            // Create match card
            const matchCard = document.createElement('div');
            matchCard.className = 'match-card';
            
            matchCard.innerHTML = `
                <div class="match-header">
                    <span class="match-date">${formatDate(match.date)}</span>
                </div>
                <div class="match-teams">
                    <div class="team">
                        <img src="${team1.logo || 'images/team-placeholder.png'}" alt="${team1.name}">
                        <span>${team1.name}</span>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <img src="${team2.logo || 'images/team-placeholder.png'}" alt="${team2.name}">
                        <span>${team2.name}</span>
                    </div>
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
        
    } catch (error) {
        console.error("Error loading upcoming matches:", error);
        document.getElementById('upcoming-matches').innerHTML = 
            '<div class="no-data">Gagal memuat pertandingan mendatang</div>';
    }
}

// Function to load teams overview
async function loadTeamsOverview() {
    try {
        const teamsGrid = document.getElementById('teams-grid');
        
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
        console.error("Error loading teams overview:", error);
        document.getElementById('teams-grid').innerHTML = 
            '<div class="no-data">Gagal memuat data tim</div>';
    }
}

// Function to load standings
async function loadStandings() {
    try {
        const standingsBody = document.getElementById('standings-body');
        
        // Clear any existing content
        standingsBody.innerHTML = '';
        
        // Query teams
        const teamsSnapshot = await db.collection('teams')
            .orderBy('points', 'desc')
            .orderBy('wins', 'desc')
            .get();
        
        if (teamsSnapshot.empty) {
            standingsBody.innerHTML = '<tr><td colspan="6" class="no-data">Belum ada data klasemen</td></tr>';
            return;
        }
        
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
            
            standingsBody.appendChild(row);
            rank++;
        });
        
    } catch (error) {
        console.error("Error loading standings:", error);
        document.getElementById('standings-body').innerHTML = 
            '<tr><td colspan="6" class="no-data">Gagal memuat data klasemen</td></tr>';
    }
}