// Admin Statistics JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the admin statistics page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load statistics data
    loadStatistics();
});

// Initialize event listeners
function initEventListeners() {
    // Tab buttons
    document.getElementById('team-stats-tab').addEventListener('click', function() {
        switchTab('team-stats');
    });
    
    document.getElementById('player-stats-tab').addEventListener('click', function() {
        switchTab('player-stats');
    });
    
    // Export buttons
    document.getElementById('export-team-stats-btn').addEventListener('click', function() {
        exportStatistics('team');
    });
    
    document.getElementById('export-player-stats-btn').addEventListener('click', function() {
        exportStatistics('player');
    });
}

// Function to switch tabs
function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.stats-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).style.display = 'block';
    
    // Add active class to selected tab button
    document.getElementById(`${tabId}-tab`).classList.add('active');
}

// Function to load statistics
async function loadStatistics() {
    try {
        // Load team statistics
        await loadTeamStatistics();
        
        // Load player statistics
        await loadPlayerStatistics();
        
    } catch (error) {
        console.error("Error loading statistics:", error);
        showAlert('error', 'Gagal memuat statistik');
    }
}

// Function to load team statistics
async function loadTeamStatistics() {
    try {
        const teamStatsContainer = document.getElementById('team-stats');
        
        // Clear existing content
        teamStatsContainer.innerHTML = '<div class="loading">Memuat statistik tim...</div>';
        
        // Get teams
        const teamsSnapshot = await db.collection('teams').get();
        
        if (teamsSnapshot.empty) {
            teamStatsContainer.innerHTML = '<div class="no-data">Tidak ada tim yang terdaftar</div>';
            return;
        }
        
        // Process teams
        let teams = [];
        
        teamsSnapshot.forEach(doc => {
            const team = doc.data();
            team.id = doc.id;
            
            // Initialize stats if not present
            team.played = team.played || 0;
            team.won = team.won || 0;
            team.drawn = team.drawn || 0;
            team.lost = team.lost || 0;
            team.goalsFor = team.goalsFor || 0;
            team.goalsAgainst = team.goalsAgainst || 0;
            team.goalDifference = team.goalDifference || 0;
            team.points = team.points || 0;
            
            teams.push(team);
        });
        
        // Create stats sections
        const statsContent = document.createElement('div');
        statsContent.className = 'stats-grid';
        
        // Top scoring teams
        const topScoringTeams = [...teams].sort((a, b) => b.goalsFor - a.goalsFor).slice(0, 5);
        statsContent.appendChild(createStatCard('Tim Pencetak Gol Terbanyak', topScoringTeams, 'goalsFor', 'gol'));
        
        // Best defense teams
        const bestDefenseTeams = [...teams]
            .filter(team => team.played > 0)
            .sort((a, b) => a.goalsAgainst - b.goalsAgainst)
            .slice(0, 5);
        statsContent.appendChild(createStatCard('Tim Pertahanan Terbaik', bestDefenseTeams, 'goalsAgainst', 'gol'));
        
        // Most wins
        const mostWinsTeams = [...teams].sort((a, b) => b.won - a.won).slice(0, 5);
        statsContent.appendChild(createStatCard('Tim dengan Kemenangan Terbanyak', mostWinsTeams, 'won', 'kemenangan'));
        
        // Best win rate
        const teamsWithMatches = teams.filter(team => team.played > 0);
        const winRateTeams = teamsWithMatches.map(team => {
            return {
                ...team,
                winRate: (team.won / team.played) * 100
            };
        }).sort((a, b) => b.winRate - a.winRate).slice(0, 5);
        statsContent.appendChild(createStatCard('Tim dengan Persentase Kemenangan Tertinggi', winRateTeams, 'winRate', '%', true));
        
        // Clear loading message and add content
        teamStatsContainer.innerHTML = '';
        teamStatsContainer.appendChild(statsContent);
        
        // Add export button
        const exportBtn = document.createElement('button');
        exportBtn.id = 'export-team-stats-btn';
        exportBtn.className = 'btn btn-primary';
        exportBtn.innerHTML = '<i class="fas fa-download"></i> Ekspor Statistik Tim';
        exportBtn.addEventListener('click', function() {
            exportStatistics('team');
        });
        
        teamStatsContainer.appendChild(exportBtn);
        
    } catch (error) {
        console.error("Error loading team statistics:", error);
        document.getElementById('team-stats').innerHTML = 
            '<div class="no-data">Gagal memuat statistik tim</div>';
    }
}

