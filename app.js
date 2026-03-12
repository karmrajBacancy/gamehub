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
  bestScores: { snake: 0, memory: 0, reaction: Infinity, whack: 0, typing: 0, aim: Infinity, panic: 0, wrong: 0, cursed: 0, emoji: 0 },
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

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursor.style.left = mouseX + "px"; cursor.style.top = mouseY + "px";
});

(function animateTrail() {
  trailX += (mouseX - trailX) * 0.15;
  trailY += (mouseY - trailY) * 0.15;
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
    const delay = [300, 700, 1100, 1500, 1900, 2300, 2700, 3100, 3500, 3900][i] || 300;
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
  if (state.gamesPlayedSet.size >= 10) unlock("collector", "Collector");
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

document.getElementById("closeGame").addEventListener("click", closeGame);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeGame(); });

function openGame(name) {
  activeGame = name;
  document.getElementById("overlayTitle").textContent = {
    snake: "SNAKE", memory: "MEMORY MATCH", reaction: "REACTION TIME",
    whack: "WHACK-A-BOT", typing: "SPEED TYPE", aim: "AIM TRAINER",
    panic: "PANIC BUTTON", wrong: "WRONG ANSWERS", cursed: "CURSOR BETRAYAL", emoji: "EMOJI ROULETTE"
  }[name];
  overlay.classList.add("active");
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
  ]
};

