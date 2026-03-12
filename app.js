// ═══════════════════════════════════════
// SPLASH SCREEN
// ═══════════════════════════════════════
(function initSplash() {
  const splash = document.getElementById("splashScreen");
  if (!splash) return;

  // Freeze dashboard animations until splash is clicked
  document.body.classList.add("splash-active");

  function enterSite() {
    // 1. Start audio (user gesture — browser allows it)
    if (typeof NexusAudio !== 'undefined') NexusAudio.init();

    // 2. Animate splash out
    splash.classList.add("leaving");

    // 3. After splash fades, show dashboard + trigger fly-in animations
    setTimeout(() => {
      splash.classList.add("gone");
      document.body.classList.remove("splash-active");
      document.body.classList.add("ready");

      // Re-trigger fly-in animations by removing and re-adding cards
      document.querySelectorAll(".game-card").forEach(card => {
        card.style.animation = "none";
        card.offsetHeight; // force reflow
        card.style.animation = "";
      });

      // Re-trigger hero animations
      document.querySelectorAll(".hero-badge, .hero-title .line, .hero-sub, .player-name-setup").forEach(el => {
        el.style.animation = "none";
        el.offsetHeight;
        el.style.animation = "";
      });
    }, 800);
  }

  splash.addEventListener("click", enterSite);
  splash.addEventListener("touchstart", enterSite, { once: true });
})();

// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════
const state = {
  xp: 0, level: 1, xpToNext: 100,
  coins: 0, totalCoins: 0, gamesPlayed: 0,
  gamesPlayedSet: new Set(),
  achievements: new Set(),
  bestScores: { snake: 0, memory: 0, reaction: Infinity, whack: 0, typing: 0, aim: Infinity, panic: 0, wrong: 0, cursed: 0, emoji: 0, dodge: 0, slash: 0, runner: 0, pour: 0, trivia: 0, spinwheel: 0, tipsy: 0, beerpong: 0, neverhave: 0 },
  history: [],
  combo: 0, comboTimer: null,
  playerName: localStorage.getItem("nexus_playerName") || "",
};

// ═══════════════════════════════════════
// PLAYER NAME SETUP
// ═══════════════════════════════════════
(function initPlayerName() {
  const input = document.getElementById("playerNameInput");
  const btn = document.getElementById("playerNameBtn");
  const setup = document.getElementById("playerNameSetup");
  const display = document.getElementById("playerNameDisplay");
  const tagName = document.getElementById("playerTagName");
  const heroName = document.getElementById("heroPlayerName");
  const editBtn = document.getElementById("playerNameEdit");

  function setName(name) {
    name = name.trim().toUpperCase().slice(0, 16);
    if (!name) return;
    state.playerName = name;
    localStorage.setItem("nexus_playerName", name);
    heroName.textContent = name;
    tagName.textContent = name;
    setup.style.display = "none";
    display.style.display = "flex";
  }

  // Load saved name
  if (state.playerName) {
    setName(state.playerName);
  }

  btn.addEventListener("click", () => setName(input.value));
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") setName(input.value); });

  editBtn.addEventListener("click", () => {
    setup.style.display = "flex";
    display.style.display = "none";
    input.value = state.playerName;
    input.focus();
  });
})();

// ═══════════════════════════════════════
// CURSOR
// ═══════════════════════════════════════
// ── Touch detection ──
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

const cursor = document.getElementById("cursor");
const cursorTrail = document.getElementById("cursorTrail");
let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

// Track touch position globally for games that need it
document.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  if (t) { mouseX = t.clientX; mouseY = t.clientY; }
}, { passive: true });
document.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  if (t) { mouseX = t.clientX; mouseY = t.clientY; }
}, { passive: true });

if (!isTouchDevice) {
  // ── Funny Cursor Emojis (desktop only) ──
  const cursorEmojis = ["🎯", "👾", "🚀", "🔥", "⚡", "🎮", "🤖", "💀", "👀", "🦄", "🍕", "🐱", "🧠", "💣", "🌮"];
  const trailEmojis = ["✨", "⭐", "💫", "🌟", "🔮", "💎", "🪐", "🌈", "🎪", "🍭"];

  function setRandomCursorEmoji() {
    cursor.setAttribute("data-emoji", cursorEmojis[Math.floor(Math.random() * cursorEmojis.length)]);
  }
  function setRandomTrailEmoji() {
    cursorTrail.setAttribute("data-emoji", trailEmojis[Math.floor(Math.random() * trailEmojis.length)]);
  }

  setRandomCursorEmoji();
  setRandomTrailEmoji();
  setInterval(() => {
    if (!cursor.classList.contains("hover") && !cursor.classList.contains("click")) setRandomCursorEmoji();
  }, 3000);
  setInterval(setRandomTrailEmoji, 5000);
  document.addEventListener("click", () => setTimeout(setRandomCursorEmoji, 200));

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursor.style.left = mouseX + "px"; cursor.style.top = mouseY + "px";
  });

  (function animateTrail() {
    trailX += (mouseX - trailX) * 0.12;
    trailY += (mouseY - trailY) * 0.12;
    cursorTrail.style.left = trailX + "px";
    cursorTrail.style.top = trailY + "px";
    requestAnimationFrame(animateTrail);
  })();

  document.addEventListener("mousedown", () => cursor.classList.add("click"));
  document.addEventListener("mouseup", () => cursor.classList.remove("click"));
} else {
  // Hide cursor elements on touch
  cursor.style.display = "none";
  cursorTrail.style.display = "none";
}

function setupCursorHovers() {
  if (isTouchDevice) return; // No hover on touch
  document.querySelectorAll("a, button, .game-card, .stat-card, .achievement-row, .play-btn, .close-btn, .game-btn, .memory-cell, .whack-hole, .aim-target, .reaction-box").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
  });
}
setupCursorHovers();

// ═══════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
let particles = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas(); window.addEventListener("resize", resizeCanvas);

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.4; this.speedY = (Math.random() - 0.5) * 0.4;
    this.opacity = Math.random() * 0.4 + 0.1;
    this.color = Math.random() > 0.7 ? "#b44aff" : "#00f0ff";
  }
  update() {
    this.x += this.speedX; this.y += this.speedY;
    const dx = mouseX - this.x, dy = mouseY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 200) { this.x += dx * 0.002; this.y += dy * 0.002; }
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
  }
  draw() {
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color; ctx.globalAlpha = this.opacity; ctx.fill(); ctx.globalAlpha = 1;
  }
}
for (let i = 0; i < 100; i++) particles.push(new Particle());

function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(0,240,255,${0.08 * (1 - dist / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
      }
    }
  }
}
(function animP() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  drawConnections();
  requestAnimationFrame(animP);
})();

// ═══════════════════════════════════════
// CLICK EFFECTS
// ═══════════════════════════════════════
const rippleContainer = document.getElementById("rippleContainer");
document.addEventListener("click", (e) => {
  const r = document.createElement("div");
  r.className = "click-ripple"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
  rippleContainer.appendChild(r); setTimeout(() => r.remove(), 600);

  state.combo++; clearTimeout(state.comboTimer);
  state.comboTimer = setTimeout(() => { state.combo = 0; document.getElementById("comboDisplay").classList.remove("active"); }, 1200);
  if (state.combo >= 3) {
    document.getElementById("comboDisplay").classList.add("active");
    document.getElementById("comboCount").textContent = state.combo;
  }
});

// ═══════════════════════════════════════
// CARD FLY-IN & TILT
// ═══════════════════════════════════════
// Wait for splash to be dismissed before setting landing timers
function setupCardLanding() {
  document.querySelectorAll(".game-card").forEach((card, i) => {
    const delay = [300, 700, 1100, 1500, 1900, 2300, 2700, 3100, 3500, 3900, 4300, 4700, 5100, 5500, 5900, 6300, 6700, 7100, 7500][i] || 300;
    setTimeout(() => { card.classList.add("landed"); }, delay + 2000);
  });
}

// If splash is active, wait for "ready" class; otherwise run immediately
if (document.body.classList.contains("splash-active")) {
  const observer = new MutationObserver(() => {
    if (document.body.classList.contains("ready")) {
      observer.disconnect();
      setupCardLanding();
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
} else {
  setupCardLanding();
}

// Card tilt (desktop only — disabled on touch for performance)
if (!isTouchDevice) {
  document.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      if (!card.classList.contains("landed")) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      card.style.transform = `perspective(800px) rotateX(${(y-0.5)*12}deg) rotateY(${(x-0.5)*-12}deg) scale(1.02)`;
      card.style.setProperty("--mx", x*100+"%"); card.style.setProperty("--my", y*100+"%");
    });
    card.addEventListener("mouseleave", () => {
      if (card.classList.contains("landed")) card.style.transform = "";
    });
  });
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
document.querySelectorAll(".hud-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const view = link.dataset.view;
    document.querySelectorAll(".hud-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById("view" + view.charAt(0).toUpperCase() + view.slice(1)).classList.add("active");
    if (view === "stats") updateStatsView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// ═══════════════════════════════════════
// XP / COINS / LEVEL
// ═══════════════════════════════════════
function addXP(amount, x, y) {
  if (amount <= 0) return;
  state.xp += amount;
  showFloatingText(`+${amount} XP`, x || window.innerWidth / 2, y || 200, "var(--success)");
  while (state.xp >= state.xpToNext) {
    state.xp -= state.xpToNext; state.level++;
    state.xpToNext = Math.floor(state.xpToNext * 1.4);
    levelUp();
  }
  updateHUD();
}

function addCoins(amount) {
  state.coins += amount; state.totalCoins += amount;
  document.getElementById("coins").textContent = state.coins;
  const el = document.getElementById("coins");
  el.style.transform = "scale(1.4)"; setTimeout(() => el.style.transform = "scale(1)", 200);
  if (state.totalCoins >= 500) unlock("rich", "Rich");
}

function updateHUD() {
  document.getElementById("level").textContent = state.level;
  document.getElementById("xpFill").style.width = (state.xp / state.xpToNext * 100) + "%";
  document.getElementById("xpText").textContent = `${state.xp} / ${state.xpToNext} XP`;
}

function levelUp() {
  if (typeof NexusAudio !== 'undefined') NexusAudio.sfxLevelUp();
  addCoins(state.level * 10);
  const ov = document.getElementById("levelUpOverlay");
  document.getElementById("levelUpNumber").textContent = state.level;
  ov.classList.add("show");
  setTimeout(() => ov.classList.remove("show"), 1500);
  if (state.level >= 5) unlock("level5", "Veteran");
}

function showFloatingText(text, x, y, color) {
  const el = document.createElement("div"); el.className = "floating-xp";
  el.textContent = text; el.style.left = x + "px"; el.style.top = y + "px";
  if (color) el.style.color = color;
  document.getElementById("floatingTexts").appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// ═══════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════
function unlock(id, name) {
  if (state.achievements.has(id)) return;
  if (typeof NexusAudio !== 'undefined') NexusAudio.sfxAchievement();
  state.achievements.add(id);
  const popup = document.getElementById("achievementPopup");
  document.getElementById("achievementName").textContent = name;
  popup.classList.add("show"); setTimeout(() => popup.classList.remove("show"), 3000);
  const row = document.getElementById("ach-" + id);
  if (row) { row.classList.add("unlocked"); row.querySelector(".ach-icon").classList.remove("locked"); row.querySelector(".ach-icon").classList.add("unlocked"); }
  addXP(30, window.innerWidth / 2, 300);
}

// ═══════════════════════════════════════
// GAME END HELPER
// ═══════════════════════════════════════
function endGame(gameName, score, label) {
  state.gamesPlayed++;
  state.gamesPlayedSet.add(gameName);

  // XP based on score
  let xpEarned = Math.max(5, Math.floor(score / 2));
  if (gameName === "reaction" || gameName === "aim") xpEarned = Math.max(5, Math.floor(2000 / Math.max(score, 1)));
  xpEarned = Math.min(xpEarned, 100);
  const coinsEarned = Math.max(2, Math.floor(xpEarned / 2));

  addXP(xpEarned); addCoins(coinsEarned);

  // Best score
  const isBest = (gameName === "reaction" || gameName === "aim")
    ? score < state.bestScores[gameName]
    : score > state.bestScores[gameName];

  if (isBest) {
    state.bestScores[gameName] = score;
    const bestEl = document.getElementById("best-" + gameName);
    if (bestEl) bestEl.textContent = label || score;
  }

  // History
  state.history.unshift({ game: gameName.toUpperCase(), score: label || score, xp: xpEarned });
  if (state.history.length > 20) state.history.pop();

  // Achievements
  if (state.gamesPlayed === 1) unlock("first-game", "First Game");
  if (state.gamesPlayedSet.size >= 19) unlock("collector", "Collector");
  const partyGames = ["pour","trivia","spinwheel","tipsy","beerpong","neverhave"];
  if (partyGames.every(g => state.gamesPlayedSet.has(g))) unlock("partyanimal", "Party Animal");
  if (state.gamesPlayed >= 20) unlock("marathon", "Marathon");

  return { xpEarned, coinsEarned, isBest };
}

// ═══════════════════════════════════════
// STATS VIEW
// ═══════════════════════════════════════
function updateStatsView() {
  document.getElementById("statGames").textContent = state.gamesPlayed;
  document.getElementById("statXP").textContent = state.xp + (state.level - 1) * 100;
  document.getElementById("statCoins").textContent = state.totalCoins;
  document.getElementById("statAch").textContent = `${state.achievements.size} / 10`;
  document.getElementById("barGames").style.width = Math.min(state.gamesPlayed / 20 * 100, 100) + "%";
  document.getElementById("barXP").style.width = Math.min((state.xp + (state.level-1)*100) / 500 * 100, 100) + "%";
  document.getElementById("barCoins").style.width = Math.min(state.totalCoins / 500 * 100, 100) + "%";
  document.getElementById("barAch").style.width = (state.achievements.size / 10 * 100) + "%";

  // History
  const list = document.getElementById("historyList");
  if (state.history.length === 0) {
    list.innerHTML = '<div class="history-empty">No games played yet. Go play!</div>';
  } else {
    list.innerHTML = state.history.map(h => `
      <div class="history-row">
        <span class="history-game">${h.game}</span>
        <span class="history-score">${h.score}</span>
        <span class="history-xp">+${h.xp} XP</span>
      </div>
    `).join("");
  }
}

// ═══════════════════════════════════════
// GAME LAUNCHER
// ═══════════════════════════════════════
const overlay = document.getElementById("gameOverlay");
const gameContainer = document.getElementById("gameContainer");
let activeGame = null;

document.querySelectorAll(".play-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const card = btn.closest(".game-card");
    const gameName = card.dataset.game;
    openGame(gameName);
  });
});

document.getElementById("closeGame").addEventListener("click", () => {
  if (overlay.classList.contains("fullscreen-game")) {
    // In fullscreen games, require confirmation to prevent accidental close
    const btn = document.getElementById("closeGame");
    if (btn.dataset.confirmClose === "true") {
      closeGame();
    } else {
      btn.dataset.confirmClose = "true";
      btn.textContent = "EXIT?";
      btn.style.fontSize = "12px";
      btn.style.padding = "4px 10px";
      setTimeout(() => {
        btn.dataset.confirmClose = "false";
        btn.textContent = "\u2715";
        btn.style.fontSize = "";
        btn.style.padding = "";
      }, 2000);
    }
  } else {
    closeGame();
  }
});
overlay.addEventListener("click", (e) => { if (e.target === overlay && !overlay.classList.contains("fullscreen-game")) closeGame(); });

function openGame(name) {
  activeGame = name;
  document.getElementById("overlayTitle").textContent = {
    snake: "SNAKE", memory: "MEMORY MATCH", reaction: "REACTION TIME",
    whack: "WHACK-A-BOT", typing: "SPEED TYPE", aim: "AIM TRAINER",
    panic: "PANIC BUTTON", wrong: "WRONG ANSWERS", cursed: "CURSOR BETRAYAL", emoji: "EMOJI ROULETTE",
    dodge: "NEON DODGE", slash: "CYBER SLASH", runner: "GRAVITY RUNNER",
    pour: "POUR MASTER", trivia: "DRUNK TRIVIA", spinwheel: "CYBER WHEEL",
    tipsy: "TIPSY TOWER", beerpong: "BEER PONG", neverhave: "NEVER HAVE I EVER"
  }[name];
  overlay.classList.add("active");
  if (name === "snake" || name === "dodge" || name === "beerpong") overlay.classList.add("fullscreen-game");
  if (typeof NexusAudio !== 'undefined') NexusAudio.startGameMusic(name);
  gameContainer.innerHTML = "";

  switch (name) {
    case "snake": initSnake(); break;
    case "memory": initMemory(); break;
    case "reaction": initReaction(); break;
    case "whack": initWhack(); break;
    case "typing": initTyping(); break;
    case "aim": initAim(); break;
    case "panic": initPanic(); break;
    case "wrong": initWrong(); break;
    case "cursed": initCursed(); break;
    case "emoji": initEmoji(); break;
    case "dodge": initDodge(); break;
    case "slash": initSlash(); break;
    case "runner": initRunner(); break;
    case "pour": initPour(); break;
    case "trivia": initTrivia(); break;
    case "spinwheel": initSpinWheel(); break;
    case "tipsy": initTipsy(); break;
    case "beerpong": initBeerPong(); break;
    case "neverhave": initNeverHave(); break;
  }
  setTimeout(setupCursorHovers, 100);
}

