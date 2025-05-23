// Playoff JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the playoff page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if playoffs are active
    checkPlayoffStatus();
});

// Function to check if playoffs are active
async function checkPlayoffStatus() {
    try {
        // Get playoff status from settings
        const settingsDoc = await db.collection('settings').doc('playoff').get();
        
        if (!settingsDoc.exists) {
            showPlayoffInactive();
            return;
        }
        
        const settings = settingsDoc.data();
        
        if (!settings.isActive) {
            showPlayoffInactive();
            return;
        }
        
        // Playoffs are active, load data
        loadPlayoffBracket();
        loadPlayoffSchedule();
        
    } catch (error) {
        console.error("Error checking playoff status:", error);
        showPlayoffInactive();
    }
}

// Function to show inactive playoff message
function showPlayoffInactive() {
    const playoffInfo = document.querySelector('.playoff-info');
    const bracket = document.querySelector('.bracket');
    const playoffSchedule = document.querySelector('.playoff-schedule');
    
    playoffInfo.innerHTML = `
        <h3>Playoff Belum Dimulai</h3>
        <p>Playoff akan dimulai setelah semua pertandingan babak penyisihan selesai. Silakan pantau klasemen untuk melihat tim-tim yang akan lolos ke babak playoff.</p>
    `;
    
    bracket.style.display = 'none';
    playoffSchedule.style.display = 'none';
}

// Function to load playoff bracket
async function loadPlayoffBracket() {
    try {
        const bracket = document.querySelector('.bracket');
        
        // Clear any existing content
        bracket.innerHTML = '<div class="loading">Memuat bracket playoff...</div>';
        
        // Get playoff matches
        const matchesSnapshot = await db.collection('playoff_matches')
            .orderBy('round', 'asc')
            .orderBy('matchNumber', 'asc')
            .get();
        
        if (matchesSnapshot.empty) {
            bracket.innerHTML = '<div class="no-data">Belum ada data bracket playoff</div>';
            return;
        }
        
        // Group matches by round
        const matchesByRound = {};
        
        matchesSnapshot.forEach(doc => {
            const match = doc.data();
            match.id = doc.id;
            
            if (!matchesByRound[match.round]) {
                matchesByRound[match.round] = [];
            }
            
            matchesByRound[match.round].push(match);
        });
        
        // Clear loading message
        bracket.innerHTML = '';
        
        // Create rounds
        const rounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));
        
        // Process each round
        const roundPromises = rounds.map(async (round) => {
            const matches = matchesByRound[round];
            
            // Create round element
            const roundElement = document.createElement('div');
            roundElement.className = 'bracket-round';
            
            // Set round title
            let roundTitle = '';
            if (round === '1') roundTitle = 'Semi Final';
            else if (round === '2') roundTitle = 'Final';
            
            // Process matches in this round
            const matchPromises = matches.map(async (match) => {
                // Get team data
                let team1 = { name: 'TBD', logo: 'images/team-placeholder.png' };
                let team2 = { name: 'TBD', logo: 'images/team-placeholder.png' };
                
                if (match.team1Id) {
                    const team1Doc = await db.collection('teams').doc(match.team1Id).get();
                    if (team1Doc.exists) team1 = team1Doc.data();
                }
                
                if (match.team2Id) {
                    const team2Doc = await db.collection('teams').doc(match.team2Id).get();
                    if (team2Doc.exists) team2 = team2Doc.data();
                }
                
                // Create match element
                const matchElement = document.createElement('div');
                matchElement.className = 'bracket-match';
                
                matchElement.innerHTML = `
                    <div class="bracket-match-header">
                        ${roundTitle} - Match ${match.matchNumber}
                    </div>
                    <div class="bracket-team ${match.winnerId === match.team1Id ? 'bracket-winner' : ''}">
                        <div class="bracket-team-info">
                            <img src="${team1.logo || 'images/team-placeholder.png'}" alt="${team1.name}">
                            <span>${team1.name}</span>
                        </div>
                        <div class="bracket-score">${match.isCompleted ? (match.team1Score || 0) : '-'}</div>
                    </div>
                    <div class="bracket-team ${match.winnerId === match.team2Id ? 'bracket-winner' : ''}">
                        <div class="bracket-team-info">
                            <img src="${team2.logo || 'images/team-placeholder.png'}" alt="${team2.name}">
                            <span>${team2.name}</span>
                        </div>
                        <div class="bracket-score">${match.isCompleted ? (match.team2Score || 0) : '-'}</div>
                    </div>
                `;
                
                return matchElement;
            });
            
            // Wait for all match promises to resolve
            const matchElements = await Promise.all(matchPromises);
            
            // Add matches to round
            matchElements.forEach(matchElement => {
                roundElement.appendChild(matchElement);
            });
            
            return roundElement;
        });
        
        // Wait for all round promises to resolve
        const roundElements = await Promise.all(roundPromises);
        
        // Add rounds to bracket
        roundElements.forEach(roundElement => {
            bracket.appendChild(roundElement);
            
            // Add connecting lines between rounds (except for the last round)
            if (roundElement !== roundElements[roundElements.length - 1]) {
                const bracketLines = document.createElement('div');
                bracketLines.className = 'bracket-lines';
                bracket.appendChild(bracketLines);
            }
        });
        
    } catch (error) {
        console.error("Error loading playoff bracket:", error);
        document.querySelector('.bracket').innerHTML = 
            '<div class="no-data">Gagal memuat bracket playoff</div>';
    }
}

