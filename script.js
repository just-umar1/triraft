const peer = new Peer();
const connections = {};
let hostConn;
const players = {};
let score = 0;

// Game State
const myPos = { x: 50, y: 50 };
const keys = {};
const speed = 5;

const gameArea = document.getElementById('game-area');
const orb = document.getElementById('orb');

peer.on('open', (id) => { document.getElementById('my-id').innerText = id; });

// --- HUB & RELAY LOGIC ---
peer.on('connection', (conn) => {
    connections[conn.peer] = conn;
    createRemotePlayer(conn.peer, '#ff00ff'); // Guests are pink
    
    conn.on('data', (data) => {
        if (data.type === 'move') {
            updateRemotePos(data.id, data.x, data.y);
            // Relay to other guests
            for (let id in connections) {
                if (id !== data.id) connections[id].send(data);
            }
        }
    });
});

function connectToFriend() {
    const id = document.getElementById('join-id').value;
    hostConn = peer.connect(id);
    hostConn.on('open', () => {
        hostConn.on('data', (data) => {
            if (data.type === 'move') {
                if (!players[data.id]) createRemotePlayer(data.id, '#00ffff');
                updateRemotePos(data.id, data.x, data.y);
            }
        });
    });
}

// --- KEYBOARD ENGINE ---
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function gameLoop() {
    let moved = false;
    if (keys['ArrowUp'] || keys['KeyW']) { myPos.y -= speed; moved = true; }
    if (keys['ArrowDown'] || keys['KeyS']) { myPos.y += speed; moved = true; }
    if (keys['ArrowLeft'] || keys['KeyA']) { myPos.x -= speed; moved = true; }
    if (keys['ArrowRight'] || keys['KeyD']) { myPos.x += speed; moved = true; }

    if (moved) {
        // Boundary checks (Pixels because we are using fixed game area)
        myPos.x = Math.max(0, Math.min(770, myPos.x));
        myPos.y = Math.max(0, Math.min(470, myPos.y));

        const local = document.getElementById('local-player');
        local.style.left = myPos.x + 'px';
        local.style.top = myPos.y + 'px';

        // Send to others
        const payload = { type: 'move', id: peer.id, x: myPos.x, y: myPos.y };
        if (hostConn) hostConn.send(payload);
        else {
            for (let id in connections) connections[id].send(payload);
        }
    }
    requestAnimationFrame(gameLoop);
}

function createRemotePlayer(id, color) {
    if (players[id]) return;
    const el = document.createElement('div');
    el.className = 'player';
    el.style.background = color;
    gameArea.appendChild(el);
    players[id] = el;
}

function updateRemotePos(id, x, y) {
    if (players[id]) {
        players[id].style.left = x + 'px';
        players[id].style.top = y + 'px';
    }
}

// Start the loop
gameLoop();