// ═══════════════════════════════════════
// GAME OVER SCREEN WITH FUNNY MESSAGES
// ═══════════════════════════════════════
const funnyMessages = {
  snake: [
    "{name} ate themselves. Let that sink in. {name} ATE themselves.",
    "My grandma plays better than {name} and she thinks the mouse is a foot pedal.",
    "That snake had a family, {name}. You monster. A talentless monster.",
    "{name} really said 'what if I just... die?' and committed.",
    "The wall was literally ALWAYS there, {name}. How are you surprised?",
    "Skill issue? Nah, {name} has a LIFE issue.",
    "Even the food felt bad watching {name}'s disaster unfold.",
    "{name}'s snake filed for divorce and chose death instead.",
    "I've seen better gameplay from a screensaver. Step it up, {name}.",
    "That wasn't a game over, that was an intervention for {name}.",
    "{name} drives like they play Snake. Please take the bus, {name}.",
    "The snake's last words: 'Why did I trust {name}?'",
    "Congratulations {name}, you speedran failure.",
    "404: {name}'s talent not found.",
    "I'd say 'nice try {name}' but I'd be lying to your face.",
    "{name} really looked at their own tail and thought 'food?' Unreal."
  ],
  memory: [
    "{name} has the memory of a concussed goldfish.",
    "{name}... there's only 16 cards. SIXTEEN.",
    "{name}'s brain just sent a resignation letter.",
    "Even Dory from Finding Nemo is judging {name} right now.",
    "The cards aren't moving, {name}. They're literally SITTING there. How??",
    "{name}'s last brain cell just applied for a transfer.",
    "I've seen better memory from a potato battery than {name}.",
    "Alzheimer's researchers want to study {name}. Seriously.",
    "{name} forgot where the card was 0.3 seconds after seeing it.",
    "If forgetting was an Olympic sport, {name} would forget to show up.",
    "Two cards, {name}. You just need to remember TWO at a time. TWO.",
    "{name}'s memory is so bad, they probably forgot they're bad at this.",
    "Hey {name}, your brain called. It said 'I quit.'"
  ],
  reaction: [
    "Were you asleep, {name}? Be honest. Were you actually asleep?",
    "My dead grandpa reacts faster than {name} and he's been dead for 12 years.",
    "Internet Explorer sends {name} its condolences... eventually.",
    "A glacier just lapped {name}. A GLACIER.",
    "{name} reacts to things the way government responds to emails.",
    "{name} clicked so late the button almost filed a missing person report.",
    "{name}'s reflexes are on dial-up in a 5G world.",
    "Turtles are watching {name}'s replays for motivation.",
    "{name} makes sloths look like Formula 1 drivers.",
    "By the time {name} clicks, the sun will have exploded.",
    "{name}'s reaction time can be measured with a calendar.",
    "{name} is not slow, just... chronologically challenged.",
    "NASA uses {name}'s reaction time to measure geological eras.",
    "Hey {name}, the green button was RIGHT THERE. It was begging you."
  ],
  whack: [
    "The bots aren't scared of {name}. They're RELAXED around {name}.",
    "{name} hit the grid like they're petting it. WHACK it, don't CARESS it, {name}!",
    "The bots are literally napping between {name}'s attempts.",
    "{name} just gave every bot a spa day. They feel refreshed.",
    "A bot just named its kid after {name}. Out of gratitude.",
    "{name} is the reason bots believe in a loving, non-violent universe.",
    "A bot literally stopped to wave at {name}. {name} missed it. Obviously.",
    "Even blind cats catch more things than {name}.",
    "The bots formed a union and demanded MORE playtime with {name}.",
    "{name}'s whacking game is about as threatening as a wet napkin.",
    "The bots are using {name}'s gameplay as a vacation brochure.",
    "I've seen scarier aggression from a Roomba. Come on, {name}.",
    "{name}, the bots wanted me to say thanks. They've never felt safer."
  ],
  typing: [
    "Was {name} typing with their elbows? Their nose? A fish stick?",
    "{name} types like they're defusing a bomb. One. Key. At. A. Time.",
    "Even autocorrect rage-quit watching {name}.",
    "{name}'s WPM is measured in Words Per Millennium.",
    "Monkeys randomly smashing a keyboard wrote Hamlet faster than {name}.",
    "{name}'s typing speed is an insult to keyboards everywhere.",
    "The cursor is literally aging waiting for {name} to type.",
    "{name} types like they're paying per keystroke.",
    "Hunt and peck? More like hunt and NEVER find, {name}.",
    "{name}'s keyboard just asked to be reassigned to someone else.",
    "A fax machine transmits data faster than {name} types.",
    "If {name} typed any slower, they'd be going backwards.",
    "Hey {name}, the letters are labeled on the keys. Just look down."
  ],
  aim: [
    "Stormtrooper Academy just offered {name} a full scholarship.",
    "{name} couldn't hit a barn if they were INSIDE the barn.",
    "The targets aren't moving, {name}, and you STILL missed.",
    "Stevie Wonder has better aim than {name}. That's not a joke.",
    "Aim assist looked at {name}'s gameplay and said 'I can't fix this.'",
    "{name} missed targets that were TRYING to be hit.",
    "{name}'s mouse asked for a restraining order.",
    "The targets added {name} on LinkedIn. They feel safe networking.",
    "{name}'s aim is so bad, GPS can't even help.",
    "{name} shoots like they learned aiming from a weather vane in a hurricane.",
    "A target just updated its Tinder bio: 'Survived {name}.'",
    "Hey {name}, the targets are the ROUND GLOWING things. Just FYI.",
    "{name} makes stormtroopers look like snipers. That's impressive, honestly."
  ],
  panic: [
    "The button wasn't even trying to hide, {name}.",
    "{name} got outrun by a BUTTON. A rectangular HTML element.",
    "That button has better cardio than {name}.",
    "The button filed a restraining order against {name}'s cursor.",
    "{name} couldn't catch a cold, let alone a button.",
    "Even the decoy buttons felt bad watching {name}.",
    "That button just qualified for the Olympics. {name} didn't.",
    "{name}'s cursor moves like it's walking through honey.",
    "A button just put '{name} survivor' on its resume.",
    "{name} lost a fight with CSS positioning. Think about that.",
    "The button is now charging {name} rent for all the time they wasted.",
    "Somewhere, a button is telling its kids about surviving {name}."
  ],
  wrong: [
    "{name} accidentally got the RIGHT answer. That's the WRONG thing to do here.",
    "{name}'s brain can't stop being correct. Must be exhausting.",
    "Hey {name}, the instructions said WRONG answers. Can you read?",
    "{name} is too smart for this game. And by 'too smart' I mean not smart enough.",
    "{name}'s instincts betrayed them harder than their ex.",
    "Being wrong on purpose is hard. Being wrong on accident is what {name} does.",
    "{name} just proved that thinking is their enemy.",
    "Your brain: 'pick the right one!' — {name}: *listens* — WRONG MOVE.",
    "Congratulations {name}, you're bad at being bad.",
    "{name} failed at failing. That's a new level of fail.",
    "Plot twist: {name} can't even do the wrong thing right.",
    "The WRONG answers are literally LABELED. Come on, {name}."
  ],
  cursed: [
    "{name} got betrayed by their own cursor. Trust issues unlocked.",
    "Imagine losing to your own mouse, {name}. Couldn't be... wait, it IS {name}.",
    "{name} just discovered their cursor has free will. And it hates them.",
    "Your cursor wasn't inverted, {name}. You're just bad normally.",
    "The cursor did its best. {name} did their worst.",
    "{name}'s hand-eye coordination just filed for bankruptcy.",
    "Even with a normal cursor, {name} would still struggle. Let's be honest.",
    "The cursor was the hero. {name} was the obstacle.",
    "{name} tried to click a button. The button clicked back.",
    "Therapists now treat 'Cursor Betrayal PTSD' thanks to {name}.",
    "{name}'s spatial awareness left the chat.",
    "The cursor went left. {name}'s brain went home."
  ],
  emoji: [
    "{name} can't match a smiley face. Let that sink in.",
    "The emoji wheel was literally SHOWING the answer, {name}.",
    "{name} has the timing of a broken metronome.",
    "Even slot machines give better odds than {name}'s clicks.",
    "{name} thought 😭 was 😂. Emotional intelligence: zero.",
    "The emojis are spinning slower than {name}'s brain.",
    "Timing is everything. {name} has none of it.",
    "{name} plays Emoji Roulette like they play life — randomly and poorly.",
    "The wheel: *exists* — {name}: *misses anyway*",
    "{name}'s finger was on the button. The brain was on vacation.",
    "That emoji just winked at {name}. Out of pity.",
    "Fun fact: {name} has missed more emojis than most people see in a lifetime."
  ],
  dodge: [
    "{name} dodged exactly ZERO things. Not one. Zero.",
    "A beam hit {name} so hard, their ancestors felt it.",
    "{name} moved INTO the projectile. On PURPOSE apparently.",
    "The projectiles weren't even aiming at {name}. They just walked into them.",
    "Dodging requires MOVING, {name}. Just a thought.",
    "The beams formed a support group for {name}'s victims.",
    "{name} has the spatial awareness of a brick wall.",
    "A projectile literally STOPPED to let {name} dodge. They still got hit.",
    "{name}'s dodge skills: 404 Not Found.",
    "The neon beams are using {name}'s gameplay as target practice motivation.",
    "Even NPCs dodge better than {name}.",
    "{name} is the reason 'Game Over' screens exist."
  ],
  slash: [
    "{name} slashed air. Lots and lots of air.",
    "The glitches aren't scared of {name}. They're BORED.",
    "{name} clicked a core. The ONE thing you DON'T click.",
    "Red means DON'T CLICK, {name}. It's universal.",
    "{name}'s combo? It was imaginary. Like their skills.",
    "A glitch just walked past {name} like it owned the place.",
    "The cores are sending {name} thank-you cards for clicking them.",
    "{name}'s slashing technique: eyes closed, hope for the best.",
    "I've seen better combat skills from a screensaver.",
    "{name} brings a click to a slash fight.",
    "The glitches formed a parade. {name} watched.",
    "Even the combo counter felt bad for showing 'x0'."
  ],
  runner: [
    "{name} ran straight into a wall. A visible, obvious wall.",
    "Jumping requires PRESSING A BUTTON, {name}.",
    "{name}'s runner career: 0.3 seconds. New record for failure.",
    "The obstacles aren't moving. {name} ran INTO them.",
    "A spike just asked {name} why they didn't jump.",
    "{name} has the reflexes of a sleeping log.",
    "The ground was RIGHT THERE and {name} still face-planted.",
    "Press Space to jump. Space. THE BIG LONG KEY, {name}.",
    "{name} survived for exactly long enough to embarrass themselves.",
    "{name} runs like they're carrying invisible furniture.",
    "The obstacles were rooting for {name}. They're disappointed too.",
    "That wasn't a run. That was a casual stroll into death."
  ],
  pour: [
    "{name} poured like they're watering a garden with a firehose.",
    "The glass filed a flooding complaint against {name}.",
    "{name} couldn't fill a bathtub without burning the house down.",
    "Bartenders worldwide just felt a disturbance watching {name}.",
    "{name} overflowed harder than their inbox on a Monday.",
    "The target line was RIGHT THERE, {name}. It was literally DRAWN for you.",
    "{name} pours drinks like they pour concrete. Everywhere.",
    "A toddler with a sippy cup has better precision than {name}.",
    "Every drop {name} spilled just filed for emotional damages.",
    "{name}'s pouring skills: perfect for flooding basements.",
    "That glass needed therapy after what {name} did to it.",
    "Fun fact: {name} once missed an entire ocean."
  ],
  trivia: [
    "{name} knew nothing. Even Google felt embarrassed for them.",
    "The blur wasn't the problem, {name}. Your brain was.",
    "{name} picked the wrong answer on a TRUE or FALSE question.",
    "Every neuron in {name}'s brain just went on strike.",
    "The screen was blurry but {name}'s ignorance was crystal clear.",
    "{name} studied at the University of Wrong Answers.",
    "{name} failed a quiz about their own name.",
    "The trivia bot just lowered the difficulty out of pity for {name}.",
    "Even drunk, the ANSWERS don't change, {name}.",
    "The blur was mercy. So {name} couldn't see how wrong they were.",
    "{name}'s knowledge is more blurry than the screen.",
    "Wikipedia just unfollowed {name} out of shame."
  ],
  spinwheel: [
    "{name} thought they'd land on 'safe'. Adorable.",
    "The wheel has spoken. {name} must obey.",
    "{name} spun like their life depended on it. It didn't help.",
    "Fate chose violence against {name}. The wheel never lies.",
    "The wheel just created a core memory for {name}.",
    "Someone get {name} a drink. They're gonna need it.",
    "{name} should've stayed home. The wheel had plans.",
    "Even the wheel felt bad for what it gave {name}.",
    "The wheel said '{name}, you're cooked.' And it was right.",
    "Legends say {name} is still doing that dare.",
    "{name} really thought 'just one more spin' was a good idea.",
    "That dare was designed specifically to humble {name}."
  ],
  tipsy: [
    "{name} built that tower with the structural integrity of a wet napkin.",
    "JENGA! Wait, this isn't Jenga. {name} still lost though.",
    "{name} pulled ONE block. ONE. And everything collapsed.",
    "Civil engineers just revoked {name}'s building license.",
    "{name}'s tower lasted shorter than their attention span.",
    "The blocks formed a support group after dealing with {name}.",
    "That tower had dreams, {name}. You ended them.",
    "Gravity was barely involved. {name} did ALL the damage.",
    "Even earthquakes are more gentle than {name}.",
    "{name} plays Tipsy Tower like they live life: recklessly.",
    "The tower's last words: 'Why, {name}? Why?'",
    "Architects just collectively sighed watching {name}."
  ],
  beerpong: [
    "{name} missed every cup like they were avoiding them on purpose.",
    "Steph Curry just unfollowed {name}.",
    "The cups were RIGHT THERE, {name}. Stationary. Glowing.",
    "{name} threw the ball like it owed them money.",
    "Air ball? More like air EVERYTHING for {name}.",
    "The ball went everywhere except where {name} aimed.",
    "Frat houses across the nation just felt a disturbance thanks to {name}.",
    "{name}'s aim is so bad the cups filed for witness protection.",
    "The ball just asked to be reassigned to a competent player.",
    "{name} couldn't hit water if they fell out of a boat.",
    "Pro tip: the cups are the ROUND things on the TABLE, {name}.",
    "{name} makes Stormtroopers look like sharpshooters."
  ],
  neverhave: [
    "{name} has done EVERYTHING. And we mean EVERYTHING.",
    "FBI wants to know {name}'s location after those answers.",
    "{name}'s wildness score just broke the meter.",
    "Even the game is scared of {name} now.",
    "Someone call {name}'s mom. She needs to know.",
    "{name} tapped 'yes' faster than anyone should.",
    "The game just filed a restraining order against {name}.",
    "{name}'s life is basically a reality TV show.",
    "Never have I ever... met someone as wild as {name}.",
    "The app needs therapy after learning about {name}.",
    "{name}'s 'Never Have I Ever' became 'Always Have I Always.'",
    "Plot twist: the game was supposed to judge {name}. {name} judged the game."
  ]
};

const winMessages = {
  memory: [
    "Wait... {name} actually won? Let me check for cheat codes.",
    "{name}'s ONE brain cell really showed up today. Respect.",
    "That was suspiciously good, {name}. Are you... okay?",
    "Oh look, {name} CAN use their brain. Alert the media."
  ],
  reaction: [
    "Okay chill {name}, we didn't ask for a superhero audition.",
    "{name} clicked so fast my code had to double-check. Relax.",
    "Either {name} is cracked or memorized the timing. Sus.",
    "{name} has fast fingers. No further comment."
  ],
  aim: [
    "Aimbot detected. We're calling the police on {name}.",
    "{name} actually hit things? This wasn't in the script.",
    "The targets are filing a complaint against {name}. Too aggressive.",
    "{name} woke up today and chose violence. Respect."
  ],
  panic: [
    "Wait {name} actually CAUGHT that button? Hacker confirmed.",
    "The button is filing a police report against {name}.",
    "Speed demon {name} actually tracked it down. Terrifying.",
    "That button needs therapy after what {name} did."
  ],
  wrong: [
    "{name} is a professional idiot. In the BEST way possible.",
    "Being wrong has never felt so right. Good job, {name}.",
    "{name} mastered the art of being deliberately stupid.",
    "Harvard wants to study how {name} suppresses correct instincts."
  ],
  emoji: [
    "Did {name} just... time that perfectly? Suspicious.",
    "{name} has the timing of a Swiss watch. For once.",
    "The emoji didn't stand a chance against {name}'s reflexes.",
    "Okay {name}, you can stop showing off now."
  ],
  dodge: [
    "{name} dodged EVERYTHING?! Aimbot for dodging is real.",
    "The projectiles are filing a formal complaint about {name}.",
    "Matrix vibes. {name} literally became Neo.",
    "Somewhere, a beam is crying because of {name}."
  ],
  slash: [
    "x4 COMBO? {name} is a certified glitch destroyer.",
    "{name} slashed so hard the game felt it.",
    "The glitches want a union after dealing with {name}.",
    "That was violence, {name}. Beautiful, pixelated violence."
  ],
  pour: [
    "{name} pours like a Swiss watchmaker. A drunk Swiss watchmaker.",
    "Every drop landed perfectly. The glass is speechless.",
    "Bartender of the year goes to {name}. Reluctantly.",
    "That pour was so clean, even the glass blushed."
  ],
  trivia: [
    "Wait {name} can READ through blur? Witch confirmed.",
    "{name}'s brain cells showed up drunk and STILL won.",
    "Even with blurry vision, {name}'s mind is crystal clear.",
    "Drunk genius. {name} just invented a new category."
  ],
  spinwheel: [
    "{name} conquered every dare. Bow to the party monarch.",
    "The wheel tried its worst. {name} didn't even flinch.",
    "Party legend unlocked. {name} feared nothing.",
    "The wheel owes {name} an apology and a trophy."
  ],
  tipsy: [
    "{name} pulled blocks like a surgeon. A drunk surgeon, but still.",
    "That tower should've fallen 10 blocks ago. {name} defied physics.",
    "Engineers want to study {name}'s block-pulling technique.",
    "The tower respects {name}. It stood out of fear."
  ],
  beerpong: [
    "{name} just sank every cup. The table is trembling.",
    "Kobe would be proud. Rest easy, {name} carries the legacy.",
    "Every cup? EVERY CUP?! {name} is built different.",
    "The cups knew they were doomed the moment {name} touched the ball."
  ],
  neverhave: [
    "{name} is somehow the most innocent person alive. Suspicious.",
    "Pure as snow. {name} has never done ANYTHING. Sure.",
    "Either {name} is an angel or the best liar alive.",
    "{name}'s wildness score is so low, even nuns are concerned."
  ]
};

const gameOverIcons = {
  snake: "💀", memory: "🧠", reaction: "⚡", whack: "🔨", typing: "⌨️", aim: "🎯",
  panic: "💨", wrong: "🤔", cursed: "👁️", emoji: "🎰",
  dodge: "🚀", slash: "⚔️", runner: "🏃",
  pour: "🍺", trivia: "🧠", spinwheel: "🎡", tipsy: "🏗️", beerpong: "🏓", neverhave: "👀"
};

const gameOverTitles = {
  snake: "GAME OVER",
  memory: "COMPLETE!",
  reaction: "TIMES UP",
  whack: "TIMES UP",
  typing: "TIMES UP",
  aim: "FINISHED!",
  panic: "TIMES UP",
  wrong: "GAME OVER",
  cursed: "TIMES UP",
  emoji: "FINISHED!",
  dodge: "GAME OVER",
  slash: "GAME OVER",
  runner: "CRASHED!",
  pour: "OVERFLOWED!",
  trivia: "BLACKED OUT!",
  spinwheel: "SPUN OUT!",
  tipsy: "COLLAPSED!",
  beerpong: "GAME SET!",
  neverhave: "EXPOSED!"
};

function showGameOver(gameName, res, isWin) {
  if (typeof NexusAudio !== 'undefined') { NexusAudio.stopMusic(); NexusAudio.sfxGameOver(); }
  // Pick a random funny message
  let messages;
  if (isWin && winMessages[gameName]) {
    messages = winMessages[gameName];
  } else {
    messages = funnyMessages[gameName] || funnyMessages.snake;
  }
  const playerName = state.playerName || "PLAYER";
  const rawMsg = messages[Math.floor(Math.random() * messages.length)];
  const msg = rawMsg.replace(/\{name\}/g, playerName);

  // Build game-over overlay inside game container
  const goScreen = document.createElement("div");
  goScreen.className = "game-over-screen";
  goScreen.innerHTML = `
    <div class="game-over-skull">${gameOverIcons[gameName] || "💀"}</div>
    <div class="game-over-title">${gameOverTitles[gameName] || "GAME OVER"}</div>
    <div class="game-over-message">"${msg}"</div>
    <div class="game-over-stats">
      <div class="game-over-stat">
        <div class="game-over-stat-value">+${res.xpEarned}</div>
        <div class="game-over-stat-label">XP EARNED</div>
      </div>
      <div class="game-over-stat">
        <div class="game-over-stat-value">+${res.coinsEarned}</div>
        <div class="game-over-stat-label">COINS</div>
      </div>
      ${res.isBest ? `<div class="game-over-stat">
        <div class="game-over-stat-value" style="color:var(--legendary)">NEW!</div>
        <div class="game-over-stat-label">BEST SCORE</div>
      </div>` : ""}
    </div>
    <div class="game-over-countdown" style="opacity:0; height:0; overflow:hidden;"></div>
  `;

  // Position it inside the game overlay body
  const overlayBody = document.querySelector(".game-overlay-body");
  if (overlayBody) {
    overlayBody.style.position = "relative";
    overlayBody.appendChild(goScreen);
  }

  // Add a "RETURN TO HUB" button instead of auto-close
  const returnBtn = document.createElement("button");
  returnBtn.textContent = "RETURN TO HUB";
  returnBtn.className = "game-over-return-btn";
  returnBtn.addEventListener("click", function(e) { e.stopPropagation(); closeGame(); });
  goScreen.appendChild(returnBtn);
}

