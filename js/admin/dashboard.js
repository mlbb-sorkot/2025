// Dashboard JavaScript for the MLBB Kapolresta Sorong Kota Cup admin panel
// This file handles the dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Load dashboard data
    loadDashboardStats();
    loadTodayMatches();
    loadCurrentStandings();
    loadRecentActivities();
});

// Function to load dashboard statistics
async function loadDashboardStats() {
    try {
        // Get counts from Firestore
        const teamsCount = await getCollectionCount('teams');
        const playersCount = await getCollectionCount('players');
        const matchesCount = await getCollectionCount('matches');
        const completedMatchesCount = await getCompletedMatchesCount();
        
        // Update stats in UI
        document.getElementById('teams-count').textContent = teamsCount;
        document.getElementById('players-count').textContent = playersCount;
        document.getElementById('matches-count').textContent = matchesCount;
        document.getElementById('completed-matches-count').textContent = completedMatchesCount;
        
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
        showAlert('error', 'Gagal memuat statistik dashboard');
    }
}

// Function to get collection count
async function getCollectionCount(collectionName) {
    try {
        const snapshot = await db.collection(collectionName).get();
        return snapshot.size;
    } catch (error) {
        console.error(`Error getting ${collectionName} count:`, error);
        return 0;
    }
}

// Function to get completed matches count
async function getCompletedMatchesCount() {
    try {
        const snapshot = await db.collection('matches')
            .where('isCompleted', '==', true)
            .get();
        return snapshot.size;
    } catch (error) {
        console.error("Error getting completed matches count:", error);
        return 0;
    }
}

// Function to load today's matches
async function loadTodayMatches() {
    try {
        const todayMatchesContainer = document.getElementById('today-matches');
        
        // Clear existing content
        todayMatchesContainer.innerHTML = '<div class="loading">Memuat pertandingan hari ini...</div>';
        
        // Get today's date (start and end)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Get matches for today
        const matchesSnapshot = await db.collection('matches')
            .where('date', '>=', today)
            .where('date', '<', tomorrow)
            .orderBy('date', 'asc')
            .get();
        
        if (matchesSnapshot.empty) {
            todayMatchesContainer.innerHTML = '<div class="no-data">Tidak ada pertandingan hari ini</div>';
            return;
        }
        
        // Clear loading message
        todayMatchesContainer.innerHTML = '';
        
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
            
            // Format time
            const matchTime = match.date.toDate();
            const timeString = matchTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            matchCard.innerHTML = `
                <div class="match-time">${timeString}</div>
                <div class="match-teams">
                    <div class="team">
                        <span>${team1.name}</span>
                        ${match.isCompleted ? `<span class="score">${match.team1Score || 0}</span>` : ''}
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <span>${team2.name}</span>
                        ${match.isCompleted ? `<span class="score">${match.team2Score || 0}</span>` : ''}
                    </div>
                </div>
                <div class="match-status ${match.isCompleted ? 'completed' : 'upcoming'}">
                    ${match.isCompleted ? 'Selesai' : 'Belum Dimulai'}
                </div>
            `;
            
            return matchCard;
        });
        
        // Wait for all promises to resolve
        const matchCards = await Promise.all(matchPromises);
        
        // Add match cards to container
        matchCards.forEach(card => {
            todayMatchesContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error("Error loading today's matches:", error);
        document.getElementById('today-matches').innerHTML = 
            '<div class="no-data">Gagal memuat pertandingan hari ini</div>';
    }
}

// Function to load current standings
async function loadCurrentStandings() {
    try {
        const standingsContainer = document.getElementById('current-standings');
        
        // Clear existing content
        standingsContainer.innerHTML = '<div class="loading">Memuat klasemen...</div>';
        
        // Get teams
        const teamsSnapshot = await db.collection('teams')
            .orderBy('points', 'desc')
            .orderBy('goalDifference', 'desc')
            .limit(5)
            .get();
        
        if (teamsSnapshot.empty) {
            standingsContainer.innerHTML = '<div class="no-data">Belum ada data klasemen</div>';
            return;
        }
        
        // Create standings table
        const table = document.createElement('table');
        table.className = 'standings-table';
        
        // Add table header
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>Tim</th>
                    <th>Main</th>
                    <th>M</th>
                    <th>S</th>
                    <th>K</th>
                    <th>Poin</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        // Add teams to table
        const tableBody = table.querySelector('tbody');
        
        teamsSnapshot.forEach((doc, index) => {
            const team = doc.data();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${team.name}</td>
                <td>${team.played || 0}</td>
                <td>${team.won || 0}</td>
                <td>${team.drawn || 0}</td>
                <td>${team.lost || 0}</td>
                <td>${team.points || 0}</td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Clear loading message and add table
        standingsContainer.innerHTML = '';
        standingsContainer.appendChild(table);
        
        // Add view all link
        const viewAllLink = document.createElement('a');
        viewAllLink.href = 'teams.html';
        viewAllLink.className = 'view-all';
        viewAllLink.textContent = 'Lihat Semua';
        
        standingsContainer.appendChild(viewAllLink);
        
    } catch (error) {
        console.error("Error loading standings:", error);
        document.getElementById('current-standings').innerHTML = 
            '<div class="no-data">Gagal memuat klasemen</div>';
    }
}

// Function to load recent activities
async function loadRecentActivities() {
    try {
        const activitiesContainer = document.getElementById('recent-activities');
        
        // Clear existing content
        activitiesContainer.innerHTML = '<div class="loading">Memuat aktivitas terbaru...</div>';
        
        // Get recent activities
        const activitiesSnapshot = await db.collection('activities')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();
        
        if (activitiesSnapshot.empty) {
            activitiesContainer.innerHTML = '<div class="no-data">Belum ada aktivitas terbaru</div>';
            return;
        }
        
        // Clear loading message
        activitiesContainer.innerHTML = '';
        
        // Create activities list
        const activityList = document.createElement('ul');
        activityList.className = 'activity-list';
        
        activitiesSnapshot.forEach(doc => {
            const activity = doc.data();
            
            const listItem = document.createElement('li');
            listItem.className = 'activity-item';
            
            // Format timestamp
            const timestamp = activity.timestamp.toDate();
            const timeString = formatTimeAgo(timestamp);
            
            // Set icon based on activity type
            let icon = 'fa-info-circle';
            if (activity.type === 'match') icon = 'fa-futbol';
            else if (activity.type === 'team') icon = 'fa-users';
            else if (activity.type === 'player') icon = 'fa-user';
            
            listItem.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-message">${activity.message}</div>
                    <div class="activity-time">${timeString}</div>
                </div>
            `;
            
            activityList.appendChild(listItem);
        });
        
        activitiesContainer.appendChild(activityList);
        
    } catch (error) {
        console.error("Error loading recent activities:", error);
        document.getElementById('recent-activities').innerHTML = 
            '<div class="no-data">Gagal memuat aktivitas terbaru</div>';
    }
}

// Function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return 'Baru saja';
    } else if (diffMin < 60) {
        return `${diffMin} menit yang lalu`;
    } else if (diffHour < 24) {
        return `${diffHour} jam yang lalu`;
    } else if (diffDay < 30) {
        return `${diffDay} hari yang lalu`;
    } else {
        return date.toLocaleDateString('id-ID');
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