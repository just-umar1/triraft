function updateScoreboard() {
    const list = document.getElementById('player-list');
    if (!list) return;

    // Convert players object to array and sort by score
    const sorted = Object.values(players).sort((a, b) => (b.score || 0) - (a.score || 0));

    // Update the HTML
    list.innerHTML = sorted.map(p => `
        <div style="display:flex; justify-content:between;">
            <span>${p.id === socket.id ? 'YOU' : p.id.substr(0,4)}</span>
            <span style="margin-left:auto">${p.score || 0}</span>
        </div>
    `).join('');
}