function closeGame() {
  // Stop audio
  if (typeof NexusAudio !== 'undefined') { NexusAudio.stopMusic(); NexusAudio.startDashboardAmbient(); }
  // Stop all game loops first
  if (window._gameInterval) { clearInterval(window._gameInterval); window._gameInterval = null; }
  if (window._gameTimeout) { clearTimeout(window._gameTimeout); window._gameTimeout = null; }
  if (window._gameRAF) { cancelAnimationFrame(window._gameRAF); window._gameRAF = null; }

  // Reset close button state
  const closeBtn = document.getElementById("closeGame");
  closeBtn.dataset.confirmClose = "false";
  closeBtn.textContent = "\u2715";
  closeBtn.style.fontSize = "";
  closeBtn.style.padding = "";

  // Close overlay
  overlay.classList.remove("active");
  overlay.classList.remove("fullscreen-game");
  activeGame = null;

  // Clear game container after transition
  setTimeout(() => { gameContainer.innerHTML = ""; }, 500);

  // Ensure dashboard is visible
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("viewDashboard").classList.add("active");
  document.querySelectorAll(".hud-link").forEach(l => l.classList.remove("active"));
  document.getElementById("navDashboard").classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ═══════════════════════════════════════
// GAME: SNAKE (3D ISOMETRIC FULLSCREEN)
// ═══════════════════════════════════════
function initSnake() {
  const cols = 20, rows = 20;

  // Fullscreen canvas setup
  gameContainer.innerHTML = `
    <div class="snake3d-hud">
      <div class="snake3d-hud-item">SCORE <span id="snakeScore">0</span></div>
      <div class="snake3d-hud-item">SPEED <span id="snakeSpeed">1.0</span>x</div>
      <div class="snake3d-hud-item">LENGTH <span id="snakeLen">3</span></div>
      <div class="snake3d-hud-center" id="snakeMsg">W/&#8593; Up &bull; S/&#8595; Down &bull; A/&#8592; Left &bull; D/&#8594; Right</div>
    </div>
    <canvas id="snakeCanvas"></canvas>
  `;

  const cvs = document.getElementById("snakeCanvas");
  const c = cvs.getContext("2d");

  // Size canvas to fill overlay
  function resizeSnakeCanvas() {
    const parent = cvs.parentElement;
    cvs.width = parent.offsetWidth;
    cvs.height = parent.offsetHeight;
  }
  resizeSnakeCanvas();
  window.addEventListener("resize", resizeSnakeCanvas);

  // ── Isometric projection ──
  const TILT = 0.35; // flatter view for easier direction judgment
  const SEGMENT_HEIGHT = 12; // visual height of 3D segments

  function getTileSize() {
    // Auto-size tiles so the grid fits nicely in center
    const maxTileW = (cvs.width * 0.82) / (cols + rows);
    const maxTileH = (cvs.height * 0.70) / ((cols + rows) * TILT);
    return Math.min(maxTileW, maxTileH) * 2;
  }

  function toIso(gx, gy, gz) {
    const ts = getTileSize();
    const halfW = ts / 2;
    const halfH = ts * TILT / 2;
    const cx = cvs.width / 2;
    // Center the grid: grid center (cols/2, rows/2) should map to screen center
    // Account for 3D element heights by nudging down slightly
    const gridCenterY = ((cols + rows) / 2) * halfH;
    const cy = (cvs.height / 2) - gridCenterY + halfH * 2;
    return {
      x: cx + (gx - gy) * halfW,
      y: cy + (gx + gy) * halfH - (gz || 0)
    };
  }

  // ── Snake state ──
  let snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  let dir = {x:1,y:0}, nextDir = {x:1,y:0};
  let score = 0, alive = true, started = false;
  let frameCount = 0, baseSpeed = 145;
  let shakeX = 0, shakeY = 0, shakeDecay = 0;

  // ── Food system ──
  const foodTypes = [
    { color: "#00ff88", glow: "#00ff88", points: 10, chance: 0.6 },
    { color: "#ffd700", glow: "#ffd700", points: 25, chance: 0.25 },
    { color: "#b44aff", glow: "#b44aff", points: 50, chance: 0.1 },
    { color: "#00f0ff", glow: "#00f0ff", points: 100, chance: 0.05 },
  ];
  let food = null, bonusFood = null, bonusFoodTimer = 0;

  function pickFoodType() {
    const r = Math.random(); let cum = 0;
    for (const ft of foodTypes) { cum += ft.chance; if (r < cum) return ft; }
    return foodTypes[0];
  }

  function spawnFood() {
    let f;
    do { f = {x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows)}; }
    while (snake.some(s => s.x === f.x && s.y === f.y));
    f.type = pickFoodType();
    f.spawnTime = Date.now();
    return f;
  }
  food = spawnFood();

  // ── 3D Particles ──
  let gameParticles = [];
  class IsoParticle {
    constructor(gx, gy, gz, color, type) {
      this.gx = gx; this.gy = gy; this.gz = gz;
      this.color = color; this.life = 1;
      if (type === "eat") {
        this.vx = (Math.random()-0.5)*0.3; this.vy = (Math.random()-0.5)*0.3;
        this.vz = 1 + Math.random()*3;
        this.decay = 0.025; this.size = 3 + Math.random()*4;
      } else if (type === "death") {
        const a = Math.random()*Math.PI*2;
        const s = 0.1+Math.random()*0.3;
        this.vx = Math.cos(a)*s; this.vy = Math.sin(a)*s;
        this.vz = 2+Math.random()*5;
        this.decay = 0.012; this.size = 4+Math.random()*5;
      } else {
        this.vx = (Math.random()-0.5)*0.05; this.vy = (Math.random()-0.5)*0.05;
        this.vz = 0.3+Math.random()*0.5;
        this.decay = 0.04; this.size = 1.5+Math.random()*2;
      }
    }
    update() {
      this.gx += this.vx; this.gy += this.vy;
      this.gz += this.vz; this.vz -= 0.12; // gravity
      this.life -= this.decay;
    }
    draw() {
      if (this.life <= 0) return;
      const p = toIso(this.gx, this.gy, Math.max(0, this.gz));
      c.globalAlpha = this.life * 0.8;
      c.shadowColor = this.color;
      c.shadowBlur = this.size * 2;
      c.fillStyle = this.color;
      c.beginPath();
      c.arc(p.x, p.y, this.size * this.life, 0, Math.PI*2);
      c.fill();
      c.shadowBlur = 0;
      c.globalAlpha = 1;
    }
  }

  function emitParticles(gx, gy, color, count, type) {
    for (let i = 0; i < count; i++)
      gameParticles.push(new IsoParticle(gx, gy, 0.5, color, type));
  }

  // ══════════════════════════════════
  // 3D ISOMETRIC DRAWING
  // ══════════════════════════════════

  function drawFloor() {
    const ts = getTileSize();
    const halfW = ts / 2;
    const halfH = ts * TILT / 2;

    // Floor tiles
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const p = toIso(x, y, 0);
        const isEven = (x + y) % 2 === 0;

        // Diamond tile
        c.beginPath();
        c.moveTo(p.x, p.y - halfH);
        c.lineTo(p.x + halfW, p.y);
        c.lineTo(p.x, p.y + halfH);
        c.lineTo(p.x - halfW, p.y);
        c.closePath();

        c.fillStyle = isEven ? "rgba(12,12,22,0.95)" : "rgba(16,16,28,0.95)";
        c.fill();

        // Grid lines
        c.strokeStyle = "rgba(0,240,255,0.04)";
        c.lineWidth = 0.5;
        c.stroke();
      }
    }

    // Glowing border edges
    const corners = [
      toIso(0, 0, 0), toIso(cols, 0, 0),
      toIso(cols, rows, 0), toIso(0, rows, 0)
    ];
    c.beginPath();
    c.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 4; i++) c.lineTo(corners[i].x, corners[i].y);
    c.closePath();
    c.strokeStyle = "rgba(0,240,255,0.15)";
    c.lineWidth = 2;
    c.shadowColor = "#00f0ff";
    c.shadowBlur = 10;
    c.stroke();
    c.shadowBlur = 0;

    // 3D walls (left and bottom edges)
    const wallH = 8;
    // Left wall
    const bl = toIso(0, rows, 0);
    const blTop = toIso(0, rows, wallH);
    const tlTop = toIso(0, 0, wallH);
    const tl = toIso(0, 0, 0);
    c.beginPath();
    c.moveTo(bl.x, bl.y); c.lineTo(blTop.x, blTop.y);
    c.lineTo(tlTop.x, tlTop.y); c.lineTo(tl.x, tl.y);
    c.closePath();
    c.fillStyle = "rgba(0,240,255,0.03)";
    c.fill();
    c.strokeStyle = "rgba(0,240,255,0.08)";
    c.lineWidth = 1;
    c.stroke();

    // Bottom wall
    const br = toIso(cols, rows, 0);
    const brTop = toIso(cols, rows, wallH);
    c.beginPath();
    c.moveTo(bl.x, bl.y); c.lineTo(blTop.x, blTop.y);
    c.lineTo(brTop.x, brTop.y); c.lineTo(br.x, br.y);
    c.closePath();
    c.fillStyle = "rgba(180,74,255,0.03)";
    c.fill();
    c.strokeStyle = "rgba(180,74,255,0.08)";
    c.stroke();
  }

  // Draw a 3D cube/block at grid position
  function draw3DBlock(gx, gy, height, topColor, leftColor, rightColor, glowColor, glowSize) {
    const ts = getTileSize();
    const halfW = ts / 2;
    const halfH = ts * TILT / 2;

    const base = toIso(gx, gy, 0);
    const top = toIso(gx, gy, height);

    // Shadow on floor
    c.globalAlpha = 0.15;
    c.fillStyle = "#000";
    c.beginPath();
    const shadowOff = height * 0.5;
    c.moveTo(base.x, base.y + shadowOff);
    c.lineTo(base.x + halfW * 0.8, base.y + shadowOff - halfH * 0.3);
    c.lineTo(base.x, base.y + shadowOff - halfH * 0.7);
    c.lineTo(base.x - halfW * 0.8, base.y + shadowOff - halfH * 0.3);
    c.closePath();
    c.fill();
    c.globalAlpha = 1;

    // Glow
    if (glowColor && glowSize) {
      c.shadowColor = glowColor;
      c.shadowBlur = glowSize;
    }

    // Right face (lighter)
    c.beginPath();
    c.moveTo(top.x, top.y + halfH);
    c.lineTo(top.x + halfW, top.y);
    c.lineTo(base.x + halfW, base.y);
    c.lineTo(base.x, base.y + halfH);
    c.closePath();
    c.fillStyle = rightColor;
    c.fill();

    // Left face (darker)
    c.beginPath();
    c.moveTo(top.x, top.y + halfH);
    c.lineTo(top.x - halfW, top.y);
    c.lineTo(base.x - halfW, base.y);
    c.lineTo(base.x, base.y + halfH);
    c.closePath();
    c.fillStyle = leftColor;
    c.fill();

    // Top face
    c.beginPath();
    c.moveTo(top.x, top.y - halfH);
    c.lineTo(top.x + halfW, top.y);
    c.lineTo(top.x, top.y + halfH);
    c.lineTo(top.x - halfW, top.y);
    c.closePath();
    c.fillStyle = topColor;
    c.fill();

    // Top face highlight
    c.beginPath();
    c.moveTo(top.x, top.y - halfH);
    c.lineTo(top.x + halfW, top.y);
    c.lineTo(top.x, top.y + halfH);
    c.lineTo(top.x - halfW, top.y);
    c.closePath();
    const hlGrad = c.createLinearGradient(top.x - halfW, top.y - halfH, top.x + halfW, top.y + halfH);
    hlGrad.addColorStop(0, "rgba(255,255,255,0.15)");
    hlGrad.addColorStop(0.5, "rgba(255,255,255,0.02)");
    hlGrad.addColorStop(1, "transparent");
    c.fillStyle = hlGrad;
    c.fill();

    c.shadowBlur = 0;
  }

  function drawFood3D(f) {
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.15;
    const floatZ = 8 + Math.sin(Date.now() * 0.003) * 4;
    const rotation = Date.now() * 0.002;
    const ft = f.type;
    const ts = getTileSize();

    // Floor glow
    const floorP = toIso(f.x + 0.5, f.y + 0.5, 0);
    const auraGrad = c.createRadialGradient(floorP.x, floorP.y, 0, floorP.x, floorP.y, ts * 0.8);
    auraGrad.addColorStop(0, ft.glow + "33");
    auraGrad.addColorStop(1, "transparent");
    c.fillStyle = auraGrad;
    c.beginPath();
    c.arc(floorP.x, floorP.y, ts * 0.8, 0, Math.PI*2);
    c.fill();

    // Floating orb
    const p = toIso(f.x + 0.5, f.y + 0.5, floatZ);
    const orbR = ts * 0.2 * pulse;

    // Orbiting dots
    for (let i = 0; i < 3; i++) {
      const angle = rotation + (i * Math.PI * 2 / 3);
      const ox = p.x + Math.cos(angle) * orbR * 2;
      const oy = p.y + Math.sin(angle) * orbR * 1.2;
      c.fillStyle = ft.color;
      c.globalAlpha = 0.5;
      c.beginPath();
      c.arc(ox, oy, 2, 0, Math.PI*2);
      c.fill();
      c.globalAlpha = 1;
    }

    // Main orb with glow
    c.shadowColor = ft.glow;
    c.shadowBlur = 25;
    const orbGrad = c.createRadialGradient(p.x - orbR*0.3, p.y - orbR*0.4, 0, p.x, p.y, orbR);
    orbGrad.addColorStop(0, "#fff");
    orbGrad.addColorStop(0.3, ft.color);
    orbGrad.addColorStop(1, ft.glow + "88");
    c.fillStyle = orbGrad;
    c.beginPath();
    c.arc(p.x, p.y, orbR, 0, Math.PI*2);
    c.fill();
    c.shadowBlur = 0;

    // Points label
    if (ft.points > 10) {
      c.font = `bold ${Math.round(ts*0.12)}px Orbitron, monospace`;
      c.fillStyle = ft.color;
      c.textAlign = "center";
      c.globalAlpha = 0.8;
      c.fillText("+" + ft.points, p.x, p.y + orbR + ts * 0.15);
      c.globalAlpha = 1;
    }
  }

  function drawSnake3D() {
    // Sort segments by depth (back-to-front for isometric: higher x+y = closer to camera)
    const sorted = snake.map((s, i) => ({ ...s, idx: i }));
    sorted.sort((a, b) => (a.x + a.y) - (b.x + b.y));

    sorted.forEach(seg => {
      const i = seg.idx;
      const t = i / Math.max(1, snake.length - 1);
      const isHead = i === 0;

      // Height: head tallest, tapers to tail
      let h;
      if (isHead) h = SEGMENT_HEIGHT * 1.4;
      else if (i < 3) h = SEGMENT_HEIGHT * (1.2 - i * 0.05);
      else h = SEGMENT_HEIGHT * Math.max(0.4, 1 - t * 0.6);

      // Colors: cyan head → teal tail (or red if dead)
      const hue = 185 + t * 40;
      const sat = alive ? 90 : 20;
      const lightTop = alive ? (50 - t * 10) : 20;
      const lightLeft = alive ? (30 - t * 8) : 12;
      const lightRight = alive ? (40 - t * 8) : 16;

      const topC = alive ? `hsl(${hue},${sat}%,${lightTop}%)` : `hsl(0,40%,${lightTop}%)`;
      const leftC = alive ? `hsl(${hue},${sat}%,${lightLeft}%)` : `hsl(0,30%,${lightLeft}%)`;
      const rightC = alive ? `hsl(${hue},${sat}%,${lightRight}%)` : `hsl(0,35%,${lightRight}%)`;
      const glowC = isHead ? (alive ? "#00f0ff" : "#ff3333") : null;
      const glowS = isHead ? 20 : 0;

      draw3DBlock(seg.x + 0.1, seg.y + 0.1, h, topC, leftC, rightC, glowC, glowS);

      // Head details
      if (isHead && alive) {
        const headP = toIso(seg.x + 0.5, seg.y + 0.5, h);
        const ts = getTileSize();
        const eyeS = ts * 0.06;

        // Eye positions based on direction
        let e1off, e2off;
        if (dir.x === 1) { e1off = {dx: 0.15, dy: -0.12}; e2off = {dx: 0.15, dy: 0.12}; }
        else if (dir.x === -1) { e1off = {dx: -0.15, dy: -0.12}; e2off = {dx: -0.15, dy: 0.12}; }
        else if (dir.y === -1) { e1off = {dx: -0.12, dy: -0.15}; e2off = {dx: 0.12, dy: -0.15}; }
        else { e1off = {dx: -0.12, dy: 0.15}; e2off = {dx: 0.12, dy: 0.15}; }

        const e1 = toIso(seg.x + 0.5 + e1off.dx, seg.y + 0.5 + e1off.dy, h + 2);
        const e2 = toIso(seg.x + 0.5 + e2off.dx, seg.y + 0.5 + e2off.dy, h + 2);

        // Eye whites
        c.fillStyle = "rgba(220,255,255,0.95)";
        c.shadowColor = "#00f0ff";
        c.shadowBlur = 8;
        c.beginPath(); c.arc(e1.x, e1.y, eyeS, 0, Math.PI*2); c.fill();
        c.beginPath(); c.arc(e2.x, e2.y, eyeS, 0, Math.PI*2); c.fill();

        // Pupils
        c.shadowBlur = 0;
        c.fillStyle = "#0a0a0f";
        c.beginPath(); c.arc(e1.x + dir.x*eyeS*0.2, e1.y + dir.y*eyeS*0.2, eyeS*0.5, 0, Math.PI*2); c.fill();
        c.beginPath(); c.arc(e2.x + dir.x*eyeS*0.2, e2.y + dir.y*eyeS*0.2, eyeS*0.5, 0, Math.PI*2); c.fill();

        // Pupil highlights
        c.fillStyle = "rgba(255,255,255,0.7)";
        c.beginPath(); c.arc(e1.x - eyeS*0.15, e1.y - eyeS*0.15, eyeS*0.2, 0, Math.PI*2); c.fill();
        c.beginPath(); c.arc(e2.x - eyeS*0.15, e2.y - eyeS*0.15, eyeS*0.2, 0, Math.PI*2); c.fill();
      }

      // Scale pattern on every other segment
      if (!isHead && i % 2 === 0 && alive) {
        const topP = toIso(seg.x + 0.5, seg.y + 0.5, h);
        const scaleS = getTileSize() * 0.06;
        c.globalAlpha = 0.12;
        c.fillStyle = "#fff";
        c.beginPath();
        c.moveTo(topP.x, topP.y - scaleS);
        c.lineTo(topP.x + scaleS, topP.y);
        c.lineTo(topP.x, topP.y + scaleS);
        c.lineTo(topP.x - scaleS, topP.y);
        c.closePath();
        c.fill();
        c.globalAlpha = 1;
      }
    });
  }

  // ── Main draw ──
  function draw() {
    c.save();
    c.clearRect(0, 0, cvs.width, cvs.height);

    // Background
    const bgGrad = c.createRadialGradient(cvs.width/2, cvs.height/2, 0, cvs.width/2, cvs.height/2, cvs.width*0.7);
    bgGrad.addColorStop(0, "#0d0d1a");
    bgGrad.addColorStop(1, "#050508");
    c.fillStyle = bgGrad;
    c.fillRect(0, 0, cvs.width, cvs.height);

    // Screen shake
    if (shakeDecay > 0) {
      shakeX = (Math.random()-0.5)*shakeDecay*12;
      shakeY = (Math.random()-0.5)*shakeDecay*12;
      shakeDecay *= 0.9;
      if (shakeDecay < 0.01) { shakeDecay = 0; shakeX = 0; shakeY = 0; }
      c.translate(shakeX, shakeY);
    }

    drawFloor();

    // Depth-sort everything: food, snake, particles
    // Draw food if it's "behind" the snake
    if (food) drawFood3D(food);
    if (bonusFood) drawFood3D(bonusFood);

    drawSnake3D();

    // Particles
    gameParticles.forEach(p => { p.update(); p.draw(); });
    gameParticles = gameParticles.filter(p => p.life > 0);

    // Trail particles from head
    if (alive && snake.length > 0 && frameCount % 3 === 0) {
      const h = snake[0];
      emitParticles(h.x + 0.5 - dir.x*0.3, h.y + 0.5 - dir.y*0.3, "rgba(0,240,255,0.5)", 1, "trail");
    }

    c.restore();
    frameCount++;
  }

  // ── Game tick ──
  function tick() {
    if (!alive) return;
    dir = nextDir;
    const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};

    // Collision check
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows || snake.some(s => s.x === head.x && s.y === head.y)) {
      alive = false;
      shakeDecay = 1.5;

      // Death particles (3D explosion upward)
      snake.forEach((s, i) => {
        emitParticles(s.x + 0.5, s.y + 0.5, i === 0 ? "#00f0ff" : "#00a0aa", 8, "death");
      });

      clearInterval(window._gameInterval); window._gameInterval = null;
      if (window._gameRAF) { cancelAnimationFrame(window._gameRAF); window._gameRAF = null; }

      let deathFrames = 0;
      function deathAnim() {
        try { draw(); } catch(e) {}
        deathFrames++;
        if (deathFrames < 50) {
          requestAnimationFrame(deathAnim);
        } else {
          try {
            const res = endGame("snake", score);
            showGameOver("snake", res, false);
          } catch(e) {
            console.error("endGame error:", e);
            setTimeout(function() { closeGame(); }, 1000);
          }
        }
      }
      requestAnimationFrame(deathAnim);
      return;
    }

    snake.unshift(head);

    // Check food
    if (head.x === food.x && head.y === food.y) {
      const pts = food.type.points;
      score += pts;
      document.getElementById("snakeScore").textContent = score;
      document.getElementById("snakeLen").textContent = snake.length;
      emitParticles(food.x + 0.5, food.y + 0.5, food.type.color, 20, "eat");
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxEat();
      showFloatingText("+" + pts, mouseX, mouseY - 20, food.type.color);
      food = spawnFood();

      if (Math.random() < 0.2 && !bonusFood) {
        bonusFood = spawnFood();
        bonusFood.type = foodTypes[2 + Math.floor(Math.random() * 2)];
        bonusFoodTimer = setTimeout(() => { bonusFood = null; }, 5000);
      }

      const speedLevel = Math.floor(snake.length / 5);
      const newSpeed = Math.max(75, baseSpeed - speedLevel * 5);
      clearInterval(window._gameInterval);
      window._gameInterval = setInterval(tick, newSpeed);
      document.getElementById("snakeSpeed").textContent = (baseSpeed / newSpeed).toFixed(1);

    } else if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
      const pts = bonusFood.type.points;
      score += pts;
      document.getElementById("snakeScore").textContent = score;
      document.getElementById("snakeLen").textContent = snake.length;
      emitParticles(bonusFood.x + 0.5, bonusFood.y + 0.5, bonusFood.type.color, 30, "eat");
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxEat();
      showFloatingText("+" + pts + " BONUS!", mouseX, mouseY - 30, bonusFood.type.color);
      clearTimeout(bonusFoodTimer);
      bonusFood = null;
    } else {
      snake.pop();
    }

    draw();
  }

  // ── Render loop ──
  let lastDraw = 0;
  function renderLoop(time) {
    if (!overlay.classList.contains("active") || !alive) return;
    if (time - lastDraw > 16) {
      draw();
      lastDraw = time;
    }
    window._gameRAF = requestAnimationFrame(renderLoop);
  }

  draw(); // draw initial frame (floor + snake visible, but not moving)

  // ── START SCREEN ──
  const startOverlay = document.createElement("div");
  startOverlay.className = "snake-start-overlay";
  startOverlay.innerHTML = `
    <div class="snake-start-box">
      <div class="snake-start-title">SNAKE 3D</div>
      <div class="snake-start-controls">
        <div class="snake-ctrl-row"><span class="snake-key">W</span> / <span class="snake-key">&#8593;</span> Up</div>
        <div class="snake-ctrl-row"><span class="snake-key">S</span> / <span class="snake-key">&#8595;</span> Down</div>
        <div class="snake-ctrl-row"><span class="snake-key">A</span> / <span class="snake-key">&#8592;</span> Left</div>
        <div class="snake-ctrl-row"><span class="snake-key">D</span> / <span class="snake-key">&#8594;</span> Right</div>
      </div>
      <button class="snake-start-btn" id="snakeStartBtn">START GAME</button>
      <div class="snake-start-hint">or press any arrow key</div>
    </div>
  `;
  cvs.parentElement.appendChild(startOverlay);

  function startGame() {
    startOverlay.classList.add("fade-out");
    setTimeout(() => { startOverlay.remove(); }, 400);
    started = true;
    window._gameInterval = setInterval(tick, baseSpeed);
    window._gameRAF = requestAnimationFrame(renderLoop);
  }

  document.getElementById("snakeStartBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    if (!started) startGame();
  });

  // ── Controls ──
  const handler = (e) => {
    if (!overlay.classList.contains("active")) { document.removeEventListener("keydown", handler); return; }
    const map = {
      ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
      w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0},
      W:{x:0,y:-1}, S:{x:0,y:1}, A:{x:-1,y:0}, D:{x:1,y:0}
    };
    const nd = map[e.key];
    if (nd && !(nd.x === -dir.x && nd.y === -dir.y)) {
      nextDir = nd;
      e.preventDefault();
      if (!started) startGame();
    }
  };
  document.addEventListener("keydown", handler);

  // Mobile touch controls: swipe + on-screen d-pad
  if (isTouchDevice) {
    let touchStartX = 0, touchStartY = 0;
    cvs.addEventListener("touchstart", (e) => {
      const t = e.touches[0]; if (!t) return;
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      if (!started) startGame();
    }, { passive: true });
    cvs.addEventListener("touchend", (e) => {
      const t = e.changedTouches[0]; if (!t) return;
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const absDx = Math.abs(dx), absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 20) return; // too small
      let nd;
      if (absDx > absDy) nd = dx > 0 ? {x:1,y:0} : {x:-1,y:0};
      else nd = dy > 0 ? {x:0,y:1} : {x:0,y:-1};
      if (nd && !(nd.x === -dir.x && nd.y === -dir.y)) nextDir = nd;
    }, { passive: true });

    // On-screen d-pad
    const dpad = document.createElement("div");
    dpad.className = "snake-dpad";
    dpad.innerHTML = `
      <button class="dpad-btn dpad-up" data-dx="0" data-dy="-1">&#9650;</button>
      <button class="dpad-btn dpad-left" data-dx="-1" data-dy="0">&#9664;</button>
      <button class="dpad-btn dpad-right" data-dx="1" data-dy="0">&#9654;</button>
      <button class="dpad-btn dpad-down" data-dx="0" data-dy="1">&#9660;</button>
    `;
    gameContainer.appendChild(dpad);
    dpad.querySelectorAll(".dpad-btn").forEach(b => {
      b.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nd = { x: parseInt(b.dataset.dx), y: parseInt(b.dataset.dy) };
        if (!(nd.x === -dir.x && nd.y === -dir.y)) nextDir = nd;
        if (!started) startGame();
      }, { passive: false });
    });
  }
}

// ═══════════════════════════════════════
// GAME: MEMORY
// ═══════════════════════════════════════
function initMemory() {
  const emojis = ["&#9889;","&#9733;","&#9764;","&#9881;","&#9752;","&#9775;","&#9876;","&#127919;"];
  let cards = [...emojis, ...emojis];
  cards.sort(() => Math.random() - 0.5);
  let revealed = [], matched = 0, moves = 0, locked = false;

  gameContainer.innerHTML = `
    <div class="game-score-bar"><span>MOVES: <b id="memMoves">0</b></span><span>MATCHED: <b id="memMatched">0</b> / 8</span></div>
    <div class="memory-grid" id="memGrid"></div>
  `;
  const grid = document.getElementById("memGrid");
  cards.forEach((emoji, i) => {
    const cell = document.createElement("div");
    cell.className = "memory-cell hidden";
    cell.innerHTML = emoji;
    cell.dataset.index = i;
    cell.addEventListener("click", () => handleMemClick(cell, i));
    grid.appendChild(cell);
  });
  setTimeout(setupCursorHovers, 50);

  function handleMemClick(cell, i) {
    if (locked || cell.classList.contains("revealed") || cell.classList.contains("matched")) return;
    cell.classList.remove("hidden"); cell.classList.add("revealed");
    revealed.push({ cell, index: i, emoji: cards[i] });

    if (revealed.length === 2) {
      moves++;
      document.getElementById("memMoves").textContent = moves;
      locked = true;
      if (revealed[0].emoji === revealed[1].emoji) {
        revealed[0].cell.classList.add("matched"); revealed[1].cell.classList.add("matched");
        matched++;
        document.getElementById("memMatched").textContent = matched;
        showFloatingText("+1", mouseX, mouseY - 20, "var(--success)");
        if (typeof NexusAudio !== 'undefined') NexusAudio.sfxCorrect();
        revealed = []; locked = false;
        if (matched === 8) {
          const score = Math.max(100 - moves * 3, 10);
          const res = endGame("memory", score);
          setTimeout(() => { showGameOver("memory", res, true); }, 400);
        }
      } else {
        if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();
        setTimeout(() => {
          revealed[0].cell.classList.remove("revealed"); revealed[0].cell.classList.add("hidden");
          revealed[1].cell.classList.remove("revealed"); revealed[1].cell.classList.add("hidden");
          revealed = []; locked = false;
        }, 800);
      }
    }
  }
}

