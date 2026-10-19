import React, { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
// Daun Kaca Oren — gugur, interaksi tetikus, jatuh ke bawah langsung pecah
// dengan serpihan kaca dan percikan cahaya oren yang cantik & lembut
// ─────────────────────────────────────────────────────────────

const MAX_LEAVES = 16;
const rand = (a, b) => a + Math.random() * (b - a);

// ── Audio (Web Audio API) Sintesis Bunyi Kaca Pecah Realistik & Lembut ──
function createAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0.5;
  const soften = ctx.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = 8500;
  master.connect(soften);
  soften.connect(ctx.destination);

  const len = Math.floor(ctx.sampleRate * 0.25);
  const noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);

  return { ctx, master, noiseBuf, last: 0 };
}

function playShatter(audio, power = 1) {
  if (!audio || audio.ctx.state !== 'running') return;
  const { ctx, master, noiseBuf } = audio;
  const now = ctx.currentTime;
  if (now - audio.last < 0.04) return;
  audio.last = now;

  // 1. Crack / retak hingar lembut
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = rand(2200, 3600);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.24 * power, now);
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  src.connect(hp); hp.connect(ng); ng.connect(master);
  src.start(now);

  // 2. Denting kristal/kaca halus
  const pieces = Math.round(rand(6, 11));
  for (let i = 0; i < pieces; i++) {
    const t = now + rand(0.005, 0.18);
    const f = rand(2200, 7800);
    const dur = rand(0.06, 0.28);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(rand(0.02, 0.05) * power, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(master);

    [1, 2.76].forEach((mult, k) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mult;
      const og = ctx.createGain();
      og.gain.value = k === 0 ? 1 : 0.35;
      o.connect(og); og.connect(g);
      o.start(t);
      o.stop(t + dur + 0.02);
    });
  }
}

// ── Bentuk Daun Kaca ──
function leafPath(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.95, -s * 0.45, s * 0.8, s * 0.55, 0, s);
  ctx.bezierCurveTo(-s * 0.8, s * 0.55, -s * 0.95, -s * 0.45, 0, -s);
  ctx.closePath();
}

function drawLeaf(ctx, l) {
  ctx.save();
  ctx.translate(l.x, l.y);
  ctx.rotate(l.rot);
  ctx.globalAlpha = l.alpha;
  const s = l.size;

  const grad = ctx.createLinearGradient(-s, -s, s, s);
  grad.addColorStop(0, `hsla(${l.hue + 8}, 100%, 72%, 0.55)`);
  grad.addColorStop(1, `hsla(${l.hue - 8}, 95%, 52%, 0.22)`);

  ctx.shadowColor = 'rgba(249, 115, 22, 0.55)';
  ctx.shadowBlur = 18;
  leafPath(ctx, s);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(255, 225, 185, 0.65)';
  ctx.stroke();

  // Urat daun + tangkai
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 235, 205, 0.45)';
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.92);
  ctx.lineTo(0, s * 1.2);
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    ctx.moveTo(0, i * s * 0.28);
    ctx.lineTo(Math.sign(i) * s * 0.5, i * s * 0.28 - s * 0.22);
    ctx.moveTo(0, i * s * 0.28);
    ctx.lineTo(-Math.sign(i) * s * 0.5, i * s * 0.28 - s * 0.22);
  }
  ctx.stroke();

  // Kilauan kaca
  leafPath(ctx, s);
  ctx.clip();
  const shine = ctx.createLinearGradient(-s, -s, 0, 0);
  shine.addColorStop(0, 'rgba(255,255,255,0.4)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(-s, -s, s * 1.2, s * 1.2);
  ctx.restore();
}

function makeLeaf(w, h, fromTop = true) {
  const size = rand(20, 36);
  return {
    x: rand(20, w - 20),
    y: fromTop ? rand(-h * 0.3, -size * 2) : rand(0, h * 0.7),
    vx: rand(-0.35, 0.35),
    vy: rand(0.7, 1.4),
    rot: rand(0, Math.PI * 2),
    vr: rand(-0.02, 0.02),
    size,
    hue: rand(22, 36),
    phase: rand(0, Math.PI * 2),
    sway: rand(0.3, 0.7),
    alpha: 1,
    grabbed: false,
  };
}

// ── Serpihan Kaca Tajam & Berkilau ──
function makeShards(l, impact = 1, isFloor = false) {
  const n = Math.round(rand(14, 20));
  const shards = [];
  for (let i = 0; i < n; i++) {
    // Jika pecah di lantai, lantunkan serpihan ke atas membentuk percikan cantik
    const ang = isFloor ? rand(-Math.PI * 0.95, -Math.PI * 0.05) : rand(0, Math.PI * 2);
    const dist = rand(0, l.size * 0.7);
    const speed = rand(1.2, 4.5) * impact;
    shards.push({
      x: l.x + Math.cos(ang) * dist,
      y: l.y + Math.sin(ang) * dist,
      vx: Math.cos(ang) * speed + (l.vx * 0.5),
      vy: Math.sin(ang) * speed - (isFloor ? rand(1.5, 4.2) : 0),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.25, 0.25),
      r: rand(4, l.size * 0.42),
      hue: l.hue + rand(-5, 5),
      life: 1,
      decay: rand(0.01, 0.02),
    });
  }
  return shards;
}

