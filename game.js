const lanes = ["A", "S", "D", "F"];
const notesContainer = document.getElementById("notes");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const startBtn = document.getElementById("start-btn");

let notes = [];
let lastTime = 0;
let running = false;
let score = 0;
let combo = 0;

// Simple "chart" for a short song: [timeInMs, laneIndex]
const chart = [
  [500, 0],
  [800, 1],
  [1100, 2],
  [1400, 3],
  [1900, 0],
  [2200, 1],
  [2500, 2],
  [2800, 3],
  [3400, 1],
  [3700, 2],
  [4000, 3],
  [4300, 0],
];

let songStartTime = null;

function createNote(laneIndex, spawnTime) {
  const noteEl = document.createElement("div");
  noteEl.className = "note";
  noteEl.textContent = lanes[laneIndex];

  noteEl.style.left = laneIndex * 25 + "%";
  noteEl.style.top = "-30px";

  notesContainer.appendChild(noteEl);

  const note = {
    laneIndex,
    el: noteEl,
    spawnTime,
    hit: false,
    judged: false,
  };

  notes.push(note);
}

function startSong() {
  // Reset state
  notes.forEach(n => n.el.remove());
  notes = [];
  score = 0;
  combo = 0;
  scoreEl.textContent = score;
  comboEl.textContent = combo;

  songStartTime = performance.now();
  lastTime = songStartTime;
  running = true;

  // Pre-create notes based on chart
  chart.forEach(([time, laneIndex]) => {
    createNote(laneIndex, songStartTime + time);
  });

  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (!running) return;

  const dt = timestamp - lastTime;
  lastTime = timestamp;

  const fallDuration = 2000; // ms from top to hit line
  const containerHeight = 500;
  const hitLineY = containerHeight - 80; // from CSS

  notes.forEach(note => {
    const t = timestamp - note.spawnTime;
    const progress = t / fallDuration;

    if (progress >= 0 && progress <= 1.2) {
      const y = progress * hitLineY;
      note.el.style.top = y + "px";
    }

    // Missed note (fell past hit window)
    if (!note.judged && t > fallDuration + 200) {
      note.judged = true;
      combo = 0;
      comboEl.textContent = combo;
      note.el.style.opacity = 0.2;
    }
  });

  // Stop when all notes are judged
  if (notes.every(n => n.judged)) {
    running = false;
  } else {
    requestAnimationFrame(gameLoop);
  }
}

function handleHit(key) {
  if (!running) return;

  const laneIndex = lanes.indexOf(key.toUpperCase());
  if (laneIndex === -1) return;

  const now = performance.now();
  const fallDuration = 2000;
  const hitWindow = 200; // ms

  // Find closest note in this lane that is not judged yet
  let bestNote = null;
  let bestDiff = Infinity;

  notes.forEach(note => {
    if (note.laneIndex !== laneIndex || note.judged) return;
    const t = now - note.spawnTime;
    const diff = Math.abs(t - fallDuration);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestNote = note;
    }
  });

  if (bestNote && bestDiff <= hitWindow) {
    bestNote.judged = true;
    bestNote.hit = true;
    bestNote.el.style.background = "#6ee7ff";
    bestNote.el.style.boxShadow = "0 0 12px #6ee7ff";

    // Scoring
    let gained = 0;
    if (bestDiff < 60) {
      gained = 300; // perfect
    } else if (bestDiff < 120) {
      gained = 150; // good
    } else {
      gained = 50; // ok
    }

    score += gained;
    combo += 1;
    scoreEl.textContent = score;
    comboEl.textContent = combo;
  } else {
    // Bad hit
    combo = 0;
    comboEl.textContent = combo;
  }
}

document.addEventListener("keydown", e => {
  handleHit(e.key);
});

startBtn.addEventListener("click", () => {
  startSong();
});
