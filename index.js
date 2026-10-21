
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { FontLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/geometries/TextGeometry.js";

const $ = (selector) => document.querySelector(selector);
const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = window.matchMedia("(max-width: 600px)").matches;

const boot = $("#boot-screen");
const progress = $("#boot-progress");
const bootStatus = $("#boot-status");
const toast = $("#toast");

let toastTimeout;
let motionEnabled = !reducedMotion;
let sceneReady = false;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2400);
}

const bootMessages = [
  "INITIALIZING SPACETIME...",
  "CALIBRATING OPTICAL SENSORS...",
  "SUMMONING DIGITAL MATTER...",
  "STABILIZING REALITY...",
  "WELCOME TO THE VOID."
];

let bootStep = 0;
const bootInterval = setInterval(() => {
  bootStep++;
  progress.style.width = `${Math.min(bootStep * 25, 100)}%`;
  bootStatus.textContent = bootMessages[Math.min(bootStep, bootMessages.length - 1)];

  if (bootStep >= 4 && sceneReady) {
    clearInterval(bootInterval);
    setTimeout(() => boot.classList.add("done"), 350);
  }
}, 220);

// ---------------------------------------------------------------------
// THREE.JS: THE UNIVERSE
// ---------------------------------------------------------------------

const canvas = $("#world");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#050611");
scene.fog = new THREE.FogExp2("#050611", 0.022);

const camera = new THREE.PerspectiveCamera(
  48,
  window.innerWidth / window.innerHeight,
  0.1,
  180
);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !mobile,
  alpha: false,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.35 : 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

const universe = new THREE.Group();
scene.add(universe);

const ambient = new THREE.AmbientLight(0x9ba6ff, 1.05);
scene.add(ambient);

function makeLight(color, intensity, position, distance = 30) {
  const light = new THREE.PointLight(color, intensity, distance, 2);
  light.position.set(...position);
  scene.add(light);
  return light;
}

const cyanLight = makeLight(0x54f5ff, 38, [-5, 2, 5]);
const purpleLight = makeLight(0x9161ff, 48, [5, 1, -4]);
const pinkLight = makeLight(0xff6bd6, 25, [0, -5, 3]);

// ---------------------------------------------------------------------
// STARS: layered particles at different depths
// ---------------------------------------------------------------------

function createStarfield(count, spread, depth, size, opacity) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const colorA = new THREE.Color("#73dfff");
  const colorB = new THREE.Color("#c6a3ff");
  const colorC = new THREE.Color("#ffffff");

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = (Math.random() - 0.5) * depth;

    const c = [colorA, colorB, colorC][Math.floor(Math.random() * 3)];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size,
    transparent: true,
    opacity,
    vertexColors: true,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  universe.add(points);
  return points;
}

const farStars = createStarfield(1700, 85, 65, 0.045, 0.65);
const nearStars = createStarfield(500, 48, 28, 0.075, 0.85);
const dust = createStarfield(350, 35, 18, 0.025, 0.35);

// ---------------------------------------------------------------------
// PROCEDURAL GLASS MATERIAL
// ---------------------------------------------------------------------

function makeGlassMaterial(color, opacity = 0.24) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.15,
    roughness: 0.12,
    transmission: 0.42,
    thickness: 1.4,
    ior: 1.35,
    transparent: true,
    opacity,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    emissive: color,
    emissiveIntensity: 0.12,
    side: THREE.DoubleSide
  });
}

