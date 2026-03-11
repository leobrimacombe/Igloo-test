/* ============================================================
   IGLOO INC. — Main JS
   Three.js WebGL + GSAP ScrollTrigger + Particles
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ─── Custom Cursor with Trail ────────────────────────────── */
const cursor       = document.createElement('div'); cursor.id = 'cursor';
const cursorFollow = document.createElement('div'); cursorFollow.id = 'cursor-follower';
document.body.append(cursor, cursorFollow);

const TRAIL_COUNT = 12;
const trailDots   = Array.from({ length: TRAIL_COUNT }, () => {
  const dot = document.createElement('div');
  dot.className = 'cursor-trail';
  document.body.appendChild(dot);
  return dot;
});
const trailPos = Array.from({ length: TRAIL_COUNT }, () => ({ x: -200, y: -200 }));

let mx = -200, my = -200, fx = -200, fy = -200;
window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

(function animCursor() {
  cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
  fx += (mx - fx) * 0.12; fy += (my - fy) * 0.12;
  cursorFollow.style.left = fx + 'px'; cursorFollow.style.top = fy + 'px';

  trailPos.unshift({ x: mx, y: my });
  trailPos.pop();
  trailDots.forEach((dot, i) => {
    const p = trailPos[i];
    dot.style.cssText = `left:${p.x}px;top:${p.y}px;opacity:${(1 - i / TRAIL_COUNT) * 0.45};transform:translate(-50%,-50%) scale(${1 - i / TRAIL_COUNT * 0.65})`;
  });
  requestAnimationFrame(animCursor);
})();

/* ─── Click Ripple + Shatter Particles ───────────────────── */
window.addEventListener('click', e => {
  const ripple = document.createElement('div');
  ripple.className = 'click-ripple';
  ripple.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 900);

  for (let i = 0; i < 10; i++) {
    const p = document.createElement('div');
    p.className = 'shatter-particle';
    const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
    const dist  = 50 + Math.random() * 70;
    p.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--tx:${Math.cos(angle) * dist}px;--ty:${Math.sin(angle) * dist}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
});

