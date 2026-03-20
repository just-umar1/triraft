const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = { x: 50, y: 200 };
let opponent = { x: 400, y: 200 };

let peer = new Peer();
let conn = null;

// Show your room ID
peer.on("open", id => {
  document.getElementById("roomDisplay").innerText =
    "Your Room ID: " + id;
});

// When someone joins you
peer.on("connection", connection => {
  conn = connection;
  setupConnection();
});

// Create room (just shows ID)
function createRoom() {
  alert("Share your Room ID with your friend!");
}

// Join room
function joinRoom() {
  const roomId = document.getElementById("roomInput").value;
  conn = peer.connect(roomId);

  conn.on("open", () => {
    console.log("Connected!");
    setupConnection();
  });
}

// Setup connection
function setupConnection() {
  conn.on("data", data => {
    opponent.x = data.x;
    opponent.y = data.y;
  });
}

// Send position
function sendData() {
  if (conn && conn.open) {
    conn.send(player);
  }
}

// Controls
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") player.y -= 10;
  if (e.key === "ArrowDown") player.y += 10;
  if (e.key === "ArrowLeft") player.x -= 10;
  if (e.key === "ArrowRight") player.x += 10;

  sendData();
});

// Game loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.fillStyle = "lime";
  ctx.fillRect(player.x, player.y, 20, 20);

  // Opponent
  ctx.fillStyle = "red";
  ctx.fillRect(opponent.x, opponent.y, 20, 20);

  requestAnimationFrame(draw);
}

draw();