function makeWireMaterial(color, opacity = 0.7) {
  return new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

// ---------------------------------------------------------------------
// FLOATING ORBS: glass cores, polygon outlines and halos
// ---------------------------------------------------------------------

const orbGroup = new THREE.Group();
universe.add(orbGroup);

const orbData = [];
const orbColors = [0x79f6ff, 0xa18aff, 0xff8bdf, 0x9ce9ff, 0xd7c3ff];

function createOrb(index, radius, position, color) {
  const group = new THREE.Group();
  group.position.set(...position);

  const segments = mobile ? 12 : 20;
  const geometry = new THREE.IcosahedronGeometry(radius, 1);

  const core = new THREE.Mesh(
    geometry,
    makeGlassMaterial(color, 0.3)
  );
  group.add(core);

  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius * 1.015, 1),
    makeWireMaterial(color, 0.38)
  );
  group.add(wire);

  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius * 0.78, 0),
    new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    })
  );
  group.add(inner);

  const haloMaterial = new THREE.SpriteMaterial({
    map: makeGlowTexture(color),
    color,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const halo = new THREE.Sprite(haloMaterial);
  halo.scale.set(radius * 4.8, radius * 4.8, 1);
  group.add(halo);

  // Tiny satellite
  const satellite = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius * 0.11, 0),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  satellite.position.set(radius * 1.3, radius * 0.35, radius * 0.3);
  group.add(satellite);

  orbGroup.add(group);

  orbData.push({
    group,
    core,
    wire,
    inner,
    halo,
    satellite,
    base: new THREE.Vector3(...position),
    phase: Math.random() * Math.PI * 2,
    speed: 0.25 + Math.random() * 0.4,
    amplitude: 0.25 + Math.random() * 0.5,
    radius,
    index
  });
}

function makeGlowTexture(color) {
  const size = 64;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - size / 2) / (size / 2);
      const dy = (y - size / 2) / (size / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const alpha = Math.max(0, 1 - distance);
      const falloff = Math.pow(alpha, 2.6);
      const i = (y * size + x) * 4;

      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(falloff * 255);
    }
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat
  );
  texture.needsUpdate = true;
  return texture;
}

const orbPositions = [
  [-5.6, 2.5, -2.5],
  [5.7, 2.0, -4],
  [-6.5, -2.0, -1],
  [5.1, -2.8, -2],
  [0, 4.6, -6],
  [1.8, -4.2, -4],
  [-3.8, 0.1, -7]
];

orbPositions.forEach((position, i) => {
  const radius = [0.55, 0.9, 0.34, 0.65, 0.28, 0.48, 0.23][i];
  createOrb(i, radius, position, orbColors[i % orbColors.length]);
});

// ---------------------------------------------------------------------
// GEOMETRIC RELICS: PS1-inspired faceted rings and orbital structures
// ---------------------------------------------------------------------

const relics = new THREE.Group();
universe.add(relics);

function createRelic(position, scale, color, type = 0) {
  const group = new THREE.Group();
  group.position.set(...position);
  group.scale.setScalar(scale);

  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(type === 0 ? 1 : 0.8, 0.008, 3, 48),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6
    })
  );
  group.add(torus);

  const poly = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.65, 0),
    new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.42
    })
  );
  group.add(poly);

  const axis = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16, 0),
    new THREE.MeshPhysicalMaterial({
      color: 0xe2fcff,
      metalness: 0.8,
      roughness: 0.15,
      emissive: color,
      emissiveIntensity: 0.35
    })
  );
  group.add(axis);

  if (type === 1) {
    const secondRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.006, 3, 32),
      new THREE.MeshBasicMaterial({
        color: 0x987dff,
        transparent: true,
        opacity: 0.38
      })
    );
    secondRing.rotation.x = Math.PI / 2.7;
    group.add(secondRing);
  }

  relics.add(group);
  return group;
}

const relicObjects = [
  createRelic([-4.7, 1.0, -5.5], 0.65, 0x8c80ff, 1),
  createRelic([4.5, -0.6, -6.5], 0.8, 0x72f5ff, 0),
  createRelic([2.9, 3.2, -8], 0.48, 0xff8bd8, 1),
  createRelic([-2.7, -3.0, -5], 0.55, 0x8b98ff, 0)
];

// ---------------------------------------------------------------------
// CENTRAL 3D TYPOGRAPHY
// ---------------------------------------------------------------------

const titleGroup = new THREE.Group();
titleGroup.position.set(0, 0.12, 0);
universe.add(titleGroup);

let titleMeshes = [];
let titleLoaded = false;

const fontLoader = new FontLoader();