/* ─── Hero Canvas — Ice Universe ─────────────────────────── */
(function initHero() {
  const canvas   = document.getElementById('hero-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5);

  /* Dynamic light rig */
  scene.add(new THREE.AmbientLight(0x0d1a2e, 2.2));
  const mainLight = new THREE.DirectionalLight(0x7dd4fc, 4.5);
  mainLight.position.set(3, 5, 3);
  scene.add(mainLight);
  const rimLight = new THREE.DirectionalLight(0xa78bfa, 3.5);
  rimLight.position.set(-4, -2, -2);
  scene.add(rimLight);
  const pt1 = new THREE.PointLight(0x38bdf8, 4, 14);
  pt1.position.set(0, 2, 2);
  scene.add(pt1);
  const pt2 = new THREE.PointLight(0xff6ef7, 2.5, 10);
  pt2.position.set(-3, 0, 1);
  scene.add(pt2);
  const pt3 = new THREE.PointLight(0x80ffee, 2.5, 10);
  pt3.position.set(4, -1, -1);
  scene.add(pt3);

  const group = new THREE.Group();
  scene.add(group);

  /* Helper — ice shard mesh */
  function makeIceShard(radius, detail, color, perturb = 0.35) {
    const geo = new THREE.IcosahedronGeometry(radius, detail);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const n = (Math.random() - 0.5) * radius * perturb;
      pos.setXYZ(i, pos.getX(i) + n, pos.getY(i) + n * 0.5, pos.getZ(i) + n);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
      color,
      metalness:        0.05,
      roughness:        0.03,
      transmission:     0.92,
      thickness:        1.8,
      ior:              1.5,
      transparent:      true,
      opacity:          0.93,
      side:             THREE.DoubleSide,
      envMapIntensity:  1.3,
    }));
  }

  /* Main large shard */
  const main = makeIceShard(1.9, 2, 0x9ecae1);
  main.position.set(2.2, -0.2, 0);
  group.add(main);

  /* Ice ring — TorusKnot */
  const ring = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.15, 0.07, 160, 16, 2, 3),
    new THREE.MeshPhysicalMaterial({
      color:        0x7dd4fc,
      metalness:    0.1,
      roughness:    0.02,
      transmission: 0.75,
      thickness:    0.4,
      ior:          1.5,
      transparent:  true,
      opacity:      0.75,
      side:         THREE.DoubleSide,
    })
  );
  ring.position.set(2.5, 0.1, -0.4);
  group.add(ring);

  /* Second ring — rotated */
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.0, 0.025, 16, 120),
    new THREE.MeshPhysicalMaterial({
      color:       0xa78bfa,
      transparent: true,
      opacity:     0.35,
      roughness:   0.1,
      metalness:   0.2,
      side:        THREE.DoubleSide,
    })
  );
  ring2.position.set(2.2, 0, 0);
  ring2.rotation.x = Math.PI / 3;
  group.add(ring2);

  /* Satellite shards */
  const satData = [
    { r: 0.72, color: 0x7dd4fc, pos: [ 3.8,  1.0, -0.5] },
    { r: 0.52, color: 0xa78bfa, pos: [ 1.0,  1.5, -1.0] },
    { r: 0.42, color: 0x38bdf8, pos: [ 3.2, -1.4, -0.3] },
    { r: 0.35, color: 0x7dd4fc, pos: [ 0.6, -1.0, -0.8] },
    { r: 0.28, color: 0xff80ff, pos: [ 4.3,  0.3, -1.2] },
    { r: 0.22, color: 0x80ffee, pos: [ 1.5, -1.9, -0.5] },
  ];
  const satMeshes = satData.map(s => {
    const m = makeIceShard(s.r, 0, s.color);
    m.position.set(...s.pos);
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    group.add(m);
    return m;
  });

  /* Aurora particle field */
  const AURORA_N  = 700;
  const aPos      = new Float32Array(AURORA_N * 3);
  const aColor    = new Float32Array(AURORA_N * 3);
  const palette   = [
    [0.49, 0.83, 0.99],  // cyan
    [0.65, 0.55, 0.98],  // purple
    [1.00, 0.50, 0.97],  // pink
    [0.22, 0.74, 0.98],  // sky blue
    [0.50, 0.98, 0.87],  // mint
  ];
  for (let i = 0; i < AURORA_N; i++) {
    aPos[i*3]   = (Math.random() - 0.5) * 20;
    aPos[i*3+1] = (Math.random() - 0.5) * 13;
    aPos[i*3+2] = (Math.random() - 0.5) * 8 - 3;
    const c = palette[Math.floor(Math.random() * palette.length)];
    aColor[i*3] = c[0]; aColor[i*3+1] = c[1]; aColor[i*3+2] = c[2];
  }
  const aGeo = new THREE.BufferGeometry();
  aGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3));
  aGeo.setAttribute('color',    new THREE.BufferAttribute(aColor, 3));
  const auroraPoints = new THREE.Points(aGeo, new THREE.PointsMaterial({
    size:           0.038,
    transparent:    true,
    opacity:        0.7,
    sizeAttenuation:true,
    vertexColors:   true,
    blending:       THREE.AdditiveBlending,
    depthWrite:     false,
  }));
  scene.add(auroraPoints);

  /* Wireframe icosphere — depth layer */
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.8, 2),
    new THREE.MeshBasicMaterial({ color: 0x1a3d6a, wireframe: true, transparent: true, opacity: 0.07 })
  );
  wire.position.set(2, 0, -4);
  scene.add(wire);

  /* Wireframe torus far back */
  const wireTorus = new THREE.Mesh(
    new THREE.TorusGeometry(4.5, 0.015, 12, 80),
    new THREE.MeshBasicMaterial({ color: 0x7dd4fc, transparent: true, opacity: 0.05 })
  );
  wireTorus.position.set(2, 0, -6);
  wireTorus.rotation.x = 0.4;
  scene.add(wireTorus);

  /* Resize */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* Mouse parallax */
  let tRX = 0, tRY = 0, cRX = 0, cRY = 0;
  window.addEventListener('mousemove', e => {
    tRY = ((e.clientX / window.innerWidth)  - 0.5) *  0.85;
    tRX = ((e.clientY / window.innerHeight) - 0.5) * -0.55;
  });

  /* GSAP scroll animations */
  gsap.to(group.position, {
    x: '-=2.2',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
  });
  gsap.to(group.rotation, {
    y: Math.PI * 0.9,
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 2 }
  });
  gsap.to(wire.rotation, {
    y: Math.PI * 2,
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 4 }
  });

  const clock = new THREE.Clock();
  (function animHero() {
    requestAnimationFrame(animHero);
    const t = clock.getElapsedTime();

    cRX += (tRX - cRX) * 0.05;
    cRY += (tRY - cRY) * 0.05;

    group.rotation.x = cRX + Math.sin(t * 0.35) * 0.06;
    group.rotation.y = cRY + t * 0.1;
    group.position.y = Math.sin(t * 0.45) * 0.18;

    /* Satellites orbit */
    satMeshes.forEach((m, i) => {
      m.rotation.x += 0.005 + i * 0.001;
      m.rotation.y += 0.007 + i * 0.002;
      m.position.y  = satData[i].pos[1] + Math.sin(t * 0.7 + i * 1.3) * 0.14;
    });

    /* Ring rotations */
    ring.rotation.x  = t * 0.28;
    ring.rotation.y  = t * 0.45;
    ring.rotation.z  = t * 0.18;
    ring2.rotation.y = t * 0.15;
    ring2.rotation.z = t * 0.08;

    /* Orbiting lights */
    pt1.position.x = Math.sin(t * 0.6)  *  4;
    pt1.position.y = Math.cos(t * 0.4)  *  2.5;
    pt2.position.x = Math.cos(t * 0.5)  * -3;
    pt2.position.z = Math.sin(t * 0.7)  *  2;
    pt3.position.y = Math.sin(t * 0.35) *  2;
    pt3.position.x = Math.cos(t * 0.45) *  3;

    /* Aurora + wireframes drift */
    auroraPoints.rotation.y = t * 0.04;
    auroraPoints.rotation.x = Math.sin(t * 0.1) * 0.05;
    wire.rotation.x = t * 0.025;
    wireTorus.rotation.y = t * 0.06;
    wireTorus.rotation.x = t * 0.03 + 0.4;

    renderer.render(scene, camera);
  })();
})();