// Function to load player statistics
async function loadPlayerStatistics() {
    try {
        const playerStatsContainer = document.getElementById('player-stats');
        
        // Clear existing content
        playerStatsContainer.innerHTML = '<div class="loading">Memuat statistik pemain...</div>';
        
        // Get players
        const playersSnapshot = await db.collection('players').get();
        
        if (playersSnapshot.empty) {
            playerStatsContainer.innerHTML = '<div class="no-data">Tidak ada pemain yang terdaftar</div>';
            return;
        }
        
        // Process players
        let players = [];
        const teamPromises = [];
        
        playersSnapshot.forEach(doc => {
            const player = doc.data();
            player.id = doc.id;
            
            // Initialize stats if not present
            player.goals = player.goals || 0;
            player.assists = player.assists || 0;
            player.yellowCards = player.yellowCards || 0;
            player.redCards = player.redCards || 0;
            player.mvp = player.mvp || 0;
            
            // Get team data
            if (player.teamId) {
                const teamPromise = db.collection('teams').doc(player.teamId).get()
                    .then(teamDoc => {
                        if (teamDoc.exists) {
                            player.teamName = teamDoc.data().name;
                            player.teamLogo = teamDoc.data().logoUrl;
                        } else {
                            player.teamName = 'Unknown Team';
                        }
                    });
                
                teamPromises.push(teamPromise);
            } else {
                player.teamName = 'No Team';
            }
            
            players.push(player);
        });
        
        // Wait for all team promises to resolve
        await Promise.all(teamPromises);
        
        // Create stats sections
        const statsContent = document.createElement('div');
        statsContent.className = 'stats-grid';
        
        // Top scorers
        const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 5);
        statsContent.appendChild(createPlayerStatCard('Pencetak Gol Terbanyak', topScorers, 'goals', 'gol'));
        
        // Top assists
        const topAssists = [...players].sort((a, b) => b.assists - a.assists).slice(0, 5);
        statsContent.appendChild(createPlayerStatCard('Assist Terbanyak', topAssists, 'assists', 'assist'));
        
        // Most yellow cards
        const mostYellowCards = [...players].sort((a, b) => b.yellowCards - a.yellowCards).slice(0, 5);
        statsContent.appendChild(createPlayerStatCard('Kartu Kuning Terbanyak', mostYellowCards, 'yellowCards', 'kartu'));
        
        // Most red cards
        const mostRedCards = [...players].sort((a, b) => b.redCards - a.redCards).slice(0, 5);
        statsContent.appendChild(createPlayerStatCard('Kartu Merah Terbanyak', mostRedCards, 'redCards', 'kartu'));
        
        // Most MVP
        const mostMVP = [...players].sort((a, b) => b.mvp - a.mvp).slice(0, 5);
        statsContent.appendChild(createPlayerStatCard('MVP Terbanyak', mostMVP, 'mvp', 'kali'));
        
        // Clear loading message and add content
        playerStatsContainer.innerHTML = '';
        playerStatsContainer.appendChild(statsContent);
        
        // Add export button
        const exportBtn = document.createElement('button');
        exportBtn.id = 'export-player-stats-btn';
        exportBtn.className = 'btn btn-primary';
        exportBtn.innerHTML = '<i class="fas fa-download"></i> Ekspor Statistik Pemain';
        exportBtn.addEventListener('click', function() {
            exportStatistics('player');
        });
        
        playerStatsContainer.appendChild(exportBtn);
        
    } catch (error) {
        console.error("Error loading player statistics:", error);
        document.getElementById('player-stats').innerHTML = 
            '<div class="no-data">Gagal memuat statistik pemain</div>';
    }
}

// Function to create stat card for teams
function createStatCard(title, teams, statKey, unit, isPercentage = false) {
    const card = document.createElement('div');
    card.className = 'stat-card';
    
    const cardTitle = document.createElement('h3');
    cardTitle.textContent = title;
    card.appendChild(cardTitle);
    
    const statList = document.createElement('ul');
    statList.className = 'stat-list';
    
    teams.forEach((team, index) => {
        const listItem = document.createElement('li');
        
        let statValue = team[statKey];
        if (isPercentage) {
            statValue = statValue.toFixed(1);
        }
        
        listItem.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="team">
                <div class="team-logo-small">
                    <img src="${team.logoUrl || '../img/default-team.png'}" alt="${team.name}" onerror="this.src='../img/default-team.png'">
                </div>
                ${team.name}
            </span>
            <span class="value">${statValue} ${unit}</span>
        `;
        
        statList.appendChild(listItem);
    });
    
    card.appendChild(statList);
    
    return card;
}

// Function to create stat card for players
function createPlayerStatCard(title, players, statKey, unit) {
    const card = document.createElement('div');
    card.className = 'stat-card';
    
    const cardTitle = document.createElement('h3');
    cardTitle.textContent = title;
    card.appendChild(cardTitle);
    
    const statList = document.createElement('ul');
    statList.className = 'stat-list';
    
    players.forEach((player, index) => {
        const listItem = document.createElement('li');
        
        listItem.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="player">
                <div class="player-photo-small">
                    <img src="${player.photoUrl || '../img/default-player.png'}" alt="${player.name}" onerror="this.src='../img/default-player.png'">
                </div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-team">
                        <div class="team-logo-tiny">
                            <img src="${player.teamLogo || '../img/default-team.png'}" alt="${player.teamName}" onerror="this.src='../img/default-team.png'">
                        </div>
                        ${player.teamName}
                    </div>
                </div>
            </span>
            <span class="value">${player[statKey]} ${unit}</span>
        `;
        
        statList.appendChild(listItem);
    });
    
    card.appendChild(statList);
    
    return card;
}

