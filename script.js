const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let player = { id: null, x: 100, y: 100, wood: 0 };
let players = {};
let trees = [];
let walls = [];

let peer = new Peer();
let conn;

// Generate trees
for (let i = 0; i < 20; i++) {
  trees.push({
    x: Math.random() * 750,
    y: Math.random() * 450,
    hp: 3
  });
}

// Peer setup
peer.on("open", id => {
  player.id = id;
  document.getElementById("roomDisplay").innerText = "Room ID: " + id;
});

peer.on("connection", connection => {
  conn = connection;
  setupConnection();
});

function createRoom() {
  alert("Share your Room ID");
}

function joinRoom() {
  conn = peer.connect(document.getElementById("roomInput").value);
  conn.on("open", setupConnection);
}

function setupConnection() {
  conn.on("data", data => {
    players[data.id] = data;
  });
}

// Send data
function sync() {
  if (conn && conn.open) {
    conn.send(player);
  }
}

// Movement
document.addEventListener("keydown", e => {
  if (e.key === "w") player.y -= 5;
  if (e.key === "s") player.y += 5;
  if (e.key === "a") player.x -= 5;
  if (e.key === "d") player.x += 5;

  // Gather wood
  if (e.key === "e") {
    trees.forEach(tree => {
      if (dist(player, tree) < 30 && tree.hp > 0) {
        tree.hp--;
        if (tree.hp === 0) player.wood++;
      }
    });
  }

  // Build wall
  if (e.key === "b" && player.wood > 0) {
    walls.push({ x: player.x, y: player.y });
    player.wood--;
  }

  sync();
});

// Distance helper
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Trees
  ctx.fillStyle = "green";
  trees.forEach(t => {
    if (t.hp > 0) ctx.fillRect(t.x, t.y, 20, 20);
  });

  // Walls
  ctx.fillStyle = "gray";
  walls.forEach(w => {
    ctx.fillRect(w.x, w.y, 25, 25);
  });

  // Other players
  ctx.fillStyle = "red";
  for (let id in players) {
    let p = players[id];
    ctx.fillRect(p.x, p.y, 20, 20);
  }

  // You
  ctx.fillStyle = "lime";
  ctx.fillRect(player.x, player.y, 20, 20);

  // UI
  document.getElementById("inventory").innerText =
    "Wood: " + player.wood;

  requestAnimationFrame(draw);
}

draw();