// ═══════════════════════════════════════
// GAME: REACTION TIME
// ═══════════════════════════════════════
function initReaction() {
  gameContainer.innerHTML = `
    <div class="game-score-bar"><span>ROUND: <b id="rxRound">1</b> / 5</span><span>AVG: <b id="rxAvg">--</b>ms</span></div>
    <div class="reaction-box waiting" id="rxBox">CLICK TO START</div>
  `;
  const box = document.getElementById("rxBox");
  let round = 0, times = [], phase = "idle", startTime, timer;

  box.addEventListener("click", () => {
    if (phase === "idle") { phase = "waiting"; startRound(); }
    else if (phase === "waiting") {
      clearTimeout(timer); phase = "idle";
      box.className = "reaction-box early"; box.textContent = "TOO EARLY! CLICK TO RETRY";
    }
    else if (phase === "go") {
      const rt = Date.now() - startTime;
      times.push(rt); round++;
      document.getElementById("rxRound").textContent = Math.min(round + 1, 5);
      box.className = "reaction-box result"; box.textContent = `${rt}ms`;
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxCorrect();
      phase = "idle";
      if (round < 5) {
        setTimeout(() => { phase = "waiting"; startRound(); }, 1000);
      } else {
        const avg = Math.round(times.reduce((a,b) => a+b, 0) / times.length);
        document.getElementById("rxAvg").textContent = avg;
        const res = endGame("reaction", avg, avg + "ms");
        if (avg < 250) unlock("speedster", "Speedster");
        const isGood = avg < 300;
        setTimeout(() => { showGameOver("reaction", res, isGood); }, 500);
      }
    }
  });

  function startRound() {
    box.className = "reaction-box ready"; box.textContent = "WAIT FOR GREEN...";
    const delay = 1500 + Math.random() * 3000;
    timer = setTimeout(() => {
      phase = "go"; startTime = Date.now();
      box.className = "reaction-box go"; box.textContent = "CLICK NOW!";
    }, delay);
    window._gameTimeout = timer;
  }
  setTimeout(setupCursorHovers, 50);
}

// ═══════════════════════════════════════
// GAME: WHACK-A-BOT
// ═══════════════════════════════════════
function initWhack() {
  gameContainer.innerHTML = `
    <div class="game-score-bar"><span>SCORE: <b id="whScore">0</b></span><span>TIME: <b id="whTime">30</b>s</span></div>
    <div class="whack-grid" id="whGrid"></div>
  `;
  const grid = document.getElementById("whGrid");
  let score = 0, timeLeft = 30, holes = [];

  for (let i = 0; i < 9; i++) {
    const hole = document.createElement("div");
    hole.className = "whack-hole";
    hole.addEventListener("click", () => {
      if (hole.classList.contains("active")) {
        hole.classList.remove("active"); hole.classList.add("hit");
        setTimeout(() => hole.classList.remove("hit"), 200);
        score += 10;
        document.getElementById("whScore").textContent = score;
        showFloatingText("+10", mouseX, mouseY - 20, "var(--success)");
        if (typeof NexusAudio !== 'undefined') NexusAudio.sfxHit();
      }
    });
    grid.appendChild(hole);
    holes.push(hole);
  }

  function spawnBot() {
    if (timeLeft <= 0) return;
    holes.forEach(h => h.classList.remove("active"));
    const idx = Math.floor(Math.random() * 9);
    holes[idx].classList.add("active");
    holes[idx].innerHTML = "&#129302;";
    const dur = Math.max(400, 1000 - score * 5);
    window._gameTimeout = setTimeout(() => {
      holes[idx].classList.remove("active");
      holes[idx].innerHTML = "";
      spawnBot();
    }, dur);
  }

  const countdown = setInterval(() => {
    timeLeft--;
    document.getElementById("whTime").textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      clearTimeout(window._gameTimeout);
      holes.forEach(h => { h.classList.remove("active"); h.innerHTML = ""; });
      const res = endGame("whack", score);
      showGameOver("whack", res, score > 100);
    }
  }, 1000);
  window._gameInterval = countdown;
  spawnBot();
  setTimeout(setupCursorHovers, 50);
}

// ═══════════════════════════════════════
// GAME: SPEED TYPE
// ═══════════════════════════════════════
function initTyping() {
  const words = [
    "nexus","cyber","quantum","plasma","photon","matrix","cipher","neural","orbit","vector",
    "fusion","binary","crypto","turbo","hyper","omega","delta","sigma","pulse","surge",
    "phantom","blaze","storm","swift","ember","frost","spark","shade","drift","echo",
    "glitch","vortex","pixel","daemon","kernel","syntax","debug","deploy","render","cache"
  ];

  const taunts = {
    idle: [
      "Waiting for those slow fingers...",
      "Any day now...",
      "The keyboard is gathering dust.",
      "Hello? Is anyone typing?",
      "I've seen paint dry faster.",
      "Loading typing skills... ERROR.",
    ],
    wrong: [
      "WRONG! Do you even know the alphabet?",
      "Bro WHAT was that keystroke?",
      "Your fingers are drunk. Send them home.",
      "Even a cat walking on keys does better.",
      "Nope. Nope. Absolutely not.",
      "The keyboard just flinched.",
      "That letter doesn't even EXIST in the word.",
      "Are you typing with your forehead?",
      "WRONG KEY! It's literally right there!",
      "Autocorrect just rage-quit.",
    ],
    correct: [
      "Wait... you got one right?!",
      "Lucky guess. Don't get cocky.",
      "Even a broken clock is right twice a day.",
      "Okay okay, not bad. Don't let it go to your head.",
      "The keyboard is SHOCKED.",
      "That was acceptable. Barely.",
    ],
    streak: [
      "OKAY {name}, calm down!!",
      "{name} is COOKING right now!",
      "Someone call the fire dept, {name} is ON FIRE!",
      "The keyboard can't keep up with {name}!",
      "UNSTOPPABLE! (for now...)",
      "{name} woke up and chose SPEED.",
      "Bro is LOCKED IN!",
    ],
    slow: [
      "My grandma types faster. On a rotary phone.",
      "Are you reading the word letter by letter?",
      "Speedrun? More like a scenic walk.",
      "The word is aging faster than you type it.",
    ]
  };

  let score = 0, timeLeft = 30, currentWord = "";
  let streak = 0, wordsTyped = 0, totalChars = 0;
  let lastWordTime = Date.now(), tauntTimer = null;

  const pName = state.playerName || "PLAYER";

  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>SCORE: <b id="tyScore">0</b></span>
      <span>STREAK: <b id="tyStreak">0</b> &#128293;</span>
      <span>WPM: <b id="tyWPM">0</b></span>
      <span>TIME: <b id="tyTime">30</b>s</span>
    </div>

    <div class="ty-editor">
      <div class="ty-editor-header">
        <div class="ty-editor-dots">
          <span class="ty-dot ty-dot-red"></span>
          <span class="ty-dot ty-dot-yellow"></span>
          <span class="ty-dot ty-dot-green"></span>
        </div>
        <div class="ty-editor-title">${pName.toLowerCase()}_typing_test.exe</div>
        <div class="ty-editor-badge" id="tyBadge">READY</div>
      </div>

      <div class="ty-editor-body">
        <div class="ty-line-numbers">
          <span id="tyLineNum">1</span>
        </div>
        <div class="ty-code-area">
          <div class="ty-prompt">
            <span class="ty-prompt-symbol">&#9654;</span>
            <span class="ty-prompt-label">type:</span>
          </div>
          <div class="ty-word-display" id="tyWord"></div>
          <div class="ty-input-row">
            <span class="ty-cursor-blink">|</span>
            <input class="ty-input" id="tyInput" autocomplete="off" spellcheck="false" placeholder="start typing...">
          </div>
        </div>
      </div>

      <div class="ty-taunt-bar" id="tyTaunt">
        <span class="ty-taunt-icon">&#128488;</span>
        <span class="ty-taunt-text" id="tyTauntText">Type the word above. If you can.</span>
      </div>

      <div class="ty-editor-footer">
        <span class="ty-footer-item">UTF-8</span>
        <span class="ty-footer-item">CHAOS MODE</span>
        <span class="ty-footer-item" id="tyChars">0 chars</span>
        <span class="ty-footer-item ty-footer-status" id="tyStatus">● IDLE</span>
      </div>
    </div>
  `;

  const wordEl = document.getElementById("tyWord");
  const input = document.getElementById("tyInput");
  const tauntText = document.getElementById("tyTauntText");
  const badge = document.getElementById("tyBadge");
  const statusEl = document.getElementById("tyStatus");
  input.focus();

  function setTaunt(category) {
    const msgs = taunts[category] || taunts.idle;
    let msg = msgs[Math.floor(Math.random() * msgs.length)];
    msg = msg.replace(/\{name\}/g, pName);
    tauntText.textContent = msg;
    const bar = document.getElementById("tyTaunt");
    bar.classList.add("ty-taunt-pop");
    setTimeout(() => bar.classList.remove("ty-taunt-pop"), 400);
  }

  function nextWord() {
    currentWord = words[Math.floor(Math.random() * words.length)];
    // Render word with individual letter spans for highlighting
    wordEl.innerHTML = currentWord.split("").map((ch, i) =>
      `<span class="ty-letter" data-i="${i}">${ch.toUpperCase()}</span>`
    ).join("");
    input.value = "";
    input.className = "ty-input";
    badge.textContent = "TYPING...";
    badge.className = "ty-editor-badge ty-badge-active";
    statusEl.innerHTML = "● ACTIVE";
    statusEl.className = "ty-footer-item ty-footer-status ty-status-active";
    lastWordTime = Date.now();
    document.getElementById("tyLineNum").textContent = wordsTyped + 1;
  }

  // Idle taunt timer
  function resetIdleTaunt() {
    clearTimeout(tauntTimer);
    tauntTimer = setTimeout(() => {
      if (timeLeft > 0) setTaunt("idle");
    }, 4000);
  }

  input.addEventListener("input", () => {
    const val = input.value.toLowerCase();
    resetIdleTaunt();

    // Highlight matching/wrong letters
    const letters = wordEl.querySelectorAll(".ty-letter");
    letters.forEach((el, i) => {
      if (i < val.length) {
        if (val[i] === currentWord[i]) {
          el.className = "ty-letter ty-letter-correct";
        } else {
          el.className = "ty-letter ty-letter-wrong";
        }
      } else {
        el.className = "ty-letter";
      }
    });

    if (val === currentWord) {
      // Correct word!
      streak++;
      wordsTyped++;
      totalChars += currentWord.length;
      const wordTime = (Date.now() - lastWordTime) / 1000;
      const pts = Math.floor((10 + currentWord.length) * (1 + streak * 0.1));
      score += pts;
      document.getElementById("tyScore").textContent = score;
      document.getElementById("tyStreak").textContent = streak;
      document.getElementById("tyChars").textContent = totalChars + " chars";

      // WPM calculation
      const elapsed = 30 - timeLeft || 1;
      const wpm = Math.round((wordsTyped / elapsed) * 60);
      document.getElementById("tyWPM").textContent = wpm;

      showFloatingText("+" + pts, mouseX, mouseY - 40, "#00ff88");

      if (streak >= 5) {
        setTaunt("streak");
        badge.textContent = "ON FIRE!";
        badge.className = "ty-editor-badge ty-badge-fire";
      } else if (wordTime < 1.5) {
        setTaunt("correct");
      } else {
        setTaunt("slow");
      }

      // Flash the word green
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxCorrect();
      letters.forEach(el => el.className = "ty-letter ty-letter-done");
      setTimeout(nextWord, 200);

    } else if (!currentWord.startsWith(val)) {
      // Wrong character
      streak = 0;
      document.getElementById("tyStreak").textContent = 0;
      input.className = "ty-input ty-input-wrong";
      badge.textContent = "ERROR!";
      badge.className = "ty-editor-badge ty-badge-error";
      statusEl.innerHTML = "● ERROR";
      statusEl.className = "ty-footer-item ty-footer-status ty-status-error";
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();

      setTaunt("wrong");

      // Shake the editor
      const editor = document.querySelector(".ty-editor");
      editor.classList.add("ty-shake");
      setTimeout(() => editor.classList.remove("ty-shake"), 400);
    } else {
      input.className = "ty-input";
      statusEl.innerHTML = "● ACTIVE";
      statusEl.className = "ty-footer-item ty-footer-status ty-status-active";
    }
  });

  nextWord();
  resetIdleTaunt();

  const countdown = setInterval(() => {
    timeLeft--;
    document.getElementById("tyTime").textContent = timeLeft;

    // Urgent styling at 10s
    if (timeLeft <= 10) {
      document.getElementById("tyTime").style.color = "#ff2d78";
    }
    if (timeLeft <= 5) {
      setTaunt("idle");
    }

    if (timeLeft <= 0) {
      clearInterval(countdown);
      clearTimeout(tauntTimer);
      input.disabled = true;
      input.className = "ty-input ty-input-disabled";
      badge.textContent = "TERMINATED";
      badge.className = "ty-editor-badge ty-badge-dead";
      statusEl.innerHTML = "● DEAD";
      statusEl.className = "ty-footer-item ty-footer-status ty-status-dead";
      tauntText.textContent = `${pName} typed ${wordsTyped} words. Pathetic? You decide.`;
      const res = endGame("typing", score);
      showGameOver("typing", res, score > 150);
    }
  }, 1000);
  window._gameInterval = countdown;
  setTimeout(setupCursorHovers, 50);
}

// ═══════════════════════════════════════
// GAME: AIM TRAINER
// ═══════════════════════════════════════
function initAim() {
  const total = 30;
  let hits = 0, startTime = null;

  gameContainer.innerHTML = `
    <div class="game-score-bar"><span>HITS: <b id="aimHits">0</b> / ${total}</span><span>TIME: <b id="aimTime">0.0</b>s</span></div>
    <div class="aim-area" id="aimArea"></div>
  `;
  const area = document.getElementById("aimArea");

  function spawnTarget() {
    area.innerHTML = "";
    const t = document.createElement("div");
    t.className = "aim-target";
    const maxX = area.offsetWidth - 50, maxY = area.offsetHeight - 50;
    t.style.left = (10 + Math.random() * maxX) + "px";
    t.style.top = (10 + Math.random() * maxY) + "px";
    t.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!startTime) startTime = Date.now();
      hits++;
      document.getElementById("aimHits").textContent = hits;
      showFloatingText("HIT!", e.clientX, e.clientY - 20, "var(--primary)");
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxHit();
      if (hits >= total) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const elapsedMs = Math.round((Date.now() - startTime));
        clearInterval(window._gameInterval);
        area.innerHTML = "";
        const res = endGame("aim", elapsedMs, elapsed + "s");
        showGameOver("aim", res, true);
      } else {
        spawnTarget();
      }
    });
    area.appendChild(t);
    setTimeout(setupCursorHovers, 20);
  }

  spawnTarget();

  window._gameInterval = setInterval(() => {
    if (startTime && hits < total) {
      document.getElementById("aimTime").textContent = ((Date.now() - startTime) / 1000).toFixed(1);
    }
  }, 100);
}

// ═══════════════════════════════════════
// GAME: PANIC BUTTON
// ═══════════════════════════════════════
function initPanic() {
  let score = 0, timeLeft = 25, catches = 0;
  const pName = state.playerName || "PLAYER";

  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>CAUGHT: <b id="panicScore">0</b></span>
      <span>TIME: <b id="panicTime">25</b>s</span>
    </div>
    <div class="panic-arena" id="panicArena">
      <div class="panic-taunt" id="panicTaunt">Catch the button... if you can 😏</div>
      <button class="panic-btn" id="panicBtn">CLICK ME!</button>
      <button class="panic-decoy panic-decoy-1">CLICK ME!</button>
      <button class="panic-decoy panic-decoy-2">CLICK ME!</button>
      <button class="panic-decoy panic-decoy-3">CLICK ME!</button>
    </div>
  `;

  const arena = document.getElementById("panicArena");
  const btn = document.getElementById("panicBtn");
  const taunt = document.getElementById("panicTaunt");
  const decoys = arena.querySelectorAll(".panic-decoy");

  const panicTaunts = [
    "Too slow!", "Can't catch me!", "HAHA nice try!",
    "Over here, dummy!", "You call that a click?", "Nope!",
    "Almost! (not really)", `${pName} can't aim lol`, "I'm RIGHT HERE!",
    "Bro just give up", "My grandma clicks faster", "Pathetic! 😂",
    "MISSED! Again!", `${pName} is struggling omg`, "Try harder!",
    "I could do this all day", "Yawn... 🥱"
  ];

  const catchTaunts = [
    "Lucky click!", "Okay fine you got ONE", "Even a broken clock...",
    "Don't get cocky!", "Fluke. Definitely a fluke.", "Wait, HOW?!"
  ];

  function moveBtn() {
    const aw = arena.offsetWidth - 120;
    const ah = arena.offsetHeight - 50;
    btn.style.left = (10 + Math.random() * aw) + "px";
    btn.style.top = (40 + Math.random() * ah) + "px";
    btn.style.transform = `rotate(${(Math.random() - 0.5) * 30}deg) scale(${0.7 + Math.random() * 0.6})`;
  }

  function moveDecoys() {
    decoys.forEach(d => {
      const aw = arena.offsetWidth - 120;
      const ah = arena.offsetHeight - 50;
      d.style.left = (10 + Math.random() * aw) + "px";
      d.style.top = (40 + Math.random() * ah) + "px";
      d.style.display = Math.random() > 0.4 ? "block" : "none";
    });
  }

  // Flee on mouse/touch proximity
  function checkProximity(clientX, clientY) {
    const rect = btn.getBoundingClientRect();
    const bx = rect.left + rect.width / 2;
    const by = rect.top + rect.height / 2;
    const dx = clientX - bx;
    const dy = clientY - by;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 120) {
      moveBtn();
      moveDecoys();
      taunt.textContent = panicTaunts[Math.floor(Math.random() * panicTaunts.length)];
    }
  }
  arena.addEventListener("mousemove", (e) => checkProximity(e.clientX, e.clientY));
  arena.addEventListener("touchmove", (e) => { e.preventDefault(); const t = e.touches[0]; if (t) checkProximity(t.clientX, t.clientY); }, { passive: false });
  arena.addEventListener("touchstart", (e) => { const t = e.touches[0]; if (t) checkProximity(t.clientX, t.clientY); }, { passive: true });

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    catches++;
    score += 10 + catches * 2;
    document.getElementById("panicScore").textContent = catches;
    showFloatingText("+" + (10 + catches * 2), e.clientX, e.clientY - 20, "var(--success)");
    if (typeof NexusAudio !== 'undefined') NexusAudio.sfxCorrect();
    taunt.textContent = catchTaunts[Math.floor(Math.random() * catchTaunts.length)];
    moveBtn();
    moveDecoys();
  });

  decoys.forEach(d => {
    d.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();
      taunt.textContent = "THAT'S A DECOY! 😂 Wrong button, genius!";
      d.classList.add("panic-decoy-wrong");
      setTimeout(() => d.classList.remove("panic-decoy-wrong"), 500);
    });
  });

  moveBtn();
  moveDecoys();

  // Periodically teleport
  const moveTimer = setInterval(() => {
    if (timeLeft > 0 && Math.random() > 0.5) { moveBtn(); moveDecoys(); }
  }, 1500);

  const countdown = setInterval(() => {
    timeLeft--;
    document.getElementById("panicTime").textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      clearInterval(moveTimer);
      if (catches >= 15) unlock("panicmaster", "Button Catcher");
      const res = endGame("panic", score);
      showGameOver("panic", res, catches >= 10);
    }
  }, 1000);
  window._gameInterval = countdown;
  setTimeout(setupCursorHovers, 50);
}

