// Schedule JavaScript for the MLBB Kapolresta Sorong Kota Cup website
// This file handles the schedule page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Load schedule data
    loadSchedule();
    
    // Set up filter listeners
    setupFilters();
});

// Global variables to store schedule data
let allMatches = [];
let allTeams = [];

// Function to load schedule data
async function loadSchedule() {
    try {
        // Show loading state
        const scheduleTimeline = document.getElementById('schedule-timeline');
        scheduleTimeline.innerHTML = '<div class="loading">Memuat jadwal...</div>';
        
        // Load teams first for filtering
        await loadTeams();
        
        // Query matches ordered by date
        const matchesSnapshot = await db.collection('matches')
            .orderBy('date', 'asc')
            .get();
        
        if (matchesSnapshot.empty) {
            scheduleTimeline.innerHTML = '<div class="no-data">Belum ada jadwal pertandingan</div>';
            return;
        }
        
        // Process matches
        allMatches = [];
        const matchPromises = matchesSnapshot.docs.map(async (doc) => {
            const match = doc.data();
            match.id = doc.id;
            
            // Get team data
            const team1Doc = await db.collection('teams').doc(match.team1Id).get();
            const team2Doc = await db.collection('teams').doc(match.team2Id).get();
            
            match.team1 = team1Doc.exists ? team1Doc.data() : { name: 'TBD', logo: 'images/team-placeholder.png' };
            match.team2 = team2Doc.exists ? team2Doc.data() : { name: 'TBD', logo: 'images/team-placeholder.png' };
            
            // Add to global matches array
            allMatches.push(match);
            
            return match;
        });
        
        // Wait for all promises to resolve
        await Promise.all(matchPromises);
        
        // Populate date filter
        populateDateFilter();
        
        // Display all matches initially
        displayMatches(allMatches);
        
    } catch (error) {
        console.error("Error loading schedule:", error);
        document.getElementById('schedule-timeline').innerHTML = 
            '<div class="no-data">Gagal memuat jadwal pertandingan</div>';
    }
}

// Function to load teams for filtering
async function loadTeams() {
    try {
        // Query teams
        const teamsSnapshot = await db.collection('teams')
            .orderBy('name', 'asc')
            .get();
        
        // Process teams
        allTeams = [];
        teamsSnapshot.forEach(doc => {
            const team = doc.data();
            team.id = doc.id;
            allTeams.push(team);
        });
        
        // Populate team filter
        populateTeamFilter();
        
    } catch (error) {
        console.error("Error loading teams:", error);
    }
}

// Function to populate date filter
function populateDateFilter() {
    const dateFilter = document.getElementById('date-filter');
    
    // Clear existing options
    dateFilter.innerHTML = '<option value="all">Semua Tanggal</option>';
    
    // Get unique dates from matches
    const dates = {};
    allMatches.forEach(match => {
        if (match.date) {
            const date = match.date.toDate ? match.date.toDate() : new Date(match.date);
            const dateString = formatDateOnly(date);
            dates[dateString] = date;
        }
    });
    
    // Sort dates
    const sortedDates = Object.entries(dates).sort((a, b) => a[1] - b[1]);
    
    // Add date options
    sortedDates.forEach(([dateString, date]) => {
        const option = document.createElement('option');
        option.value = dateString;
        option.textContent = dateString;
        dateFilter.appendChild(option);
    });
}

// Function to populate team filter
function populateTeamFilter() {
    const teamFilter = document.getElementById('team-filter');
    
    // Clear existing options
    teamFilter.innerHTML = '<option value="all">Semua Tim</option>';
    
    // Add team options
    allTeams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name;
        teamFilter.appendChild(option);
    });
}

// Function to set up filter listeners
function setupFilters() {
    const dateFilter = document.getElementById('date-filter');
    const teamFilter = document.getElementById('team-filter');
    
    // Add change event listeners
    dateFilter.addEventListener('change', applyFilters);
    teamFilter.addEventListener('change', applyFilters);
}

