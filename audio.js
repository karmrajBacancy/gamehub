// ═══════════════════════════════════════
// NEXUS AUDIO ENGINE - Web Audio API
// Procedural cyberpunk sounds, no files
// ═══════════════════════════════════════
const NexusAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let muted = localStorage.getItem("nexus_muted") === "true";
  let initialized = false;
  let introPlayed = false;

  // Current playing handles
  let ambientHandle = null;   // dashboard music
  let gameMusicHandle = null;  // in-game music
  let pendingTimers = [];      // setTimeout IDs we need to clean up

  // What SHOULD be playing right now
  // "intro" | "dashboard" | "game" | "gameover"
  let audioState = "intro";

  // iOS/mobile silent buffer unlock — must happen during user gesture
  function unlockAudio() {
    if (!ctx) return;
    // Play a tiny silent buffer to unlock audio output on iOS
    const silentBuf = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = silentBuf;
    src.connect(ctx.destination);
    src.start(0);
    src.stop(ctx.currentTime + 0.001);
    // Also resume if suspended
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  // Called ONCE from splash screen click — guaranteed user gesture
  function init() {
    if (initialized) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      musicGain = ctx.createGain();
      sfxGain = ctx.createGain();
      musicGain.gain.value = 0.045;
      sfxGain.gain.value = 0.13;
      masterGain.gain.value = muted ? 0 : 1;
      musicGain.connect(masterGain);
      sfxGain.connect(masterGain);
      masterGain.connect(ctx.destination);
      initialized = true;

      // iOS unlock: play silent buffer + resume during user gesture
      unlockAudio();

      // Mobile: keep resuming AudioContext on any user interaction
      const resumeOnGesture = () => unlockAudio();
      document.addEventListener("touchstart", resumeOnGesture, { passive: true });
      document.addEventListener("touchend", resumeOnGesture, { passive: true });
      document.addEventListener("click", resumeOnGesture, { passive: true });

      // Resume audio when user comes back to the tab/app
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && ctx && ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
      });

      // Start intro sequence immediately
      audioState = "intro";
      playIntroSequence();

      // Transition to dashboard music after intro fly-in finishes
      const t = setTimeout(() => {
        if (audioState === "intro") {
          audioState = "dashboard";
          _startDashboardMusic();
        }
      }, 9000);
      pendingTimers.push(t);
    } catch (e) { console.warn("Audio init failed:", e); }
  }

  // ═══════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════
  function playTone(freq, duration, type, dest, vol, detune) {
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(vol || 0.3, ctx.currentTime + 0.01);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    osc.connect(g);
    g.connect(dest || sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  }

  function playNoise(duration, filterFreq, dest, vol) {
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const bufSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq || 1000;
    filter.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.1, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest || sfxGain);
    src.start(ctx.currentTime);
    src.stop(ctx.currentTime + duration + 0.01);
  }

  // ═══════════════════════════════════════
  // STOP HELPERS
  // ═══════════════════════════════════════
  function _stopAmbient() {
    if (ambientHandle) { ambientHandle.stop(); ambientHandle = null; }
  }

  function _stopGameMusic() {
    if (gameMusicHandle) { gameMusicHandle.stop(); gameMusicHandle = null; }
  }

  function _stopAll() {
    _stopAmbient();
    _stopGameMusic();
  }

  // ═══════════════════════════════════════
  // DASHBOARD MUSIC - Chill Cyberpunk Beat
  // ═══════════════════════════════════════
  function _startDashboardMusic() {
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    _stopAll();

    const BPM = 85;
    const beatMs = 60000 / BPM;
    const intervals = [];

    // ── BASS LINE ──
    const bassPattern = [110,110,0,110, 130.8,0,130.8,0, 110,110,0,110, 98,0,82.4,0];
    let bassStep = 0;
    intervals.push(setInterval(() => {
      if (!ctx) return;
      const note = bassPattern[bassStep % bassPattern.length];
      if (note > 0) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = "sawtooth"; osc.frequency.value = note;
        filter.type = "lowpass"; filter.frequency.value = 300;
        g.gain.setValueAtTime(0.35, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + beatMs / 1000 * 0.9);
        osc.connect(filter); filter.connect(g); g.connect(musicGain);
        osc.start(); osc.stop(ctx.currentTime + beatMs / 1000);
      }
      bassStep++;
    }, beatMs / 2));

    // ── DRUMS ──
    let drumStep = 0;
    intervals.push(setInterval(() => {
      if (!ctx) return;
      const pos = drumStep % 16;
      if (pos % 4 === 0) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = 150;
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.08);
        g.gain.setValueAtTime(0.4, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        osc.connect(g); g.connect(musicGain);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      }
      if (pos === 4 || pos === 12) {
        playNoise(0.1, 3000, musicGain, 0.12);
        playTone(200, 0.06, "triangle", musicGain, 0.1);
      }
      playNoise(pos % 2 === 0 ? 0.03 : 0.06, pos % 2 === 0 ? 8000 : 6000, musicGain, pos % 2 === 0 ? 0.06 : 0.03);
      drumStep++;
    }, beatMs / 4));

    // ── MELODY ──
    const melodyPattern = [
      {note:440,dur:2},{note:523.3,dur:1},{note:587.3,dur:1},{note:659.3,dur:2},{note:523.3,dur:2},
      {note:0,dur:1},{note:440,dur:1},{note:392,dur:2},{note:329.6,dur:2},{note:392,dur:1},
      {note:440,dur:1},{note:523.3,dur:2},{note:440,dur:1},{note:392,dur:1},{note:329.6,dur:4},{note:0,dur:2}
    ];
    let melodyIdx = 0, melodyWait = 0;
    intervals.push(setInterval(() => {
      if (!ctx) return;
      if (melodyWait > 0) { melodyWait--; return; }
      const m = melodyPattern[melodyIdx % melodyPattern.length];
      if (m.note > 0) {
        const dur = m.dur * beatMs / 1000 * 0.9;
        playTone(m.note, dur, "triangle", musicGain, 0.12);
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = "sine"; osc2.frequency.value = m.note; osc2.detune.value = 7;
        g2.gain.setValueAtTime(0.06, ctx.currentTime);
        g2.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
        osc2.connect(g2); g2.connect(musicGain);
        osc2.start(); osc2.stop(ctx.currentTime + dur + 0.05);
      }
      melodyWait = m.dur - 1;
      melodyIdx++;
    }, beatMs / 2));

    // ── PAD ──
    const padNotes = [220, 261.6, 329.6, 392];
    const padOscs = [];
    const padGain = ctx.createGain();
    padGain.gain.value = 0.06;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass"; padFilter.frequency.value = 800;
    const padLfo = ctx.createOscillator();
    const padLfoGain = ctx.createGain();
    padLfo.type = "sine"; padLfo.frequency.value = 0.15;
    padLfoGain.gain.value = 300;
    padLfo.connect(padLfoGain);
    padLfoGain.connect(padFilter.frequency);
    padLfo.start();
    padNotes.forEach(f => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth"; osc.frequency.value = f;
      osc.detune.value = (Math.random() - 0.5) * 10;
      osc.connect(padFilter);
      osc.start();
      padOscs.push(osc);
    });
    padFilter.connect(padGain);
    padGain.connect(musicGain);

    // ── ATMOSPHERE ──
    intervals.push(setInterval(() => {
      if (!ctx) return;
      playTone(2200, 0.08, "sine", musicGain, 0.04);
      setTimeout(() => playTone(1650, 0.06, "sine", musicGain, 0.02), 120);
    }, beatMs * 8));
    intervals.push(setInterval(() => {
      if (!ctx) return;
      playNoise(0.02, 12000, musicGain, 0.015);
    }, 350));

    ambientHandle = {
      stop() {
        intervals.forEach(iv => clearInterval(iv));
        padOscs.forEach(o => { try { o.stop(); } catch(e) {} });
        try { padLfo.stop(); } catch(e) {}
      }
    };
  }

  // ═══════════════════════════════════════
  // INTRO FLY-IN SOUND FX
  // ═══════════════════════════════════════
  function playIntroSequence() {
    if (!ctx) return;

    const introGain = ctx.createGain();
    introGain.gain.value = 0.18;
    introGain.connect(masterGain);

    // 1. Rising whoosh
    const whooshLen = 3.5;
    const whooshBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * whooshLen), ctx.sampleRate);
    const whooshData = whooshBuf.getChannelData(0);
    for (let i = 0; i < whooshData.length; i++) whooshData[i] = Math.random() * 2 - 1;
    const whooshSrc = ctx.createBufferSource();
    whooshSrc.buffer = whooshBuf;
    const whooshFilter = ctx.createBiquadFilter();
    whooshFilter.type = "bandpass"; whooshFilter.Q.value = 3;
    whooshFilter.frequency.setValueAtTime(100, ctx.currentTime);
    whooshFilter.frequency.exponentialRampToValueAtTime(6000, ctx.currentTime + whooshLen);
    const whooshG = ctx.createGain();
    whooshG.gain.setValueAtTime(0, ctx.currentTime);
    whooshG.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.5);
    whooshG.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 2);
    whooshG.gain.linearRampToValueAtTime(0, ctx.currentTime + whooshLen);
    whooshSrc.connect(whooshFilter); whooshFilter.connect(whooshG); whooshG.connect(introGain);
    whooshSrc.start(); whooshSrc.stop(ctx.currentTime + whooshLen + 0.1);

    // 2. Rising cinematic tone
    const riseOsc = ctx.createOscillator();
    const riseOsc2 = ctx.createOscillator();
    const riseFilter = ctx.createBiquadFilter();
    const riseG = ctx.createGain();
    riseOsc.type = "sawtooth"; riseOsc.frequency.setValueAtTime(55, ctx.currentTime);
    riseOsc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 3);
    riseOsc2.type = "sawtooth"; riseOsc2.frequency.setValueAtTime(55.5, ctx.currentTime);
    riseOsc2.frequency.exponentialRampToValueAtTime(221, ctx.currentTime + 3);
    riseFilter.type = "lowpass";
    riseFilter.frequency.setValueAtTime(200, ctx.currentTime);
    riseFilter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 3);
    riseG.gain.setValueAtTime(0, ctx.currentTime);
    riseG.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.8);
    riseG.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2.5);
    riseG.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.5);
    riseOsc.connect(riseFilter); riseOsc2.connect(riseFilter);
    riseFilter.connect(riseG); riseG.connect(introGain);
    riseOsc.start(); riseOsc2.start();
    riseOsc.stop(ctx.currentTime + 4); riseOsc2.stop(ctx.currentTime + 4);

    // 3. Card landing thuds
    const cardDelays = [0.3, 0.7, 1.1, 1.5, 1.9, 2.3, 2.7, 3.1, 3.5, 3.9, 4.3, 4.7, 5.1, 5.5, 5.9, 6.3, 6.7, 7.1, 7.5];
    cardDelays.forEach((d, i) => {
      const landTime = d + 1.4;
      const t = setTimeout(() => {
        if (!ctx) return;
        const thud = ctx.createOscillator();
        const thudG = ctx.createGain();
        thud.type = "sine"; thud.frequency.value = 80 - i * 5;
        thud.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.12);
        thudG.gain.setValueAtTime(0.4, ctx.currentTime);
        thudG.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        thud.connect(thudG); thudG.connect(introGain);
        thud.start(); thud.stop(ctx.currentTime + 0.25);
        playNoise(0.06, 2000 + i * 500, introGain, 0.15);
        const chimeNotes = [392, 440, 523.3, 587.3, 659.3, 784, 880, 987.8, 1047, 1175, 1319, 1480, 1568, 1661, 1760, 1865, 1976, 2093, 2217];
        playTone(chimeNotes[i], 0.4, "triangle", introGain, 0.12);
        setTimeout(() => playTone(chimeNotes[i] * 1.5, 0.3, "sine", introGain, 0.06), 80);
      }, landTime * 1000);
      pendingTimers.push(t);
    });

    // 4. Final power chord (~4.5s)
    const t2 = setTimeout(() => {
      if (!ctx) return;
      const finalNotes = [220, 261.6, 329.6, 440, 523.3];
      finalNotes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i < 2 ? "sawtooth" : "triangle";
        osc.frequency.value = f;
        osc.detune.value = (Math.random() - 0.5) * 8;
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
        osc.connect(g); g.connect(introGain);
        osc.start(); osc.stop(ctx.currentTime + 2.2);
      });
      playNoise(0.15, 8000, introGain, 0.1);
      setTimeout(() => playNoise(0.1, 10000, introGain, 0.06), 100);
      setTimeout(() => playNoise(0.08, 12000, introGain, 0.04), 200);
    }, 4500);
    pendingTimers.push(t2);
  }

  // ═══════════════════════════════════════
  // PUBLIC: Start Game Music
  // ═══════════════════════════════════════
  function startGameMusic(gameName) {
    audioState = "game";
    _stopAll();
    // Cancel any pending intro->dashboard timer
    pendingTimers.forEach(t => clearTimeout(t));
    pendingTimers = [];
    if (!ctx) return;
    // Mobile: resume suspended AudioContext
    if (ctx.state === "suspended") ctx.resume();

    const makers = {
      snake: musicSnake, memory: musicMemory, reaction: musicReaction,
      whack: musicWhack, typing: musicTyping, aim: musicAim,
      panic: musicWhack, wrong: musicMemory, cursed: musicReaction, emoji: musicTyping,
      dodge: musicAim, slash: musicWhack, runner: musicSnake,
      pour: musicMemory, trivia: musicTyping, spinwheel: musicWhack,
      tipsy: musicReaction, beerpong: musicAim, neverhave: musicMemory
    };
    const maker = makers[gameName] || makers.snake;
    gameMusicHandle = maker();
  }

  // PUBLIC: Stop game music (called by showGameOver)
  function stopMusic() {
    _stopGameMusic();
    audioState = "gameover";
  }

  // PUBLIC: Return to dashboard music
  function startDashboardAmbient() {
    audioState = "dashboard";
    _startDashboardMusic();
  }

  // ═══════════════════════════════════════
  // GAME MUSIC GENERATORS
  // ═══════════════════════════════════════
  function musicSnake() {
    const notes = [82.4, 98.0];
    let i = 0;
    const iv = setInterval(() => {
      if (!ctx) return;
      playTone(notes[i % 2], 0.3, "square", musicGain, 0.35);
      playNoise(0.05, 6000, musicGain, 0.08);
      i++;
    }, 500);
    return { stop() { clearInterval(iv); } };
  }

  function musicMemory() {
    const chord = [220, 261.6, 329.6, 392];
    let i = 0;
    const iv = setInterval(() => {
      if (!ctx) return;
      playTone(chord[i % chord.length], 0.8, "triangle", musicGain, 0.25);
      i++;
    }, 1000);
    return { stop() { clearInterval(iv); } };
  }

  function musicReaction() {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = "sawtooth"; osc.frequency.value = 65.4;
    filter.type = "lowpass"; filter.frequency.value = 150;
    filter.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 30);
    g.gain.value = 0.4;
    osc.connect(filter); filter.connect(g); g.connect(musicGain);
    osc.start();
    const iv = setInterval(() => {
      if (!ctx) return;
      playTone(55, 0.08, "sine", musicGain, 0.3);
      setTimeout(() => playTone(55, 0.06, "sine", musicGain, 0.2), 120);
    }, 800);
    return { stop() { try { osc.stop(); } catch(e) {} clearInterval(iv); } };
  }

  function musicWhack() {
    const bassNotes = [130.8, 155.6, 174.6, 196];
    let i = 0;
    const iv = setInterval(() => {
      if (!ctx) return;
      playTone(bassNotes[i % bassNotes.length], 0.12, "square", musicGain, 0.35);
      if (i % 2 === 1) playNoise(0.06, 4000, musicGain, 0.12);
      i++;
    }, 375);
    return { stop() { clearInterval(iv); } };
  }

  function musicTyping() {
    const padNotes = [146.8, 174.6, 220, 261.6];
    padNotes.forEach(f => playTone(f, 30, "triangle", musicGain, 0.08));
    let beat = 0;
    const iv = setInterval(() => {
      if (!ctx) return;
      const accent = beat % 4 === 0;
      playNoise(0.03, accent ? 5000 : 3000, musicGain, accent ? 0.15 : 0.08);
      beat++;
    }, 600);
    return { stop() { clearInterval(iv); } };
  }

  function musicAim() {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth"; osc.frequency.value = 110;
    g.gain.value = 0.25;
    osc.connect(g); g.connect(musicGain);
    osc.start();
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.type = "square"; lfo.frequency.value = 4.67;
    lfoG.gain.value = 0.2;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    lfo.start();
    let step = 0;
    const arp = [440, 659.3, 880];
    const iv = setInterval(() => {
      if (!ctx) return;
      playTone(arp[step % 3], 0.15, "sine", musicGain, 0.12);
      step++;
    }, 700);
    return { stop() { try { osc.stop(); lfo.stop(); } catch(e) {} clearInterval(iv); } };
  }

  // ═══════════════════════════════════════
  // SOUND EFFECTS
  // ═══════════════════════════════════════
  function sfxCorrect() {
    if (!ctx) return;
    playTone(523.3, 0.1, "sine", sfxGain, 0.3);
    setTimeout(() => playTone(784, 0.12, "sine", sfxGain, 0.25), 60);
  }

  function sfxWrong() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square"; osc.frequency.value = 160;
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    osc.connect(g); g.connect(sfxGain);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  }

  function sfxGameOver() {
    if (!ctx) return;
    const notes = [329.6, 261.6, 220, 164.8];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.2, "sawtooth", sfxGain, 0.25), i * 160);
    });
    setTimeout(() => playNoise(0.3, 800, sfxGain, 0.15), 650);
  }

  function sfxLevelUp() {
    if (!ctx) return;
    const notes = [261.6, 329.6, 392, 523.3];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.15, "triangle", sfxGain, 0.35), i * 110);
    });
    setTimeout(() => playNoise(0.15, 8000, sfxGain, 0.1), 450);
    setTimeout(() => playNoise(0.1, 10000, sfxGain, 0.08), 520);
  }

  function sfxAchievement() {
    if (!ctx) return;
    const pairs = [[261.6,329.6],[329.6,392],[392,523.3]];
    pairs.forEach((p, i) => {
      setTimeout(() => {
        playTone(p[0], 0.25, "square", sfxGain, 0.2);
        playTone(p[1], 0.25, "sine", sfxGain, 0.25);
      }, i * 220);
    });
    setTimeout(() => playNoise(0.2, 7000, sfxGain, 0.1), 680);
  }

  function sfxClick() {
    if (!ctx) return;
    playNoise(0.02, 4000, sfxGain, 0.08);
  }

  function sfxEat() {
    if (!ctx) return;
    playTone(600, 0.06, "sine", sfxGain, 0.2);
    setTimeout(() => playTone(900, 0.08, "sine", sfxGain, 0.15), 40);
  }

  function sfxHit() {
    if (!ctx) return;
    playTone(400, 0.05, "square", sfxGain, 0.2);
    playNoise(0.04, 3000, sfxGain, 0.12);
  }

  // ═══════════════════════════════════════
  // MUTE TOGGLE
  // ═══════════════════════════════════════
  function toggleMute() {
    if (!ctx) createContext();
    muted = !muted;
    localStorage.setItem("nexus_muted", muted);
    if (masterGain && ctx) {
      masterGain.gain.linearRampToValueAtTime(muted ? 0 : 1, ctx.currentTime + 0.1);
    }
    return muted;
  }

  // ═══════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════
  return {
    init,
    startDashboardAmbient,
    startGameMusic,
    stopMusic,
    playIntroSequence,
    sfxCorrect,
    sfxWrong,
    sfxGameOver,
    sfxLevelUp,
    sfxAchievement,
    sfxClick,
    sfxEat,
    sfxHit,
    toggleMute,
    isMuted: () => muted
  };
})();