// ═══════════════════════════════════════
// GAME: WRONG ANSWERS ONLY
// ═══════════════════════════════════════
function initWrong() {
  const questions = [
    { q: "What color is the sky?", right: "Blue", wrong: ["Green", "Purple", "Plaid"] },
    { q: "How many legs does a dog have?", right: "4", wrong: ["7", "None", "It depends"] },
    { q: "What is 2 + 2?", right: "4", wrong: ["Fish", "Thursday", "Yes"] },
    { q: "Which planet do we live on?", right: "Earth", wrong: ["Mars", "The Moon", "Costco"] },
    { q: "What do cows drink?", right: "Water", wrong: ["Milk", "Coffee", "Tears"] },
    { q: "How many months have 28 days?", right: "All of them", wrong: ["Just 1", "None", "February only"] },
    { q: "What's the opposite of hot?", right: "Cold", wrong: ["Lukewarm", "Spicy", "Wednesday"] },
    { q: "Which way does the sun rise?", right: "East", wrong: ["Down", "Sideways", "It doesn't"] },
    { q: "What sound does a cat make?", right: "Meow", wrong: ["Moo", "Windows startup", "Nothing"] },
    { q: "Is fire hot or cold?", right: "Hot", wrong: ["Cold", "Medium rare", "Both"] },
    { q: "What's bigger: the moon or a coin?", right: "The moon", wrong: ["A coin", "Equal", "Trick question"] },
    { q: "How many fingers on one hand?", right: "5", wrong: ["11", "Depends on the hand", "π"] },
    { q: "What do you breathe?", right: "Air", wrong: ["WiFi", "Vibes", "Regret"] },
    { q: "Which animal barks?", right: "Dog", wrong: ["Fish", "Table", "My neighbor"] },
    { q: "What year comes after 2024?", right: "2025", wrong: ["1997", "Never", "2024 Part 2"] },
    { q: "Is water wet?", right: "Yes", wrong: ["Debatable", "Only on Tuesdays", "Ask the water"] },
    { q: "How do birds fly?", right: "Wings", wrong: ["Uber", "They don't", "Positive thinking"] },
    { q: "What's 10 x 0?", right: "0", wrong: ["10", "100", "Undefined vibes"] },
  ];

  let score = 0, round = 0, lives = 3, totalRounds = 12;
  let shuffledQs = [...questions].sort(() => Math.random() - 0.5).slice(0, totalRounds);
  const pName = state.playerName || "PLAYER";

  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>SCORE: <b id="wrongScore">0</b></span>
      <span>ROUND: <b id="wrongRound">1</b> / ${totalRounds}</span>
      <span>LIVES: <b id="wrongLives">❤️❤️❤️</b></span>
    </div>
    <div class="wrong-game" id="wrongGame">
      <div class="wrong-instruction">⚠️ PICK THE <span style="color:var(--mythic)">WRONG</span> ANSWER ⚠️</div>
      <div class="wrong-question" id="wrongQ"></div>
      <div class="wrong-options" id="wrongOpts"></div>
      <div class="wrong-feedback" id="wrongFeedback"></div>
    </div>
  `;

  function showQuestion() {
    if (round >= totalRounds || lives <= 0) {
      if (score >= 10) unlock("wrongking", "Certified Idiot");
      const res = endGame("wrong", score);
      showGameOver("wrong", res, score >= 8);
      return;
    }
    const q = shuffledQs[round];
    document.getElementById("wrongQ").textContent = q.q;
    document.getElementById("wrongRound").textContent = round + 1;

    // Shuffle: 1 right + 3 wrong
    const options = [
      { text: q.right, isRight: true },
      ...q.wrong.map(w => ({ text: w, isRight: false }))
    ].sort(() => Math.random() - 0.5);

    const optsEl = document.getElementById("wrongOpts");
    optsEl.innerHTML = "";
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "wrong-opt";
      btn.textContent = opt.text;
      btn.addEventListener("click", () => handleAnswer(opt, btn, optsEl));
      optsEl.appendChild(btn);
    });
    document.getElementById("wrongFeedback").textContent = "";
    setTimeout(setupCursorHovers, 50);
  }

  function handleAnswer(opt, btn, optsEl) {
    // Disable all buttons
    optsEl.querySelectorAll(".wrong-opt").forEach(b => b.disabled = true);
    const fb = document.getElementById("wrongFeedback");

    if (!opt.isRight) {
      // Picked WRONG answer = correct play!
      score++;
      document.getElementById("wrongScore").textContent = score;
      btn.classList.add("wrong-opt-correct");
      fb.textContent = "✅ WRONG answer! That's... correct? Nice!";
      fb.style.color = "var(--success)";
      showFloatingText("+1", mouseX, mouseY - 20, "var(--success)");
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxCorrect();
    } else {
      // Picked RIGHT answer = you failed!
      lives--;
      const hearts = "❤️".repeat(lives) + "🖤".repeat(3 - lives);
      document.getElementById("wrongLives").innerHTML = hearts;
      btn.classList.add("wrong-opt-wrong");
      fb.textContent = "❌ That's the RIGHT answer! You were supposed to be WRONG!";
      fb.style.color = "var(--mythic)";
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();
    }

    round++;
    setTimeout(showQuestion, 1500);
  }

  showQuestion();
}

// ═══════════════════════════════════════
// GAME: CURSOR BETRAYAL
// ═══════════════════════════════════════
function initCursed() {
  let score = 0, timeLeft = 30, taskNum = 0;
  const pName = state.playerName || "PLAYER";

  const curseTypes = ["inverted", "delayed", "drunk", "mirrored", "jittery"];
  let currentCurse = "inverted";

  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>SCORE: <b id="cursedScore">0</b></span>
      <span>TIME: <b id="cursedTime">30</b>s</span>
    </div>
    <div class="cursed-game" id="cursedGame">
      <div class="cursed-curse" id="cursedCurse">CURSE: INVERTED</div>
      <div class="cursed-instruction" id="cursedInstruction">Click the green button!</div>
      <div class="cursed-arena" id="cursedArena"></div>
    </div>
  `;

  const arenaEl = document.getElementById("cursedArena");
  const instrEl = document.getElementById("cursedInstruction");
  const curseEl = document.getElementById("cursedCurse");

  // Custom cursor overlay within the arena
  let fakeCursorEl = document.createElement("div");
  fakeCursorEl.className = "cursed-fake-cursor";
  fakeCursorEl.textContent = "⊕";
  arenaEl.appendChild(fakeCursorEl);

  let realMX = 0, realMY = 0;
  let fakeMX = 0, fakeMY = 0;
  let delayQueue = [];

  arenaEl.addEventListener("mousemove", (e) => {
    const rect = arenaEl.getBoundingClientRect();
    realMX = e.clientX - rect.left;
    realMY = e.clientY - rect.top;

    if (currentCurse === "inverted") {
      fakeMX = rect.width - realMX;
      fakeMY = rect.height - realMY;
    } else if (currentCurse === "mirrored") {
      fakeMX = rect.width - realMX;
      fakeMY = realMY;
    } else if (currentCurse === "drunk") {
      fakeMX = realMX + (Math.random() - 0.5) * 80;
      fakeMY = realMY + (Math.random() - 0.5) * 80;
    } else if (currentCurse === "jittery") {
      fakeMX = realMX + Math.sin(Date.now() * 0.01) * 50;
      fakeMY = realMY + Math.cos(Date.now() * 0.013) * 50;
    } else if (currentCurse === "delayed") {
      delayQueue.push({ x: realMX, y: realMY, t: Date.now() });
    }

    if (currentCurse !== "delayed") {
      fakeCursorEl.style.left = fakeMX + "px";
      fakeCursorEl.style.top = fakeMY + "px";
    }
  });

  // Delayed cursor update
  setInterval(() => {
    if (currentCurse === "delayed" && delayQueue.length > 0) {
      const now = Date.now();
      while (delayQueue.length > 0 && now - delayQueue[0].t > 400) {
        const p = delayQueue.shift();
        fakeMX = p.x;
        fakeMY = p.y;
      }
      fakeCursorEl.style.left = fakeMX + "px";
      fakeCursorEl.style.top = fakeMY + "px";
    }
  }, 30);

  function spawnTask() {
    // Remove old targets
    arenaEl.querySelectorAll(".cursed-target").forEach(t => t.remove());

    currentCurse = curseTypes[Math.floor(Math.random() * curseTypes.length)];
    curseEl.textContent = "CURSE: " + currentCurse.toUpperCase();
    delayQueue = [];

    const tasks = [
      { instruction: "Click the GREEN button!", spawnFn: spawnColorBtn, color: "#00ff88" },
      { instruction: "Click the BIGGEST circle!", spawnFn: spawnSizeTask },
      { instruction: "Click the button that says 'YES'!", spawnFn: spawnWordTask },
    ];

    const task = tasks[taskNum % tasks.length];
    instrEl.textContent = task.instruction;
    task.spawnFn();
    taskNum++;
    setTimeout(setupCursorHovers, 50);
  }

  function spawnColorBtn(correctColor) {
    const colors = ["#00ff88", "#ff2d78", "#ffd700", "#b44aff", "#00f0ff"];
    const correctIdx = Math.floor(Math.random() * 5);
    for (let i = 0; i < 5; i++) {
      const btn = document.createElement("button");
      btn.className = "cursed-target";
      btn.style.background = colors[i];
      btn.style.left = (15 + (i % 3) * 35) + "%";
      btn.style.top = (20 + Math.floor(i / 3) * 40) + "%";
      btn.textContent = "●";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (colors[i] === "#00ff88") {
          score += 10;
          document.getElementById("cursedScore").textContent = score;
          showFloatingText("+10", e.clientX, e.clientY - 20, "var(--success)");
          if (typeof NexusAudio !== 'undefined') NexusAudio.sfxCorrect();
          spawnTask();
        } else {
          if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();
          instrEl.textContent = "WRONG COLOR! Click GREEN!";
        }
      });
      arenaEl.appendChild(btn);
    }
  }

  function spawnSizeTask() {
    const sizes = [30, 45, 60, 40, 50];
    const maxIdx = sizes.indexOf(Math.max(...sizes));
    for (let i = 0; i < 5; i++) {
      const btn = document.createElement("button");
      btn.className = "cursed-target cursed-target-circle";
      btn.style.width = sizes[i] + "px";
      btn.style.height = sizes[i] + "px";
      btn.style.left = (10 + Math.random() * 70) + "%";
      btn.style.top = (10 + Math.random() * 70) + "%";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (i === maxIdx) {
          score += 10;
          document.getElementById("cursedScore").textContent = score;
          showFloatingText("+10", e.clientX, e.clientY - 20, "var(--success)");
          if (typeof NexusAudio !== 'undefined') NexusAudio.sfxCorrect();
          spawnTask();
        } else {
          if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();
          instrEl.textContent = "WRONG! Click the BIGGEST one!";
        }
      });
      arenaEl.appendChild(btn);
    }
  }

  function spawnWordTask() {
    const words = ["YES", "NO", "MAYBE", "NAH", "NOPE"];
    for (let i = 0; i < 5; i++) {
      const btn = document.createElement("button");
      btn.className = "cursed-target";
      btn.textContent = words[i];
      btn.style.left = (10 + (i % 3) * 35) + "%";
      btn.style.top = (20 + Math.floor(i / 3) * 40) + "%";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (words[i] === "YES") {
          score += 10;
          document.getElementById("cursedScore").textContent = score;
          showFloatingText("+10", e.clientX, e.clientY - 20, "var(--success)");
          if (typeof NexusAudio !== 'undefined') NexusAudio.sfxCorrect();
          spawnTask();
        } else {
          if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();
          instrEl.textContent = "WRONG! Click 'YES'!";
        }
      });
      arenaEl.appendChild(btn);
    }
  }

  spawnTask();

  const countdown = setInterval(() => {
    timeLeft--;
    document.getElementById("cursedTime").textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      const res = endGame("cursed", score);
      showGameOver("cursed", res, score >= 80);
    }
  }, 1000);
  window._gameInterval = countdown;
}

// ═══════════════════════════════════════
// GAME: EMOJI ROULETTE
// ═══════════════════════════════════════
function initEmoji() {
  const emojis = ["😂", "😭", "😡", "🥰", "😱", "🤮", "😴", "🤯", "😎", "🥳", "😈", "🤡"];
  let score = 0, round = 0, totalRounds = 15;
  let spinning = false, spinInterval = null;
  let currentIdx = 0, targetEmoji = "";
  let speed = 60;

  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>SCORE: <b id="emojiScore">0</b></span>
      <span>ROUND: <b id="emojiRound">1</b> / ${totalRounds}</span>
    </div>
    <div class="emoji-game" id="emojiGame">
      <div class="emoji-target-label">MATCH THIS:</div>
      <div class="emoji-target" id="emojiTarget">😂</div>
      <div class="emoji-spinner-container">
        <div class="emoji-spinner" id="emojiSpinner">😂</div>
      </div>
      <button class="game-btn emoji-stop-btn" id="emojiStop">STOP!</button>
      <div class="emoji-feedback" id="emojiFeedback"></div>
    </div>
  `;

  const targetEl = document.getElementById("emojiTarget");
  const spinnerEl = document.getElementById("emojiSpinner");
  const stopBtn = document.getElementById("emojiStop");
  const feedbackEl = document.getElementById("emojiFeedback");

  function startRound() {
    if (round >= totalRounds) {
      const res = endGame("emoji", score);
      showGameOver("emoji", res, score >= 10);
      return;
    }

    targetEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    targetEl.textContent = targetEmoji;
    document.getElementById("emojiRound").textContent = round + 1;
    feedbackEl.textContent = "";
    stopBtn.disabled = false;
    stopBtn.textContent = "STOP!";

    // Speed increases each round
    speed = Math.max(30, 80 - round * 3);
    spinning = true;
    currentIdx = Math.floor(Math.random() * emojis.length);

    spinInterval = setInterval(() => {
      currentIdx = (currentIdx + 1) % emojis.length;
      spinnerEl.textContent = emojis[currentIdx];
      spinnerEl.style.transform = `scale(${0.9 + Math.random() * 0.2})`;
    }, speed);
    window._gameInterval = spinInterval;
  }

  stopBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!spinning) return;
    spinning = false;
    clearInterval(spinInterval);
    stopBtn.disabled = true;

    const landed = emojis[currentIdx];
    spinnerEl.style.transform = "scale(1.3)";

    if (landed === targetEmoji) {
      score++;
      document.getElementById("emojiScore").textContent = score;
      feedbackEl.textContent = "✅ MATCH!";
      feedbackEl.style.color = "var(--success)";
      spinnerEl.classList.add("emoji-match");
      showFloatingText("+1", e.clientX, e.clientY - 20, "var(--success)");
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxCorrect();
    } else {
      feedbackEl.textContent = `❌ Got ${landed} — needed ${targetEmoji}`;
      feedbackEl.style.color = "var(--mythic)";
      spinnerEl.classList.add("emoji-miss");
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();
    }

    round++;
    setTimeout(() => {
      spinnerEl.classList.remove("emoji-match", "emoji-miss");
      spinnerEl.style.transform = "scale(1)";
      startRound();
    }, 1200);
  });

  startRound();
  setTimeout(setupCursorHovers, 50);
}

// ═══════════════════════════════════════
// GAME: NEON DODGE (Fullscreen Canvas)
// ═══════════════════════════════════════
function initDodge() {
  gameContainer.innerHTML = `
    <div class="snake3d-hud">
      <div class="snake3d-hud-item">SCORE <span id="dodgeScore">0</span></div>
      <div class="snake3d-hud-item">DODGED <span id="dodgeDodged">0</span></div>
      <div class="snake3d-hud-item">TIME <span id="dodgeTime">45</span>s</div>
      <div class="snake3d-hud-center" id="dodgeGraze"></div>
    </div>
    <canvas id="dodgeCanvas"></canvas>
  `;

  const cvs = document.getElementById("dodgeCanvas");
  const c = cvs.getContext("2d");
  function resize() { cvs.width = cvs.parentElement.offsetWidth; cvs.height = cvs.parentElement.offsetHeight; }
  resize(); window.addEventListener("resize", resize);

  let playerX = cvs.width / 2, playerY = cvs.height / 2;
  const playerR = 10;
  let score = 0, dodged = 0, timeLeft = 45, alive = true;
  let projectiles = [], particles = [];
  let spawnRate = 800, speedMult = 1;
  let lastSpawn = Date.now(), startTime = Date.now();

  function updatePlayerPos(clientX, clientY) {
    const rect = cvs.getBoundingClientRect();
    playerX = Math.max(playerR, Math.min(cvs.width - playerR, clientX - rect.left));
    playerY = Math.max(playerR, Math.min(cvs.height - playerR, clientY - rect.top));
  }
  cvs.addEventListener("mousemove", (e) => updatePlayerPos(e.clientX, e.clientY));
  cvs.addEventListener("touchmove", (e) => { e.preventDefault(); const t = e.touches[0]; if (t) updatePlayerPos(t.clientX, t.clientY); }, { passive: false });
  cvs.addEventListener("touchstart", (e) => { const t = e.touches[0]; if (t) updatePlayerPos(t.clientX, t.clientY); }, { passive: true });

  function spawnProjectile() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = (2 + Math.random() * 2) * speedMult;
    if (edge === 0) { x = Math.random() * cvs.width; y = -10; } // top
    else if (edge === 1) { x = Math.random() * cvs.width; y = cvs.height + 10; } // bottom
    else if (edge === 2) { x = -10; y = Math.random() * cvs.height; } // left
    else { x = cvs.width + 10; y = Math.random() * cvs.height; } // right

    // Aim generally toward center area with some randomness
    const tx = cvs.width / 2 + (Math.random() - 0.5) * cvs.width * 0.6;
    const ty = cvs.height / 2 + (Math.random() - 0.5) * cvs.height * 0.6;
    const angle = Math.atan2(ty - y, tx - x);
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;

    const types = ["beam", "orb", "fast"];
    const type = Math.random() < 0.15 ? "fast" : (Math.random() < 0.5 ? "beam" : "orb");
    const colors = { beam: "#00f0ff", orb: "#b44aff", fast: "#ff6b35" };
    const sizes = { beam: 4, orb: 8, fast: 3 };

    if (type === "fast") { vx *= 1.8; vy *= 1.8; }
    projectiles.push({ x, y, vx, vy, color: colors[type], size: sizes[type], type, grazed: false });
  }

  function addParticle(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (speed || 2) * Math.random();
      particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 1, decay: 0.03+Math.random()*0.03, size: 2+Math.random()*3, color });
    }
  }

  function gameLoop() {
    if (!overlay.classList.contains("active")) return;
    c.clearRect(0, 0, cvs.width, cvs.height);

    // Background
    const bg = c.createRadialGradient(cvs.width/2, cvs.height/2, 0, cvs.width/2, cvs.height/2, cvs.width*0.7);
    bg.addColorStop(0, "#0a0a18"); bg.addColorStop(1, "#030308");
    c.fillStyle = bg; c.fillRect(0, 0, cvs.width, cvs.height);

    // Grid
    c.strokeStyle = "rgba(0,240,255,0.03)"; c.lineWidth = 1;
    for (let i = 0; i < cvs.width; i += 60) { c.beginPath(); c.moveTo(i,0); c.lineTo(i,cvs.height); c.stroke(); }
    for (let i = 0; i < cvs.height; i += 60) { c.beginPath(); c.moveTo(0,i); c.lineTo(cvs.width,i); c.stroke(); }

    if (!alive) {
      // Death explosion
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.life > 0) { c.globalAlpha = p.life; c.fillStyle = p.color; c.shadowColor = p.color; c.shadowBlur = 8;
          c.beginPath(); c.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2); c.fill(); c.shadowBlur = 0; c.globalAlpha = 1; }
      });
      particles = particles.filter(p => p.life > 0);
      if (particles.length > 0) { window._gameRAF = requestAnimationFrame(gameLoop); }
      return;
    }

    // Spawn projectiles
    const elapsed = (Date.now() - startTime) / 1000;
    spawnRate = Math.max(150, 800 - elapsed * 15);
    speedMult = 1 + elapsed * 0.035;
    if (Date.now() - lastSpawn > spawnRate) { spawnProjectile(); lastSpawn = Date.now(); }

    // Update & draw projectiles
    projectiles.forEach(p => {
      p.x += p.vx; p.y += p.vy;

      // Trail
      c.globalAlpha = 0.3; c.fillStyle = p.color;
      c.beginPath(); c.arc(p.x - p.vx*2, p.y - p.vy*2, p.size*0.6, 0, Math.PI*2); c.fill();
      c.globalAlpha = 1;

      // Body
      c.shadowColor = p.color; c.shadowBlur = 12;
      c.fillStyle = p.color;
      c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI*2); c.fill();
      c.shadowBlur = 0;

      // Collision with player
      const dx = p.x - playerX, dy = p.y - playerY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < playerR + p.size) {
        alive = false;
        addParticle(playerX, playerY, "#00f0ff", 40, 5);
        addParticle(playerX, playerY, "#ff3333", 30, 4);
        if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();
        clearInterval(window._gameInterval);
        setTimeout(() => {
          const res = endGame("dodge", score);
          showGameOver("dodge", res, timeLeft <= 0);
        }, 1500);
      }

      // Graze detection (close miss)
      if (!p.grazed && dist < playerR + p.size + 20 && dist >= playerR + p.size) {
        p.grazed = true;
        score += 5;
        document.getElementById("dodgeScore").textContent = score;
        const grazeEl = document.getElementById("dodgeGraze");
        grazeEl.textContent = "GRAZE +5"; grazeEl.style.color = "#ffd700"; grazeEl.style.opacity = "1";
        setTimeout(() => { grazeEl.style.opacity = "0.5"; grazeEl.textContent = ""; }, 500);
        addParticle(playerX, playerY, "#ffd700", 5, 1);
      }
    });

    // Remove off-screen projectiles and count dodged
    const before = projectiles.length;
    projectiles = projectiles.filter(p => p.x > -50 && p.x < cvs.width+50 && p.y > -50 && p.y < cvs.height+50);
    const removed = before - projectiles.length;
    if (removed > 0) {
      dodged += removed; score += removed;
      document.getElementById("dodgeDodged").textContent = dodged;
      document.getElementById("dodgeScore").textContent = score;
    }

    // Draw player
    c.shadowColor = "#00f0ff"; c.shadowBlur = 20;
    const pg = c.createRadialGradient(playerX, playerY, 0, playerX, playerY, playerR);
    pg.addColorStop(0, "#fff"); pg.addColorStop(0.5, "#00f0ff"); pg.addColorStop(1, "rgba(0,240,255,0.3)");
    c.fillStyle = pg;
    c.beginPath(); c.arc(playerX, playerY, playerR, 0, Math.PI*2); c.fill();
    c.shadowBlur = 0;

    // Shield ring
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.2;
    c.strokeStyle = "rgba(0,240,255,0.3)"; c.lineWidth = 1.5;
    c.beginPath(); c.arc(playerX, playerY, playerR * 2 * pulse, 0, Math.PI*2); c.stroke();

    // Particles
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life > 0) { c.globalAlpha = p.life; c.fillStyle = p.color;
        c.beginPath(); c.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2); c.fill(); c.globalAlpha = 1; }
    });
    particles = particles.filter(p => p.life > 0);

    window._gameRAF = requestAnimationFrame(gameLoop);
  }

  // Timer
  const countdown = setInterval(() => {
    timeLeft--;
    document.getElementById("dodgeTime").textContent = timeLeft;
    if (timeLeft % 10 === 0 && timeLeft > 0) { score += 25; document.getElementById("dodgeScore").textContent = score; }
    if (timeLeft <= 0 && alive) {
      clearInterval(countdown);
      alive = false;
      const res = endGame("dodge", score);
      showGameOver("dodge", res, true);
    }
  }, 1000);
  window._gameInterval = countdown;
  window._gameRAF = requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════
// GAME: CYBER SLASH (DOM-based)
// ═══════════════════════════════════════
function initSlash() {
  let score = 0, lives = 3, timeLeft = 40, combo = 0;
  let spawnTimer = null, alive = true;

  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>SCORE: <b id="slashScore">0</b></span>
      <span>COMBO: <b id="slashCombo">x1</b></span>
      <span>LIVES: <b id="slashLives">❤️❤️❤️</b></span>
      <span>TIME: <b id="slashTime">40</b>s</span>
    </div>
    <div class="slash-arena" id="slashArena"></div>
  `;

  const arena = document.getElementById("slashArena");
  const glitchSymbols = ["#", "$", "%", "&", "@", "!", "~", "^", "*", "?"];

  function updateLives() {
    const h = "❤️".repeat(lives) + "🖤".repeat(Math.max(0, 3 - lives));
    document.getElementById("slashLives").innerHTML = h;
  }

  function spawnGlitch() {
    if (!alive) return;
    const el = document.createElement("div");
    const isCore = Math.random() < 0.2; // 20% chance core
    el.className = isCore ? "slash-enemy slash-core" : "slash-enemy slash-glitch";
    el.textContent = isCore ? "◆" : glitchSymbols[Math.floor(Math.random() * glitchSymbols.length)];
    el.style.left = (5 + Math.random() * 85) + "%";
    el.style.animationDuration = (2 + Math.random() * 2 - (40 - timeLeft) * 0.03) + "s";

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (el.classList.contains("slashed")) return;
      el.classList.add("slashed");

      if (isCore) {
        // Hit a core — lose life
        lives--;
        combo = 0;
        updateLives();
        document.getElementById("slashCombo").textContent = "x1";
        if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();
        el.classList.add("slash-core-hit");
        if (lives <= 0) { endSlash(); }
      } else {
        // Slashed a glitch
        combo++;
        const mult = Math.min(combo, 4);
        const pts = 10 * mult;
        score += pts;
        document.getElementById("slashScore").textContent = score;
        document.getElementById("slashCombo").textContent = "x" + mult;
        showFloatingText("+" + pts, e.clientX, e.clientY - 20, mult >= 3 ? "var(--accent)" : "var(--success)");
        if (typeof NexusAudio !== 'undefined') NexusAudio.sfxHit();
        if (combo === 4) showFloatingText("MAX COMBO!", e.clientX, e.clientY - 50, "var(--accent)");
      }
      setTimeout(() => el.remove(), 400);
    });

    // If glitch reaches bottom without being slashed
    el.addEventListener("animationend", () => {
      if (el.classList.contains("slashed")) return;
      if (!isCore) {
        // Glitch escaped — lose life
        lives--;
        combo = 0;
        updateLives();
        document.getElementById("slashCombo").textContent = "x1";
        if (lives <= 0) endSlash();
      }
      el.remove();
    });

    arena.appendChild(el);
    setTimeout(setupCursorHovers, 20);
  }

  function endSlash() {
    alive = false;
    clearInterval(window._gameInterval);
    clearInterval(spawnTimer);
    const res = endGame("slash", score);
    showGameOver("slash", res, score >= 200);
  }

  // Spawn loop
  spawnTimer = setInterval(() => {
    if (!alive) return;
    spawnGlitch();
    // Occasionally spawn 2
    if (Math.random() < 0.3 + (40 - timeLeft) * 0.01) setTimeout(spawnGlitch, 200);
  }, Math.max(400, 1000 - (40 - timeLeft) * 15));

  // Timer
  const countdown = setInterval(() => {
    timeLeft--;
    document.getElementById("slashTime").textContent = timeLeft;
    // Increase spawn rate
    clearInterval(spawnTimer);
    spawnTimer = setInterval(() => {
      if (!alive) return;
      spawnGlitch();
      if (Math.random() < 0.3 + (40 - timeLeft) * 0.015) setTimeout(spawnGlitch, 200);
    }, Math.max(350, 1000 - (40 - timeLeft) * 15));

    if (timeLeft <= 0 && alive) { endSlash(); }
  }, 1000);
  window._gameInterval = countdown;
  setTimeout(setupCursorHovers, 50);
}