fontLoader.load(
  "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json",
  (font) => {
    const words = [
      { text: "HELLO", y: 0.65, size: 1.48 },
      { text: "WORLD.", y: -0.95, size: 1.48 }
    ];

    words.forEach((word, index) => {
      const geometry = new TextGeometry(word.text, {
        font,
        size: word.size,
        depth: 0.22,
        curveSegments: 5,
        bevelEnabled: true,
        bevelThickness: 0.035,
        bevelSize: 0.018,
        bevelSegments: 2
      });

      geometry.computeBoundingBox();
      geometry.center();

      const frontMaterial = new THREE.MeshPhysicalMaterial({
        color: index === 0 ? 0xe7f8ff : 0xc6c7ff,
        metalness: 0.72,
        roughness: 0.19,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        emissive: index === 0 ? 0x153c50 : 0x27184f,
        emissiveIntensity: 0.35
      });

      const mesh = new THREE.Mesh(geometry, frontMaterial);
      mesh.position.y = word.y;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      titleGroup.add(mesh);
      titleMeshes.push(mesh);

      // Low-poly offset extrusion creates a retro 3D silhouette.
      const edgeGeometry = geometry.clone();
      const edgeMesh = new THREE.Mesh(
        edgeGeometry,
        new THREE.MeshBasicMaterial({
          color: index === 0 ? 0x58eaff : 0xa18aff,
          wireframe: true,
          transparent: true,
          opacity: 0.12,
          depthWrite: false
        })
      );
      edgeMesh.position.set(0.025, word.y - 0.035, -0.08);
      titleGroup.add(edgeMesh);
      titleMeshes.push(edgeMesh);

      const backMesh = new THREE.Mesh(
        geometry.clone(),
        new THREE.MeshBasicMaterial({
          color: index === 0 ? 0x4542a0 : 0x24275f,
          wireframe: false
        })
      );
      backMesh.position.set(0.045, word.y - 0.065, -0.24);
      titleGroup.add(backMesh);
      titleMeshes.push(backMesh);
    });

    titleLoaded = true;
    sceneReady = true;
    titleGroup.scale.setScalar(mobile ? 0.72 : 0.95);

    // Place the title at a readable depth, with a gentle forward tilt.
    titleGroup.rotation.x = -0.055;
  },
  undefined,
  (error) => {
    console.warn("3D font could not load; CSS title remains visible.", error);
    sceneReady = true;
  }
);

// ---------------------------------------------------------------------
// ORBITAL GUIDES
// ---------------------------------------------------------------------

const orbitalGuides = new THREE.Group();
universe.add(orbitalGuides);

for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4.8 + i * 0.55, 0.006, 3, 120),
    new THREE.MeshBasicMaterial({
      color: [0x79efff, 0x8f7aff, 0xff8bdb][i],
      transparent: true,
      opacity: 0.13 - i * 0.025,
      depthWrite: false
    })
  );

  ring.rotation.x = 1.1 + i * 0.15;
  ring.rotation.y = i * 0.8;
  orbitalGuides.add(ring);
}

// ---------------------------------------------------------------------
// INTERACTION: CURSOR, PARALLAX, AND MOTION
// ---------------------------------------------------------------------

const pointer = {
  x: 0,
  y: 0,
  smoothX: 0,
  smoothY: 0,
  px: 0,
  py: 0
};

const cursorCore = $(".cursor-core");
const cursorRing = $(".cursor-ring");

window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  pointer.px = event.clientX;
  pointer.py = event.clientY;

  if (cursorCore) {
    cursorCore.style.left = `${event.clientX}px`;
    cursorCore.style.top = `${event.clientY}px`;
  }

  if (cursorRing) {
    cursorRing.style.left = `${event.clientX}px`;
    cursorRing.style.top = `${event.clientY}px`;
  }

  root.style.setProperty("--mx", pointer.x.toFixed(3));
  root.style.setProperty("--my", pointer.y.toFixed(3));
});

