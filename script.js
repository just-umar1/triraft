const arena = document.getElementById('arena');
const status = document.getElementById('status');
const localPlayer = document.getElementById('local-player');

// --- 1. AUTO-ROOM LOGIC ---
let roomID = window.location.hash.substring(1);
const isJoining = !!roomID; 
const peer = new Peer(); // PeerJS handles the heavy lifting

const connections = {};
const players = {};
const keys = {};
const myPos = { x: 50, y: 50 }; // Start in center (%)
const speed = 0.7;

peer.on('open', (id) => {
    if (!isJoining) {
        window.location.hash = id;
        status.innerText = "SHARE THIS URL TO INVITE FRIENDS!";
    } else {
        status.innerText = "Joining Arena...";
        connectToPeer(roomID); // Connect to the person who shared the link
    }
});

// --- 2. CONNECTION & MESH LOGIC ---
peer.on('connection', (conn) => {
    setupConnection(conn);
    
    // Automatic Mesh: If I'm the first person, I tell new people about others
    conn.on('open', () => {
        const otherPeerIds = Object.keys(connections).filter(pid => pid !== conn.peer);
        if (otherPeerIds.length > 0) {
            conn.send({ type: 'INTRO', peers: otherPeerIds });
        }
    });
});

function connectToPeer(id) {
    if (id === peer.id || connections[id]) return;
    const conn = peer.connect(id);
    setupConnection(conn);
}

function setupConnection(conn) {
    conn.on('open', () => {
        connections[conn.peer] = conn;
        status.innerText = "PLAYERS ONLINE: " + (Object.keys(connections).length + 1);

        conn.on('data', (data) => {
            if (data.type === 'INTRO') {
                data.peers.forEach(pid => connectToPeer(pid));
            } else if (data.type === 'move') {
                updateRemotePlayer(data.id, data.x, data.y);
            }
        });
    });

    conn.on('close', () => {
        if (players[conn.peer]) {
            players[conn.peer].remove();
            delete players[conn.peer];
        }
    });
}

// --- 3. INPUT & GAME LOOP ---
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function gameLoop() {
    let moved = false;
    if (keys['ArrowUp'] || keys['KeyW']) { myPos.y -= speed; moved = true; }
    if (keys['ArrowDown'] || keys['KeyS']) { myPos.y += speed; moved = true; }
    if (keys['ArrowLeft'] || keys['KeyA']) { myPos.x -= speed; moved = true; }
    if (keys['ArrowRight'] || keys['KeyD']) { myPos.x += speed; moved = true; }

    if (moved) {
        // Bounds checking
        myPos.x = Math.max(2, Math.min(98, myPos.x));
        myPos.y = Math.max(2, Math.min(98, myPos.y));
        
        localPlayer.style.left = myPos.x + '%';
        localPlayer.style.top = myPos.y + '%';

        // Direct broadcast to all peers
        const payload = { type: 'move', id: peer.id, x: myPos.x, y: myPos.y };
        for (let id in connections) {
            if (connections[id].open) connections[id].send(payload);
        }
    }
    requestAnimationFrame(gameLoop);
}

function updateRemotePlayer(id, x, y) {
    if (!players[id]) {
        const el = document.createElement('div');
        el.className = 'player';
        el.style.color = '#f0f'; // Everyone else is Magenta
        arena.appendChild(el);
        players[id] = el;
    }
    players[id].style.left = x + '%';
    players[id].style.top = y + '%';
}

gameLoop();