// ═══════════════════════════════════════
// GAME: GRAVITY RUNNER (Canvas side-scroller)
// ═══════════════════════════════════════
function initRunner() {
  const W = 650, H = 350;
  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>DISTANCE: <b id="runnerDist">0</b>m</span>
      <span>SPEED: <b id="runnerSpeed">1.0</b>x</span>
    </div>
    <canvas id="runnerCanvas" width="${W}" height="${H}"></canvas>
    <div class="game-message" id="runnerMsg">SPACE / CLICK to Jump</div>
  `;

  const cvs = document.getElementById("runnerCanvas");
  const c = cvs.getContext("2d");

  const GROUND_Y = H - 60;
  const GRAVITY = 0.65;
  const JUMP_VEL = -12;
  let scrollSpeed = 3;
  let distance = 0, alive = true, frameCount = 0;

  // Player
  const player = { x: 100, y: GROUND_Y, vy: 0, w: 20, h: 30, grounded: true, canDouble: true };

  // Obstacles
  let obstacles = [];
  let nextObstacle = 120;

  // Parallax backgrounds
  let bgLayers = [
    { rects: [], speed: 0.3, color: "rgba(0,240,255,0.03)" },
    { rects: [], speed: 0.6, color: "rgba(180,74,255,0.04)" },
  ];
  // Populate bg
  bgLayers.forEach(layer => {
    for (let i = 0; i < 8; i++) {
      layer.rects.push({
        x: Math.random() * W * 2,
        y: GROUND_Y - 40 - Math.random() * 200,
        w: 20 + Math.random() * 40,
        h: 40 + Math.random() * 120
      });
    }
  });

  // Particles
  let particles = [];

  function jump() {
    if (!alive) return;
    if (player.grounded) {
      player.vy = JUMP_VEL;
      player.grounded = false;
      player.canDouble = true;
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxClick();
    } else if (player.canDouble) {
      player.vy = JUMP_VEL * 0.85;
      player.canDouble = false;
      // Double jump particles
      for (let i = 0; i < 8; i++) {
        particles.push({ x: player.x + player.w/2, y: player.y + player.h, vx: (Math.random()-0.5)*3, vy: Math.random()*2, life: 1, decay: 0.05, color: "#b44aff", size: 2+Math.random()*2 });
      }
    }
  }

  // Controls
  const keyHandler = (e) => {
    if (!overlay.classList.contains("active")) { document.removeEventListener("keydown", keyHandler); return; }
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") { e.preventDefault(); jump(); }
  };
  document.addEventListener("keydown", keyHandler);
  cvs.addEventListener("click", jump);
  cvs.addEventListener("touchstart", (e) => { e.preventDefault(); jump(); }, { passive: false });

  function spawnObstacle() {
    const types = ["spike", "wall", "gap"];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === "spike") {
      obstacles.push({ x: W + 20, y: GROUND_Y - 25, w: 20, h: 25, type: "spike", color: "#ff2d78" });
    } else if (type === "wall") {
      const wallH = 35 + Math.random() * 25;
      obstacles.push({ x: W + 20, y: GROUND_Y - wallH, w: 18, h: wallH, type: "wall", color: "#ff6b35" });
    } else {
      // Double spike with gap
      obstacles.push({ x: W + 20, y: GROUND_Y - 22, w: 16, h: 22, type: "spike", color: "#ff2d78" });
      obstacles.push({ x: W + 55, y: GROUND_Y - 30, w: 16, h: 30, type: "spike", color: "#ff2d78" });
    }
  }

  function gameLoop() {
    if (!overlay.classList.contains("active")) return;
    c.clearRect(0, 0, W, H);

    // Background
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#05050c"); bg.addColorStop(1, "#0a0a18");
    c.fillStyle = bg; c.fillRect(0, 0, W, H);

    // Parallax buildings
    bgLayers.forEach(layer => {
      c.fillStyle = layer.color;
      layer.rects.forEach(r => {
        r.x -= scrollSpeed * layer.speed;
        if (r.x + r.w < 0) { r.x = W + Math.random() * 200; r.y = GROUND_Y - 40 - Math.random() * 200; r.w = 20+Math.random()*40; r.h = 40+Math.random()*120; }
        c.fillRect(r.x, r.y, r.w, r.h);
      });
    });

    // Ground
    c.fillStyle = "#0f0f1a";
    c.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    c.strokeStyle = "rgba(0,240,255,0.2)"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, GROUND_Y); c.lineTo(W, GROUND_Y); c.stroke();

    // Ground grid lines (scrolling)
    c.strokeStyle = "rgba(0,240,255,0.05)"; c.lineWidth = 1;
    const gridOff = (frameCount * scrollSpeed) % 40;
    for (let i = -1; i < W / 40 + 1; i++) {
      const gx = i * 40 - gridOff;
      c.beginPath(); c.moveTo(gx, GROUND_Y); c.lineTo(gx, H); c.stroke();
    }

    if (alive) {
      distance += scrollSpeed * 0.3;
      document.getElementById("runnerDist").textContent = Math.floor(distance);

      // Speed up over time
      scrollSpeed = 3 + distance * 0.003;
      document.getElementById("runnerSpeed").textContent = (scrollSpeed / 3).toFixed(1);

      // Spawn obstacles
      nextObstacle -= scrollSpeed;
      if (nextObstacle <= 0) {
        spawnObstacle();
        nextObstacle = 80 + Math.random() * 100;
      }

      // Player physics
      player.vy += GRAVITY;
      player.y += player.vy;
      if (player.y >= GROUND_Y) {
        player.y = GROUND_Y;
        player.vy = 0;
        player.grounded = true;
        player.canDouble = true;
      }

      // Run particles
      if (player.grounded && frameCount % 4 === 0) {
        particles.push({ x: player.x, y: player.y + player.h - 2, vx: -scrollSpeed*0.5 + (Math.random()-0.5), vy: -Math.random()*0.5, life: 1, decay: 0.06, color: "rgba(0,240,255,0.4)", size: 1.5+Math.random() });
      }

      // Update obstacles
      obstacles.forEach(obs => { obs.x -= scrollSpeed; });

      // Collision detection
      for (const obs of obstacles) {
        if (obs.x > player.x + player.w || obs.x + obs.w < player.x) continue;
        if (obs.y > player.y + player.h || obs.y + obs.h < player.y) continue;
        // Collision!
        alive = false;
        // Death particles
        for (let i = 0; i < 30; i++) {
          const a = Math.random()*Math.PI*2;
          particles.push({ x: player.x + player.w/2, y: player.y + player.h/2, vx: Math.cos(a)*(1+Math.random()*4), vy: Math.sin(a)*(1+Math.random()*4) - 2, life: 1, decay: 0.015, color: i < 15 ? "#00f0ff" : "#ff2d78", size: 3+Math.random()*4 });
        }
        if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();
        clearInterval(window._gameInterval); // not used but just in case
        setTimeout(() => {
          const res = endGame("runner", Math.floor(distance));
          showGameOver("runner", res, distance >= 500);
        }, 1500);
        break;
      }

      // Remove off-screen obstacles
      obstacles = obstacles.filter(o => o.x + o.w > -20);
    }

    // Draw obstacles
    obstacles.forEach(obs => {
      c.shadowColor = obs.color; c.shadowBlur = 10;
      c.fillStyle = obs.color;
      if (obs.type === "spike") {
        c.beginPath();
        c.moveTo(obs.x + obs.w/2, obs.y);
        c.lineTo(obs.x + obs.w, obs.y + obs.h);
        c.lineTo(obs.x, obs.y + obs.h);
        c.closePath();
        c.fill();
      } else {
        c.fillRect(obs.x, obs.y, obs.w, obs.h);
      }
      c.shadowBlur = 0;
      // Neon edge
      c.strokeStyle = obs.color; c.lineWidth = 1;
      if (obs.type === "spike") {
        c.beginPath(); c.moveTo(obs.x+obs.w/2,obs.y); c.lineTo(obs.x+obs.w,obs.y+obs.h); c.lineTo(obs.x,obs.y+obs.h); c.closePath(); c.stroke();
      } else { c.strokeRect(obs.x, obs.y, obs.w, obs.h); }
    });

    // Draw player
    if (alive) {
      const px = player.x, py = player.y;
      // Body (neon rectangle with glow)
      c.shadowColor = "#00f0ff"; c.shadowBlur = 15;
      c.fillStyle = "#00d4e0";
      c.fillRect(px + 4, py + 8, 12, 16); // body
      c.fillStyle = "#00f0ff";
      c.beginPath(); c.arc(px + 10, py + 6, 6, 0, Math.PI * 2); c.fill(); // head
      c.shadowBlur = 0;

      // Legs (animated)
      const legPhase = Math.sin(frameCount * 0.3) * 4;
      c.strokeStyle = "#00d4e0"; c.lineWidth = 2; c.lineCap = "round";
      c.beginPath(); c.moveTo(px+6, py+24); c.lineTo(px+4+legPhase, py+30); c.stroke();
      c.beginPath(); c.moveTo(px+14, py+24); c.lineTo(px+16-legPhase, py+30); c.stroke();

      // Arms
      const armPhase = Math.sin(frameCount * 0.3 + 1) * 3;
      c.beginPath(); c.moveTo(px+4, py+12); c.lineTo(px-2+armPhase, py+18); c.stroke();
      c.beginPath(); c.moveTo(px+16, py+12); c.lineTo(px+22-armPhase, py+18); c.stroke();

      // Eye
      c.fillStyle = "#fff";
      c.beginPath(); c.arc(px + 12, py + 5, 2, 0, Math.PI*2); c.fill();
    }

    // Particles
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= p.decay;
      if (p.life > 0) { c.globalAlpha = p.life; c.fillStyle = p.color;
        c.beginPath(); c.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2); c.fill(); c.globalAlpha = 1; }
    });
    particles = particles.filter(p => p.life > 0);

    frameCount++;
    if (alive || particles.length > 0) {
      window._gameRAF = requestAnimationFrame(gameLoop);
    }
  }

  window._gameRAF = requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════
// GAME: POUR MASTER (Canvas precision pouring)
// ═══════════════════════════════════════
function initPour() {
  const W = 400, H = 560;
  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>SCORE: <b id="pourScore">0</b></span>
      <span>ROUND: <b id="pourRound">1</b> / 10</span>
      <span id="pourFeedback" class="pour-feedback"></span>
    </div>
    <canvas id="pourCanvas" width="${W}" height="${H}"></canvas>
    <button class="game-btn pour-btn" id="pourBtn">POUR</button>
  `;
  const cvs = document.getElementById("pourCanvas");
  const c = cvs.getContext("2d");
  const btn = document.getElementById("pourBtn");
  let score = 0, round = 1, pouring = false, stopped = false;
  let liquidLevel = 0, targetLevel = 0, fillSpeed = 1.2;
  let bubbles = [], foamBubbles = [];
  let bottleAngle = 0; // bottle tilt animation

  // Realistic pint glass dimensions (tapered)
  const glassTopW = 120, glassBotW = 85, glassH = 310;
  const glassCX = W / 2, glassTopY = 130;
  const glassBaseY = glassTopY + glassH;
  const glassThickness = 4;
  const liquidMaxH = glassH - 15;

  // Beer bottle position
  const bottleCX = W / 2 + 20, bottleBaseY = 60;

  function getGlassXat(y) {
    // Returns left and right x at a given y (tapered glass)
    const t = (y - glassTopY) / glassH; // 0 at top, 1 at bottom
    const halfW = (glassTopW + (glassBotW - glassTopW) * t) / 2;
    return { left: glassCX - halfW, right: glassCX + halfW };
  }

  function newRound() {
    liquidLevel = 0;
    stopped = false;
    pouring = false;
    targetLevel = 0.3 + Math.random() * 0.5;
    fillSpeed = 1.2 + (round - 1) * 0.22;
    bubbles = [];
    foamBubbles = [];
    bottleAngle = 0;
    btn.textContent = "POUR";
    btn.disabled = false;
    draw();
  }

  // Spawn beer bubbles rising inside liquid
  function spawnBubble() {
    const liqH = liquidLevel * liquidMaxH;
    if (liqH < 10) return;
    const liqTopY = glassBaseY - liqH;
    const spawnY = glassBaseY - Math.random() * liqH * 0.8;
    const g = getGlassXat(spawnY);
    bubbles.push({
      x: g.left + 8 + Math.random() * (g.right - g.left - 16),
      y: spawnY,
      r: 1 + Math.random() * 2.5,
      speed: 0.3 + Math.random() * 0.8,
      wobble: Math.random() * Math.PI * 2,
      topY: liqTopY
    });
  }

  function draw() {
    const t = Date.now();
    c.clearRect(0, 0, W, H);

    // Background - dark wooden bar surface
    const barGrad = c.createLinearGradient(0, 0, 0, H);
    barGrad.addColorStop(0, "#0c0806");
    barGrad.addColorStop(0.7, "#1a120a");
    barGrad.addColorStop(1, "#0d0904");
    c.fillStyle = barGrad;
    c.fillRect(0, 0, W, H);

    // Subtle wood grain lines
    c.globalAlpha = 0.03;
    for (let i = 0; i < 20; i++) {
      c.strokeStyle = "#8B7355";
      c.lineWidth = 0.5;
      c.beginPath();
      const yOff = (i * 28) + Math.sin(i * 0.7) * 5;
      c.moveTo(0, yOff);
      c.bezierCurveTo(W * 0.3, yOff + 3, W * 0.7, yOff - 2, W, yOff + 1);
      c.stroke();
    }
    c.globalAlpha = 1;

    // Bar surface reflection
    c.fillStyle = "rgba(255,200,100,0.015)";
    c.fillRect(0, H - 80, W, 80);

    // === BEER BOTTLE (tilting when pouring) ===
    if (pouring && !stopped) {
      bottleAngle = Math.min(bottleAngle + 0.03, 0.7);
    } else {
      bottleAngle = Math.max(bottleAngle - 0.05, 0);
    }

    c.save();
    const bottlePivotX = glassCX + 10;
    const bottlePivotY = glassTopY - 10;
    c.translate(bottlePivotX, bottlePivotY);
    c.rotate(-bottleAngle);

    // Bottle body
    const bw = 28, bh = 110, bnw = 12, bnh = 40;
    const bx = -bw / 2, by = -bh - bnh - 10;

    // Bottle body (dark green glass)
    const bottleGrad = c.createLinearGradient(bx, by + bnh, bx + bw, by + bnh + bh);
    bottleGrad.addColorStop(0, "#1a3a1a");
    bottleGrad.addColorStop(0.3, "#2d5a2d");
    bottleGrad.addColorStop(0.5, "#3a7a3a");
    bottleGrad.addColorStop(0.7, "#2d5a2d");
    bottleGrad.addColorStop(1, "#1a3a1a");
    c.fillStyle = bottleGrad;

    // Body
    c.beginPath();
    c.moveTo(bx, by + bnh);
    c.lineTo(bx, by + bnh + bh);
    c.arc(bx + bw / 2, by + bnh + bh, bw / 2, Math.PI, 0, true);
    c.lineTo(bx + bw, by + bnh);
    c.closePath();
    c.fill();

    // Neck (tapers)
    c.beginPath();
    c.moveTo(-bnw / 2, by);
    c.lineTo(bx, by + bnh);
    c.lineTo(bx + bw, by + bnh);
    c.lineTo(bnw / 2, by);
    c.closePath();
    c.fill();

    // Neck top (rim)
    c.fillStyle = "#4a8a4a";
    c.fillRect(-bnw / 2, by - 4, bnw, 6);

    // Glass highlight on bottle
    c.fillStyle = "rgba(255,255,255,0.08)";
    c.fillRect(bx + 4, by + bnh, 6, bh);
    c.fillStyle = "rgba(255,255,255,0.04)";
    c.fillRect(bx + bw - 8, by + bnh, 4, bh);

    // Label on bottle
    c.fillStyle = "rgba(255,220,150,0.15)";
    c.fillRect(bx + 3, by + bnh + 25, bw - 6, 40);
    c.strokeStyle = "rgba(255,220,150,0.2)";
    c.lineWidth = 0.5;
    c.strokeRect(bx + 3, by + bnh + 25, bw - 6, 40);

    // Beer inside bottle (visible through glass)
    if (bottleAngle > 0.1) {
      c.fillStyle = "rgba(220,160,40,0.3)";
      const beerLvl = by + bnh + 20;
      c.fillRect(bx + 3, beerLvl, bw - 6, bh - 22);
    }

    c.restore();

    // === POUR STREAM (realistic golden beer stream) ===
    if (pouring && !stopped && bottleAngle > 0.15) {
      const pourStartX = bottlePivotX - Math.sin(bottleAngle) * (bh + bnh + 10);
      const pourStartY = bottlePivotY - Math.cos(bottleAngle) * (bh + bnh + 10) + 20;
      const liqY = glassBaseY - liquidLevel * liquidMaxH;
      const pourEndX = glassCX + Math.sin(t * 0.008) * 3;
      const pourEndY = Math.min(liqY, glassBaseY - 5);

      // Main stream
      for (let s = 0; s < 3; s++) {
        c.strokeStyle = s === 0 ? "rgba(220,160,40,0.7)" : s === 1 ? "rgba(240,190,60,0.4)" : "rgba(255,220,100,0.2)";
        c.lineWidth = s === 0 ? 5 : s === 1 ? 8 : 11;
        c.beginPath();
        const sx = pourStartX + s * 0.5;
        const wobble = Math.sin(t * 0.012 + s) * 4;
        c.moveTo(sx, pourStartY);
        c.bezierCurveTo(
          sx + wobble, pourStartY + (pourEndY - pourStartY) * 0.3,
          pourEndX - wobble * 0.5, pourStartY + (pourEndY - pourStartY) * 0.7,
          pourEndX, pourEndY
        );
        c.stroke();
      }

      // Splash droplets where stream hits liquid
      if (liquidLevel > 0.02) {
        c.fillStyle = "rgba(255,220,100,0.5)";
        for (let i = 0; i < 4; i++) {
          const dx = (Math.random() - 0.5) * 20;
          const dy = -Math.random() * 8;
          c.beginPath();
          c.arc(pourEndX + dx, pourEndY + dy, 1 + Math.random() * 1.5, 0, Math.PI * 2);
          c.fill();
        }
      }
    }

    // === GLASS (realistic pint glass shape) ===
    // Glass body - tapered shape with transparency
    c.beginPath();
    const tl = getGlassXat(glassTopY);
    const bl = getGlassXat(glassBaseY);
    c.moveTo(tl.left, glassTopY);
    // Left side (slight curve for realism)
    c.quadraticCurveTo(bl.left - 3, glassTopY + glassH * 0.6, bl.left, glassBaseY);
    // Bottom
    c.lineTo(bl.right, glassBaseY);
    // Right side
    c.quadraticCurveTo(tl.right + 3, glassTopY + glassH * 0.6, tl.right, glassTopY);
    c.closePath();

    // Glass fill (transparent with slight tint)
    c.fillStyle = "rgba(200,220,240,0.04)";
    c.fill();

    // === BEER LIQUID ===
    if (liquidLevel > 0) {
      const liqH = liquidLevel * liquidMaxH;
      const liqTopY = glassBaseY - liqH;
      const foamH = Math.min(25, liqH * 0.15 + (pouring ? 8 : 3));

      // Beer body
      c.save();
      c.beginPath();
      const lt = getGlassXat(liqTopY + foamH);
      const lb = getGlassXat(glassBaseY);
      c.moveTo(lt.left + glassThickness, liqTopY + foamH);
      c.lineTo(lb.left + glassThickness, glassBaseY - 3);
      c.lineTo(lb.right - glassThickness, glassBaseY - 3);
      c.lineTo(lt.right - glassThickness, liqTopY + foamH);
      c.closePath();

      // Golden beer gradient
      const beerGrad = c.createLinearGradient(0, liqTopY + foamH, 0, glassBaseY);
      beerGrad.addColorStop(0, "rgba(240,180,40,0.85)");
      beerGrad.addColorStop(0.3, "rgba(210,150,30,0.9)");
      beerGrad.addColorStop(0.6, "rgba(190,130,20,0.92)");
      beerGrad.addColorStop(1, "rgba(160,100,10,0.95)");
      c.fillStyle = beerGrad;
      c.fill();

      // Beer highlight (light reflection through glass)
      c.fillStyle = "rgba(255,230,150,0.08)";
      c.fillRect(lt.left + glassThickness + 5, liqTopY + foamH, 12, liqH - foamH - 5);

      c.restore();

      // === FOAM HEAD ===
      const foamTopY = liqTopY;
      const foamBotY = liqTopY + foamH;
      const ft = getGlassXat(foamTopY);
      const fb = getGlassXat(foamBotY);

      // Foam body (creamy white)
      c.save();
      c.beginPath();
      c.moveTo(ft.left + glassThickness, foamTopY);

      // Wavy foam top
      const foamLeftX = ft.left + glassThickness;
      const foamRightX = ft.right - glassThickness;
      const foamW = foamRightX - foamLeftX;
      c.moveTo(foamLeftX, foamTopY + 3);
      for (let x = 0; x <= foamW; x += 2) {
        const wave1 = Math.sin((x * 0.08) + t * 0.002) * 3;
        const wave2 = Math.sin((x * 0.15) + t * 0.003 + 1) * 2;
        c.lineTo(foamLeftX + x, foamTopY + wave1 + wave2);
      }
      c.lineTo(fb.right - glassThickness, foamBotY);
      c.lineTo(fb.left + glassThickness, foamBotY);
      c.closePath();

      const foamGrad = c.createLinearGradient(0, foamTopY, 0, foamBotY);
      foamGrad.addColorStop(0, "rgba(255,252,240,0.95)");
      foamGrad.addColorStop(0.3, "rgba(255,248,230,0.9)");
      foamGrad.addColorStop(0.7, "rgba(250,240,210,0.85)");
      foamGrad.addColorStop(1, "rgba(240,210,150,0.6)");
      c.fillStyle = foamGrad;
      c.fill();
      c.restore();

      // Foam bubble details on top
      c.fillStyle = "rgba(255,255,255,0.3)";
      for (let i = 0; i < 12; i++) {
        const bx = foamLeftX + 8 + (i / 12) * (foamW - 16);
        const by = foamTopY + Math.sin(i * 1.3 + t * 0.002) * 3 + 2;
        const br = 2 + Math.sin(i * 2.1) * 1.5;
        c.beginPath();
        c.arc(bx, by, br, 0, Math.PI * 2);
        c.fill();
      }

      // === BUBBLES rising in beer ===
      if (pouring) { for (let i = 0; i < 2; i++) spawnBubble(); }
      else if (Math.random() < 0.15) spawnBubble();

      bubbles.forEach(b => {
        b.y -= b.speed;
        b.x += Math.sin(b.wobble + t * 0.003) * 0.3;
        b.wobble += 0.02;

        if (b.y > b.topY + foamH) {
          c.fillStyle = `rgba(255,240,200,${0.3 + b.r * 0.1})`;
          c.beginPath();
          c.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          c.fill();
          // Tiny highlight on bubble
          c.fillStyle = "rgba(255,255,255,0.4)";
          c.beginPath();
          c.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
          c.fill();
        }
      });
      bubbles = bubbles.filter(b => b.y > liqTopY + foamH);
    }

    // === GLASS OUTLINE ===
    c.beginPath();
    const gtl = getGlassXat(glassTopY);
    const gbl = getGlassXat(glassBaseY);
    c.moveTo(gtl.left, glassTopY);
    c.quadraticCurveTo(gbl.left - 3, glassTopY + glassH * 0.6, gbl.left, glassBaseY);
    c.lineTo(gbl.right, glassBaseY);
    c.quadraticCurveTo(gtl.right + 3, glassTopY + glassH * 0.6, gtl.right, glassTopY);

    // Glass rim at top
    c.moveTo(gtl.left - 2, glassTopY);
    c.lineTo(gtl.right + 2, glassTopY);

    c.strokeStyle = "rgba(200,220,240,0.35)";
    c.lineWidth = glassThickness;
    c.stroke();

    // Glass highlight (left edge reflection)
    c.strokeStyle = "rgba(255,255,255,0.1)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(gtl.left + 6, glassTopY + 10);
    c.quadraticCurveTo(gbl.left + 3, glassTopY + glassH * 0.6, gbl.left + 6, glassBaseY - 10);
    c.stroke();

    // Glass highlight (right edge, subtler)
    c.strokeStyle = "rgba(255,255,255,0.05)";
    c.beginPath();
    c.moveTo(gtl.right - 8, glassTopY + 10);
    c.quadraticCurveTo(gbl.right - 5, glassTopY + glassH * 0.6, gbl.right - 8, glassBaseY - 10);
    c.stroke();

    // Glass base/foot
    c.fillStyle = "rgba(200,220,240,0.15)";
    c.beginPath();
    c.moveTo(gbl.left - 5, glassBaseY);
    c.lineTo(gbl.right + 5, glassBaseY);
    c.lineTo(gbl.right + 8, glassBaseY + 8);
    c.lineTo(gbl.left - 8, glassBaseY + 8);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(200,220,240,0.25)";
    c.lineWidth = 1.5;
    c.stroke();

    // Condensation droplets on glass
    c.fillStyle = "rgba(200,230,255,0.08)";
    for (let i = 0; i < 8; i++) {
      const dy = glassTopY + 60 + (i * 35) + Math.sin(i * 3.7) * 15;
      const g = getGlassXat(dy);
      const dx = i % 2 === 0 ? g.left + 3 + Math.sin(i) * 3 : g.right - 5 + Math.cos(i) * 3;
      c.beginPath();
      c.ellipse(dx, dy, 1.5, 2.5, 0, 0, Math.PI * 2);
      c.fill();
    }

    // === TARGET LINE ===
    const targetY = glassBaseY - (targetLevel * liquidMaxH);
    const tg = getGlassXat(targetY);
    c.setLineDash([6, 5]);
    c.strokeStyle = "rgba(255,68,68,0.8)";
    c.lineWidth = 2;
    c.shadowColor = "#ff4444";
    c.shadowBlur = 6;
    c.beginPath();
    c.moveTo(tg.left - 20, targetY);
    c.lineTo(tg.right + 20, targetY);
    c.stroke();
    c.setLineDash([]);
    c.shadowBlur = 0;

    // Target arrow markers
    c.fillStyle = "#ff4444";
    c.font = "bold 11px Orbitron, monospace";
    c.textAlign = "right";
    c.fillText("TARGET", tg.left - 24, targetY + 4);
    // Arrow
    c.beginPath();
    c.moveTo(tg.left - 18, targetY);
    c.lineTo(tg.left - 12, targetY - 4);
    c.lineTo(tg.left - 12, targetY + 4);
    c.closePath();
    c.fill();

    // === PERCENTAGE ===
    c.font = "bold 18px Orbitron, monospace";
    c.fillStyle = "rgba(240,180,40,0.9)";
    c.textAlign = "center";
    c.shadowColor = "rgba(240,180,40,0.3)";
    c.shadowBlur = 8;
    c.fillText(Math.round(liquidLevel * 100) + "%", W / 2, glassBaseY + 35);
    c.shadowBlur = 0;

    // Round indicator
    c.font = "12px Rajdhani, sans-serif";
    c.fillStyle = "rgba(200,200,200,0.3)";
    c.fillText("ROUND " + round + " / 10", W / 2, glassBaseY + 55);
  }

  function pourLoop() {
    if (!pouring || stopped) return;
    liquidLevel += fillSpeed * 0.003;
    if (liquidLevel >= 1.0) {
      liquidLevel = 1.0;
      stopPour(true);
      return;
    }
    draw();
    window._gameRAF = requestAnimationFrame(pourLoop);
  }

  function stopPour(overflow) {
    pouring = false;
    stopped = true;
    btn.disabled = true;

    const diff = Math.abs(liquidLevel - targetLevel);
    const pct = Math.round(diff * 100);
    let feedback = "", pts = 0, color = "";

    if (overflow) {
      feedback = "OVERFLOW!"; pts = 0; color = "#ff3333";
    } else if (pct <= 2) {
      feedback = "PERFECT!"; pts = 5; color = "#ffd700";
    } else if (pct <= 5) {
      feedback = "GREAT!"; pts = 3; color = "#00ff88";
    } else if (pct <= 10) {
      feedback = "CLOSE!"; pts = 2; color = "#00f0ff";
    } else if (pct <= 20) {
      feedback = "OK"; pts = 1; color = "#b44aff";
    } else {
      feedback = "MISS!"; pts = 0; color = "#ff3333";
    }

    score += pts;
    document.getElementById("pourScore").textContent = score;
    const fb = document.getElementById("pourFeedback");
    fb.textContent = feedback + (pts > 0 ? " +" + pts : "");
    fb.style.color = color;
    fb.style.textShadow = `0 0 10px ${color}`;
    if (pts > 0 && typeof NexusAudio !== 'undefined') NexusAudio.sfxCorrect();
    else if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();

    draw();

    window._gameTimeout = setTimeout(() => {
      if (!overlay.classList.contains("active")) return;
      round++;
      if (round > 10) {
        const res = endGame("pour", score);
        showGameOver("pour", res, score >= 25);
      } else {
        document.getElementById("pourRound").textContent = round;
        newRound();
      }
    }, 1200);
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (stopped) return;
    if (!pouring) {
      pouring = true;
      btn.textContent = "STOP";
      pourLoop();
    } else {
      stopPour(false);
    }
  });

  document.addEventListener("keydown", function pourKey(e) {
    if (!overlay.classList.contains("active")) { document.removeEventListener("keydown", pourKey); return; }
    if (e.key === " ") { e.preventDefault(); btn.click(); }
  });

  newRound();
}