// Function to load playoff schedule
async function loadPlayoffSchedule() {
    try {
        const scheduleContainer = document.getElementById('playoff-schedule-container');
        
        // Clear any existing content
        scheduleContainer.innerHTML = '<div class="loading">Memuat jadwal playoff...</div>';
        
        // Get playoff matches
        const matchesSnapshot = await db.collection('playoff_matches')
            .orderBy('date', 'asc')
            .get();
        
        if (matchesSnapshot.empty) {
            scheduleContainer.innerHTML = '<div class="no-data">Belum ada jadwal playoff</div>';
            return;
        }
        
        // Clear loading message
        scheduleContainer.innerHTML = '';
        
        // Process each match
        const matchPromises = matchesSnapshot.docs.map(async (doc) => {
            const match = doc.data();
            
            // Get team data
            let team1 = { name: 'TBD', logo: 'images/team-placeholder.png' };
            let team2 = { name: 'TBD', logo: 'images/team-placeholder.png' };
            
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
            
            matchCard.innerHTML = `
                <div class="match-header">
                    <span class="match-round">${roundName} - Match ${match.matchNumber}</span>
                    <span class="match-date">${formatDate(match.date)}</span>
                </div>
                <div class="match-teams">
                    <div class="team ${match.winnerId === match.team1Id ? 'winner' : ''}">
                        <img src="${team1.logo || 'images/team-placeholder.png'}" alt="${team1.name}">
                        <span>${team1.name}</span>
                        ${match.isCompleted ? `<span class="score">${match.team1Score || 0}</span>` : ''}
                    </div>
                    <div class="vs">VS</div>
                    <div class="team ${match.winnerId === match.team2Id ? 'winner' : ''}">
                        <img src="${team2.logo || 'images/team-placeholder.png'}" alt="${team2.name}">
                        <span>${team2.name}</span>
                        ${match.isCompleted ? `<span class="score">${match.team2Score || 0}</span>` : ''}
                    </div>
                </div>
            `;
            
            return matchCard;
        });
        
        // Wait for all promises to resolve
        const matchCards = await Promise.all(matchPromises);
        
        // Add match cards to container
        matchCards.forEach(card => {
            scheduleContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error("Error loading playoff schedule:", error);
        document.getElementById('playoff-schedule-container').innerHTML = 
            '<div class="no-data">Gagal memuat jadwal playoff</div>';
    }
}