/* ============================================================
   IGLOO INC. — Main JS
   Three.js WebGL + GSAP ScrollTrigger + Particles
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ─── Custom Cursor ──────────────────────────────────────── */
const cursor       = document.createElement('div'); cursor.id = 'cursor';
const cursorFollow = document.createElement('div'); cursorFollow.id = 'cursor-follower';
document.body.append(cursor, cursorFollow);

let mx = -100, my = -100, fx = -100, fy = -100;
window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
(function animCursor() {
  cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
  fx += (mx - fx) * 0.12; fy += (my - fy) * 0.12;
  cursorFollow.style.left = fx + 'px'; cursorFollow.style.top  = fy + 'px';
  requestAnimationFrame(animCursor);
})();

/* ─── Hero Canvas — Ice Shard (Three.js) ─────────────────── */
(function initHero() {
  const canvas   = document.getElementById('hero-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5);

  /* Ambient + directional lights */
  scene.add(new THREE.AmbientLight(0x1a2a4a, 1.5));
  const dirLight = new THREE.DirectionalLight(0x7dd4fc, 3);
  dirLight.position.set(3, 5, 3);
  scene.add(dirLight);
  const rimLight = new THREE.DirectionalLight(0xa78bfa, 2);
  rimLight.position.set(-4, -2, -2);
  scene.add(rimLight);
  const pointLight = new THREE.PointLight(0x38bdf8, 2, 10);
  pointLight.position.set(0, 2, 2);
  scene.add(pointLight);

  /* Ice crystal group */
  const group = new THREE.Group();
  scene.add(group);

  /* Helper: random ice-like geometry */
  function makeIceShard(radius, detail, color) {
    const geo = new THREE.IcosahedronGeometry(radius, detail);
    // Perturb vertices for crystal feel
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const noise = (Math.random() - 0.5) * radius * 0.35;
      pos.setXYZ(i, x + noise, y + noise * 0.5, z + noise);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.88,
      thickness: 1.5,
      ior: 1.45,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      envMapIntensity: 1,
    });
    return new THREE.Mesh(geo, mat);
  }

  /* Main large shard */
  const main = makeIceShard(1.6, 1, 0x9ecae1);
  main.position.set(2.2, -0.2, 0);
  group.add(main);

  /* Smaller satellite shards */
  const satellites = [
    { r: 0.7,  color: 0x7dd4fc, pos: [3.8, 1.0,  -0.5] },
    { r: 0.5,  color: 0xa78bfa, pos: [1.0, 1.5,  -1.0] },
    { r: 0.4,  color: 0x38bdf8, pos: [3.2, -1.4, -0.3] },
    { r: 0.3,  color: 0x7dd4fc, pos: [0.6, -1.0, -0.8] },
  ];
  const satMeshes = satellites.map(s => {
    const m = makeIceShard(s.r, 0, s.color);
    m.position.set(...s.pos);
    m.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    group.add(m);
    return m;
  });

  /* Floating particles behind */
  const particleGeo = new THREE.BufferGeometry();
  const pCount = 200;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i*3]   = (Math.random() - 0.5) * 12;
    pPos[i*3+1] = (Math.random() - 0.5) * 8;
    pPos[i*3+2] = (Math.random() - 0.5) * 6 - 2;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x7dd4fc,
    size: 0.025,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true
  });
  scene.add(new THREE.Points(particleGeo, particleMat));

  /* Resize */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* Mouse parallax */
  let targetRX = 0, targetRY = 0, currentRX = 0, currentRY = 0;
  window.addEventListener('mousemove', e => {
    targetRY = ((e.clientX / window.innerWidth)  - 0.5) * 0.6;
    targetRX = ((e.clientY / window.innerHeight) - 0.5) * -0.4;
  });

  /* GSAP scroll: shard drifts left + fades */
  gsap.to(group.position, {
    x: '-=1.5',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
  });
  gsap.to(group.rotation, {
    y: Math.PI * 0.6,
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 2 }
  });

  /* Animate loop */
  const clock = new THREE.Clock();
  (function animHero() {
    requestAnimationFrame(animHero);
    const t = clock.getElapsedTime();

    currentRX += (targetRX - currentRX) * 0.05;
    currentRY += (targetRY - currentRY) * 0.05;
    group.rotation.x = currentRX + Math.sin(t * 0.4) * 0.04;
    group.rotation.y = currentRY + t * 0.12;
    group.position.y = Math.sin(t * 0.5) * 0.12;

    satMeshes.forEach((m, i) => {
      m.rotation.x += 0.004 + i * 0.001;
      m.rotation.y += 0.006 + i * 0.002;
      m.position.y  = satellites[i].pos[1] + Math.sin(t * 0.7 + i) * 0.1;
    });

    pointLight.position.x = Math.sin(t * 0.6) * 3;
    pointLight.position.y = Math.cos(t * 0.4) * 2;

    renderer.render(scene, camera);
  })();
})();