// ═══════════════════════════════════════
// GAME: DRUNK TRIVIA (DOM-based with blur effects)
// ═══════════════════════════════════════
function initTrivia() {
  const questions = [
    {q:"What planet is closest to the Sun?", opts:["Venus","Mercury","Mars","Earth"], ans:1},
    {q:"How many hearts does an octopus have?", opts:["2","1","3","4"], ans:2},
    {q:"What is the hardest natural substance?", opts:["Gold","Iron","Diamond","Titanium"], ans:2},
    {q:"Which country invented pizza?", opts:["France","Italy","Greece","Spain"], ans:1},
    {q:"How many bones are in the human body?", opts:["206","208","196","212"], ans:0},
    {q:"What is the largest ocean?", opts:["Atlantic","Indian","Pacific","Arctic"], ans:2},
    {q:"Who painted the Mona Lisa?", opts:["Picasso","Da Vinci","Van Gogh","Monet"], ans:1},
    {q:"What gas do plants breathe in?", opts:["Oxygen","Nitrogen","CO2","Helium"], ans:2},
    {q:"How many legs does a spider have?", opts:["6","8","10","12"], ans:1},
    {q:"What is the fastest land animal?", opts:["Lion","Cheetah","Horse","Leopard"], ans:1},
    {q:"Which element has symbol 'O'?", opts:["Gold","Osmium","Oxygen","Oganesson"], ans:2},
    {q:"What year did the Titanic sink?", opts:["1905","1912","1920","1898"], ans:1},
    {q:"How many continents are there?", opts:["5","6","7","8"], ans:2},
    {q:"What is the smallest country?", opts:["Monaco","Vatican","Nauru","Malta"], ans:1},
    {q:"Which planet has the most moons?", opts:["Jupiter","Saturn","Uranus","Neptune"], ans:1},
    {q:"What color is a ruby?", opts:["Blue","Green","Red","Purple"], ans:2},
    {q:"How many strings on a guitar?", opts:["4","5","6","8"], ans:2},
    {q:"What animal is the tallest?", opts:["Elephant","Giraffe","Moose","Camel"], ans:1},
    {q:"What is H2O commonly known as?", opts:["Salt","Sugar","Water","Air"], ans:2},
    {q:"Which fruit has its seeds outside?", opts:["Apple","Kiwi","Strawberry","Grape"], ans:2},
    {q:"What is the capital of Japan?", opts:["Seoul","Tokyo","Beijing","Bangkok"], ans:1},
    {q:"How many sides does a hexagon have?", opts:["5","6","7","8"], ans:1},
    {q:"What color are flamingos born?", opts:["Pink","White","Grey","Orange"], ans:2},
    {q:"What is the largest mammal?", opts:["Elephant","Blue whale","Giraffe","Hippo"], ans:1},
    {q:"Which planet is known as the Red Planet?", opts:["Venus","Mars","Jupiter","Mercury"], ans:1},
    {q:"How many players on a soccer team?", opts:["9","10","11","12"], ans:2},
    {q:"What is the boiling point of water?", opts:["90°C","95°C","100°C","110°C"], ans:2},
    {q:"Who wrote Romeo and Juliet?", opts:["Dickens","Shakespeare","Austen","Twain"], ans:1},
    {q:"What shape is a stop sign?", opts:["Circle","Square","Octagon","Triangle"], ans:2},
    {q:"How many zeros in a million?", opts:["5","6","7","8"], ans:1},
  ];

  const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 12);
  let current = 0, score = 0, answered = false;
  let timerInterval = null, timeLeft = 10;

  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>SCORE: <b id="triviaScore">0</b></span>
      <span>ROUND: <b id="triviaRound">1</b> / 12</span>
      <span>DRUNK: <b id="triviaDrunk">SOBER</b></span>
    </div>
    <div class="trivia-timer"><div class="trivia-timer-fill" id="triviaTimer"></div></div>
    <div class="trivia-container" id="triviaContainer">
      <div class="trivia-question" id="triviaQ"></div>
      <div class="trivia-options" id="triviaOpts"></div>
    </div>
  `;

  function getDrunkLevel() {
    if (current < 3) return 0;
    if (current < 5) return 1;
    if (current < 7) return 2;
    if (current < 9) return 3;
    return 4;
  }

  function applyDrunkEffect() {
    const container = document.getElementById("triviaContainer");
    if (!container) return;
    const level = getDrunkLevel();
    const drunkLabels = ["SOBER","TIPSY","DRUNK","WASTED","BLACKED OUT"];
    const drunkEl = document.getElementById("triviaDrunk");
    if (drunkEl) { drunkEl.textContent = drunkLabels[level]; drunkEl.style.color = ["#00ff88","#ffd700","#ff6b35","#ff3333","#b44aff"][level]; }

    switch (level) {
      case 0: container.style.cssText = ""; break;
      case 1: container.style.cssText = "filter: blur(0.5px); transform: rotate(0.5deg);"; break;
      case 2: container.style.cssText = "filter: blur(1.5px) hue-rotate(10deg); transform: rotate(1deg) skewX(1deg);"; break;
      case 3: container.style.cssText = "filter: blur(2.5px) hue-rotate(20deg); animation: drunkWobble 1s ease-in-out infinite;"; break;
      case 4: container.style.cssText = "filter: blur(3.5px) hue-rotate(40deg); animation: drunkWobble 0.5s ease-in-out infinite;"; break;
    }
  }

  function showQuestion() {
    answered = false;
    timeLeft = Math.max(6, 10 - Math.floor(current / 3));
    const q = shuffled[current];
    document.getElementById("triviaQ").textContent = q.q;
    document.getElementById("triviaRound").textContent = current + 1;
    const optsEl = document.getElementById("triviaOpts");
    optsEl.innerHTML = "";
    q.opts.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "trivia-option";
      btn.textContent = opt;
      btn.addEventListener("click", (e) => { e.stopPropagation(); answer(i); });
      optsEl.appendChild(btn);
    });

    applyDrunkEffect();
    startTimer();
  }

  function startTimer() {
    clearInterval(timerInterval);
    const bar = document.getElementById("triviaTimer");
    const total = timeLeft;
    bar.style.width = "100%";
    timerInterval = setInterval(() => {
      timeLeft -= 0.05;
      bar.style.width = Math.max(0, (timeLeft / total) * 100) + "%";
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        if (!answered) answer(-1);
      }
    }, 50);
    window._gameInterval = timerInterval;
  }

  function answer(idx) {
    if (answered) return;
    answered = true;
    clearInterval(timerInterval);
    const q = shuffled[current];
    const btns = document.querySelectorAll(".trivia-option");
    btns.forEach((b, i) => {
      b.disabled = true;
      if (i === q.ans) b.classList.add("correct");
      if (i === idx && idx !== q.ans) b.classList.add("wrong");
    });

    if (idx === q.ans) {
      score++;
      document.getElementById("triviaScore").textContent = score;
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxCorrect();
    } else {
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();
    }

    window._gameTimeout = setTimeout(() => {
      if (!overlay.classList.contains("active")) return;
      current++;
      if (current >= shuffled.length) {
        const res = endGame("trivia", score);
        showGameOver("trivia", res, score >= 8);
      } else {
        showQuestion();
      }
    }, 1000);
  }

  showQuestion();
  setTimeout(setupCursorHovers, 50);
}

// ═══════════════════════════════════════
// GAME: CYBER WHEEL (Spin wheel with dares)
// ═══════════════════════════════════════
function initSpinWheel() {
  const segments = [
    { label: "TAKE A SIP", color: "#00f0ff", points: 1 },
    { label: "DARE", color: "#b44aff", points: 3 },
    { label: "TRUTH", color: "#ffd700", points: 2 },
    { label: "GIVE A SIP", color: "#00ff88", points: 1 },
    { label: "SAFE!", color: "#1a1a3a", points: 0 },
    { label: "DOUBLE DARE", color: "#ff2d78", points: 5 },
    { label: "TAKE A SIP", color: "#00f0ff", points: 1 },
    { label: "DARE", color: "#ff6b35", points: 3 },
  ];

  const dares = [
    "Do your best impression of a celebrity for 30 seconds",
    "Let someone else post something on your social media",
    "Show the last photo on your phone",
    "Talk in an accent for the next 2 rounds",
    "Do 10 pushups right now",
    "Say something embarrassing about yourself",
    "Let the group go through your recent messages",
    "Do a silly dance for 15 seconds",
    "Call a friend and sing them Happy Birthday",
    "Speak in third person for the next 3 rounds",
    "Try to lick your elbow",
    "Let someone draw on your face with a marker",
    "Act like a cat for 1 minute",
    "Do your best robot impression",
    "Tell your worst joke ever",
  ];
  const truths = [
    "What's the most embarrassing thing you've googled?",
    "What's the last lie you told?",
    "What's your most irrational fear?",
    "What's the worst date you've been on?",
    "What's the most childish thing you still do?",
    "If you could swap lives with someone here, who?",
    "What's your guilty pleasure TV show?",
    "What's the weirdest dream you've had?",
    "What's the dumbest thing you've done while drunk?",
    "What's the longest you've gone without showering?",
  ];

  let score = 0, spinsLeft = 8, spinning = false;
  let currentAngle = 0;

  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>DARE LEVEL: <b id="wheelScore">0</b></span>
      <span>SPINS LEFT: <b id="wheelSpins">8</b></span>
    </div>
    <div class="wheel-wrapper">
      <div class="wheel-pointer">&#9660;</div>
      <div class="wheel-container" id="wheelContainer">
        <canvas id="wheelCanvas" width="300" height="300"></canvas>
      </div>
      <button class="game-btn wheel-spin-btn" id="wheelSpinBtn">SPIN!</button>
    </div>
    <div class="wheel-result" id="wheelResult"></div>
  `;

  const cvs = document.getElementById("wheelCanvas");
  const c = cvs.getContext("2d");
  const segAngle = (Math.PI * 2) / segments.length;

  function drawWheel(rotation) {
    c.clearRect(0, 0, 300, 300);
    const cx = 150, cy = 150, r = 140;

    segments.forEach((seg, i) => {
      const startA = i * segAngle + rotation;
      const endA = startA + segAngle;

      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, r, startA, endA);
      c.closePath();
      c.fillStyle = seg.color;
      c.fill();
      c.strokeStyle = "rgba(255,255,255,0.2)";
      c.lineWidth = 2;
      c.stroke();

      // Label
      c.save();
      c.translate(cx, cy);
      c.rotate(startA + segAngle / 2);
      c.textAlign = "center";
      c.fillStyle = seg.color === "#1a1a3a" ? "#00ff88" : "#fff";
      c.font = "bold 11px Orbitron, monospace";
      c.fillText(seg.label, r * 0.6, 4);
      c.restore();
    });

    // Center circle
    c.beginPath();
    c.arc(cx, cy, 20, 0, Math.PI * 2);
    c.fillStyle = "#0a0a15";
    c.fill();
    c.strokeStyle = "#00f0ff";
    c.lineWidth = 2;
    c.stroke();

    // Outer ring glow
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.strokeStyle = "rgba(0,240,255,0.3)";
    c.lineWidth = 3;
    c.shadowColor = "#00f0ff";
    c.shadowBlur = 15;
    c.stroke();
    c.shadowBlur = 0;
  }

  drawWheel(0);

  document.getElementById("wheelSpinBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    if (spinning || spinsLeft <= 0) return;
    spinning = true;
    spinsLeft--;
    document.getElementById("wheelSpins").textContent = spinsLeft;
    document.getElementById("wheelResult").textContent = "";

    const totalRotation = (5 + Math.random() * 5) * Math.PI * 2;
    const duration = 3500;
    const startTime = Date.now();
    const startAngle = currentAngle;

    function animSpin() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      currentAngle = startAngle + totalRotation * eased;
      drawWheel(currentAngle);

      if (progress < 1) {
        window._gameRAF = requestAnimationFrame(animSpin);
      } else {
        // Determine winner
        const normalizedAngle = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        // Pointer is at top (3π/2 or -π/2)
        const pointerAngle = (Math.PI * 2 - normalizedAngle + Math.PI * 1.5) % (Math.PI * 2);
        const segIdx = Math.floor(pointerAngle / segAngle) % segments.length;
        const result = segments[segIdx];

        score += result.points;
        document.getElementById("wheelScore").textContent = score;

        let resultText = result.label;
        if (result.label === "DARE" || result.label === "DOUBLE DARE") {
          resultText += ": " + dares[Math.floor(Math.random() * dares.length)];
        } else if (result.label === "TRUTH") {
          resultText += ": " + truths[Math.floor(Math.random() * truths.length)];
        }

        const resultEl = document.getElementById("wheelResult");
        resultEl.textContent = resultText;
        resultEl.style.color = result.color;

        if (typeof NexusAudio !== 'undefined') NexusAudio.sfxHit();

        spinning = false;

        if (spinsLeft <= 0) {
          window._gameTimeout = setTimeout(() => {
            if (!overlay.classList.contains("active")) return;
            const res = endGame("spinwheel", score);
            showGameOver("spinwheel", res, score >= 15);
          }, 2500);
        }
      }
    }
    animSpin();
  });

  setTimeout(setupCursorHovers, 50);
}