document.querySelectorAll("button, a").forEach((element) => {
  element.addEventListener("pointerenter", () => cursorRing?.classList.add("hovering"));
  element.addEventListener("pointerleave", () => cursorRing?.classList.remove("hovering"));
});

// Click sparks: small 3D particles that scatter from the cursor.
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const sparkMaterial = new THREE.PointsMaterial({
  color: 0x9dfaff,
  size: 0.055,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const sparks = [];
const sparkGeometry = new THREE.BufferGeometry();
const sparkPositions = new Float32Array(120 * 3);
sparkGeometry.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
const sparkPoints = new THREE.Points(sparkGeometry, sparkMaterial);
scene.add(sparkPoints);

function emitSparks(x, y) {
  pointerNdc.set(
    (x / window.innerWidth) * 2 - 1,
    -(y / window.innerHeight) * 2 + 1
  );

  raycaster.setFromCamera(pointerNdc, camera);
  const distance = 8;
  const point = raycaster.ray.origin.clone().add(
    raycaster.ray.direction.clone().multiplyScalar(distance)
  );

  for (let i = 0; i < 12; i++) {
    sparks.push({
      position: point.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.13,
        (Math.random() - 0.5) * 0.13,
        (Math.random() - 0.5) * 0.13
      ),
      life: 1
    });
  }

  if (sparks.length > 120) sparks.splice(0, sparks.length - 120);
}

window.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch") emitSparks(event.clientX, event.clientY);
});

// ---------------------------------------------------------------------
// BUTTONS AND UI
// ---------------------------------------------------------------------

$("#explore-button").addEventListener("click", () => {
  $("#about").scrollIntoView({ behavior: motionEnabled ? "smooth" : "auto" });
  notify("TRANSMISSION ACCEPTED — WELCOME, TRAVELLER.");
});

$("#reality-button").addEventListener("click", () => {
  pointer.x = 0;
  pointer.y = 0;
  pointer.smoothX = 0;
  pointer.smoothY = 0;

  titleGroup.rotation.set(-0.055, 0, 0);
  titleGroup.position.set(0, 0.12, 0);

  orbData.forEach((orb) => {
    orb.group.position.copy(orb.base);
  });

  relicObjects.forEach((relic) => {
    relic.rotation.set(0, 0, 0);
  });

  notify("REALITY RE-CALIBRATED.");
});

$("#back-to-top").addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: motionEnabled ? "smooth" : "auto"
  });
});

$("#motion-toggle").addEventListener("click", () => {
  motionEnabled = !motionEnabled;
  document.body.classList.toggle("motion-off", !motionEnabled);
  $("#motion-label").textContent = `MOTION: ${motionEnabled ? "ON" : "OFF"}`;

  notify(motionEnabled ? "MOTION RESTORED." : "MOTION PAUSED.");
});

// Clock readout
function updateClock() {
  const now = new Date();
  $("#clock").textContent = [
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  ].map((n) => String(n).padStart(2, "0")).join(":");
}
updateClock();
setInterval(updateClock, 1000);

// ---------------------------------------------------------------------
// SCROLL PARALLAX
// ---------------------------------------------------------------------

let scrollY = window.scrollY;
window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
  const hero = $("#hero");
  const heroHeight = hero.offsetHeight;
  const progress = Math.min(scrollY / heroHeight, 1);

  if (motionEnabled) {
    hero.style.setProperty("--scroll-progress", progress.toFixed(3));
  }
}, { passive: true });

// ---------------------------------------------------------------------
// RESIZE HANDLING
// ---------------------------------------------------------------------

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 600 ? 1.35 : 1.8));
}
window.addEventListener("resize", resize);

// ---------------------------------------------------------------------
// MAIN ANIMATION LOOP
// ---------------------------------------------------------------------

const clock = new THREE.Clock();
let elapsed = 0;
let lastFrame = 0;