function drawShard(ctx, s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rot);
  ctx.globalAlpha = Math.max(0, s.life);
  ctx.beginPath();
  ctx.moveTo(0, -s.r);
  ctx.lineTo(s.r * 0.8, s.r * 0.6);
  ctx.lineTo(-s.r * 0.5, s.r * 0.45);
  ctx.closePath();
  ctx.fillStyle = `hsla(${s.hue}, 100%, 65%, 0.55)`;
  ctx.shadowColor = 'rgba(249, 115, 22, 0.7)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 235, 205, 0.85)';
  ctx.stroke();
  ctx.restore();
}

// ── Percikan Cahaya Oren Lembut Apabila Daun Pecah di Lantai ──
function makeGlowSparkles(x, y, count = 12) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const ang = rand(-Math.PI * 0.95, -Math.PI * 0.05); // memancar ke atas
    const speed = rand(1, 4.5);
    list.push({
      x,
      y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed - rand(0.5, 2),
      r: rand(4, 14),
      hue: rand(20, 38),
      life: 1,
      decay: rand(0.015, 0.03),
    });
  }
  return list;
}

function drawGlowSparkle(ctx, p) {
  const a = Math.max(0, p.life);
  const r = p.r * (0.5 + 0.5 * a);
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
  g.addColorStop(0, `hsla(${p.hue + 10}, 100%, 82%, ${0.8 * a})`);
  g.addColorStop(0.4, `hsla(${p.hue}, 100%, 60%, ${0.45 * a})`);
  g.addColorStop(1, `hsla(${p.hue - 6}, 100%, 50%, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
}

export default function GlassLeaves() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let leaves = Array.from({ length: 9 }, () => makeLeaf(w, h, false));
    let shards = [];
    let sparkles = [];
    let ripples = []; // bulatan gelombang oren lembut di lantai
    let spawnTimer = 0;
    let audio = null;

    const mouse = { x: -999, y: -999, px: -999, py: -999, vx: 0, vy: 0, down: false, held: null };
    const MOUSE_R = 26;

    const ensureAudio = () => {
      if (!audio) audio = createAudio();
      if (audio && audio.ctx.state === 'suspended') audio.ctx.resume();
    };

    // Fungsi memecahkan daun
    const shatter = (leaf, impact = 1, isFloor = false) => {
      shards.push(...makeShards(leaf, impact, isFloor));
      sparkles.push(...makeGlowSparkles(leaf.x, leaf.y, isFloor ? 14 : 8));
      if (isFloor) {
        ripples.push({ x: leaf.x, y: h - 4, r: 6, maxR: rand(35, 60), life: 1 });
      }
      playShatter(audio, Math.min(1.2, 0.5 + impact * 0.35));
      if (mouse.held === leaf) mouse.held = null;
      leaves = leaves.filter((l) => l !== leaf);
    };

    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onDown = (e) => {
      ensureAudio();
      mouse.down = true;
      if (e.target.closest && e.target.closest('input,button,a,label,select,textarea')) return;
      let best = null, bd = Infinity;
      leaves.forEach((l) => {
        const d = Math.hypot(l.x - e.clientX, l.y - e.clientY);
        if (d < l.size * 1.1 + MOUSE_R && d < bd) { best = l; bd = d; }
      });
      if (best) { best.grabbed = true; mouse.held = best; }
    };
    const onUp = () => {
      mouse.down = false;
      if (mouse.held) {
        mouse.held.grabbed = false;
        mouse.held.vx = mouse.vx * 0.9;
        mouse.held.vy = mouse.vy * 0.9;
        mouse.held.vr = (mouse.vx - mouse.vy) * 0.01;
        mouse.held = null;
      }
    };
    const onKey = () => ensureAudio();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', ensureAudio, { passive: true });

    let time = 0;
    const tick = () => {
      time += 0.016;
      ctx.clearRect(0, 0, w, h);

      if (mouse.px > -900) {
        mouse.vx = mouse.vx * 0.6 + (mouse.x - mouse.px) * 0.4;
        mouse.vy = mouse.vy * 0.6 + (mouse.y - mouse.py) * 0.4;
      }
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      const mSpeed = Math.hypot(mouse.vx, mouse.vy);

      // Spawn daun baharu secara berterusan
      spawnTimer += 1;
      if (spawnTimer > 40 && leaves.length < MAX_LEAVES) {
        leaves.push(makeLeaf(w, h, true));
        spawnTimer = 0;
      }

      // Senarai daun yang perlu dipecahkan dalam pusingan ini
      const toBreak = new Map();

      for (const l of leaves) {
        if (l.grabbed) {
          l.x += (mouse.x - l.x) * 0.35;
          l.y += (mouse.y - l.y) * 0.35;
          l.vx = mouse.vx; l.vy = mouse.vy;
          l.rot += 0.03;

          // Jika daun yang dipegang disentuhkan/dihempaskan ke bawah lantai
          if (l.y + l.size * 0.5 >= h) {
            toBreak.set(l, { impact: 1.2, isFloor: true });
          }
          continue;
        }

        // Fizik daun melayang turun
        l.vx += Math.sin(time * 1.3 + l.phase) * 0.012 * l.sway;
        l.vy += (0.95 - l.vy) * 0.015;
        l.vx *= 0.995;
        l.x += l.vx;
        l.y += l.vy;
        l.rot += l.vr + Math.sin(time + l.phase) * 0.005;

        // 🌟 PERMINTAAN PENTING: Daun jatuh sampai di bawah (lantai) LANGSUNG PECAH!
        if (l.y + l.size * 0.5 >= h && l.y > 0) {
          l.y = h - l.size * 0.5;
          toBreak.set(l, { impact: 1.0, isFloor: true });
          continue;
        }

        // Tetikus menolak / melanggar daun
        const dx = l.x - mouse.x, dy = l.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        const reach = l.size * 0.85 + MOUSE_R;
        if (!mouse.held && dist < reach && dist > 0.01) {
          if (mSpeed > 16) {
            toBreak.set(l, { impact: Math.min(2.2, mSpeed / 14), isFloor: false });
          } else {
            const push = (reach - dist) / reach;
            l.vx += (dx / dist) * push * 2.2 + mouse.vx * 0.06;
            l.vy += (dy / dist) * push * 2.2 + mouse.vy * 0.06;
            l.vr += (Math.random() - 0.5) * 0.02;
          }
        }
      }

      // Perlanggaran daun dengan daun lain (langgar sesama sendiri langsung pecah)
      for (let i = 0; i < leaves.length; i++) {
        for (let j = i + 1; j < leaves.length; j++) {
          const a = leaves[i], b = leaves[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          if (dist < (a.size + b.size) * 0.72) {
            const rel = Math.hypot(a.vx - b.vx, a.vy - b.vy);
            const involvesHeld = a.grabbed || b.grabbed;
            if (involvesHeld || rel > 0.8) {
              toBreak.set(a, { impact: Math.max(1, 1 + rel * 0.4), isFloor: false });
              toBreak.set(b, { impact: Math.max(1, 1 + rel * 0.4), isFloor: false });
            } else if (dist > 0.01) {
              a.vx -= (dx / dist) * 0.2; a.vy -= (dy / dist) * 0.2;
              b.vx += (dx / dist) * 0.2; b.vy += (dy / dist) * 0.2;
            }
          }
        }
      }

      // Laksanakan pecahan daun
      toBreak.forEach(({ impact, isFloor }, leaf) => {
        shatter(leaf, impact, isFloor);
      });

      // Kemas kini serpihan kaca
      for (const s of shards) {
        s.vy += 0.12; // graviti serpihan
        s.vx *= 0.99;
        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.vr;
        s.life -= s.decay;
      }
      shards = shards.filter((s) => s.life > 0 && s.y < h + 30);

      // Kemas kini percikan cahaya oren lembut
      for (const p of sparkles) {
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.vy -= 0.015; // sedikit naik ke atas
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
      }
      sparkles = sparkles.filter((p) => p.life > 0);

      // Kemas kini gelombang ripple di lantai
      for (const r of ripples) {
        r.r += (r.maxR - r.r) * 0.12;
        r.life -= 0.028;
      }
      ripples = ripples.filter((r) => r.life > 0);

      // ── Lukis Gelombang Ripple Lantai ──
      ctx.save();
      for (const r of ripples) {
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.32, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(249, 115, 22, ${Math.max(0, r.life) * 0.45})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(249, 115, 22, 0.7)';
        ctx.shadowBlur = 10;
        ctx.stroke();
      }
      ctx.restore();

      // ── Lukis Daun Kaca ──
      leaves.forEach((l) => drawLeaf(ctx, l));

      // ── Lukis Serpihan Kaca ──
      shards.forEach((s) => drawShard(ctx, s));

      // ── Lukis Percikan Cahaya Oren Lembut ──
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      sparkles.forEach((p) => drawGlowSparkle(ctx, p));
      ctx.restore();

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', ensureAudio);
      if (audio) audio.ctx.close();
    };
  }, []);

  return <canvas ref={canvasRef} className="glass-leaves-canvas" aria-hidden="true" />;
}