// ═══════════════════════════════════════
// GAME: TIPSY TOWER (Canvas block-pulling Jenga)
// ═══════════════════════════════════════
function initTipsy() {
  const W = 400, H = 550;
  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>PULLED: <b id="tipsyScore">0</b></span>
      <span>WOBBLE: <b id="tipsyWobble">STABLE</b></span>
    </div>
    <canvas id="tipsyCanvas" width="${W}" height="${H}"></canvas>
  `;

  const cvs = document.getElementById("tipsyCanvas");
  const c = cvs.getContext("2d");
  const ROWS = 10, COLS = 3;
  const blockW = 80, blockH = 28, gap = 2;
  const towerX = (W - COLS * (blockW + gap)) / 2;
  const towerBaseY = H - 60;

  const neonColors = ["#00f0ff","#b44aff","#00ff88","#ffd700","#ff6b35","#ff2d78"];
  let blocks = [];
  let pulled = 0, wobble = 0, alive = true;
  let hoverBlock = null;
  let pullAnim = null; // {block, startX, progress}

  // Build tower
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      blocks.push({
        row, col,
        x: towerX + col * (blockW + gap),
        y: towerBaseY - (row + 1) * (blockH + gap),
        w: blockW, h: blockH,
        color: neonColors[(row * COLS + col) % neonColors.length],
        pulled: false,
        sliding: false, slideX: 0
      });
    }
  }

  function getWobbleLabel() {
    if (wobble < 2) return "STABLE";
    if (wobble < 5) return "SHAKY";
    if (wobble < 8) return "TIPSY";
    return "CRITICAL!";
  }

  function draw() {
    c.clearRect(0, 0, W, H);
    c.fillStyle = "#08080f";
    c.fillRect(0, 0, W, H);

    // Ground
    c.fillStyle = "rgba(0,240,255,0.05)";
    c.fillRect(0, towerBaseY, W, H - towerBaseY);
    c.strokeStyle = "rgba(0,240,255,0.2)";
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, towerBaseY); c.lineTo(W, towerBaseY); c.stroke();

    const time = Date.now() * 0.003;
    const wobbleOffset = wobble > 0 ? Math.sin(time * (1 + wobble * 0.3)) * wobble * 0.8 : 0;

    // Draw blocks
    blocks.forEach(b => {
      if (b.pulled) return;
      const wx = b.x + wobbleOffset * (ROWS - b.row) * 0.15;
      const bx = b.sliding ? b.x + b.slideX : wx;

      c.shadowColor = b.color;
      c.shadowBlur = hoverBlock === b ? 15 : 5;
      c.fillStyle = hoverBlock === b ? b.color : b.color + "cc";
      c.fillRect(bx, b.y, b.w, b.h);

      // Edge highlight
      c.fillStyle = "rgba(255,255,255,0.15)";
      c.fillRect(bx, b.y, b.w, 3);

      c.shadowBlur = 0;

      // Border
      c.strokeStyle = hoverBlock === b ? "#fff" : "rgba(255,255,255,0.1)";
      c.lineWidth = hoverBlock === b ? 2 : 1;
      c.strokeRect(bx, b.y, b.w, b.h);
    });
  }

  function checkCollapse() {
    // Higher pull count + edge blocks = more risk
    const baseChance = 0.03 * pulled * pulled;
    const rand = Math.random();
    return rand < baseChance;
  }

  function collapse() {
    alive = false;
    if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();

    // Scatter animation
    let frame = 0;
    blocks.forEach(b => {
      if (!b.pulled) {
        b.vx = (Math.random() - 0.5) * 8;
        b.vy = -Math.random() * 6;
        b.vr = (Math.random() - 0.5) * 0.2;
        b.rot = 0;
      }
    });

    function collapseAnim() {
      c.clearRect(0, 0, W, H);
      c.fillStyle = "#08080f";
      c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(0,240,255,0.05)";
      c.fillRect(0, towerBaseY, W, H - towerBaseY);

      blocks.forEach(b => {
        if (b.pulled) return;
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.5;
        b.rot += b.vr;
        c.save();
        c.translate(b.x + b.w / 2, b.y + b.h / 2);
        c.rotate(b.rot);
        c.fillStyle = b.color + "88";
        c.shadowColor = b.color;
        c.shadowBlur = 8;
        c.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        c.shadowBlur = 0;
        c.restore();
      });
      frame++;
      if (frame < 60) {
        window._gameRAF = requestAnimationFrame(collapseAnim);
      } else {
        const res = endGame("tipsy", pulled);
        showGameOver("tipsy", res, pulled >= 10);
      }
    }
    collapseAnim();
  }

  function pullBlock(b) {
    if (!alive || b.pulled) return;
    b.pulled = true;
    pulled++;
    wobble += 0.8 + Math.random() * 0.5;

    document.getElementById("tipsyScore").textContent = pulled;
    const wLabel = getWobbleLabel();
    const wEl = document.getElementById("tipsyWobble");
    wEl.textContent = wLabel;
    wEl.style.color = wobble < 2 ? "#00ff88" : wobble < 5 ? "#ffd700" : wobble < 8 ? "#ff6b35" : "#ff3333";

    if (typeof NexusAudio !== 'undefined') NexusAudio.sfxClick();

    // Check if all blocks pulled (win) or collapse
    const remaining = blocks.filter(b => !b.pulled).length;
    if (remaining <= 0) {
      const res = endGame("tipsy", pulled);
      showGameOver("tipsy", res, true);
      return;
    }

    if (checkCollapse()) {
      window._gameTimeout = setTimeout(() => { if (overlay.classList.contains("active")) collapse(); }, 300);
    } else {
      draw();
    }
  }

  cvs.addEventListener("mousemove", (e) => {
    if (!alive) return;
    const rect = cvs.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    hoverBlock = null;
    for (const b of blocks) {
      if (b.pulled) continue;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        hoverBlock = b;
        break;
      }
    }
    draw();
  });

  cvs.addEventListener("click", (e) => {
    e.stopPropagation();
    if (hoverBlock && alive) pullBlock(hoverBlock);
  });

  // Touch support for mobile
  cvs.addEventListener("touchstart", (e) => {
    e.stopPropagation();
    const t = e.touches[0]; if (!t || !alive) return;
    const rect = cvs.getBoundingClientRect();
    const mx = (t.clientX - rect.left) * (W / rect.width);
    const my = (t.clientY - rect.top) * (H / rect.height);
    for (const b of blocks) {
      if (b.pulled) continue;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        hoverBlock = b;
        pullBlock(b);
        break;
      }
    }
  }, { passive: false });
  cvs.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const t = e.touches[0]; if (!t || !alive) return;
    const rect = cvs.getBoundingClientRect();
    const mx = (t.clientX - rect.left) * (W / rect.width);
    const my = (t.clientY - rect.top) * (H / rect.height);
    hoverBlock = null;
    for (const b of blocks) {
      if (b.pulled) continue;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        hoverBlock = b;
        break;
      }
    }
    draw();
  }, { passive: false });

  draw();
}

// ═══════════════════════════════════════
// GAME: BEER PONG (Canvas projectile physics)
// ═══════════════════════════════════════
function initBeerPong() {
  gameContainer.innerHTML = `
    <div class="snake3d-hud">
      <div class="snake3d-hud-item">CUPS <span id="bpCups">0</span> / 6</div>
      <div class="snake3d-hud-item">THROWS <span id="bpThrows">10</span></div>
      <div class="snake3d-hud-item">SCORE <span id="bpScore">0</span></div>
    </div>
    <canvas id="bpCanvas"></canvas>
  `;

  const cvs = document.getElementById("bpCanvas");
  const c = cvs.getContext("2d");
  function resize() {
    if (!cvs.parentElement) return;
    cvs.width = cvs.parentElement.offsetWidth;
    cvs.height = cvs.parentElement.offsetHeight;
  }
  resize();
  function bpResizeHandler() { resize(); cups = getCups(); }
  window.addEventListener("resize", bpResizeHandler);
  // Clean up resize listener when game closes
  const bpCleanupObserver = new MutationObserver(() => {
    if (!overlay.classList.contains("active")) {
      window.removeEventListener("resize", bpResizeHandler);
      bpCleanupObserver.disconnect();
    }
  });
  bpCleanupObserver.observe(overlay, { attributes: true, attributeFilter: ["class"] });

  let throwsLeft = 10, cupsSunk = 0, score = 0;
  let aimX = cvs.width / 2, aimY = cvs.height * 0.8;
  let ball = null; // {x, y, vx, vy, active}
  let power = 0, charging = false;
  let particles = [];

  // Cup positions (triangle formation at top)
  const cupR = 22;
  function getCups() {
    const cx = cvs.width / 2;
    const topY = cvs.height * 0.15;
    const rowGap = cupR * 2.2;
    const colGap = cupR * 2.4;
    return [
      // Row 1 (3 cups)
      { x: cx - colGap, y: topY, alive: true },
      { x: cx, y: topY, alive: true },
      { x: cx + colGap, y: topY, alive: true },
      // Row 2 (2 cups)
      { x: cx - colGap / 2, y: topY + rowGap, alive: true },
      { x: cx + colGap / 2, y: topY + rowGap, alive: true },
      // Row 3 (1 cup)
      { x: cx, y: topY + rowGap * 2, alive: true },
    ];
  }

  let cups = getCups();

  cvs.addEventListener("mousemove", (e) => {
    const rect = cvs.getBoundingClientRect();
    aimX = e.clientX - rect.left;
    aimY = e.clientY - rect.top;
  });

  cvs.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    if (ball && ball.active) return;
    if (throwsLeft <= 0) return;
    charging = true;
    power = 0;
  });

  cvs.addEventListener("mouseup", (e) => {
    e.stopPropagation();
    if (!charging) return;
    charging = false;
    if (throwsLeft <= 0) return;
    throwsLeft--;
    document.getElementById("bpThrows").textContent = throwsLeft;
    launchBall();
  });

  function launchBall() {
    const startX = cvs.width / 2;
    const startY = cvs.height * 0.85;
    const dx = aimX - startX;
    const dy = aimY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = Math.min(power * 0.15 + 5, 18);
    ball = {
      x: startX, y: startY,
      vx: (dx / dist) * speed * 0.6,
      vy: (dy / dist) * speed - 4,
      active: true,
      radius: 8
    };
  }

  // Touch support for mobile Beer Pong
  cvs.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const t = e.touches[0]; if (!t) return;
    const rect = cvs.getBoundingClientRect();
    aimX = t.clientX - rect.left;
    aimY = t.clientY - rect.top;
  }, { passive: false });
  cvs.addEventListener("touchstart", (e) => {
    e.stopPropagation();
    const t = e.touches[0]; if (!t) return;
    const rect = cvs.getBoundingClientRect();
    aimX = t.clientX - rect.left;
    aimY = t.clientY - rect.top;
    if (ball && ball.active) return;
    if (throwsLeft <= 0) return;
    charging = true;
    power = 0;
  }, { passive: false });
  cvs.addEventListener("touchend", (e) => {
    e.stopPropagation();
    if (!charging) return;
    charging = false;
    if (throwsLeft <= 0) return;
    throwsLeft--;
    document.getElementById("bpThrows").textContent = throwsLeft;
    launchBall();
  });

  function addSplash(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 3;
      particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s - 2, life: 1, decay: 0.03, size: 2+Math.random()*3, color });
    }
  }

  function gameLoop() {
    if (!overlay.classList.contains("active")) return;
    c.clearRect(0, 0, cvs.width, cvs.height);

    // Table background
    const bg = c.createLinearGradient(0, 0, 0, cvs.height);
    bg.addColorStop(0, "#0a0a15");
    bg.addColorStop(1, "#0d0d1a");
    c.fillStyle = bg;
    c.fillRect(0, 0, cvs.width, cvs.height);

    // Table surface grid
    c.strokeStyle = "rgba(0,240,255,0.03)";
    c.lineWidth = 1;
    for (let i = 0; i < cvs.width; i += 50) { c.beginPath(); c.moveTo(i,0); c.lineTo(i,cvs.height); c.stroke(); }
    for (let i = 0; i < cvs.height; i += 50) { c.beginPath(); c.moveTo(0,i); c.lineTo(cvs.width,i); c.stroke(); }

    // Center line
    c.strokeStyle = "rgba(0,240,255,0.08)";
    c.lineWidth = 2;
    c.setLineDash([10, 10]);
    c.beginPath(); c.moveTo(0, cvs.height * 0.5); c.lineTo(cvs.width, cvs.height * 0.5); c.stroke();
    c.setLineDash([]);

    // Draw cups
    cups.forEach(cup => {
      if (!cup.alive) return;
      // Cup glow
      c.shadowColor = "#b44aff";
      c.shadowBlur = 15;
      // Cup body
      const cg = c.createRadialGradient(cup.x, cup.y, 0, cup.x, cup.y, cupR);
      cg.addColorStop(0, "rgba(180,74,255,0.4)");
      cg.addColorStop(0.7, "rgba(180,74,255,0.2)");
      cg.addColorStop(1, "rgba(180,74,255,0.05)");
      c.fillStyle = cg;
      c.beginPath(); c.arc(cup.x, cup.y, cupR, 0, Math.PI * 2); c.fill();
      // Cup rim
      c.strokeStyle = "#b44aff";
      c.lineWidth = 2.5;
      c.beginPath(); c.arc(cup.x, cup.y, cupR, 0, Math.PI * 2); c.stroke();
      // Inner rim
      c.strokeStyle = "rgba(180,74,255,0.4)";
      c.lineWidth = 1;
      c.beginPath(); c.arc(cup.x, cup.y, cupR * 0.6, 0, Math.PI * 2); c.stroke();
      c.shadowBlur = 0;
    });

    // Power bar while charging
    if (charging) {
      power = Math.min(power + 1.5, 100);
      const barW = 200, barH = 12;
      const barX = cvs.width / 2 - barW / 2;
      const barY = cvs.height * 0.92;
      c.fillStyle = "rgba(10,10,20,0.8)";
      c.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
      const pg = c.createLinearGradient(barX, 0, barX + barW, 0);
      pg.addColorStop(0, "#00f0ff");
      pg.addColorStop(0.5, "#b44aff");
      pg.addColorStop(1, "#ff2d78");
      c.fillStyle = pg;
      c.fillRect(barX, barY, barW * (power / 100), barH);
      c.strokeStyle = "rgba(0,240,255,0.3)";
      c.strokeRect(barX, barY, barW, barH);

      c.font = "bold 11px Orbitron, monospace";
      c.fillStyle = "#00f0ff";
      c.textAlign = "center";
      c.fillText("POWER: " + Math.round(power) + "%", cvs.width / 2, barY - 6);
    }

    // Aim crosshair
    if (!ball || !ball.active) {
      c.strokeStyle = "rgba(0,240,255,0.4)";
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(aimX - 15, aimY); c.lineTo(aimX + 15, aimY); c.stroke();
      c.beginPath(); c.moveTo(aimX, aimY - 15); c.lineTo(aimX, aimY + 15); c.stroke();
      c.beginPath(); c.arc(aimX, aimY, 10, 0, Math.PI * 2); c.stroke();

      // Trajectory preview
      if (charging || power > 0) {
        const startX = cvs.width / 2, startY = cvs.height * 0.85;
        const dx = aimX - startX, dy = aimY - startY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const speed = Math.min(power * 0.15 + 5, 18);
        let pvx = (dx/dist)*speed*0.6, pvy = (dy/dist)*speed - 4;
        let px = startX, py = startY;
        c.setLineDash([4, 6]);
        c.strokeStyle = "rgba(0,240,255,0.2)";
        c.beginPath(); c.moveTo(px, py);
        for (let i = 0; i < 25; i++) {
          px += pvx; py += pvy; pvy += 0.25;
          c.lineTo(px, py);
        }
        c.stroke();
        c.setLineDash([]);
      }
    }

    // Ball physics
    if (ball && ball.active) {
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vy += 0.25; // gravity

      // Trail
      c.globalAlpha = 0.3;
      c.fillStyle = "#00f0ff";
      c.beginPath(); c.arc(ball.x - ball.vx * 2, ball.y - ball.vy * 2, ball.radius * 0.6, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;

      // Ball
      c.shadowColor = "#00f0ff";
      c.shadowBlur = 15;
      const bg = c.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
      bg.addColorStop(0, "#fff");
      bg.addColorStop(0.5, "#00f0ff");
      bg.addColorStop(1, "rgba(0,240,255,0.3)");
      c.fillStyle = bg;
      c.beginPath(); c.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); c.fill();
      c.shadowBlur = 0;

      // Check cup collision
      for (const cup of cups) {
        if (!cup.alive) continue;
        const dx = ball.x - cup.x, dy = ball.y - cup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < cupR + ball.radius * 0.5) {
          cup.alive = false;
          cupsSunk++;
          score += 10;
          document.getElementById("bpCups").textContent = cupsSunk;
          document.getElementById("bpScore").textContent = score;
          addSplash(cup.x, cup.y, "#b44aff", 20);
          addSplash(cup.x, cup.y, "#00f0ff", 10);
          if (typeof NexusAudio !== 'undefined') NexusAudio.sfxEat();
          ball.active = false;
          break;
        }
      }

      // Ball out of bounds
      if (ball.y > cvs.height + 50 || ball.x < -50 || ball.x > cvs.width + 50) {
        ball.active = false;
      }

      // Check end
      if (!ball.active) {
        const allSunk = cups.every(c => !c.alive);
        if (allSunk || throwsLeft <= 0) {
          window._gameTimeout = setTimeout(() => {
            if (!overlay.classList.contains("active")) return;
            const res = endGame("beerpong", score);
            showGameOver("beerpong", res, cupsSunk >= 4);
          }, 1000);
        }
      }
    }

    // Particles
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= p.decay;
      if (p.life > 0) {
        c.globalAlpha = p.life;
        c.fillStyle = p.color;
        c.shadowColor = p.color; c.shadowBlur = 6;
        c.beginPath(); c.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); c.fill();
        c.shadowBlur = 0;
        c.globalAlpha = 1;
      }
    });
    particles = particles.filter(p => p.life > 0);

    window._gameRAF = requestAnimationFrame(gameLoop);
  }

  window._gameRAF = requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════
// GAME: NEVER HAVE I EVER (DOM party game)
// ═══════════════════════════════════════
function initNeverHave() {
  const statements = [
    { text: "Texted an ex at 2 AM", wild: 1 },
    { text: "Pretended to be on the phone to avoid someone", wild: 1 },
    { text: "Lied on my resume", wild: 2 },
    { text: "Stalked someone's Instagram back to 2015", wild: 1 },
    { text: "Been kicked out of a bar", wild: 3 },
    { text: "Sent a text to the wrong person and panicked", wild: 1 },
    { text: "Cried during a movie in public", wild: 1 },
    { text: "Eaten food off the floor", wild: 1 },
    { text: "Ghosted someone", wild: 2 },
    { text: "Called a teacher 'Mom' or 'Dad'", wild: 1 },
    { text: "Faked being sick to skip work/school", wild: 1 },
    { text: "Had a crush on a cartoon character", wild: 1 },
    { text: "Googled my own name", wild: 1 },
    { text: "Tripped in public and pretended nothing happened", wild: 1 },
    { text: "Peed in a pool", wild: 2 },
    { text: "Accidentally liked an old photo while stalking", wild: 2 },
    { text: "Said 'you too' when a waiter said 'enjoy your meal'", wild: 1 },
    { text: "Worn the same outfit two days in a row", wild: 1 },
    { text: "Laughed at something that wasn't funny to be polite", wild: 1 },
    { text: "Pretended to know a song everyone was singing", wild: 1 },
    { text: "Broken something and blamed someone else", wild: 2 },
    { text: "Walked into a glass door", wild: 1 },
    { text: "Drunk-texted my boss", wild: 3 },
    { text: "Fallen asleep during a meeting or class", wild: 1 },
    { text: "Regifted a present", wild: 2 },
    { text: "Binged an entire TV show in one day", wild: 1 },
    { text: "Waved back at someone who wasn't waving at me", wild: 1 },
    { text: "Creeped on someone's profile for over an hour", wild: 2 },
    { text: "Eaten something past its expiration date", wild: 1 },
    { text: "Danced alone in my room like nobody's watching", wild: 1 },
    { text: "Gone skinny dipping", wild: 3 },
    { text: "Lied about my age", wild: 2 },
    { text: "Had a full conversation with my pet", wild: 1 },
    { text: "Accidentally sent a screenshot to the person in it", wild: 3 },
    { text: "Cried because of a song", wild: 1 },
    { text: "Skipped a shower for more than 2 days", wild: 2 },
    { text: "Been on a blind date", wild: 2 },
    { text: "Talked trash about someone, then realized they were behind me", wild: 3 },
    { text: "Used someone else's Netflix without asking", wild: 1 },
    { text: "Slept through an alarm for something important", wild: 2 },
  ];

  const shuffled = [...statements].sort(() => Math.random() - 0.5).slice(0, 15);
  let current = 0, wildScore = 0;

  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>WILD SCORE: <b id="nhieScore">0</b></span>
      <span>ROUND: <b id="nhieRound">1</b> / 15</span>
      <span>RATING: <b id="nhieRating">ANGEL</b></span>
    </div>
    <div class="nhie-wild-meter">
      <div class="nhie-wild-fill" id="nhieFill" style="width: 0%"></div>
    </div>
    <div class="nhie-container">
      <div class="nhie-label">NEVER HAVE I EVER...</div>
      <div class="nhie-statement" id="nhieStatement">${shuffled[0].text}</div>
      <div class="nhie-buttons">
        <button class="nhie-have-btn" id="nhieHave">I HAVE &#128293;</button>
        <button class="nhie-never-btn" id="nhieNever">NEVER &#128519;</button>
      </div>
    </div>
  `;

  function getRating() {
    if (wildScore <= 3) return { text: "ANGEL", color: "#00ff88" };
    if (wildScore <= 8) return { text: "GOOD KID", color: "#00f0ff" };
    if (wildScore <= 15) return { text: "ADVENTURER", color: "#ffd700" };
    if (wildScore <= 22) return { text: "WILD CARD", color: "#ff6b35" };
    return { text: "ABSOLUTE MENACE", color: "#ff2d78" };
  }

  function updateUI() {
    document.getElementById("nhieScore").textContent = wildScore;
    document.getElementById("nhieRound").textContent = current + 1;
    const rating = getRating();
    const ratingEl = document.getElementById("nhieRating");
    ratingEl.textContent = rating.text;
    ratingEl.style.color = rating.color;
    document.getElementById("nhieFill").style.width = Math.min(100, (wildScore / 30) * 100) + "%";
    document.getElementById("nhieFill").style.background = `linear-gradient(90deg, #00ff88, ${rating.color})`;
  }

  function showStatement() {
    const stmtEl = document.getElementById("nhieStatement");
    stmtEl.style.animation = "none";
    stmtEl.offsetHeight; // reflow
    stmtEl.style.animation = "nhie-fade-in 0.4s ease";
    stmtEl.textContent = shuffled[current].text;
  }

  function nextRound() {
    current++;
    if (current >= shuffled.length) {
      // Check wildcard achievement
      if (wildScore >= 25) {
        try { unlock("wildcard", "Wild Card"); } catch(e) {}
      }
      const res = endGame("neverhave", wildScore);
      showGameOver("neverhave", res, wildScore >= 15);
      return;
    }
    showStatement();
    updateUI();
  }

  document.getElementById("nhieHave").addEventListener("click", (e) => {
    e.stopPropagation();
    wildScore += shuffled[current].wild;
    if (typeof NexusAudio !== 'undefined') NexusAudio.sfxWrong();
    // Flash red
    const container = document.querySelector(".nhie-container");
    container.style.borderColor = "#ff2d78";
    container.style.boxShadow = "0 0 30px rgba(255,45,120,0.3)";
    showFloatingText("+" + shuffled[current].wild + " WILD", mouseX, mouseY - 20, "#ff2d78");
    setTimeout(() => { container.style.borderColor = ""; container.style.boxShadow = ""; }, 300);
    nextRound();
  });

  document.getElementById("nhieNever").addEventListener("click", (e) => {
    e.stopPropagation();
    if (typeof NexusAudio !== 'undefined') NexusAudio.sfxCorrect();
    // Flash green
    const container = document.querySelector(".nhie-container");
    container.style.borderColor = "#00ff88";
    container.style.boxShadow = "0 0 30px rgba(0,255,136,0.3)";
    showFloatingText("INNOCENT", mouseX, mouseY - 20, "#00ff88");
    setTimeout(() => { container.style.borderColor = ""; container.style.boxShadow = ""; }, 300);
    nextRound();
  });

  updateUI();
  setTimeout(setupCursorHovers, 50);
}

// ═══════════════════════════════════════
// SOUND TOGGLE
// ═══════════════════════════════════════
(function initSoundToggle() {
  const btn = document.getElementById("soundToggle");
  const icon = document.getElementById("soundIcon");
  if (!btn || !icon) return;

  // Set initial state
  if (typeof NexusAudio !== 'undefined' && NexusAudio.isMuted()) {
    btn.classList.add("muted");
    icon.innerHTML = "&#128264;";
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (typeof NexusAudio === 'undefined') return;
    const muted = NexusAudio.toggleMute();
    icon.innerHTML = muted ? "&#128264;" : "&#128266;";
    btn.classList.toggle("muted", muted);
  });
})();
