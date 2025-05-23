// Admin Standings JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the admin standings page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Load standings data
    loadStandings();
    
    // Initialize event listeners
    initEventListeners();
});

// Initialize event listeners
function initEventListeners() {
    // Refresh standings button
    document.getElementById('refresh-standings-btn').addEventListener('click', function() {
        loadStandings(true);
    });
    
    // Export standings button
    document.getElementById('export-standings-btn').addEventListener('click', exportStandings);
}

// Function to load standings
async function loadStandings(forceRefresh = false) {
    try {
        const standingsContainer = document.getElementById('standings-container');
        
        // Clear existing content
        standingsContainer.innerHTML = '<div class="loading">Memuat klasemen...</div>';
        
        // Get teams
        const teamsSnapshot = await db.collection('teams').get();
        
        if (teamsSnapshot.empty) {
            standingsContainer.innerHTML = '<div class="no-data">Tidak ada tim yang terdaftar</div>';
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
        
        // If force refresh, recalculate all stats
        if (forceRefresh) {
            await recalculateAllTeamStats(teams);
            
            // Reload teams with updated stats
            const updatedTeamsSnapshot = await db.collection('teams').get();
            teams = [];
            
            updatedTeamsSnapshot.forEach(doc => {
                const team = doc.data();
                team.id = doc.id;
                teams.push(team);
            });
        }
        
        // Sort teams by points, then goal difference, then goals for
        teams.sort((a, b) => {
            if (a.points !== b.points) {
                return b.points - a.points;
            }
            
            if (a.goalDifference !== b.goalDifference) {
                return b.goalDifference - a.goalDifference;
            }
            
            return b.goalsFor - a.goalsFor;
        });
        
        // Create standings table
        const table = document.createElement('table');
        table.className = 'standings-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Pos</th>
                <th>Tim</th>
                <th>Main</th>
                <th>M</th>
                <th>S</th>
                <th>K</th>
                <th>GM</th>
                <th>GK</th>
                <th>SG</th>
                <th>Poin</th>
            </tr>
        `;
        
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        teams.forEach((team, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td class="team-name">
                    <div class="team-logo-small">
                        <img src="${team.logoUrl || '../img/default-team.png'}" alt="${team.name}" onerror="this.src='../img/default-team.png'">
                    </div>
                    ${team.name}
                </td>
                <td>${team.played}</td>
                <td>${team.won}</td>
                <td>${team.drawn}</td>
                <td>${team.lost}</td>
                <td>${team.goalsFor}</td>
                <td>${team.goalsAgainst}</td>
                <td>${team.goalDifference}</td>
                <td class="points">${team.points}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        
        // Clear loading message and add table
        standingsContainer.innerHTML = '';
        standingsContainer.appendChild(table);
        
        // Show last updated time
        const lastUpdated = document.createElement('div');
        lastUpdated.className = 'last-updated';
        lastUpdated.textContent = `Terakhir diperbarui: ${new Date().toLocaleString('id-ID')}`;
        standingsContainer.appendChild(lastUpdated);
        
        // If force refresh, show success message
        if (forceRefresh) {
            showAlert('success', 'Klasemen berhasil diperbarui');
            
            // Log activity
            logActivity('standings', 'Klasemen telah diperbarui');
        }
        
    } catch (error) {
        console.error("Error loading standings:", error);
        document.getElementById('standings-container').innerHTML = 
            '<div class="no-data">Gagal memuat klasemen</div>';
        
        if (forceRefresh) {
            showAlert('error', 'Gagal memperbarui klasemen');
        }
    }
}

// Function to recalculate all team stats
async function recalculateAllTeamStats(teams) {
    try {
        // Reset all team stats
        const batch = db.batch();
        
        teams.forEach(team => {
            const teamRef = db.collection('teams').doc(team.id);
            
            batch.update(teamRef, {
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        
        // Get all completed matches
        const matchesSnapshot = await db.collection('matches')
            .where('isCompleted', '==', true)
            .get();
        
        // Process each match
        for (const doc of matchesSnapshot.docs) {
            const match = doc.data();
            
            // Update team stats
            await updateTeamStats(
                match.team1Id, 
                match.team2Id, 
                match.team1Score || 0, 
                match.team2Score || 0, 
                match.winnerId
            );
        }
        
    } catch (error) {
        console.error("Error recalculating team stats:", error);
        throw error;
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
        team1Update.goalDifference = (team1.goalsFor || 0) + team1Score - ((team1.goalsAgainst || 0) + team2Score);
        team2Update.goalDifference = (team2.goalsFor || 0) + team2Score - ((team2.goalsAgainst || 0) + team1Score);
        
        // Update teams
        await db.collection('teams').doc(team1Id).update(team1Update);
        await db.collection('teams').doc(team2Id).update(team2Update);
        
    } catch (error) {
        console.error("Error updating team stats:", error);
        throw error;
    }
}

// Function to export standings
function exportStandings() {
    try {
        const standingsTable = document.querySelector('.standings-table');
        
        if (!standingsTable) {
            showAlert('error', 'Tidak ada data klasemen untuk diekspor');
            return;
        }
        
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        // Convert table to worksheet
        const ws = XLSX.utils.table_to_sheet(standingsTable);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Klasemen');
        
        // Generate filename with date
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const filename = `Klasemen_MLBB_Kapolresta_Sorong_Kota_Cup_${dateStr}.xlsx`;
        
        // Export to Excel file
        XLSX.writeFile(wb, filename);
        
        showAlert('success', 'Klasemen berhasil diekspor');
        
        // Log activity
        logActivity('export', 'Klasemen telah diekspor ke Excel');
        
    } catch (error) {
        console.error("Error exporting standings:", error);
        showAlert('error', 'Gagal mengekspor klasemen');
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