const gameOverIcons = {
  snake: "💀", memory: "🧠", reaction: "⚡", whack: "🔨", typing: "⌨️", aim: "🎯",
  panic: "💨", wrong: "🤔", cursed: "👁️", emoji: "🎰"
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
  emoji: "FINISHED!"
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
    <div class="game-over-countdown">
      RETURNING TO HUB
      <div class="countdown-bar"><div class="countdown-fill"></div></div>
    </div>
  `;

  // Position it inside the game overlay body
  const overlayBody = document.querySelector(".game-overlay-body");
  if (overlayBody) {
    overlayBody.style.position = "relative";
    overlayBody.appendChild(goScreen);
  }

  // Auto close after 10 seconds (time to read the message)
  setTimeout(function() { closeGame(); }, 10000);
}

function closeGame() {
  // Stop audio
  if (typeof NexusAudio !== 'undefined') { NexusAudio.stopMusic(); NexusAudio.startDashboardAmbient(); }
  // Stop all game loops first
  if (window._gameInterval) { clearInterval(window._gameInterval); window._gameInterval = null; }
  if (window._gameTimeout) { clearTimeout(window._gameTimeout); window._gameTimeout = null; }
  if (window._gameRAF) { cancelAnimationFrame(window._gameRAF); window._gameRAF = null; }

  // Close overlay
  overlay.classList.remove("active");
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
// GAME: SNAKE
// ═══════════════════════════════════════
function initSnake() {
  const size = 24, cols = 24, rows = 18;
  const w = cols * size, h = rows * size;
  gameContainer.innerHTML = `
    <div class="game-score-bar">
      <span>SCORE: <b id="snakeScore">0</b></span>
      <span>SPEED: <b id="snakeSpeed">1</b>x</span>
      <span>LENGTH: <b id="snakeLen">3</b></span>
    </div>
    <canvas id="snakeCanvas" width="${w}" height="${h}" style="border-radius:12px"></canvas>
    <div class="game-message" id="snakeMsg">Use WASD or Arrow Keys to move</div>
  `;
  const cvs = document.getElementById("snakeCanvas");
  const c = cvs.getContext("2d");

  // ── Snake state ──
  let snake = [{x:12,y:9},{x:11,y:9},{x:10,y:9}];
  let dir = {x:1,y:0}, nextDir = {x:1,y:0};
  let score = 0, alive = true, started = false;
  let frameCount = 0, baseSpeed = 110;
  let shakeX = 0, shakeY = 0, shakeDecay = 0;

  // ── Smooth interpolation ──
  let prevSnake = snake.map(s => ({...s}));
  let interpT = 0;

  // ── Food system (multiple types) ──
  const foodTypes = [
    { emoji: null, color: "#00ff88", glow: "#00ff88", points: 10, chance: 0.6, radius: size * 0.35 },
    { emoji: null, color: "#ffd700", glow: "#ffd700", points: 25, chance: 0.25, radius: size * 0.38 },
    { emoji: null, color: "#b44aff", glow: "#b44aff", points: 50, chance: 0.1, radius: size * 0.4 },
    { emoji: null, color: "#00f0ff", glow: "#00f0ff", points: 100, chance: 0.05, radius: size * 0.42 },
  ];
  let food = null;
  let bonusFood = null;
  let bonusFoodTimer = 0;

  function pickFoodType() {
    const r = Math.random();
    let cum = 0;
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

  // ── Particles ──
  let gameParticles = [];
  class SnakeParticle {
    constructor(x, y, color, type) {
      this.x = x; this.y = y; this.color = color;
      this.life = 1; this.decay = 0.02 + Math.random() * 0.03;
      this.size = 2 + Math.random() * 3;
      if (type === "eat") {
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.decay = 0.03 + Math.random() * 0.02;
        this.size = 2 + Math.random() * 5;
      } else if (type === "death") {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.decay = 0.01 + Math.random() * 0.02;
        this.size = 3 + Math.random() * 6;
      } else if (type === "trail") {
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.decay = 0.04 + Math.random() * 0.03;
        this.size = 1 + Math.random() * 2;
      }
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.vx *= 0.96; this.vy *= 0.96;
      this.life -= this.decay;
    }
    draw(ctx) {
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.size * 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  function emitParticles(x, y, color, count, type) {
    for (let i = 0; i < count; i++) {
      gameParticles.push(new SnakeParticle(x, y, color, type));
    }
  }

  // ── Drawing helpers ──
  function getCenterX(gx) { return gx * size + size / 2; }
  function getCenterY(gy) { return gy * size + size / 2; }

  function lerpPos(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  function drawBackground() {
    // Dark gradient background
    const grad = c.createRadialGradient(w/2, h/2, 0, w/2, h/2, w * 0.7);
    grad.addColorStop(0, "#0d0d18");
    grad.addColorStop(1, "#06060a");
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);

    // Grid dots
    c.fillStyle = "rgba(255,255,255,0.03)";
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        c.beginPath();
        c.arc(x * size + size / 2, y * size + size / 2, 1, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Border glow
    const borderGrad = c.createLinearGradient(0, 0, w, 0);
    borderGrad.addColorStop(0, "rgba(0,240,255,0.15)");
    borderGrad.addColorStop(0.5, "rgba(180,74,255,0.15)");
    borderGrad.addColorStop(1, "rgba(0,240,255,0.15)");
    c.strokeStyle = borderGrad;
    c.lineWidth = 2;
    c.beginPath();
    const r = 10, x0 = 1, y0 = 1, bw = w - 2, bh = h - 2;
    c.moveTo(x0 + r, y0);
    c.lineTo(x0 + bw - r, y0); c.arcTo(x0 + bw, y0, x0 + bw, y0 + r, r);
    c.lineTo(x0 + bw, y0 + bh - r); c.arcTo(x0 + bw, y0 + bh, x0 + bw - r, y0 + bh, r);
    c.lineTo(x0 + r, y0 + bh); c.arcTo(x0, y0 + bh, x0, y0 + bh - r, r);
    c.lineTo(x0, y0 + r); c.arcTo(x0, y0, x0 + r, y0, r);
    c.closePath();
    c.stroke();
  }

  function drawFood(f) {
    const fx = getCenterX(f.x);
    const fy = getCenterY(f.y);
    const ft = f.type;
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.15;
    const rotation = Date.now() * 0.002;

    // Outer aura
    const auraGrad = c.createRadialGradient(fx, fy, 0, fx, fy, ft.radius * 2.5 * pulse);
    auraGrad.addColorStop(0, ft.glow + "44");
    auraGrad.addColorStop(0.5, ft.glow + "11");
    auraGrad.addColorStop(1, "transparent");
    c.fillStyle = auraGrad;
    c.beginPath();
    c.arc(fx, fy, ft.radius * 2.5 * pulse, 0, Math.PI * 2);
    c.fill();

    // Orbiting dots
    for (let i = 0; i < 3; i++) {
      const angle = rotation + (i * Math.PI * 2 / 3);
      const orbitR = ft.radius * 1.6 * pulse;
      const ox = fx + Math.cos(angle) * orbitR;
      const oy = fy + Math.sin(angle) * orbitR;
      c.fillStyle = ft.color;
      c.globalAlpha = 0.5;
      c.beginPath();
      c.arc(ox, oy, 1.5, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    }

    // Main food body
    c.shadowColor = ft.glow;
    c.shadowBlur = 15;
    c.fillStyle = ft.color;
    c.beginPath();
    c.arc(fx, fy, ft.radius * pulse, 0, Math.PI * 2);
    c.fill();

    // Inner highlight
    c.shadowBlur = 0;
    const hlGrad = c.createRadialGradient(fx - ft.radius * 0.25, fy - ft.radius * 0.3, 0, fx, fy, ft.radius);
    hlGrad.addColorStop(0, "rgba(255,255,255,0.5)");
    hlGrad.addColorStop(0.5, "rgba(255,255,255,0.05)");
    hlGrad.addColorStop(1, "transparent");
    c.fillStyle = hlGrad;
    c.beginPath();
    c.arc(fx, fy, ft.radius * pulse, 0, Math.PI * 2);
    c.fill();

    // Points label
    if (ft.points > 10) {
      c.font = "bold 8px Orbitron, monospace";
      c.fillStyle = ft.color;
      c.textAlign = "center";
      c.globalAlpha = 0.7;
      c.fillText("+" + ft.points, fx, fy + ft.radius * 2 + 6);
      c.globalAlpha = 1;
    }
  }

  function drawSnakeBody(positions) {
    if (positions.length < 2) return;

    const bodyRadius = size * 0.38;

    // Draw body segments from tail to head
    for (let i = positions.length - 1; i >= 0; i--) {
      const seg = positions[i];
      const px = getCenterX(seg.x);
      const py = getCenterY(seg.y);
      const t = i / positions.length;

      // Segment radius (head bigger, tapers at tail)
      let radius;
      if (i === 0) radius = bodyRadius * 1.15;
      else if (i < 3) radius = bodyRadius * (1.1 - i * 0.02);
      else radius = bodyRadius * Math.max(0.5, 1 - (t * 0.5));

      // Color gradient from head to tail
      const hue = 185 + t * 40; // cyan to teal
      const sat = 100 - t * 20;
      const light = alive ? (55 - t * 15) : 25;
      const alpha = alive ? (1 - t * 0.3) : 0.4;

      // Body segment shadow / glow
      c.shadowColor = alive ? `hsla(${hue}, ${sat}%, ${light}%, 0.6)` : "rgba(255,50,50,0.3)";
      c.shadowBlur = i === 0 ? 14 : 6;

      // Main body circle
      c.fillStyle = alive
        ? `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`
        : `rgba(180, 50, 50, ${alpha * 0.6})`;
      c.beginPath();
      c.arc(px, py, radius, 0, Math.PI * 2);
      c.fill();

      // Specular highlight on each segment
      c.shadowBlur = 0;
      const specGrad = c.createRadialGradient(px - radius * 0.3, py - radius * 0.35, 0, px, py, radius);
      specGrad.addColorStop(0, `rgba(255,255,255,${0.25 - t * 0.15})`);
      specGrad.addColorStop(0.6, "rgba(255,255,255,0.02)");
      specGrad.addColorStop(1, "transparent");
      c.fillStyle = specGrad;
      c.beginPath();
      c.arc(px, py, radius, 0, Math.PI * 2);
      c.fill();

      // Connectors between segments (smooth body)
      if (i < positions.length - 1) {
        const next = positions[i + 1];
        const nx = getCenterX(next.x);
        const ny = getCenterY(next.y);
        const nextT = (i + 1) / positions.length;
        const nextRadius = bodyRadius * Math.max(0.5, 1 - (nextT * 0.5));
        const connRadius = (radius + nextRadius) / 2 * 0.85;

        c.fillStyle = alive
          ? `hsla(${hue + 5}, ${sat - 5}%, ${light - 3}%, ${alpha * 0.9})`
          : `rgba(160, 40, 40, ${alpha * 0.5})`;
        c.beginPath();
        c.arc((px + nx) / 2, (py + ny) / 2, connRadius, 0, Math.PI * 2);
        c.fill();
      }

      // Scale pattern (subtle diamond marks)
      if (i > 0 && i % 2 === 0 && alive) {
        c.globalAlpha = 0.08;
        c.fillStyle = "#fff";
        c.beginPath();
        const sr = radius * 0.3;
        c.moveTo(px, py - sr);
        c.lineTo(px + sr, py);
        c.lineTo(px, py + sr);
        c.lineTo(px - sr, py);
        c.closePath();
        c.fill();
        c.globalAlpha = 1;
      }
    }

    // ── HEAD DETAILS ──
    if (positions.length > 0) {
      const head = positions[0];
      const hx = getCenterX(head.x);
      const hy = getCenterY(head.y);
      const headR = bodyRadius * 1.15;

      // Eyes
      const eyeOffset = headR * 0.35;
      const eyeR = headR * 0.22;
      const pupilR = eyeR * 0.6;

      // Eye positions based on direction
      let le, re;
      if (dir.x === 1) { le = {x: hx + eyeOffset * 0.6, y: hy - eyeOffset}; re = {x: hx + eyeOffset * 0.6, y: hy + eyeOffset}; }
      else if (dir.x === -1) { le = {x: hx - eyeOffset * 0.6, y: hy - eyeOffset}; re = {x: hx - eyeOffset * 0.6, y: hy + eyeOffset}; }
      else if (dir.y === -1) { le = {x: hx - eyeOffset, y: hy - eyeOffset * 0.6}; re = {x: hx + eyeOffset, y: hy - eyeOffset * 0.6}; }
      else { le = {x: hx - eyeOffset, y: hy + eyeOffset * 0.6}; re = {x: hx + eyeOffset, y: hy + eyeOffset * 0.6}; }

      // Eye whites
      c.shadowBlur = 0;
      c.fillStyle = alive ? "rgba(220,255,255,0.95)" : "rgba(150,80,80,0.7)";
      c.beginPath(); c.arc(le.x, le.y, eyeR, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(re.x, re.y, eyeR, 0, Math.PI * 2); c.fill();

      // Pupils (look in direction of movement)
      const pupOff = eyeR * 0.25;
      const px1 = le.x + dir.x * pupOff;
      const py1 = le.y + dir.y * pupOff;
      const px2 = re.x + dir.x * pupOff;
      const py2 = re.y + dir.y * pupOff;
      c.fillStyle = alive ? "#0a0a0f" : "#4a1010";
      c.beginPath(); c.arc(px1, py1, pupilR, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(px2, py2, pupilR, 0, Math.PI * 2); c.fill();

      // Pupil highlight
      c.fillStyle = "rgba(255,255,255,0.6)";
      c.beginPath(); c.arc(px1 - pupilR * 0.3, py1 - pupilR * 0.3, pupilR * 0.35, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(px2 - pupilR * 0.3, py2 - pupilR * 0.3, pupilR * 0.35, 0, Math.PI * 2); c.fill();

      // Tongue (flickers occasionally)
      if (alive && frameCount % 40 < 15) {
        const tongueLen = headR * 0.7;
        const tx = hx + dir.x * (headR + tongueLen * 0.3);
        const ty = hy + dir.y * (headR + tongueLen * 0.3);
        const forkSize = 3;

        c.strokeStyle = "#ff4466";
        c.lineWidth = 1.5;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(hx + dir.x * headR * 0.8, hy + dir.y * headR * 0.8);
        c.lineTo(tx, ty);
        c.stroke();

        // Fork
        if (dir.x !== 0) {
          c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + dir.x * forkSize, ty - forkSize); c.stroke();
          c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + dir.x * forkSize, ty + forkSize); c.stroke();
        } else {
          c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx - forkSize, ty + dir.y * forkSize); c.stroke();
          c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + forkSize, ty + dir.y * forkSize); c.stroke();
        }
      }
    }
  }

  // ── Main draw ──
  function draw() {
    c.save();
    if (shakeDecay > 0) {
      shakeX = (Math.random() - 0.5) * shakeDecay * 8;
      shakeY = (Math.random() - 0.5) * shakeDecay * 8;
      shakeDecay *= 0.9;
      if (shakeDecay < 0.01) { shakeDecay = 0; shakeX = 0; shakeY = 0; }
      c.translate(shakeX, shakeY);
    }

    drawBackground();
    drawFood(food);
    if (bonusFood) drawFood(bonusFood);
    drawSnakeBody(snake);

    // Draw particles
    gameParticles.forEach(p => { p.update(); p.draw(c); });
    gameParticles = gameParticles.filter(p => p.life > 0);

    // Trail particles from head
    if (alive && snake.length > 0 && frameCount % 3 === 0) {
      const hx = getCenterX(snake[0].x);
      const hy = getCenterY(snake[0].y);
      emitParticles(hx - dir.x * size * 0.3, hy - dir.y * size * 0.3, "rgba(0,240,255,0.5)", 1, "trail");
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

      // Death particles
      snake.forEach((s, i) => {
        const cx = getCenterX(s.x), cy = getCenterY(s.y);
        emitParticles(cx, cy, i === 0 ? "#00f0ff" : "#00a0aa", 6, "death");
      });

      // Death animation then back to dashboard
      clearInterval(window._gameInterval); window._gameInterval = null;
      if (window._gameRAF) { cancelAnimationFrame(window._gameRAF); window._gameRAF = null; }

      // Short death animation then show game over screen
      let deathFrames = 0;
      function deathAnim() {
        try { draw(); } catch(e) { /* canvas error, skip */ }
        deathFrames++;
        if (deathFrames < 40) {
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

    prevSnake = snake.map(s => ({...s}));
    snake.unshift(head);

    // Check regular food
    if (head.x === food.x && head.y === food.y) {
      const pts = food.type.points;
      score += pts;
      document.getElementById("snakeScore").textContent = score;
      document.getElementById("snakeLen").textContent = snake.length;

      // Eat particles
      const fx = getCenterX(food.x), fy = getCenterY(food.y);
      emitParticles(fx, fy, food.type.color, 20, "eat");
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxEat();

      showFloatingText("+" + pts, mouseX, mouseY - 20, food.type.color);
      food = spawnFood();

      // Spawn bonus food occasionally
      if (Math.random() < 0.2 && !bonusFood) {
        bonusFood = spawnFood();
        bonusFood.type = foodTypes[2 + Math.floor(Math.random() * 2)]; // purple or cyan
        bonusFoodTimer = setTimeout(() => { bonusFood = null; }, 5000);
      }

      // Speed up
      const speedLevel = Math.floor(snake.length / 5);
      const newSpeed = Math.max(55, baseSpeed - speedLevel * 5);
      clearInterval(window._gameInterval);
      window._gameInterval = setInterval(tick, newSpeed);
      document.getElementById("snakeSpeed").textContent = (baseSpeed / newSpeed).toFixed(1);

    } else if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
      // Bonus food
      const pts = bonusFood.type.points;
      score += pts;
      document.getElementById("snakeScore").textContent = score;
      document.getElementById("snakeLen").textContent = snake.length;
      const bx = getCenterX(bonusFood.x), by = getCenterY(bonusFood.y);
      emitParticles(bx, by, bonusFood.type.color, 30, "eat");
      if (typeof NexusAudio !== 'undefined') NexusAudio.sfxEat();
      showFloatingText("+" + pts + " BONUS!", mouseX, mouseY - 30, bonusFood.type.color);
      clearTimeout(bonusFoodTimer);
      bonusFood = null;
    } else {
      snake.pop();
    }

    draw();
  }

  // ── Render loop (for smooth particles/effects between ticks) ──
  let lastDraw = 0;
  function renderLoop(time) {
    if (!overlay.classList.contains("active") || !alive) return;
    if (time - lastDraw > 16) { // ~60fps visual update
      draw();
      lastDraw = time;
    }
    window._gameRAF = requestAnimationFrame(renderLoop);
  }

  draw();
  window._gameInterval = setInterval(tick, baseSpeed);
  window._gameRAF = requestAnimationFrame(renderLoop);

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
      if (!started) started = true;
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
