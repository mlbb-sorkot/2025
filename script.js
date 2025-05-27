// JSON Data
const standingsData = [
    { rank: 1, team: "Sorong Dragons", matches: 0, wins: 0, losses: 0, pts: "0", points: 0 },
    { rank: 2, team: "Abyss Gladiators", matches: 0, wins: 0, losses: 0, pts: "0", points: 0 },
    { rank: 3, team: "Celestial Legion", matches: 0, wins: 0, losses: 0, pts: "0", points: 0 },
    { rank: 4, team: "Titan Wrath", matches: 0, wins: 0, losses: 0, pts: "0", points: 0 }
];

const topPlayersData = [
    { player: "Revolta", team: "Sorong Dragons", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Arlott", heroImg: "https://i.ibb.co/9W1JX9P/arlott.png", role: "Exp" },
    { player: "Hades", team: "Abyss Gladiators", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Ling", heroImg: "https://i.ibb.co/6YF3cKp/ling.png", role: "Jungle" },
    { player: "Zeus", team: "Celestial Legion", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Valentina", heroImg: "https://i.ibb.co/85PBgZ4/valentina.png", role: "Mid" },
    { player: "Kronos", team: "Titan Wrath", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Atlas", heroImg: "https://i.ibb.co/MZc7JnY/atlas.png", role: "Roam" }
];

const playerStatsData = [
    { player: "Revolta", team: "Sorong Dragons", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Arlott" },
    { player: "Hades", team: "Abyss Gladiators", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Ling" },
    { player: "Mythos", team: "Sorong Dragons", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Lancelot" },
    { player: "Zeus", team: "Celestial Legion", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Valentina" },
    { player: "Athena", team: "Celestial Legion", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Kagura" },
    { player: "BlitzX", team: "Sorong Dragons", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Balmond" },
    { player: "Vortex", team: "Abyss Gladiators", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Grock" },
    { player: "Kronos", team: "Titan Wrath", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Atlas" },
    { player: "Nyx", team: "Sorong Dragons", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Diggie" },
    { player: "Ragnar", team: "Abyss Gladiators", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Bruno" },
    { player: "Revolta", team: "Sorong Dragons", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Arlott" },
    { player: "Hades", team: "Abyss Gladiators", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Ling" },
    { player: "Mythos", team: "Sorong Dragons", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Lancelot" },
    { player: "Zeus", team: "Celestial Legion", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Valentina" },
    { player: "Athena", team: "Celestial Legion", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Kagura" },
    { player: "BlitzX", team: "Sorong Dragons", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Balmond" },
    { player: "Vortex", team: "Abyss Gladiators", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Grock" },
    { player: "Kronos", team: "Titan Wrath", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Atlas" },
    { player: "Nyx", team: "Sorong Dragons", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Diggie" },
    { player: "Ragnar", team: "Abyss Gladiators", kills: 0, deaths: 0, assists: 0, kda: 0, hero: "Bruno" }
];

// Load Standings Data
function loadStandingsData() {
    const standingsContainer = document.querySelector('.standings-container');
    standingsContainer.innerHTML = '';
    
    standingsData.forEach(team => {
        const teamRow = document.createElement('div');
        teamRow.className = 'grid grid-cols-12 p-4 border-b border-[#6A0DAD]/20 hover:bg-[#3A3A3A]/50 transition-colors';
        
        const rankClass = team.rank === 1 ? 'text-[#FFD700] font-bold' : 'text-[#F8F8F8]';
        const teamClass = team.rank === 1 ? 'font-bold' : '';
        
        teamRow.innerHTML = `
            <div class="col-span-1 text-center digital-font ${rankClass}">${team.rank}</div>
            <div class="col-span-5 flex items-center ${teamClass}">
                <img src="${getTeamImage(team.team)}" alt="${team.team}" class="w-8 h-8 mr-2 rounded-full">
                <span class="subtitle-font">${team.team}</span>
            </div>
            <div class="col-span-1 text-center digital-font ${teamClass}">${team.matches}</div>
            <div class="col-span-1 text-center digital-font ${teamClass}">${team.wins}</div>
            <div class="col-span-1 text-center digital-font ${teamClass}">${team.losses}</div>
            <div class="col-span-1 text-center digital-font ${teamClass}">${team.pts}</div>
            <div class="col-span-2 text-center digital-font ${rankClass}">${team.points}</div>
        `;
        
        standingsContainer.appendChild(teamRow);
    });
}

function getTeamImage(teamName) {
    const images = {
        "Sorong Dragons": "https://i.ibb.co/C5JQXrS/dragon-logo.png",
        "Abyss Gladiators": "https://i.ibb.co/qBRyH5H/gladiator-logo.png",
        "Celestial Legion": "https://i.ibb.co/d0x3M3Q/celestial-logo.png",
        "Titan Wrath": "https://i.ibb.co/fH2x2pK/titan-logo.png"
    };
    return images[teamName];
}

// Load Top Players
function loadTopPlayers() {
    const topPlayersContainer = document.querySelector('#stats .grid.grid-cols-1.md\\:grid-cols-4.gap-6');
    topPlayersContainer.innerHTML = '';
    
    topPlayersData.forEach((player, index) => {
        const delayClasses = ['delay-0', 'delay-1', 'delay-2', 'delay-3'];
        
        const playerCard = document.createElement('div');
        playerCard.className = `card-glass rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:shadow-[#6A0DAD]/30 float-animation ${delayClasses[index]}`;
        
        playerCard.innerHTML = `
            <div class="flex justify-center -mt-12 mb-4 relative">
                <img src="https://i.ibb.co/1nZJfQX/mlbb-avatar.png" alt="Player" class="w-24 h-24 rounded-full border-4 border-[#6A0DAD] bg-[#2C2C2C]">
                <div class="absolute -bottom-2 bg-[#FFD700] text-[#2C2C2C] px-3 py-1 rounded-full text-xs font-bold subtitle-font">#${index + 1}</div>
            </div>
            <h4 class="text-lg font-bold text-[#FFD700] mb-1 title-font">${player.player}</h4>
            <p class="text-sm text-[#F8F8F8] mb-3 subtitle-font">${player.team}</p>
            <div class="flex justify-center mb-4">
                <img src="${player.heroImg}" alt="${player.hero}" class="w-12 h-12 rounded-full">
                <div class="ml-2 text-left">
                    <p class="text-xs text-[#FFD700] subtitle-font">BEST HERO</p>
                    <p class="text-sm text-[#F8F8F8] -mt-1 title-font">${player.hero}</p>
                    <p class="text-xs text-[#F8F8F8]">${player.role}</p>
                </div>
            </div>
            <div class="bg-[#3A3A3A]/50 rounded-lg p-2">
                <p class="text-sm text-[#FFD700] digital-font">KDA ${player.kda.toFixed(2)}</p>
                <div class="grid grid-cols-3 gap-2 text-xs text-[#F8F8F8]">
                    <div>
                        <p class="font-bold">${player.kills}</p>
                        <p>KILLS</p>
                    </div>
                    <div>
                        <p class="font-bold">${player.deaths}</p>
                        <p>DEATHS</p>
                    </div>
                    <div>
                        <p class="font-bold">${player.assists}</p>
                        <p>ASSISTS</p>
                    </div>
                </div>
            </div>
        `;
        
        topPlayersContainer.appendChild(playerCard);
    });
}

// Load Player Stats
function loadPlayerStats() {
    const playerStatsContainer = document.querySelector('.player-stats-container');
    playerStatsContainer.innerHTML = '';
    
    playerStatsData.forEach((player, index) => {
        const kdaPercentage = Math.min(100, Math.max(0, (player.kda / 5) * 100));
        
        const playerRow = document.createElement('div');
        playerRow.className = 'grid grid-cols-12 p-4 border-b border-[#6A0DAD]/20 hover:bg-[#3A3A3A]/50 transition-colors';
        
        playerRow.innerHTML = `
            <div class="col-span-3 flex items-center">
                <img src="https://i.ibb.co/1nZJfQX/mlbb-avatar.png" alt="${player.player}" class="w-8 h-8 rounded-full mr-2">
                <span class="subtitle-font">${player.player}</span>
            </div>
            <div class="col-span-2 flex items-center">
                <img src="${getTeamImage(player.team)}" alt="${player.team}" class="w-6 h-6 rounded-full mr-2">
                <span class="text-sm subtitle-font">${player.team}</span>
            </div>
            <div class="col-span-1 text-center digital-font">${player.kills}</div>
            <div class="col-span-1 text-center digital-font">${player.deaths}</div>
            <div class="col-span-1 text-center digital-font">${player.assists}</div>
            <div class="col-span-1 text-center digital-font font-bold ${player.kda > 3 ? 'text-[#FFD700]' : ''}">${player.kda.toFixed(2)}</div>
            <div class="col-span-3 flex items-center justify-center">
                <div class="w-3/4">
                    <div class="stats-bar" style="width: ${kdaPercentage}%">${player.kda.toFixed(2)}</div>
                </div>
                <img src="${getHeroImage(player.hero)}" alt="${player.hero}" class="w-8 h-8 rounded-full ml-2">
            </div>
        `;
        
        playerStatsContainer.appendChild(playerRow);
    });
}

function getHeroImage(heroName) {
    const heroImages = {
        "Arlott": "https://i.ibb.co/9W1JX9P/arlott.png",
        "Ling": "https://i.ibb.co/6YF3cKp/ling.png",
        "Valentina": "https://i.ibb.co/85PBgZ4/valentina.png",
        "Lancelot": "https://i.ibb.co/m9QHqYY/lancelot.png",
        "Kagura": "https://i.ibb.co/PZ7hNQK/kagura.png",
        "Balmond": "https://i.ibb.co/Np4R2YR/balmond.png",
        "Grock": "https://i.ibb.co/F0XjW8n/grock.png",
        "Atlas": "https://i.ibb.co/MZc7JnY/atlas.png",
        "Diggie": "https://i.ibb.co/CtMhY5b/diggie.png",
        "Bruno": "https://i.ibb.co/Zfm8NQc/bruno.png"
    };
    return heroImages[heroName];
}

// Initialize mobile menu
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    mobileMenuButton.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
    });
}

// Initialize smooth scrolling
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobile-menu');
                if (!mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });
}

// Initialize animations
function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeIn');
            }
        });
    }, {
        threshold: 0.1
    });
    
    document.querySelectorAll('.team-card, .card-glass').forEach(card => {
        observer.observe(card);
    });
}

// Page Load
document.addEventListener('DOMContentLoaded', function() {
    loadStandingsData();
    loadTopPlayers();
    loadPlayerStats();
    initMobileMenu();
    initSmoothScrolling();
    initAnimations();
    
    // Add style for fade-in animation
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
            animation: fadeIn 0.8s ease forwards;
        }
    `;
    document.head.appendChild(style);
});
