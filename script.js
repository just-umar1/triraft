const peer = new Peer();
const connections = {}; 
let hostConn; 
const players = {};
let myScore = 0;

const gameArea = document.getElementById('game-area');
const localPlayer = document.getElementById('local-player');

peer.on('open', (id) => { document.getElementById('my-id').innerText = id; });

// --- CONNECTION HANDLING ---
peer.on('connection', (conn) => {
    connections[conn.peer] = conn;
    createPlayerElement(conn.peer, '#f0f'); // Magenta for guests
    
    conn.on('data', (data) => {
        if (data.type === 'move') {
            updatePlayerPos(data.id, data.x, data.y);
            // RELAY to other guests
            for (let id in connections) {
                if (id !== data.id) connections[id].send(data);
            }
        }
    });
});

function connectToFriend() {
    const hostId = document.getElementById('join-id').value;
    hostConn = peer.connect(hostId);
    hostConn.on('open', () => {
        hostConn.on('data', (data) => {
            if (data.type === 'move') {
                if (!players[data.id]) createPlayerElement(data.id, '#ff0'); // Yellow for others
                updatePlayerPos(data.id, data.x, data.y);
            }
        });
    });
}

// --- GAME MECHANICS ---
function createPlayerElement(id, color) {
    if (players[id]) return;
    const el = document.createElement('div');
    el.className = 'player';
    el.style.backgroundColor = color;
    el.style.color = color;
    gameArea.appendChild(el);
    players[id] = el;
}

function updatePlayerPos(id, x, y) {
    if (players[id]) {
        players[id].style.left = x + '%';
        players[id].style.top = y + '%';
    }
}

function handleInput(e) {
    const rect = gameArea.getBoundingClientRect();
    const xRaw = e.touches ? e.touches[0].clientX : e.clientX;
    const yRaw = e.touches ? e.touches[0].clientY : e.clientY;

    const x = Math.max(2, Math.min(98, ((xRaw - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((yRaw - rect.top) / rect.height) * 100));

    localPlayer.style.left = x + '%';
    localPlayer.style.top = y + '%';

    const moveData = { type: 'move', id: peer.id, x: x, y: y };

    if (hostConn && hostConn.open) {
        hostConn.send(moveData);
    } else {
        for (let id in connections) {
            connections[id].send(moveData);
        }
    }
}

gameArea.addEventListener('mousemove', handleInput);
gameArea.addEventListener('touchmove', (e) => { e.preventDefault(); handleInput(e); }, { passive: false });