// Function to apply filters
function applyFilters() {
    const dateFilter = document.getElementById('date-filter').value;
    const teamFilter = document.getElementById('team-filter').value;
    
    // Filter matches
    let filteredMatches = allMatches;
    
    // Apply date filter
    if (dateFilter !== 'all') {
        filteredMatches = filteredMatches.filter(match => {
            if (match.date) {
                const date = match.date.toDate ? match.date.toDate() : new Date(match.date);
                return formatDateOnly(date) === dateFilter;
            }
            return false;
        });
    }
    
    // Apply team filter
    if (teamFilter !== 'all') {
        filteredMatches = filteredMatches.filter(match => {
            return match.team1Id === teamFilter || match.team2Id === teamFilter;
        });
    }
    
    // Display filtered matches
    displayMatches(filteredMatches);
}

// Function to display matches
function displayMatches(matches) {
    const scheduleTimeline = document.getElementById('schedule-timeline');
    
    // Clear existing content
    scheduleTimeline.innerHTML = '';
    
    if (matches.length === 0) {
        scheduleTimeline.innerHTML = '<div class="no-data">Tidak ada pertandingan yang sesuai dengan filter</div>';
        return;
    }
    
    // Group matches by date
    const matchesByDate = {};
    matches.forEach(match => {
        if (match.date) {
            const date = match.date.toDate ? match.date.toDate() : new Date(match.date);
            const dateString = formatDateOnly(date);
            
            if (!matchesByDate[dateString]) {
                matchesByDate[dateString] = [];
            }
            
            matchesByDate[dateString].push(match);
        }
    });
    
    // Sort dates
    const sortedDates = Object.keys(matchesByDate).sort((a, b) => {
        const dateA = new Date(matchesByDate[a][0].date.toDate ? matchesByDate[a][0].date.toDate() : matchesByDate[a][0].date);
        const dateB = new Date(matchesByDate[b][0].date.toDate ? matchesByDate[b][0].date.toDate() : matchesByDate[b][0].date);
        return dateA - dateB;
    });
    
    // Create timeline items for each date
    sortedDates.forEach((dateString, index) => {
        const dateMatches = matchesByDate[dateString];
        
        // Create timeline item
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        
        // Create timeline date
        const timelineDate = document.createElement('div');
        timelineDate.className = 'timeline-date';
        timelineDate.textContent = dateString;
        
        // Create timeline content
        const timelineContent = document.createElement('div');
        timelineContent.className = 'timeline-content';
        
        // Add matches for this date
        dateMatches.forEach(match => {
            const matchCard = document.createElement('div');
            matchCard.className = 'match-card';
            
            // Format time
            const date = match.date.toDate ? match.date.toDate() : new Date(match.date);
            const timeOptions = { hour: '2-digit', minute: '2-digit' };
            const timeString = date.toLocaleTimeString('id-ID', timeOptions) + ' WIT';
            
            matchCard.innerHTML = `
                <div class="match-header">
                    <span class="match-time">${timeString}</span>
                    ${match.isCompleted ? `<span class="match-status completed">Selesai</span>` : 
                                          `<span class="match-status upcoming">Mendatang</span>`}
                </div>
                <div class="match-teams">
                    <div class="team">
                        <img src="${match.team1.logo || 'images/team-placeholder.png'}" alt="${match.team1.name}">
                        <span>${match.team1.name}</span>
                        ${match.isCompleted ? `<span class="score">${match.team1Score || 0}</span>` : ''}
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <img src="${match.team2.logo || 'images/team-placeholder.png'}" alt="${match.team2.name}">
                        <span>${match.team2.name}</span>
                        ${match.isCompleted ? `<span class="score">${match.team2Score || 0}</span>` : ''}
                    </div>
                </div>
            `;
            
            timelineContent.appendChild(matchCard);
        });
        
        // Assemble timeline item
        timelineItem.appendChild(timelineDate);
        timelineItem.appendChild(timelineContent);
        
        // Add to timeline
        scheduleTimeline.appendChild(timelineItem);
    });
}