/* ─── Ice Divider Canvas ────────────────────────────────── */
(function initIceDivider() {
  const canvas = document.getElementById('ice-canvas');
  const ctx    = canvas.getContext('2d');

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw();
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    /* Crystalline polygon background */
    const cols = Math.ceil(w / 80) + 2;
    const rows = Math.ceil(h / 60) + 2;
    const pts  = [];
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        pts.push({
          x: c * 80 + (r % 2 === 0 ? 0 : 40) + (Math.random() - 0.5) * 25,
          y: r * 60 + (Math.random() - 0.5) * 20
        });
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i  = r * (cols + 1) + c;
        const tl = pts[i];
        const tr = pts[i + 1];
        const bl = pts[i + (cols + 1)];
        const br = pts[i + (cols + 1) + 1];
        if (!tl || !tr || !bl || !br) continue;

        const lightVal = 0.3 + Math.random() * 0.5;
        const alpha    = 0.04 + Math.random() * 0.12;

        ctx.beginPath();
        ctx.moveTo(tl.x, tl.y);
        ctx.lineTo(tr.x, tr.y);
        ctx.lineTo(br.x, br.y);
        ctx.lineTo(bl.x, bl.y);
        ctx.closePath();

        ctx.fillStyle = `rgba(${Math.round(56 + lightVal * 80)}, ${Math.round(130 + lightVal * 100)}, ${Math.round(200 + lightVal * 50)}, ${alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(125, 212, 252, ${alpha * 0.6})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    /* Gradient overlay */
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(10,10,16,1)');
    grad.addColorStop(0.3, 'rgba(10,10,16,0)');
    grad.addColorStop(0.7, 'rgba(15,15,24,0)');
    grad.addColorStop(1, 'rgba(15,15,24,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  window.addEventListener('resize', resize);
  resize();
})();

/* ─── Card Canvases — Mini Ice Shards ───────────────────── */
document.querySelectorAll('.card-canvas').forEach(canvas => {
  const color = canvas.dataset.color || '#7dd4fc';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const w = canvas.offsetWidth || 300;
  const h = 200;
  renderer.setSize(w, h);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.z = 3.5;

  scene.add(new THREE.AmbientLight(0x1a2a4a, 2));
  const dl = new THREE.DirectionalLight(parseInt(color.replace('#','0x')), 4);
  dl.position.set(2, 3, 2); scene.add(dl);
  const rl = new THREE.DirectionalLight(0xa78bfa, 2);
  rl.position.set(-3, -1, -1); scene.add(rl);

  const colorNum = parseInt(color.replace('#','0x'));
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const n = (Math.random() - 0.5) * 0.4;
    pos.setXYZ(i, pos.getX(i) + n, pos.getY(i) + n * 0.5, pos.getZ(i) + n);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const mat = new THREE.MeshPhysicalMaterial({
    color: colorNum,
    metalness: 0.05,
    roughness: 0.08,
    transmission: 0.85,
    thickness: 1.2,
    ior: 1.4,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    mesh.rotation.x = t * 0.25;
    mesh.rotation.y = t * 0.35;
    mesh.position.y = Math.sin(t * 0.7) * 0.08;
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    const nw = canvas.offsetWidth || 300;
    renderer.setSize(nw, h);
    camera.aspect = nw / h;
    camera.updateProjectionMatrix();
  });
});

/* ─── Footer Particle Canvas ────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H;

  const PARTICLE_COUNT = 120;
  const particles = [];
  let mouseX = -9999, mouseY = -9999;

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 10;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -(Math.random() * 0.5 + 0.2);
      this.r  = Math.random() * 2 + 0.5;
      this.life = 1;
      this.decay = Math.random() * 0.003 + 0.001;
      const hue = 195 + Math.random() * 60;
      this.color = `hsla(${hue}, 90%, 70%, `;
    }
    update() {
      const dx = mouseX - this.x, dy = mouseY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        this.vx += (dx / dist) * 0.08;
        this.vy += (dy / dist) * 0.08;
      }
      this.vx *= 0.98; this.vy *= 0.98;
      this.x += this.vx; this.y += this.vy;
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

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  window.addEventListener('resize', resize);
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

  resize();
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  (function loop() {
    requestAnimationFrame(loop);
    ctx.fillStyle = 'rgba(5,5,8,0.15)';
    ctx.fillRect(0, 0, W, H);

    /* Subtle glow connections */
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < 80) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(125,212,252,${(1 - d/80) * 0.12})`;
          ctx.lineWidth = 0.5;
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
  tl.to('.hero-eyebrow',  { opacity: 1, y: 0, duration: 0.8 }, 0.3)
    .to('.hero-title .line', { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.55)
    .to('.hero-sub',      { opacity: 1, y: 0, duration: 0.8 }, 1.0)
    .to('.hero-cta',      { opacity: 1, y: 0, duration: 0.8 }, 1.2);
});

/* ─── Scroll Reveal ──────────────────────────────────────── */
const reveals = document.querySelectorAll('.reveal, .about-label, .ventures-label, .contact-label, .about-grid, .ventures-grid, .section-title, .about-right, .ventures-sub, .contact-sub, .btn-primary');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

/* Add reveal class to elements */
document.querySelectorAll(
  '.about-label, .ventures-label, .contact-label, ' +
  '.about-grid, .section-title, .about-right p, ' +
  '.ventures-sub, .contact-sub, .venture-card, ' +
  '.about-stats'
).forEach((el, i) => {
  el.classList.add('reveal');
  if (i % 3 === 1) el.classList.add('reveal-delay-1');
  if (i % 3 === 2) el.classList.add('reveal-delay-2');
  observer.observe(el);
});

/* ─── Stat Counter Animation ─────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 2000;
  const start = performance.now();
  (function step(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(p * target);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  })(start);
}

const statObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-num').forEach(animateCounter);
      statObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const statsEl = document.querySelector('.about-stats');
if (statsEl) statObserver.observe(statsEl);

/* ─── Nav Scroll Style ────────────────────────────────────── */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (window.scrollY > 60) {
    nav.style.background = 'rgba(5,5,8,0.95)';
  } else {
    nav.style.background = 'rgba(5,5,8,0.6)';
  }
});

/* ─── Text Scramble Effect ─────────────────────────────────── */
class TextScramble {
  constructor(el) {
    this.el    = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    this.queue = [];
    this.frame = 0;
    this.frameReq = null;
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const len     = Math.max(oldText.length, newText.length);
    const promise = new Promise(res => this.resolve = res);
    this.queue = [];
    for (let i = 0; i < len; i++) {
      const from  = oldText[i]  || '';
      const to    = newText[i]  || '';
      const start = Math.floor(Math.random() * 10);
      const end   = start + Math.floor(Math.random() * 12) + 4;
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameReq);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '', complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span style="color:var(--ice-blue);opacity:0.7">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameReq = requestAnimationFrame(() => { this.frame++; this.update(); });
    }
  }
}

/* Apply scramble on hover to nav logo */
const logoEl = document.querySelector('.nav-logo .logo-text');
if (logoEl) {
  const fx = new TextScramble(logoEl);
  let isScrambling = false;
  logoEl.parentElement.addEventListener('mouseenter', () => {
    if (!isScrambling) {
      isScrambling = true;
      fx.setText('IGLOO').then(() => { isScrambling = false; });
    }
  });
}
