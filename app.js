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
  bestScores: { snake: 0, memory: 0, reaction: Infinity, whack: 0, typing: 0, aim: Infinity, panic: 0, wrong: 0, cursed: 0, emoji: 0, dodge: 0, slash: 0, runner: 0 },
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
const cursor = document.getElementById("cursor");
const cursorTrail = document.getElementById("cursorTrail");
let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

// ── Funny Cursor Emojis ──
const cursorEmojis = ["🎯", "👾", "🚀", "🔥", "⚡", "🎮", "🤖", "💀", "👀", "🦄", "🍕", "🐱", "🧠", "💣", "🌮"];
const trailEmojis = ["✨", "⭐", "💫", "🌟", "🔮", "💎", "🪐", "🌈", "🎪", "🍭"];
let cursorEmojiIdx = 0;
let trailEmojiIdx = 0;

function setRandomCursorEmoji() {
  cursorEmojiIdx = Math.floor(Math.random() * cursorEmojis.length);
  cursor.setAttribute("data-emoji", cursorEmojis[cursorEmojiIdx]);
}
function setRandomTrailEmoji() {
  trailEmojiIdx = Math.floor(Math.random() * trailEmojis.length);
  cursorTrail.setAttribute("data-emoji", trailEmojis[trailEmojiIdx]);
}

// Initial emojis
setRandomCursorEmoji();
setRandomTrailEmoji();

// Rotate cursor emoji every 3 seconds
setInterval(() => {
  if (!cursor.classList.contains("hover") && !cursor.classList.contains("click")) {
    setRandomCursorEmoji();
  }
}, 3000);

// Rotate trail emoji every 5 seconds
setInterval(setRandomTrailEmoji, 5000);

// Change cursor on each click to a random one
document.addEventListener("click", () => {
  setTimeout(setRandomCursorEmoji, 200);
});

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

function setupCursorHovers() {
  document.querySelectorAll("a, button, .game-card, .stat-card, .achievement-row, .play-btn, .close-btn, .game-btn, .memory-cell, .whack-hole, .aim-target, .reaction-box").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
  });
}
setupCursorHovers();
document.addEventListener("mousedown", () => cursor.classList.add("click"));
document.addEventListener("mouseup", () => cursor.classList.remove("click"));

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
    const delay = [300, 700, 1100, 1500, 1900, 2300, 2700, 3100, 3500, 3900, 4300, 4700, 5100][i] || 300;
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

// Card tilt (always active, but only when "landed")
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
  if (state.gamesPlayedSet.size >= 13) unlock("collector", "Collector");
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
  document.getElementById("statAch").textContent = `${state.achievements.size} / 8`;
  document.getElementById("barGames").style.width = Math.min(state.gamesPlayed / 20 * 100, 100) + "%";
  document.getElementById("barXP").style.width = Math.min((state.xp + (state.level-1)*100) / 500 * 100, 100) + "%";
  document.getElementById("barCoins").style.width = Math.min(state.totalCoins / 500 * 100, 100) + "%";
  document.getElementById("barAch").style.width = (state.achievements.size / 8 * 100) + "%";

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
    dodge: "NEON DODGE", slash: "CYBER SLASH", runner: "GRAVITY RUNNER"
  }[name];
  overlay.classList.add("active");
  if (name === "snake" || name === "dodge") overlay.classList.add("fullscreen-game");
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
  ]
};

const gameOverIcons = {
  snake: "💀", memory: "🧠", reaction: "⚡", whack: "🔨", typing: "⌨️", aim: "🎯",
  panic: "💨", wrong: "🤔", cursed: "👁️", emoji: "🎰",
  dodge: "🚀", slash: "⚔️", runner: "🏃"
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
  runner: "CRASHED!"
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

  // Flee on mouse proximity
  arena.addEventListener("mousemove", (e) => {
    const rect = btn.getBoundingClientRect();
    const bx = rect.left + rect.width / 2;
    const by = rect.top + rect.height / 2;
    const dx = e.clientX - bx;
    const dy = e.clientY - by;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 120) {
      moveBtn();
      moveDecoys();
      taunt.textContent = panicTaunts[Math.floor(Math.random() * panicTaunts.length)];
    }
  });

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

  cvs.addEventListener("mousemove", (e) => {
    const rect = cvs.getBoundingClientRect();
    playerX = Math.max(playerR, Math.min(cvs.width - playerR, e.clientX - rect.left));
    playerY = Math.max(playerR, Math.min(cvs.height - playerR, e.clientY - rect.top));
  });

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