// Function to export statistics
async function exportStatistics(type) {
    try {
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        if (type === 'team') {
            // Get teams
            const teamsSnapshot = await db.collection('teams').get();
            
            if (teamsSnapshot.empty) {
                showAlert('error', 'Tidak ada data tim untuk diekspor');
                return;
            }
            
            // Process teams
            let teams = [];
            
            teamsSnapshot.forEach(doc => {
                const team = doc.data();
                team.id = doc.id;
                
                // Initialize stats if not present
                team.played = team.played || 0;
                team.won = team.won || 0;
                team.drawn = team.drawn || 0;
                team.lost = team.lost || 0;
                team.goalsFor = team.goalsFor || 0;
                team.goalsAgainst = team.goalsAgainst || 0;
                team.goalDifference = team.goalDifference || 0;
                team.points = team.points || 0;
                
                // Calculate win rate
                team.winRate = team.played > 0 ? ((team.won / team.played) * 100).toFixed(1) + '%' : '0%';
                
                teams.push(team);
            });
            
            // Sort teams by points
            teams.sort((a, b) => b.points - a.points);
            
            // Create worksheet data
            const wsData = [
                ['Peringkat', 'Tim', 'Main', 'Menang', 'Seri', 'Kalah', 'Gol', 'Kebobolan', 'Selisih Gol', 'Poin', 'Win Rate']
            ];
            
            teams.forEach((team, index) => {
                wsData.push([
                    index + 1,
                    team.name,
                    team.played,
                    team.won,
                    team.drawn,
                    team.lost,
                    team.goalsFor,
                    team.goalsAgainst,
                    team.goalDifference,
                    team.points,
                    team.winRate
                ]);
            });
            
            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Statistik Tim');
            
            // Generate filename with date
            const date = new Date();
            const dateStr = date.toISOString().split('T')[0];
            const filename = `Statistik_Tim_MLBB_Kapolresta_Sorong_Kota_Cup_${dateStr}.xlsx`;
            
            // Export to Excel file
            XLSX.writeFile(wb, filename);
            
            showAlert('success', 'Statistik tim berhasil diekspor');
            
            // Log activity
            logActivity('export', 'Statistik tim telah diekspor ke Excel');
            
        } else if (type === 'player') {
            // Get players
            const playersSnapshot = await db.collection('players').get();
            
            if (playersSnapshot.empty) {
                showAlert('error', 'Tidak ada data pemain untuk diekspor');
                return;
            }
            
            // Process players
            let players = [];
            const teamPromises = [];
            
            playersSnapshot.forEach(doc => {
                const player = doc.data();
                player.id = doc.id;
                
                // Initialize stats if not present
                player.goals = player.goals || 0;
                player.assists = player.assists || 0;
                player.yellowCards = player.yellowCards || 0;
                player.redCards = player.redCards || 0;
                player.mvp = player.mvp || 0;
                
                // Get team data
                if (player.teamId) {
                    const teamPromise = db.collection('teams').doc(player.teamId).get()
                        .then(teamDoc => {
                            if (teamDoc.exists) {
                                player.teamName = teamDoc.data().name;
                            } else {
                                player.teamName = 'Unknown Team';
                            }
                        });
                    
                    teamPromises.push(teamPromise);
                } else {
                    player.teamName = 'No Team';
                }
                
                players.push(player);
            });
            
            // Wait for all team promises to resolve
            await Promise.all(teamPromises);
            
            // Create worksheet data
            const wsData = [
                ['Nama Pemain', 'Tim', 'Posisi', 'Gol', 'Assist', 'Kartu Kuning', 'Kartu Merah', 'MVP']
            ];
            
            players.forEach(player => {
                wsData.push([
                    player.name,
                    player.teamName,
                    player.position || '-',
                    player.goals,
                    player.assists,
                    player.yellowCards,
                    player.redCards,
                    player.mvp
                ]);
            });
            
            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Statistik Pemain');
            
            // Generate filename with date
            const date = new Date();
            const dateStr = date.toISOString().split('T')[0];
            const filename = `Statistik_Pemain_MLBB_Kapolresta_Sorong_Kota_Cup_${dateStr}.xlsx`;
            
            // Export to Excel file
            XLSX.writeFile(wb, filename);
            
            showAlert('success', 'Statistik pemain berhasil diekspor');
            
            // Log activity
            logActivity('export', 'Statistik pemain telah diekspor ke Excel');
        }
        
    } catch (error) {
        console.error("Error exporting statistics:", error);
        showAlert('error', 'Gagal mengekspor statistik');
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