function animate(now = 0) {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);
  if (motionEnabled) elapsed += delta;

  // Smoothly follow the mouse.
  const smoothing = motionEnabled ? 0.045 : 0.12;
  pointer.smoothX += (pointer.x - pointer.smoothX) * smoothing;
  pointer.smoothY += (pointer.y - pointer.smoothY) * smoothing;

  if (motionEnabled) {
    // Camera parallax creates the impression of a deep 3D space.
    camera.position.x += (pointer.smoothX * 0.95 - camera.position.x) * 0.025;
    camera.position.y += (pointer.smoothY * 0.58 - camera.position.y) * 0.025;
    camera.position.z += (15 - camera.position.z) * 0.02;

    camera.lookAt(
      pointer.smoothX * 0.16,
      pointer.smoothY * 0.12,
      0
    );

    universe.rotation.y = pointer.smoothX * 0.035;
    universe.rotation.x = -pointer.smoothY * 0.022;

    farStars.rotation.y += delta * 0.002;
    nearStars.rotation.y -= delta * 0.004;
    dust.rotation.z += delta * 0.002;

    orbitalGuides.rotation.y += delta * 0.025;
    orbitalGuides.rotation.x = pointer.smoothY * 0.04;

    relicObjects.forEach((relic, index) => {
      relic.rotation.x += delta * (0.09 + index * 0.012);
      relic.rotation.y += delta * (0.13 + index * 0.016);
      relic.position.y += Math.sin(elapsed * 0.6 + index) * delta * 0.025;
    });

    orbData.forEach((orb) => {
      const t = elapsed * orb.speed + orb.phase;

      orb.group.position.x = orb.base.x + Math.sin(t * 0.7) * orb.amplitude;
      orb.group.position.y = orb.base.y + Math.cos(t) * orb.amplitude * 0.55;
      orb.group.position.z = orb.base.z + Math.sin(t * 0.45) * 0.4;

      orb.core.rotation.x += delta * 0.12;
      orb.core.rotation.y += delta * 0.19;

      orb.wire.rotation.x -= delta * 0.16;
      orb.wire.rotation.y += delta * 0.22;

      orb.inner.rotation.x += delta * 0.26;
      orb.inner.rotation.z -= delta * 0.2;

      orb.halo.material.opacity = 0.24 + (Math.sin(t * 1.4) + 1) * 0.1;
      orb.satellite.rotation.y += delta * 0.8;
    });

    if (titleLoaded) {
      titleGroup.rotation.y += (pointer.smoothX * 0.13 - titleGroup.rotation.y) * 0.035;
      titleGroup.rotation.x += (-0.055 - pointer.smoothY * 0.07 - titleGroup.rotation.x) * 0.035;
      titleGroup.position.y = 0.12 + Math.sin(elapsed * 0.7) * 0.055;
    }

    cyanLight.position.x = -5 + pointer.smoothX * 2;
    purpleLight.position.y = 1 + pointer.smoothY * 2;
    pinkLight.position.x = Math.sin(elapsed * 0.25) * 3;
  }

  // Update click particles.
  const positions = sparkGeometry.attributes.position.array;
  let live = 0;

  for (let i = sparks.length - 1; i >= 0; i--) {
    const spark = sparks[i];
    spark.life -= delta * 1.5;

    if (spark.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }

    spark.position.add(spark.velocity);
    positions[live * 3] = spark.position.x;
    positions[live * 3 + 1] = spark.position.y;
    positions[live * 3 + 2] = spark.position.z;
    live++;
  }

  for (let i = live; i < 120; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = -1000;
  }

  sparkGeometry.attributes.position.needsUpdate = true;
  sparkGeometry.setDrawRange(0, live);
  sparkMaterial.opacity = motionEnabled ? 0.9 : 0.3;

  renderer.render(scene, camera);

  // A tiny FPS estimate for optional debugging.
  if (now - lastFrame > 1000) {
    lastFrame = now;
  }
}

animate();

// If the document is loaded in a background tab, browsers may throttle
// animation automatically. This listener resets the clock on return.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) clock.getDelta();
});

console.info(
  "%c VOID/STUDIO ",
  "background:#101426;color:#7df9ff;padding:8px;font-weight:bold;"
);
console.info("Reality engine initialized. Hello, world.");