/* ─── Ice Divider Canvas — Animated ─────────────────────── */
(function initIceDivider() {
  const canvas = document.getElementById('ice-canvas');
  const ctx    = canvas.getContext('2d');
  let cells    = [];
  let cols, rows;
  let animTime = 0;

  function buildCells(w, h) {
    cols = Math.ceil(w / 80) + 2;
    rows = Math.ceil(h / 60) + 2;
    cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({
          lightVal: 0.3 + Math.random() * 0.5,
          alpha:    0.04 + Math.random() * 0.13,
        });
      }
    }
  }

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    buildCells(canvas.width, canvas.height);
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);

    /* Animated vertex grid */
    const pts = [];
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        pts.push({
          x: c * 80 + (r % 2 === 0 ? 0 : 40) + Math.sin(animTime * 1.1 + c * 0.45 + r * 0.3) * 11,
          y: r * 60 + Math.cos(animTime * 0.85 + c * 0.3 + r * 0.55) * 9,
        });
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i  = r * (cols + 1) + c;
        const tl = pts[i], tr = pts[i + 1];
        const bl = pts[i + (cols + 1)], br = pts[i + (cols + 1) + 1];
        if (!tl || !tr || !bl || !br) continue;

        const cell = cells[r * cols + c];
        const lv   = cell.lightVal;
        const al   = cell.alpha;

        ctx.beginPath();
        ctx.moveTo(tl.x, tl.y);
        ctx.lineTo(tr.x, tr.y);
        ctx.lineTo(br.x, br.y);
        ctx.lineTo(bl.x, bl.y);
        ctx.closePath();
        ctx.fillStyle   = `rgba(${Math.round(56 + lv * 80)}, ${Math.round(130 + lv * 100)}, ${Math.round(200 + lv * 55)}, ${al})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(125,212,252,${al * 0.55})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }
    }

    /* Fade edges */
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0,    'rgba(10,10,16,1)');
    grad.addColorStop(0.32, 'rgba(10,10,16,0)');
    grad.addColorStop(0.68, 'rgba(15,15,24,0)');
    grad.addColorStop(1,    'rgba(15,15,24,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  window.addEventListener('resize', resize);
  resize();

  (function loop() {
    animTime += 0.018;
    draw();
    requestAnimationFrame(loop);
  })();
})();

/* ─── Card Canvases — Enhanced Ice Shards ────────────────── */
document.querySelectorAll('.card-canvas').forEach(canvas => {
  const color   = canvas.dataset.color || '#7dd4fc';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const w = canvas.offsetWidth || 300;
  const h = 200;
  renderer.setSize(w, h);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.z = 3.5;

  scene.add(new THREE.AmbientLight(0x0d1a2e, 2.5));
  const colorHex = parseInt(color.replace('#', '0x'));
  const dl = new THREE.DirectionalLight(colorHex, 5.5);
  dl.position.set(2, 3, 2);
  scene.add(dl);
  const rl = new THREE.DirectionalLight(0xa78bfa, 3);
  rl.position.set(-3, -1, -1);
  scene.add(rl);
  const pl = new THREE.PointLight(colorHex, 4, 7);
  pl.position.set(0, 0, 2);
  scene.add(pl);

  /* Main shard */
  const geo = new THREE.IcosahedronGeometry(0.95, 1);
  const pAttr = geo.attributes.position;
  for (let i = 0; i < pAttr.count; i++) {
    const n = (Math.random() - 0.5) * 0.44;
    pAttr.setXYZ(i, pAttr.getX(i) + n, pAttr.getY(i) + n * 0.5, pAttr.getZ(i) + n);
  }
  pAttr.needsUpdate = true;
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
    color:       colorHex,
    metalness:   0.05,
    roughness:   0.03,
    transmission:0.90,
    thickness:   1.5,
    ior:         1.48,
    transparent: true,
    opacity:     0.93,
    side:        THREE.DoubleSide,
  }));
  scene.add(mesh);

  /* Mini satellite shards */
  const miniData = [
    { r: 0.18, ox: 1.4,  oy: 0.6,  oz: -0.3 },
    { r: 0.13, ox: -1.2, oy: -0.5, oz: -0.2 },
    { r: 0.15, ox: 0.4,  oy: 1.3,  oz: -0.5 },
  ];
  const miniMeshes = miniData.map(({ r, ox, oy, oz }) => {
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(r, 0),
      new THREE.MeshPhysicalMaterial({ color: colorHex, transmission: 0.85, transparent: true, opacity: 0.82, roughness: 0.1, side: THREE.DoubleSide })
    );
    m.position.set(ox, oy, oz);
    scene.add(m);
    return { mesh: m, ox, oy, oz };
  });

  /* Background particles */
  const pGeo = new THREE.BufferGeometry();
  const pBuf = new Float32Array(80 * 3);
  for (let i = 0; i < 80; i++) {
    pBuf[i*3]   = (Math.random() - 0.5) * 6;
    pBuf[i*3+1] = (Math.random() - 0.5) * 5;
    pBuf[i*3+2] = (Math.random() - 0.5) * 4 - 1;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pBuf, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: colorHex, size: 0.032, transparent: true, opacity: 0.55,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false
  })));

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    mesh.rotation.x = t * 0.22;
    mesh.rotation.y = t * 0.32;
    mesh.position.y = Math.sin(t * 0.65) * 0.1;
    pl.position.x = Math.sin(t * 0.8) * 2;
    pl.position.y = Math.cos(t * 0.6) * 1.5;
    miniMeshes.forEach((s, i) => {
      const a = t * (0.5 + i * 0.2) + i * Math.PI * 0.66;
      s.mesh.position.x = s.ox + Math.cos(a) * 0.18;
      s.mesh.position.y = s.oy + Math.sin(a) * 0.18;
      s.mesh.rotation.y += 0.025;
    });
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    const nw = canvas.offsetWidth || 300;
    renderer.setSize(nw, h);
    camera.aspect = nw / h;
    camera.updateProjectionMatrix();
  });
});

/* ─── Card 3D Tilt + Shine ───────────────────────────────── */
document.querySelectorAll('.venture-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    gsap.to(card, { y: -14, duration: 0.4, ease: 'power2.out', transformPerspective: 1000 });
  });
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    gsap.to(card, { rotationX: -y * 14, rotationY: x * 14, duration: 0.25, ease: 'power2.out', transformPerspective: 1000 });
    card.style.setProperty('--shine-x', (x * 100 + 50) + '%');
    card.style.setProperty('--shine-y', (y * 100 + 50) + '%');
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotationX: 0, rotationY: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', transformPerspective: 1000 });
  });
});

/* ─── Footer Particle Canvas ─────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H;

  const PARTICLE_COUNT = 180;
  const particles = [];
  let mouseX = -9999, mouseY = -9999;

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x     = Math.random() * W;
      this.y     = init ? Math.random() * H : H + 10;
      this.vx    = (Math.random() - 0.5) * 0.55;
      this.vy    = -(Math.random() * 0.65 + 0.2);
      this.r     = Math.random() * 2.5 + 0.5;
      this.life  = 1;
      this.decay = Math.random() * 0.003 + 0.001;
      const hues = [195, 220, 270, 300, 180];
      const hue  = hues[Math.floor(Math.random() * hues.length)] + Math.random() * 20 - 10;
      this.color = `hsla(${hue},90%,70%,`;
    }
    update() {
      const dx   = mouseX - this.x, dy = mouseY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140) { this.vx += (dx / dist) * 0.1; this.vy += (dy / dist) * 0.1; }
      this.vx *= 0.97; this.vy *= 0.97;
      this.x  += this.vx; this.y  += this.vy;
      this.life -= this.decay;
      if (this.life <= 0 || this.y < -20) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.life * 0.7 + ')';
      ctx.fill();
    }
  }

  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  window.addEventListener('resize', resize);
  canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); mouseX = e.clientX - r.left; mouseY = e.clientY - r.top; });
  canvas.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });
  resize();
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  (function loop() {
    requestAnimationFrame(loop);
    ctx.fillStyle = 'rgba(5,5,8,0.12)';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(125,212,252,${(1 - d / 100) * 0.16})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }
    particles.forEach(p => { p.update(); p.draw(); });
  })();
})();

/* ─── Hero Entrance Animation ────────────────────────────── */
window.addEventListener('load', () => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to('.hero-eyebrow',    { opacity: 1, y: 0, duration: 0.9 }, 0.3)
    .to('.hero-title .line',{ opacity: 1, y: 0, duration: 1.1, stagger: 0.13 }, 0.55)
    .to('.hero-sub',        { opacity: 1, y: 0, duration: 0.9 }, 1.05)
    .to('.hero-cta',        { opacity: 1, y: 0, duration: 0.9 }, 1.28);

  /* 3D section reveals */
  gsap.utils.toArray('#about, #ventures, #contact').forEach(section => {
    gsap.from(section, {
      rotateX:   6,
      y:         50,
      opacity:   0,
      duration:  1.3,
      ease:      'power3.out',
      scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none none' },
    });
  });
});

/* ─── Scroll Reveal ──────────────────────────────────────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll(
  '.about-label, .ventures-label, .contact-label, ' +
  '.about-grid, .section-title, .about-right p, ' +
  '.ventures-sub, .contact-sub, .venture-card, .about-stats'
).forEach((el, i) => {
  el.classList.add('reveal');
  if (i % 3 === 1) el.classList.add('reveal-delay-1');
  if (i % 3 === 2) el.classList.add('reveal-delay-2');
  observer.observe(el);
});

/* ─── Stat Counter Animation ─────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const start  = performance.now();
  (function step(now) {
    const p      = Math.min((now - start) / 2200, 1);
    const eased  = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target);
    if (p < 1) requestAnimationFrame(step); else el.textContent = target;
  })(start);
}

const statObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.querySelectorAll('.stat-num').forEach(animateCounter); statObserver.unobserve(entry.target); }
  });
}, { threshold: 0.5 });
const statsEl = document.querySelector('.about-stats');
if (statsEl) statObserver.observe(statsEl);

/* ─── Nav Scroll Style ────────────────────────────────────── */
window.addEventListener('scroll', () => {
  document.getElementById('nav').style.background =
    window.scrollY > 60 ? 'rgba(5,5,8,0.97)' : 'rgba(5,5,8,0.6)';
});

/* ─── Text Scramble Effect ─────────────────────────────────── */
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    this.queue = []; this.frame = 0; this.frameReq = null;
  }
  setText(newText) {
    const old = this.el.innerText;
    const len = Math.max(old.length, newText.length);
    const prom = new Promise(r => this.resolve = r);
    this.queue = [];
    for (let i = 0; i < len; i++) {
      const s = Math.floor(Math.random() * 10);
      this.queue.push({ from: old[i] || '', to: newText[i] || '', start: s, end: s + Math.floor(Math.random() * 12) + 4 });
    }
    cancelAnimationFrame(this.frameReq);
    this.frame = 0; this.update(); return prom;
  }
  update() {
    let out = '', done = 0;
    for (let i = 0; i < this.queue.length; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) { done++; out += to; }
      else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) { char = this.chars[Math.floor(Math.random() * this.chars.length)]; this.queue[i].char = char; }
        out += `<span style="color:var(--ice-blue);opacity:0.7">${char}</span>`;
      } else { out += from; }
    }
    this.el.innerHTML = out;
    if (done === this.queue.length) this.resolve();
    else this.frameReq = requestAnimationFrame(() => { this.frame++; this.update(); });
  }
}

const logoEl = document.querySelector('.nav-logo .logo-text');
if (logoEl) {
  const fx = new TextScramble(logoEl);
  let busy = false;
  logoEl.parentElement.addEventListener('mouseenter', () => {
    if (!busy) { busy = true; fx.setText('IGLOO').then(() => { busy = false; }); }
  });
}

/* ─── Magnetic Buttons ───────────────────────────────────── */
document.querySelectorAll('.btn-primary, .btn-outline').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width  / 2;
    const y = e.clientY - r.top  - r.height / 2;
    gsap.to(btn, { x: x * 0.32, y: y * 0.32, duration: 0.3, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
  });
});
