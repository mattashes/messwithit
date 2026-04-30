(() => {
  "use strict";

  const canvas = document.getElementById("world");
  const ctx = canvas.getContext("2d", { alpha: false });
  const mini = document.getElementById("minimap");
  const miniCtx = mini.getContext("2d");

  const bioScoreEl = document.getElementById("bio-score");
  const gunganCountEl = document.getElementById("gungan-count");
  const faunaCountEl = document.getElementById("fauna-count");
  const seedCountEl = document.getElementById("seed-count");
  const selectedNameEl = document.getElementById("selected-name");
  const selectedSwatchEl = document.getElementById("selected-swatch");
  const paletteEl = document.getElementById("plant-palette");
  const plantStatsEl = document.getElementById("plant-stats");
  const readoutEl = document.getElementById("readout");
  const readoutTitleEl = document.getElementById("readout-title");
  const readoutBodyEl = document.getElementById("readout-body");
  const cyclePlantButton = document.getElementById("cycle-plant");
  const inspectToggle = document.getElementById("inspect-toggle");
  const faunaToggle = document.getElementById("fauna-toggle");
  const plantToggle = document.getElementById("plant-toggle");

  const TILE = 24;
  const COLS = 84;
  const ROWS = 56;
  const WORLD_W = COLS * TILE;
  const WORLD_H = ROWS * TILE;
  const TAU = Math.PI * 2;

  const PLANTS = [
    {
      id: "sungrass",
      name: "Sungrass",
      role: "Hardy ground cover",
      cost: 3,
      color: "#9ccf43",
      dark: "#3f6f25",
      shape: "tuft",
      terrain: ["grass", "sand", "mud"],
      need: { water: [0.18, 0.72], nutrients: [0.18, 0.88], light: [0.52, 1] },
      gives: { nutrients: 0.04, cover: 0.18, food: 0.22 },
      uses: { water: 0.07, nutrients: 0.05, light: 0.08 },
      radius: 72,
      spacing: 30,
      spread: 0.07,
    },
    {
      id: "bubbleweed",
      name: "Bubbleweed",
      role: "Oxygenating wet plant",
      cost: 5,
      color: "#50d6c8",
      dark: "#176d73",
      shape: "bubbles",
      terrain: ["water", "mud"],
      need: { water: [0.62, 1], nutrients: [0.22, 0.78], light: [0.28, 0.86] },
      gives: { water: 0.08, oxygen: 0.34, cover: 0.12 },
      uses: { water: 0.03, nutrients: 0.06, light: 0.04 },
      radius: 82,
      spacing: 34,
      spread: 0.03,
    },
    {
      id: "sporefern",
      name: "Spore Fern",
      role: "Moist shade maker",
      cost: 4,
      color: "#63b45f",
      dark: "#285f39",
      shape: "fern",
      terrain: ["mud", "grass"],
      need: { water: [0.38, 0.92], nutrients: [0.25, 0.9], light: [0.2, 0.75] },
      gives: { shade: 0.22, nutrients: 0.08, cover: 0.18 },
      uses: { water: 0.08, nutrients: 0.08, light: 0.1 },
      radius: 80,
      spacing: 36,
      spread: 0.04,
    },
    {
      id: "shadepalm",
      name: "Shade Palm",
      role: "Canopy and shelter",
      cost: 9,
      color: "#4fa95e",
      dark: "#6a4a2b",
      shape: "palm",
      terrain: ["sand", "grass", "mud"],
      need: { water: [0.28, 0.82], nutrients: [0.32, 0.95], light: [0.55, 1] },
      gives: { shade: 0.42, cover: 0.28, food: 0.08 },
      uses: { water: 0.16, nutrients: 0.13, light: 0.22 },
      radius: 110,
      spacing: 84,
      spread: 0.01,
    },
    {
      id: "reedcluster",
      name: "Reed Cluster",
      role: "Shoreline stabilizer",
      cost: 4,
      color: "#b9c96f",
      dark: "#54733b",
      shape: "reeds",
      terrain: ["water", "mud"],
      need: { water: [0.5, 1], nutrients: [0.18, 0.86], light: [0.42, 1] },
      gives: { cover: 0.32, oxygen: 0.12, nutrients: 0.03 },
      uses: { water: 0.09, nutrients: 0.07, light: 0.07 },
      radius: 78,
      spacing: 38,
      spread: 0.05,
    },
    {
      id: "glowcap",
      name: "Glowcap",
      role: "Decomposer fungus",
      cost: 6,
      color: "#7dd6ff",
      dark: "#354a88",
      shape: "cap",
      terrain: ["mud", "grass"],
      need: { water: [0.36, 0.96], nutrients: [0.42, 1], light: [0, 0.54] },
      gives: { nutrients: 0.32, cover: 0.08 },
      uses: { water: 0.05, nutrients: 0.02, light: 0.01 },
      radius: 76,
      spacing: 26,
      spread: 0.04,
    },
    {
      id: "rootvine",
      name: "Rootvine",
      role: "Soil binder",
      cost: 5,
      color: "#77a83d",
      dark: "#4b371d",
      shape: "vine",
      terrain: ["grass", "mud", "sand"],
      need: { water: [0.2, 0.82], nutrients: [0.2, 0.88], light: [0.2, 0.88] },
      gives: { nutrients: 0.12, cover: 0.24, food: 0.06 },
      uses: { water: 0.1, nutrients: 0.06, light: 0.06 },
      radius: 92,
      spacing: 34,
      spread: 0.09,
    },
    {
      id: "blossompod",
      name: "Blossom Pod",
      role: "Nectar source",
      cost: 7,
      color: "#d36d55",
      dark: "#7b3652",
      shape: "blossom",
      terrain: ["grass", "mud"],
      need: { water: [0.32, 0.84], nutrients: [0.45, 1], light: [0.46, 1] },
      gives: { nectar: 0.48, food: 0.18 },
      uses: { water: 0.12, nutrients: 0.18, light: 0.1 },
      radius: 86,
      spacing: 48,
      spread: 0.02,
    },
    {
      id: "lilysprawl",
      name: "Lily Sprawl",
      role: "Floating habitat",
      cost: 6,
      color: "#78d48b",
      dark: "#245b4f",
      shape: "lily",
      terrain: ["water"],
      need: { water: [0.75, 1], nutrients: [0.2, 0.84], light: [0.38, 0.9] },
      gives: { cover: 0.36, oxygen: 0.16, food: 0.06 },
      uses: { water: 0.04, nutrients: 0.07, light: 0.12 },
      radius: 86,
      spacing: 42,
      spread: 0.04,
    },
    {
      id: "nitromoss",
      name: "Nitro Moss",
      role: "Nutrient fixer",
      cost: 4,
      color: "#b6dd4c",
      dark: "#53691d",
      shape: "moss",
      terrain: ["sand", "grass", "mud"],
      need: { water: [0.16, 0.78], nutrients: [0.05, 0.7], light: [0.18, 0.82] },
      gives: { nutrients: 0.28, cover: 0.08 },
      uses: { water: 0.04, nutrients: 0.02, light: 0.04 },
      radius: 74,
      spacing: 26,
      spread: 0.08,
    },
    {
      id: "thornshrub",
      name: "Thorn Shrub",
      role: "Dry cover",
      cost: 5,
      color: "#c0804d",
      dark: "#653928",
      shape: "shrub",
      terrain: ["sand", "grass"],
      need: { water: [0.06, 0.58], nutrients: [0.12, 0.78], light: [0.55, 1] },
      gives: { cover: 0.42, food: 0.04 },
      uses: { water: 0.04, nutrients: 0.07, light: 0.18 },
      radius: 88,
      spacing: 54,
      spread: 0.03,
    },
    {
      id: "canopyroot",
      name: "Canopy Root",
      role: "Late-stage anchor",
      cost: 12,
      color: "#548d4d",
      dark: "#3e3122",
      shape: "tree",
      terrain: ["grass", "mud"],
      need: { water: [0.36, 0.9], nutrients: [0.52, 1], light: [0.48, 1] },
      gives: { shade: 0.55, cover: 0.48, food: 0.2, nutrients: 0.06 },
      uses: { water: 0.22, nutrients: 0.24, light: 0.34 },
      radius: 132,
      spacing: 106,
      spread: 0.006,
    },
  ];

  const FAUNA = [
    { id: "grazer", color: "#bd6f55", likes: "food", threshold: 0.8, speed: 28 },
    { id: "pollinator", color: "#e1d15f", likes: "nectar", threshold: 0.5, speed: 52 },
    { id: "amphibian", color: "#66bfae", likes: "oxygen", threshold: 0.55, speed: 34 },
    { id: "shelterling", color: "#b58a67", likes: "cover", threshold: 0.9, speed: 24 },
  ];

  const state = {
    tiles: [],
    plants: [],
    units: [],
    seedBank: 60,
    bioScore: 0,
    gungans: 0,
    mode: "plant",
    selectedPlant: "sungrass",
    view: "plant",
    elapsed: 0,
    lastMini: 0,
    hoverWorld: null,
    hoverPlant: null,
    pointerDown: false,
    drag: null,
    cameraX: WORLD_W * 0.5,
    cameraY: WORLD_H * 0.5,
    dirtyUi: true,
  };

  let dpr = 1;
  let viewScale = 1;
  let viewX = 0;
  let viewY = 0;
  let rand = mulberry32(913812);

  function mulberry32(seed) {
    return function next() {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function hash2(x, y, seed) {
    let n = x * 374761393 + y * 668265263 + seed * 1442695041;
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  function valueNoise(x, y, scale, seed) {
    const gx = x / scale;
    const gy = y / scale;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const tx = smoothstep(gx - x0);
    const ty = smoothstep(gy - y0);
    const a = hash2(x0, y0, seed);
    const b = hash2(x0 + 1, y0, seed);
    const c = hash2(x0, y0 + 1, seed);
    const d = hash2(x0 + 1, y0 + 1, seed);
    return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
  }

  function plantType(id) {
    return PLANTS.find((plant) => plant.id === id) || PLANTS[0];
  }

  function generateWorld() {
    state.tiles = [];
    for (let y = 0; y < ROWS; y += 1) {
      const row = [];
      for (let x = 0; x < COLS; x += 1) {
        const nx = x / COLS;
        const ny = y / ROWS;
        const elevation =
          valueNoise(x, y, 11, 7) * 0.62 +
          valueNoise(x, y, 29, 4) * 0.28 +
          valueNoise(x, y, 5, 12) * 0.1;
        const wetBand = Math.max(0, 1 - Math.abs(ny - 0.34 - Math.sin(nx * 5.4) * 0.08) * 5.2);
        const lake = Math.max(0, 1 - Math.hypot(nx - 0.73, ny - 0.18) * 4.2);
        const marsh = Math.max(0, 1 - Math.hypot(nx - 0.23, ny - 0.72) * 4.6);
        const water = clamp(valueNoise(x, y, 19, 20) * 0.45 + wetBand * 0.42 + lake * 0.46 + marsh * 0.28 - elevation * 0.28, 0, 1);
        const nutrients = clamp(0.18 + valueNoise(x, y, 9, 32) * 0.58 + water * 0.18 - elevation * 0.08, 0, 1);
        const sand = clamp(elevation * 0.72 + valueNoise(x, y, 7, 44) * 0.28 - water * 0.36, 0, 1);

        let biome = "grass";
        if (water > 0.72) biome = "water";
        else if (water > 0.48) biome = "mud";
        else if (sand > 0.58) biome = "sand";

        row.push({
          x,
          y,
          water,
          nutrients,
          baseWater: water,
          baseNutrients: nutrients,
          sand,
          biome,
          jitter: hash2(x, y, 77),
        });
      }
      state.tiles.push(row);
    }
  }

  function seedStartingLife() {
    const starters = [
      ["sungrass", 390, 850],
      ["sungrass", 560, 770],
      ["thornshrub", 190, 1020],
      ["thornshrub", 1730, 1080],
      ["reedcluster", 470, 430],
      ["reedcluster", 1420, 280],
      ["bubbleweed", 1510, 240],
      ["sporefern", 870, 500],
      ["rootvine", 1090, 760],
      ["nitromoss", 620, 980],
      ["blossompod", 1040, 930],
      ["lilysprawl", 1540, 260],
      ["shadepalm", 1700, 850],
    ];

    starters.forEach(([id, x, y]) => {
      const tile = tileAt(x, y);
      if (!tile) return;
      state.plants.push({
        id: `${id}-${state.plants.length}`,
        typeId: id,
        x,
        y,
        health: 0.72 + rand() * 0.22,
        growth: 0.55 + rand() * 0.4,
        age: rand() * 90,
        pulse: rand() * TAU,
      });
    });
  }

  function tileAt(wx, wy) {
    const tx = Math.floor(wx / TILE);
    const ty = Math.floor(wy / TILE);
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return null;
    return state.tiles[ty][tx];
  }

  function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewX) / viewScale,
      y: (clientY - rect.top - viewY) / viewScale,
    };
  }

  function worldToScreen(wx, wy) {
    return {
      x: wx * viewScale + viewX,
      y: wy * viewScale + viewY,
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    viewScale = Math.max(width / WORLD_W, height / WORLD_H);
    clampCamera();
    updateViewOffset();

    const miniSize = Math.floor(mini.clientWidth * dpr);
    mini.width = miniSize;
    mini.height = miniSize;
    miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function updateViewOffset() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    viewX = width * 0.5 - state.cameraX * viewScale;
    viewY = height * 0.5 - state.cameraY * viewScale;
  }

  function clampCamera() {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    const halfW = width / (2 * viewScale);
    const halfH = height / (2 * viewScale);
    state.cameraX = clamp(state.cameraX, Math.min(halfW, WORLD_W * 0.5), Math.max(WORLD_W - halfW, WORLD_W * 0.5));
    state.cameraY = clamp(state.cameraY, Math.min(halfH, WORLD_H * 0.5), Math.max(WORLD_H - halfH, WORLD_H * 0.5));
  }

  function panCamera(screenDx, screenDy) {
    state.cameraX -= screenDx / viewScale;
    state.cameraY -= screenDy / viewScale;
    clampCamera();
    updateViewOffset();
  }

  function terrainColor(tile) {
    if (tile.biome === "water") {
      const v = Math.floor(38 + tile.water * 32);
      return `rgb(${18}, ${v + 28}, ${v + 36})`;
    }
    if (tile.biome === "mud") {
      const v = Math.floor(70 + tile.nutrients * 42);
      return `rgb(${v - 4}, ${v - 1}, ${50 + tile.water * 28})`;
    }
    if (tile.biome === "sand") {
      const v = Math.floor(138 + tile.jitter * 38);
      return `rgb(${v + 28}, ${v + 20}, ${116 + tile.jitter * 24})`;
    }
    const v = Math.floor(74 + tile.nutrients * 42);
    return `rgb(${v}, ${v + 14}, ${48 + tile.water * 28})`;
  }

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#050706";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(viewX, viewY);
    ctx.scale(viewScale, viewScale);
    drawTerrain();
    drawPlantInfluence();
    state.plants
      .slice()
      .sort((a, b) => a.y - b.y)
      .forEach(drawPlant);
    state.units.forEach(drawUnit);
    drawPlacementCursor();
    ctx.restore();

    if (state.elapsed - state.lastMini > 0.12) {
      drawMinimap();
      state.lastMini = state.elapsed;
    }
  }

  function drawTerrain() {
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const tile = state.tiles[y][x];
        ctx.fillStyle = terrainColor(tile);
        ctx.fillRect(x * TILE, y * TILE, TILE + 0.6, TILE + 0.6);

        if ((x + y * 3) % 5 === 0) {
          ctx.fillStyle =
            tile.biome === "water"
              ? "rgba(143, 211, 216, 0.12)"
              : tile.biome === "sand"
                ? "rgba(245, 236, 187, 0.14)"
                : "rgba(15, 38, 26, 0.16)";
          ctx.fillRect(x * TILE + tile.jitter * 14, y * TILE + (1 - tile.jitter) * 14, 5, 5);
        }
      }
    }
  }

  function drawPlantInfluence() {
    if (state.view !== "plant" || !state.hoverWorld) return;
    const type = plantType(state.selectedPlant);
    ctx.save();
    ctx.strokeStyle = "rgba(184, 234, 77, 0.55)";
    ctx.lineWidth = 5 / viewScale;
    ctx.beginPath();
    ctx.arc(state.hoverWorld.x, state.hoverWorld.y, type.radius, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlant(plant) {
    const type = plantType(plant.typeId);
    const size = (15 + plant.growth * 18) * (type.shape === "tree" ? 1.22 : 1);
    const alpha = clamp(0.28 + plant.health * 0.72, 0.2, 1);
    ctx.save();
    ctx.translate(plant.x, plant.y);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.36, size * 0.72, size * 0.28, 0, 0, TAU);
    ctx.fill();

    if (type.shape === "tuft") drawTuft(type, size, plant);
    else if (type.shape === "bubbles") drawBubbles(type, size, plant);
    else if (type.shape === "fern") drawFern(type, size, plant);
    else if (type.shape === "palm") drawPalm(type, size, plant);
    else if (type.shape === "reeds") drawReeds(type, size, plant);
    else if (type.shape === "cap") drawCap(type, size, plant);
    else if (type.shape === "vine") drawVine(type, size, plant);
    else if (type.shape === "blossom") drawBlossom(type, size, plant);
    else if (type.shape === "lily") drawLily(type, size, plant);
    else if (type.shape === "moss") drawMoss(type, size, plant);
    else if (type.shape === "shrub") drawShrub(type, size, plant);
    else drawTree(type, size, plant);

    if (plant === state.hoverPlant) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(214, 245, 105, 0.78)";
      ctx.lineWidth = 3 / viewScale;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.12, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTuft(type, size, plant) {
    ctx.strokeStyle = type.dark;
    ctx.lineWidth = 3;
    for (let i = -3; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 3, size * 0.34);
      ctx.quadraticCurveTo(i * 5, -size * 0.15, i * 9, -size * (0.32 + plant.growth * 0.22));
      ctx.stroke();
    }
    ctx.strokeStyle = type.color;
    ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 4, size * 0.3);
      ctx.quadraticCurveTo(i * 2, -size * 0.18, i * 12, -size * 0.52);
      ctx.stroke();
    }
  }

  function drawBubbles(type, size, plant) {
    ctx.fillStyle = type.dark;
    ctx.beginPath();
    ctx.ellipse(0, 2, size * 0.82, size * 0.45, -0.25, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 7; i += 1) {
      const a = i * 1.7 + plant.pulse;
      const r = size * (0.1 + (i % 3) * 0.035);
      ctx.fillStyle = i % 2 ? type.color : "#b4fff4";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * size * 0.45, Math.sin(a * 0.7) * size * 0.22, r, 0, TAU);
      ctx.fill();
    }
  }

  function drawFern(type, size) {
    ctx.strokeStyle = type.dark;
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i += 1) {
      const angle = -1.25 + i * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, size * 0.25);
      ctx.quadraticCurveTo(Math.cos(angle) * size * 0.3, -size * 0.12, Math.cos(angle) * size * 0.74, Math.sin(angle) * size * 0.5);
      ctx.stroke();
      ctx.fillStyle = type.color;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * size * 0.48, Math.sin(angle) * size * 0.26, size * 0.22, size * 0.07, angle, 0, TAU);
      ctx.fill();
    }
  }

  function drawPalm(type, size) {
    ctx.strokeStyle = type.dark;
    ctx.lineWidth = size * 0.18;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.45);
    ctx.quadraticCurveTo(size * 0.08, -size * 0.2, -size * 0.04, -size * 0.75);
    ctx.stroke();
    for (let i = 0; i < 7; i += 1) {
      const angle = -Math.PI + i * (Math.PI / 3);
      ctx.strokeStyle = i % 2 ? "#73bf62" : type.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-size * 0.04, -size * 0.74);
      ctx.quadraticCurveTo(Math.cos(angle) * size * 0.36, -size * 0.78 + Math.sin(angle) * size * 0.18, Math.cos(angle) * size * 0.78, -size * 0.74 + Math.sin(angle) * size * 0.32);
      ctx.stroke();
    }
  }

  function drawReeds(type, size) {
    ctx.strokeStyle = type.dark;
    ctx.lineWidth = 3;
    for (let i = -4; i <= 4; i += 1) {
      const h = size * (0.6 + ((i + 4) % 3) * 0.18);
      ctx.beginPath();
      ctx.moveTo(i * 4, size * 0.38);
      ctx.quadraticCurveTo(i * 2, -size * 0.12, i * 5, -h);
      ctx.stroke();
      ctx.fillStyle = i % 2 ? type.color : "#d7cb82";
      ctx.fillRect(i * 5 - 2, -h - 5, 4, 10);
    }
  }

  function drawCap(type, size, plant) {
    ctx.fillStyle = type.dark;
    ctx.fillRect(-size * 0.1, -size * 0.12, size * 0.2, size * 0.48);
    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.18, size * 0.66, size * 0.34, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(190, 237, 255, ${0.18 + Math.sin(plant.pulse) * 0.05})`;
    ctx.beginPath();
    ctx.arc(0, -size * 0.14, size * 0.76, 0, TAU);
    ctx.fill();
  }

  function drawVine(type, size, plant) {
    ctx.strokeStyle = type.dark;
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const x = -size * 0.7 + i * size * 0.16;
      const y = Math.sin(i * 0.9 + plant.pulse) * size * 0.18;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = type.color;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.ellipse(-size * 0.42 + i * size * 0.24, Math.sin(i) * size * 0.14, size * 0.14, size * 0.07, i, 0, TAU);
      ctx.fill();
    }
  }

  function drawBlossom(type, size) {
    ctx.strokeStyle = "#516b2c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.4);
    ctx.lineTo(0, -size * 0.36);
    ctx.stroke();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * TAU;
      ctx.fillStyle = i % 2 ? type.color : "#e4b261";
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * size * 0.2, -size * 0.42 + Math.sin(a) * size * 0.16, size * 0.17, size * 0.09, a, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = "#f5e87d";
    ctx.beginPath();
    ctx.arc(0, -size * 0.42, size * 0.1, 0, TAU);
    ctx.fill();
  }

  function drawLily(type, size) {
    ctx.fillStyle = type.dark;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.78, size * 0.5, -0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.ellipse(-size * 0.12, -size * 0.03, size * 0.55, size * 0.33, -0.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(229, 255, 217, 0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size * 0.35, -size * 0.14);
    ctx.stroke();
  }

  function drawMoss(type, size) {
    ctx.fillStyle = type.dark;
    ctx.beginPath();
    ctx.ellipse(0, size * 0.1, size * 0.82, size * 0.45, 0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = type.color;
    for (let i = 0; i < 16; i += 1) {
      const a = i * 2.31;
      const r = size * (0.1 + (i % 4) * 0.035);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * size * (0.16 + (i % 5) * 0.09), Math.sin(a) * size * 0.28, r, 0, TAU);
      ctx.fill();
    }
  }

  function drawShrub(type, size) {
    ctx.fillStyle = type.dark;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.ellipse(-size * 0.4 + i * size * 0.2, Math.sin(i) * size * 0.12, size * 0.24, size * 0.18, i * 0.4, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = type.color;
    ctx.lineWidth = 3;
    for (let i = -3; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * size * 0.12, size * 0.16);
      ctx.lineTo(i * size * 0.16, -size * 0.35);
      ctx.stroke();
    }
  }

  function drawTree(type, size) {
    ctx.strokeStyle = type.dark;
    ctx.lineWidth = size * 0.22;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.5);
    ctx.lineTo(0, -size * 0.42);
    ctx.stroke();
    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.arc(0, -size * 0.54, size * 0.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#6fa35a";
    ctx.beginPath();
    ctx.arc(-size * 0.24, -size * 0.42, size * 0.36, 0, TAU);
    ctx.arc(size * 0.26, -size * 0.4, size * 0.34, 0, TAU);
    ctx.fill();
  }

  function drawUnit(unit) {
    ctx.save();
    ctx.translate(unit.x, unit.y);
    ctx.rotate(unit.heading);
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 7, 13, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = unit.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, unit.kind === "pollinator" ? 5 : 11, unit.kind === "pollinator" ? 7 : 6, 0, 0, TAU);
    ctx.fill();
    if (unit.kind === "pollinator") {
      ctx.fillStyle = "rgba(238, 244, 160, 0.68)";
      ctx.beginPath();
      ctx.ellipse(-5, -2, 6, 3, -0.5, 0, TAU);
      ctx.ellipse(5, -2, 6, 3, 0.5, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = "#38251f";
      ctx.fillRect(-8, 4, 5, 6);
      ctx.fillRect(3, 4, 5, 6);
    }
    ctx.restore();
  }

  function drawPlacementCursor() {
    if (!state.hoverWorld) return;
    const valid = canApplyAt(state.hoverWorld.x, state.hoverWorld.y).ok;
    ctx.save();
    ctx.strokeStyle = valid ? "rgba(194, 239, 78, 0.88)" : "rgba(231, 82, 76, 0.8)";
    ctx.lineWidth = 5 / viewScale;
    ctx.beginPath();
    ctx.arc(state.hoverWorld.x, state.hoverWorld.y, 35, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = valid ? "rgba(194, 239, 78, 0.12)" : "rgba(231, 82, 76, 0.12)";
    ctx.fill();
    ctx.restore();
  }

  function drawMinimap() {
    const size = mini.clientWidth;
    const scale = size / Math.max(WORLD_W, WORLD_H);
    const ox = (size - WORLD_W * scale) * 0.5;
    const oy = (size - WORLD_H * scale) * 0.5;
    miniCtx.clearRect(0, 0, size, size);
    miniCtx.save();
    miniCtx.beginPath();
    miniCtx.arc(size / 2, size / 2, size * 0.48, 0, TAU);
    miniCtx.clip();
    miniCtx.fillStyle = "#172018";
    miniCtx.fillRect(0, 0, size, size);
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        miniCtx.fillStyle = terrainColor(state.tiles[y][x]);
        miniCtx.fillRect(ox + x * TILE * scale, oy + y * TILE * scale, TILE * scale + 0.5, TILE * scale + 0.5);
      }
    }
    state.plants.forEach((plant) => {
      const type = plantType(plant.typeId);
      miniCtx.fillStyle = type.color;
      miniCtx.fillRect(ox + plant.x * scale - 1.2, oy + plant.y * scale - 1.2, 2.4, 2.4);
    });
    state.units.forEach((unit) => {
      miniCtx.fillStyle = unit.color;
      miniCtx.fillRect(ox + unit.x * scale - 1, oy + unit.y * scale - 1, 2, 2);
    });
    const viewportW = canvas.clientWidth / viewScale;
    const viewportH = canvas.clientHeight / viewScale;
    miniCtx.strokeStyle = "rgba(190, 232, 255, 0.9)";
    miniCtx.lineWidth = 1.2;
    miniCtx.strokeRect(
      ox + (state.cameraX - viewportW * 0.5) * scale,
      oy + (state.cameraY - viewportH * 0.5) * scale,
      viewportW * scale,
      viewportH * scale
    );
    if (state.hoverWorld) {
      miniCtx.strokeStyle = "#9fe7ff";
      miniCtx.lineWidth = 1.4;
      miniCtx.beginPath();
      miniCtx.arc(ox + state.hoverWorld.x * scale, oy + state.hoverWorld.y * scale, 8, 0, TAU);
      miniCtx.stroke();
    }
    miniCtx.restore();
  }

  function canApplyAt(wx, wy) {
    const tile = tileAt(wx, wy);
    if (!tile) return { ok: false, reason: "outside map" };
    if (state.mode === "water" || state.mode === "soil" || state.mode === "inspect") {
      return { ok: true, reason: "" };
    }
    const type = plantType(state.selectedPlant);
    if (state.seedBank < type.cost) return { ok: false, reason: "low seed reserve" };
    if (!type.terrain.includes(tile.biome)) {
      return { ok: false, reason: `${type.name} dislikes ${tile.biome}` };
    }
    const crowded = state.plants.some((plant) => {
      const otherType = plantType(plant.typeId);
      const minSpacing = plant.typeId === type.id ? type.spacing : Math.min(type.spacing, otherType.spacing) * 0.55;
      return Math.hypot(plant.x - wx, plant.y - wy) < minSpacing;
    });
    if (crowded) return { ok: false, reason: "crowded" };
    return { ok: true, reason: "" };
  }

  function applyAt(wx, wy) {
    const result = canApplyAt(wx, wy);
    if (!result.ok) {
      pulseReadout("Blocked", result.reason);
      return;
    }
    if (state.mode === "plant") placePlant(wx, wy);
    else if (state.mode === "water") brushWater(wx, wy);
    else if (state.mode === "soil") brushSoil(wx, wy);
    else inspectAt(wx, wy);
  }

  function placePlant(wx, wy) {
    const type = plantType(state.selectedPlant);
    state.seedBank = Math.max(0, state.seedBank - type.cost);
    state.plants.push({
      id: `${type.id}-${state.elapsed}-${state.plants.length}`,
      typeId: type.id,
      x: wx,
      y: wy,
      health: 0.58,
      growth: 0.16,
      age: 0,
      pulse: rand() * TAU,
    });
    pulseReadout(type.name, `${type.role} planted`);
    state.dirtyUi = true;
  }

  function brushWater(wx, wy) {
    if (state.seedBank < 2) {
      pulseReadout("Water brush", "low seed reserve");
      return;
    }
    state.seedBank -= 2;
    applyTerrainBrush(wx, wy, 66, (tile, falloff) => {
      tile.water = clamp(tile.water + 0.28 * falloff, 0, 1);
      if (tile.water > 0.74) tile.biome = "water";
      else if (tile.water > 0.48 && tile.biome !== "water") tile.biome = "mud";
    });
    pulseReadout("Water brush", "wet ground refreshed");
  }

  function brushSoil(wx, wy) {
    if (state.seedBank < 2) {
      pulseReadout("Soil brush", "low seed reserve");
      return;
    }
    state.seedBank -= 2;
    applyTerrainBrush(wx, wy, 58, (tile, falloff) => {
      tile.nutrients = clamp(tile.nutrients + 0.34 * falloff, 0, 1);
      if (tile.biome === "sand" && tile.nutrients > 0.55) tile.biome = tile.water > 0.42 ? "mud" : "grass";
    });
    pulseReadout("Soil brush", "nutrients added");
  }

  function applyTerrainBrush(wx, wy, radius, change) {
    const minX = clamp(Math.floor((wx - radius) / TILE), 0, COLS - 1);
    const maxX = clamp(Math.floor((wx + radius) / TILE), 0, COLS - 1);
    const minY = clamp(Math.floor((wy - radius) / TILE), 0, ROWS - 1);
    const maxY = clamp(Math.floor((wy + radius) / TILE), 0, ROWS - 1);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const cx = x * TILE + TILE * 0.5;
        const cy = y * TILE + TILE * 0.5;
        const dist = Math.hypot(cx - wx, cy - wy);
        if (dist <= radius) change(state.tiles[y][x], 1 - dist / radius);
      }
    }
    state.dirtyUi = true;
  }

  function inspectAt(wx, wy) {
    const nearest = nearestPlant(wx, wy, 64);
    if (nearest) {
      const type = plantType(nearest.typeId);
      pulseReadout(type.name, `Health ${Math.round(nearest.health * 100)}%, growth ${Math.round(nearest.growth * 100)}%`);
      return;
    }
    const tile = tileAt(wx, wy);
    if (tile) {
      pulseReadout(tile.biome, `Water ${Math.round(tile.water * 100)}%, nutrients ${Math.round(tile.nutrients * 100)}%`);
    }
  }

  function nearestPlant(wx, wy, radius) {
    let best = null;
    let bestDist = radius;
    state.plants.forEach((plant) => {
      const dist = Math.hypot(plant.x - wx, plant.y - wy);
      if (dist < bestDist) {
        best = plant;
        bestDist = dist;
      }
    });
    return best;
  }

  function update(dt) {
    state.elapsed += dt;
    state.plants.forEach((plant) => updatePlant(plant, dt));
    state.plants = state.plants.filter((plant) => plant.health > 0.04);
    updateTiles(dt);
    updateFauna(dt);
    updateScore(dt);
    if (state.dirtyUi || Math.floor(state.elapsed * 4) !== Math.floor((state.elapsed - dt) * 4)) {
      updateHud();
      state.dirtyUi = false;
    }
  }

  function updatePlant(plant, dt) {
    const type = plantType(plant.typeId);
    const tile = tileAt(plant.x, plant.y);
    if (!tile) return;

    let water = tile.water;
    let nutrients = tile.nutrients;
    let light = 0.9;
    let crowd = 0;
    let sameCrowd = 0;

    state.plants.forEach((other) => {
      if (other === plant) return;
      const otherType = plantType(other.typeId);
      const dist = Math.hypot(other.x - plant.x, other.y - plant.y);
      if (dist > Math.max(type.radius, otherType.radius)) return;
      const falloff = 1 - dist / Math.max(type.radius, otherType.radius);
      water -= otherType.uses.water * falloff * 0.34;
      nutrients -= otherType.uses.nutrients * falloff * 0.34;
      light -= (otherType.uses.light + (otherType.gives.shade || 0)) * falloff * 0.38;
      water += (otherType.gives.water || 0) * falloff;
      nutrients += (otherType.gives.nutrients || 0) * falloff;
      if (otherType.gives.shade && type.need.light[1] < 0.72) light += otherType.gives.shade * falloff * 0.22;
      crowd += falloff * 0.08;
      if (other.typeId === plant.typeId && dist < type.spacing * 1.5) sameCrowd += 0.16 * (1 - dist / (type.spacing * 1.5));
    });

    const terrain = type.terrain.includes(tile.biome) ? 1 : 0.38;
    const waterScore = rangeScore(clamp(water, 0, 1), type.need.water);
    const nutrientScore = rangeScore(clamp(nutrients, 0, 1), type.need.nutrients);
    const lightScore = rangeScore(clamp(light, 0, 1), type.need.light);
    const target = clamp(terrain * 0.28 + waterScore * 0.25 + nutrientScore * 0.24 + lightScore * 0.18 - crowd - sameCrowd, 0, 1);

    plant.health += (target - plant.health) * clamp(dt * 0.42, 0, 1);
    plant.growth = clamp(plant.growth + (plant.health - 0.42) * dt * 0.055, 0.05, 1);
    plant.age += dt;
    plant.pulse += dt * (0.8 + plant.health * 0.8);

    if (plant.growth > 0.82 && plant.health > 0.62 && state.plants.length < 240 && rand() < type.spread * dt * 0.018) {
      attemptSpread(plant, type);
    }

    tile.water = clamp(tile.water - type.uses.water * dt * 0.0008 * plant.growth + (type.gives.water || 0) * dt * 0.0009, 0, 1);
    tile.nutrients = clamp(tile.nutrients - type.uses.nutrients * dt * 0.0008 * plant.growth + (type.gives.nutrients || 0) * dt * 0.001, 0, 1);
  }

  function rangeScore(value, range) {
    const [min, max] = range;
    if (value >= min && value <= max) return 1;
    if (value < min) return clamp(value / Math.max(0.01, min), 0, 1);
    return clamp(1 - (value - max) / Math.max(0.01, 1 - max), 0, 1);
  }

  function attemptSpread(parent, type) {
    const angle = rand() * TAU;
    const dist = type.spacing * (1.15 + rand() * 1.8);
    const x = clamp(parent.x + Math.cos(angle) * dist, 20, WORLD_W - 20);
    const y = clamp(parent.y + Math.sin(angle) * dist, 20, WORLD_H - 20);
    const oldMode = state.mode;
    const oldPlant = state.selectedPlant;
    state.mode = "plant";
    state.selectedPlant = type.id;
    const can = canApplyAt(x, y).ok;
    state.mode = oldMode;
    state.selectedPlant = oldPlant;
    if (!can) return;
    state.plants.push({
      id: `${type.id}-wild-${state.elapsed}-${state.plants.length}`,
      typeId: type.id,
      x,
      y,
      health: 0.44,
      growth: 0.08,
      age: 0,
      pulse: rand() * TAU,
    });
  }

  function updateTiles(dt) {
    const rate = dt * 0.002;
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const tile = state.tiles[y][x];
        tile.water = lerp(tile.water, tile.baseWater, rate);
        tile.nutrients = lerp(tile.nutrients, tile.baseNutrients, rate * 0.65);
      }
    }
  }

  function updateFauna(dt) {
    const support = ecosystemSupport();
    FAUNA.forEach((species) => {
      const target = Math.min(18, Math.floor((support[species.likes] || 0) / species.threshold));
      const current = state.units.filter((unit) => unit.kind === species.id).length;
      if (current < target && rand() < dt * 0.7) {
        spawnUnit(species);
      } else if (current > target && rand() < dt * 0.3) {
        const index = state.units.findIndex((unit) => unit.kind === species.id);
        if (index >= 0) state.units.splice(index, 1);
      }
    });

    state.units.forEach((unit) => {
      unit.wander -= dt;
      if (!unit.target || unit.wander <= 0 || Math.hypot(unit.target.x - unit.x, unit.target.y - unit.y) < 28) {
        pickUnitTarget(unit);
      }
      const dx = unit.target.x - unit.x;
      const dy = unit.target.y - unit.y;
      const dist = Math.hypot(dx, dy) || 1;
      unit.heading = Math.atan2(dy, dx);
      unit.x = clamp(unit.x + (dx / dist) * unit.speed * dt, 10, WORLD_W - 10);
      unit.y = clamp(unit.y + (dy / dist) * unit.speed * dt, 10, WORLD_H - 10);
    });
  }

  function ecosystemSupport() {
    const support = { food: 0, nectar: 0, oxygen: 0, cover: 0, nutrients: 0 };
    state.plants.forEach((plant) => {
      const type = plantType(plant.typeId);
      const strength = plant.health * (0.35 + plant.growth * 0.65);
      Object.entries(type.gives).forEach(([key, value]) => {
        support[key] = (support[key] || 0) + value * strength;
      });
    });
    return support;
  }

  function spawnUnit(species) {
    const plant = findSupportPlant(species.likes);
    const x = plant ? plant.x + (rand() - 0.5) * 80 : rand() * WORLD_W;
    const y = plant ? plant.y + (rand() - 0.5) * 80 : rand() * WORLD_H;
    state.units.push({
      kind: species.id,
      color: species.color,
      likes: species.likes,
      speed: species.speed * (0.8 + rand() * 0.4),
      x: clamp(x, 10, WORLD_W - 10),
      y: clamp(y, 10, WORLD_H - 10),
      target: { x: rand() * WORLD_W, y: rand() * WORLD_H },
      heading: rand() * TAU,
      wander: 0,
    });
  }

  function findSupportPlant(likes) {
    const candidates = state.plants.filter((plant) => (plantType(plant.typeId).gives[likes] || 0) > 0 && plant.health > 0.3);
    if (!candidates.length) return null;
    return candidates[Math.floor(rand() * candidates.length)];
  }

  function pickUnitTarget(unit) {
    const plant = findSupportPlant(unit.likes);
    if (plant) {
      const angle = rand() * TAU;
      const dist = 18 + rand() * 52;
      unit.target = {
        x: clamp(plant.x + Math.cos(angle) * dist, 10, WORLD_W - 10),
        y: clamp(plant.y + Math.sin(angle) * dist, 10, WORLD_H - 10),
      };
    } else {
      unit.target = { x: rand() * WORLD_W, y: rand() * WORLD_H };
    }
    unit.wander = 1.2 + rand() * 2.2;
  }

  function updateScore(dt) {
    if (!state.plants.length) {
      state.bioScore = 0;
      state.gungans = 0;
      state.seedBank = clamp(state.seedBank + dt * 0.25, 0, 99);
      return;
    }
    const healthyPlants = state.plants.filter((plant) => plant.health > 0.45);
    const diversity = new Set(healthyPlants.map((plant) => plant.typeId)).size;
    const avgHealth = state.plants.reduce((sum, plant) => sum + plant.health, 0) / state.plants.length;
    const mature = state.plants.filter((plant) => plant.growth > 0.72 && plant.health > 0.5).length;
    const support = ecosystemSupport();
    const supportScore = Object.values(support).reduce((sum, value) => sum + value, 0);
    const raw =
      healthyPlants.length * 7 +
      mature * 8 +
      diversity * 64 +
      avgHealth * 260 +
      state.units.length * 16 +
      supportScore * 36;
    state.bioScore = Math.round(lerp(state.bioScore, raw, clamp(dt * 0.85, 0, 1)));
    state.gungans = Math.max(0, Math.floor((state.bioScore - 520) / 310));
    state.seedBank = clamp(state.seedBank + dt * (0.22 + state.bioScore / 2400), 0, 99);
  }

  function updateHud() {
    bioScoreEl.textContent = state.bioScore.toLocaleString();
    gunganCountEl.textContent = String(state.gungans);
    faunaCountEl.textContent = String(state.units.length);
    seedCountEl.textContent = String(Math.floor(state.seedBank));
    const selected = plantType(state.selectedPlant);
    selectedNameEl.textContent = selected.name;
    selectedSwatchEl.style.background = `radial-gradient(circle at 45% 32%, #f4ffd8, ${selected.color} 38%, ${selected.dark})`;
    selectedSwatchEl.style.boxShadow = `0 0 18px ${selected.color}88`;

    const gives = Object.keys(selected.gives)
      .slice(0, 3)
      .map((key) => key[0].toUpperCase() + key.slice(1))
      .join(" / ");
    plantStatsEl.innerHTML = "";
    [
      `Cost ${selected.cost}`,
      selected.role,
      gives || "Habitat",
    ].forEach((text) => {
      const pill = document.createElement("span");
      pill.className = "stat-pill";
      pill.textContent = text;
      plantStatsEl.appendChild(pill);
    });

    [...paletteEl.children].forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.plant === state.selectedPlant);
    });
  }

  function pulseReadout(title, body) {
    readoutTitleEl.textContent = title;
    readoutBodyEl.textContent = body;
    readoutEl.animate(
      [
        { transform: "translateY(4px)", opacity: 0.7 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 180, easing: "ease-out" }
    );
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mode === mode);
    });
    if (mode === "plant") {
      const type = plantType(state.selectedPlant);
      pulseReadout(type.name, type.role);
    } else if (mode === "water") {
      pulseReadout("Water brush", "Wet ground");
    } else if (mode === "soil") {
      pulseReadout("Soil brush", "Nutrient boost");
    } else {
      pulseReadout("Inspect", "Terrain and life");
    }
  }

  function buildPalette() {
    PLANTS.forEach((plant) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "plant-option";
      button.dataset.plant = plant.id;
      button.title = `${plant.name}: ${plant.role}`;
      button.innerHTML = `
        <span class="plant-chip" aria-hidden="true"></span>
        <strong></strong>
        <span></span>
      `;
      button.querySelector(".plant-chip").style.background = `radial-gradient(circle at 42% 32%, #f7ffd7, ${plant.color} 38%, ${plant.dark})`;
      button.querySelector("strong").textContent = plant.name;
      button.querySelector("span:last-child").textContent = plant.role;
      button.addEventListener("click", () => {
        state.selectedPlant = plant.id;
        setMode("plant");
        pulseReadout(plant.name, plant.role);
        state.dirtyUi = true;
      });
      paletteEl.appendChild(button);
    });
  }

  function bindEvents() {
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", (event) => {
      if (state.pointerDown && state.drag && (state.mode === "plant" || state.mode === "inspect")) {
        const totalDx = event.clientX - state.drag.startX;
        const totalDy = event.clientY - state.drag.startY;
        if (Math.hypot(totalDx, totalDy) > 8) state.drag.moved = true;
        if (state.drag.moved) {
          panCamera(event.clientX - state.drag.lastX, event.clientY - state.drag.lastY);
          state.drag.lastX = event.clientX;
          state.drag.lastY = event.clientY;
        }
      }

      const world = screenToWorld(event.clientX, event.clientY);
      if (world.x < 0 || world.y < 0 || world.x > WORLD_W || world.y > WORLD_H) {
        state.hoverWorld = null;
        state.hoverPlant = null;
        return;
      }
      state.hoverWorld = world;
      state.hoverPlant = nearestPlant(world.x, world.y, 42);
      if (state.hoverPlant && state.mode === "inspect") {
        const type = plantType(state.hoverPlant.typeId);
        readoutTitleEl.textContent = type.name;
        readoutBodyEl.textContent = `Health ${Math.round(state.hoverPlant.health * 100)}%, growth ${Math.round(state.hoverPlant.growth * 100)}%`;
      }
      if (state.pointerDown && (state.mode === "water" || state.mode === "soil")) {
        applyAt(world.x, world.y);
      }
    });
    canvas.addEventListener("pointerleave", () => {
      state.hoverWorld = null;
      state.hoverPlant = null;
      state.pointerDown = false;
    });
    canvas.addEventListener("pointerdown", (event) => {
      canvas.setPointerCapture(event.pointerId);
      state.pointerDown = true;
      const world = screenToWorld(event.clientX, event.clientY);
      state.drag = {
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        world,
        moved: false,
      };
      if (world.x >= 0 && world.y >= 0 && world.x <= WORLD_W && world.y <= WORLD_H) {
        state.hoverWorld = world;
        if (state.mode === "water" || state.mode === "soil") {
          applyAt(world.x, world.y);
        }
      }
    });
    canvas.addEventListener("pointerup", () => {
      if (state.drag && !state.drag.moved && (state.mode === "plant" || state.mode === "inspect")) {
        applyAt(state.drag.world.x, state.drag.world.y);
      }
      state.pointerDown = false;
      state.drag = null;
    });

    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    cyclePlantButton.addEventListener("click", () => {
      const index = PLANTS.findIndex((plant) => plant.id === state.selectedPlant);
      const next = PLANTS[(index + 1) % PLANTS.length];
      state.selectedPlant = next.id;
      setMode("plant");
      state.dirtyUi = true;
    });

    inspectToggle.addEventListener("click", () => setMode("inspect"));
    faunaToggle.addEventListener("click", () => {
      state.view = "fauna";
      pulseReadout("Fauna view", `${state.units.length} active creatures`);
    });
    plantToggle.addEventListener("click", () => {
      state.view = "plant";
      const type = plantType(state.selectedPlant);
      pulseReadout(type.name, type.role);
    });
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  generateWorld();
  seedStartingLife();
  buildPalette();
  bindEvents();
  resize();
  setMode("plant");
  updateHud();
  requestAnimationFrame(frame);
})();
