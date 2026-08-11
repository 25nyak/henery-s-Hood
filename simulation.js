import {
  OBJECTIVES,
  AIRPORT_ESCAPE_POINT,
  AIRPORT_HEIST_POINT,
  CONTRACT_POINTS,
  PROPERTY_POINTS,
  PARKED_CARS,
  PICKUP_SPAWNS,
  INTERIORS,
  UPGRADE_SHOP_POINT,
  isRiverWater,
  clampToCity,
  clampToInterior,
  collidesBuilding,
  collidesInterior,
} from "./world.js";

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const POLICE_TYPES = ["cop", "detective", "tactical"];

const ENEMY_STATS = {
  goon: { hp: 58, speed: 145, damage: 7, reward: 90, reach: 42 },
  enforcer: { hp: 105, speed: 118, damage: 11, reward: 180, reach: 46 },
  lieutenant: { hp: 145, speed: 155, damage: 14, reward: 360, reach: 48 },
  boss: { hp: 270, speed: 96, damage: 19, reward: 850, reach: 54 },
  cop: { hp: 72, speed: 138, damage: 9, reward: 70, reach: 44 },
  detective: { hp: 105, speed: 148, damage: 13, reward: 160, reach: 46 },
  tactical: { hp: 165, speed: 126, damage: 18, reward: 300, reach: 50 },
};

const PHONE_CALLS = [
  {
    target: "D. Mercer · MOONPRAWN",
    signal: "Cautious. Wants certainty.",
    choices: ["The lunar vault guarantees the float.", "Everyone downtown is buying.", "This window closes in ten seconds."],
    correct: 0,
  },
  {
    target: "R. Vale · TURBOSOCKS",
    signal: "Competitive. Hates missing out.",
    choices: ["Read the filings first.", "The Harbor Club already took the front row.", "Small positions are safer."],
    correct: 1,
  },
  {
    target: "K. North · CLOUDHORSE",
    signal: "Impatient. Wants it now.",
    choices: ["I can mail a prospectus.", "Sleep on the decision.", "One tap closes the allocation now."],
    correct: 2,
  },
];

function moveWithCollision(entity, dx, dy, radius) {
  const nextX = clampToCity(entity.x + dx, radius);
  if (!collidesBuilding(nextX, entity.y, radius)) entity.x = nextX;
  const nextY = clampToCity(entity.y + dy, radius);
  if (!collidesBuilding(entity.x, nextY, radius)) entity.y = nextY;
}

function civilianRoster() {
  const spots = [
    [300, 760], [1070, 420], [1120, 920], [1880, 860],
    [650, 1110], [1430, 1100], [1090, 1780], [1890, 1450],
    [2200, 680], [2540, 1040], [2860, 690], [3400, 760],
    [2250, 1750], [3050, 1100], [2700, 2450], [1500, 2700],
  ];
  return spots.map(([x, y], id) => ({
    id, type: "civilian", x, y, angle: Math.random() * Math.PI * 2,
    wander: Math.random() * 3, fleeing: 0, hitFlash: 0,
  }));
}

export function createSimulation({ controls, tweaks, sound, sdk, bestCash, savedProfile, onEnd, onPhoneCall, onShop, onProfile, onProperty }) {
  const allowedMobmons = ["bruiser", "shooter", "medic", "scout"];
  const selectedMobmons = [...new Set(Array.isArray(savedProfile?.mobmons) ? savedProfile.mobmons : ["bruiser", "shooter", "medic"])]
    .filter((type) => allowedMobmons.includes(type)).slice(0, 3);
  while (selectedMobmons.length < 3) selectedMobmons.push(allowedMobmons.find((type) => !selectedMobmons.includes(type)));
  const initialProfile = {
    look: savedProfile?.look || "ledger_runner",
    codename: savedProfile?.codename || "Rook",
    mobmons: selectedMobmons,
  };
  const state = {
    mode: "idle",
    time: 0,
    environment: { hour: 17.5, weather: "rain", weatherTimer: 18 },
    cash: 0,
    bestCash,
    heat: 0,
    crimeQuiet: 0,
    mission: 0,
    location: "city",
    capture: 0,
    retaliationLeft: 0,
    extortionStarted: false,
    racketBossAlive: false,
    phoneOpen: false,
    callRound: 0,
    callCorrect: 0,
    escortStarted: false,
    escortLeft: 0,
    heistStarted: false,
    heistLeft: 0,
    cargoStage: 0,
    cargoCarId: PARKED_CARS.length,
    airportStage: 0,
    airportLeft: 0,
    aircraftCarId: PARKED_CARS.length + 2,
    shopOpen: false,
    profileOpen: false,
    propertyOpen: false,
    weaponWheelOpen: false,
    properties: {},
    incomeTimer: 10,
    wolfDeal: { propertyId: null, cooldown: 8 },
    recovery: { timer: 0, message: "", detail: "" },
    profile: initialProfile,
    tutorial: { stage: 0, done: false },
    level: 1,
    xp: 0,
    nextXp: 260,
    upgrades: { power: 0, ballistics: 0, armor: 0, mobility: 0, engine: 0 },
    player: {
      x: 500, y: 1050, angle: 0, hp: 100, maxHp: 100, armor: 0, ammo: 24,
      weapon: "pistol", meleeWeapon: "fists",
      weaponsOwned: { pistol: true, shotgun: false, carbine: false, revolver: false },
      ammoByWeapon: { pistol: 24, shotgun: 0, carbine: 0, revolver: 0 },
      cooldown: 0, inCar: null, combo: 0, comboWindow: 0,
      heavyCooldown: 0, dashCooldown: 0, dashTime: 0, dashX: 0, dashY: -1,
      invulnerable: 0,
    },
    owner: { type: "owner", location: "casino", x: 540, y: 245, angle: 0, nerve: 100, fleeing: 0, surrendered: false, hitFlash: 0 },
    npcs: civilianRoster(),
    specialNpcs: [
      { id: 100, type: "escort", location: "crown", x: 250, y: 850, angle: 0, wander: 2, fleeing: 0 },
      { id: 101, type: "escort", location: "crown", x: 450, y: 850, angle: 0, wander: 1, fleeing: 0 },
      { id: 102, type: "escort", location: "crown", x: 650, y: 850, angle: 0, wander: 3, fleeing: 0 },
      { id: 103, type: "fence", location: "marina", x: 450, y: 900, angle: Math.PI, wander: 99, fleeing: 0 },
      { id: 104, type: "fence", location: "marina", x: 610, y: 900, angle: Math.PI, wander: 99, fleeing: 0 },
    ],
    allies: [],
    mobmons: selectedMobmons.map((type, index) => ({ type, location: "city", x: 450 + index * 50, y: 1100 + index % 2 * 20, angle: 0, cooldown: 0 })),
    contract: { target: null, cooldown: 3, index: 0 },
    missionItems: [],
    cars: [
      ...PARKED_CARS.map((car, id) => ({ ...car, id, speed: 0, occupied: false })),
      { id: PARKED_CARS.length, x: 1900, y: 1780, angle: 0, frame: "cargo_truck", speed: 0, occupied: false, cargo: true },
      { id: PARKED_CARS.length + 1, x: 410, y: 860, angle: Math.PI / 2, frame: "armored_van", speed: 0, occupied: false, heistVan: true },
      { id: PARKED_CARS.length + 2, x: 900, y: 3555, angle: Math.PI / 2, frame: "private_jet", speed: 0, occupied: false, aircraft: true, missionLocked: true },
      { id: PARKED_CARS.length + 3, x: 1750, y: 3310, angle: Math.PI / 2, frame: "baggage_tug", speed: 0, occupied: false, scenery: true },
      { id: PARKED_CARS.length + 4, x: 1450, y: 2245, angle: Math.PI / 2, frame: "speedboat", speed: 0, occupied: false, boat: true },
      { id: PARKED_CARS.length + 5, x: 3300, y: 2405, angle: -Math.PI / 2, frame: "cabin_cruiser", speed: 0, occupied: false, boat: true },
      { id: PARKED_CARS.length + 6, x: 2350, y: 3330, angle: 0, frame: "prop_plane", speed: 0, occupied: false, aircraft: true, stealable: true },
      { id: PARKED_CARS.length + 7, x: 2750, y: 3260, angle: 0, frame: "news_helicopter", speed: 0, occupied: false, aircraft: true, stealable: true },
    ],
    pickups: [
      ...PICKUP_SPAWNS.map((pickup, id) => ({ ...pickup, id, location: "city", active: true, respawn: 0 })),
      { id: 20, location: "casino", x: 120, y: 560, type: "armor_vest", active: true, respawn: 0 },
      { id: 21, location: "ledger", x: 780, y: 560, type: "weapon_case", active: true, respawn: 0 },
      { id: 22, location: "marina", x: 120, y: 150, type: "cash_bundle", active: true, respawn: 0 },
      { id: 23, location: "crown", x: 780, y: 150, type: "cash_bundle", active: true, respawn: 0 },
      { id: 24, location: "city", x: 1180, y: 320, type: "weapon_baseball_bat", active: true, respawn: 0 },
      { id: 25, location: "casino", x: 760, y: 920, type: "weapon_pump_shotgun", active: true, respawn: 0 },
      { id: 26, location: "ledger", x: 150, y: 920, type: "weapon_compact_carbine", active: true, respawn: 0 },
      { id: 27, location: "crown", x: 760, y: 930, type: "weapon_heavy_revolver", active: true, respawn: 0 },
    ],
    enemies: [],
    policeCars: [],
    bullets: [],
    effects: [],
    particles: [],
    texts: [],
    shake: 0,
    policeTimer: 2,
    animTime: 0,
    endTitle: "",
    endDetail: "",
  };

  const effectScale = () => Number(tweaks.get("effectsIntensity"));
  const heatScale = () => Number(tweaks.get("heatGain"));
  const enemyPressure = () => Number(tweaks.get("enemyPressure"));

  function moveEntity(entity, dx, dy, radius, location = entity.location || state.location) {
    if (location === "city") {
      moveWithCollision(entity, dx, dy, radius);
      return;
    }
    const next = clampToInterior(location, entity.x + dx, entity.y + dy, radius);
    if (!collidesInterior(location, next.x, entity.y, radius)) entity.x = next.x;
    if (!collidesInterior(location, entity.x, next.y, radius)) entity.y = next.y;
  }

  function vehicleRadius(vehicle) {
    if (vehicle.aircraft) return 66;
    if (vehicle.cargo) return 44;
    if (vehicle.boat) return 38;
    return 30;
  }

  function resolveVehicleContacts(vehicle, peers, oldX, oldY) {
    let contacted = false;
    for (const other of peers) {
      if (other === vehicle) continue;
      const minimum = vehicleRadius(vehicle) + vehicleRadius(other);
      let dx = other.x - vehicle.x;
      let dy = other.y - vehicle.y;
      let gap = Math.hypot(dx, dy);
      if (gap >= minimum) continue;
      if (gap < 0.001) { dx = 1; dy = 0; gap = 1; }
      contacted = true;
      const nx = dx / gap;
      const ny = dy / gap;
      const overlap = minimum - gap;
      const otherOldX = other.x;
      const otherOldY = other.y;
      vehicle.x -= nx * overlap * 0.7;
      vehicle.y -= ny * overlap * 0.7;
      moveWithCollision(other, nx * overlap * 0.3, ny * overlap * 0.3, vehicleRadius(other));
      const otherInvalid = other.boat ? !isRiverWater(other.x, other.y) : !other.aircraft && isRiverWater(other.x, other.y);
      if (otherInvalid) { other.x = otherOldX; other.y = otherOldY; }
      if (collidesBuilding(vehicle.x, vehicle.y, vehicleRadius(vehicle))) { vehicle.x = oldX; vehicle.y = oldY; }
      const impact = Math.abs(vehicle.speed || 0) + Math.abs(other.speed || 0);
      vehicle.speed = -(vehicle.speed || 0) * 0.18;
      other.speed = (other.speed || 0) * 0.35 + impact * 0.12;
      if ((vehicle.bumpCooldown || 0) <= 0 && impact > 80) {
        vehicle.bumpCooldown = 0.35;
        sound.crash();
        state.shake = Math.max(state.shake, Math.min(8, impact * 0.012));
        haptic(16);
        if (state.player.inCar === vehicle.id && impact > 280) damagePlayer(Math.min(9, impact * 0.018));
        if (state.player.inCar === other.id && impact > 280) damagePlayer(Math.min(9, impact * 0.018));
      }
    }
    return contacted;
  }

  function resolveCrowdContacts() {
    if (state.location !== "city" && !INTERIORS[state.location]) return;
    const people = [
      ...(state.player.inCar === null ? [state.player] : []),
      ...state.enemies.filter((enemy) => enemy.location === state.location),
      ...(state.location === "city" ? state.npcs.filter((npc) => !npc.knocked) : []),
      ...state.specialNpcs.filter((npc) => npc.location === state.location),
      ...state.allies.filter((ally) => ally.location === state.location),
      ...state.mobmons.filter((mobmon) => mobmon.location === state.location),
    ];
    for (let first = 0; first < people.length; first += 1) {
      for (let second = first + 1; second < people.length; second += 1) {
        const a = people[first];
        const b = people[second];
        const radiusA = a.type && ["bruiser", "shooter", "medic", "scout"].includes(a.type) ? 12 : 18;
        const radiusB = b.type && ["bruiser", "shooter", "medic", "scout"].includes(b.type) ? 12 : 18;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let gap = Math.hypot(dx, dy);
        const minimum = radiusA + radiusB;
        if (gap >= minimum) continue;
        if (gap < 0.001) { dx = 1; dy = 0; gap = 1; }
        const nx = dx / gap;
        const ny = dy / gap;
        const push = (minimum - gap) * 0.5;
        const oldAx = a.x; const oldAy = a.y;
        const oldBx = b.x; const oldBy = b.y;
        moveEntity(a, -nx * push, -ny * push, radiusA, a.location || state.location);
        moveEntity(b, nx * push, ny * push, radiusB, b.location || state.location);
        if (state.location === "city" && isRiverWater(a.x, a.y) && a !== state.player) { a.x = oldAx; a.y = oldAy; }
        if (state.location === "city" && isRiverWater(b.x, b.y) && b !== state.player) { b.x = oldBx; b.y = oldBy; }
      }
    }
  }

  function addText(x, y, text, color = "#ffe393") {
    state.texts.push({ x, y, text, color, life: 1.1, location: state.location });
  }

  function burst(x, y, color, count = 8) {
    const amount = Math.round(count * effectScale());
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 110;
      state.particles.push({
        x, y, color,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.45,
        size: 2 + Math.random() * 4,
        location: state.location,
      });
    }
  }

  function raiseHeat(amount) {
    state.heat = Math.min(5, state.heat + amount * heatScale());
    state.crimeQuiet = 0;
  }

  function haptic(pattern) {
    if (!sdk.device.haptics.isSupported()) return;
    void sdk.device.haptics.vibrate(pattern).catch(() => {});
  }

  function gainXp(amount) {
    state.xp += amount;
    while (state.xp >= state.nextXp) {
      state.xp -= state.nextXp;
      state.level += 1;
      state.nextXp = Math.floor(state.nextXp * 1.28);
      state.player.maxHp += 5;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 24);
      addText(state.player.x, state.player.y - 70, `LEVEL ${state.level} · MOBMONS POWERED`, "#65e6dd");
      haptic([18, 22, 32]);
    }
  }

  function setProfile(profile) {
    const looks = ["ledger_runner", "velvet_viper", "dock_baron", "neon_widow", "old_fox"];
    const mobmonLoadout = [...new Set(Array.isArray(profile.mobmons) ? profile.mobmons : state.profile.mobmons)]
      .filter((type) => allowedMobmons.includes(type)).slice(0, 3);
    while (mobmonLoadout.length < 3) mobmonLoadout.push(allowedMobmons.find((type) => !mobmonLoadout.includes(type)));
    state.profile = {
      look: looks.includes(profile.look) ? profile.look : "ledger_runner",
      codename: String(profile.codename || "Rook").trim().slice(0, 16) || "Rook",
      mobmons: mobmonLoadout,
    };
    state.mobmons = mobmonLoadout.map((type, index) => ({
      type, location: state.location, x: state.player.x + (index - 1) * 45,
      y: state.player.y + 55, angle: 0, cooldown: 0,
    }));
    onProfile(state.profile);
  }

  function selectWeapon(name) {
    if (!state.player.weaponsOwned[name]) return false;
    state.player.ammoByWeapon[state.player.weapon] = state.player.ammo;
    state.player.weapon = name;
    state.player.ammo = state.player.ammoByWeapon[name] || 0;
    addText(state.player.x, state.player.y - 45, `${name.toUpperCase()} EQUIPPED`, "#65e6dd");
    return true;
  }

  function tutorialText() {
    if (state.tutorial.done) return "";
    return ["MOVE WITH THE JOYSTICK", "TAP HIT FOR A COMBO", "TAP DASH TO EVADE", "HOLD SHOOT TO FIRE"][state.tutorial.stage] || "";
  }

  function skipTutorial() {
    state.tutorial.done = true;
  }

  function setWeaponWheel(open) { state.weaponWheelOpen = Boolean(open); }

  function spawnEnemy(type = "goon", around = state.player, radius = 300, job = null, location = state.location) {
    const stats = ENEMY_STATS[type];
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const angle = Math.random() * Math.PI * 2;
      const range = radius * (0.65 + Math.random() * 0.45);
      const rawX = around.x + Math.cos(angle) * range;
      const rawY = around.y + Math.sin(angle) * range;
      const point = location === "city"
        ? { x: clampToCity(rawX, 26), y: clampToCity(rawY, 26) }
        : clampToInterior(location, rawX, rawY, 26);
      const blocked = location === "city"
        ? collidesBuilding(point.x, point.y, 24)
        : collidesInterior(location, point.x, point.y, 24);
      if (!blocked) {
        const enemy = {
          type, location, x: point.x, y: point.y, angle: 0, hp: stats.hp, maxHp: stats.hp,
          cooldown: 0.5 + Math.random(), windup: 0, vx: 0, vy: 0,
          animOffset: Math.random() * 4, job,
        };
        state.enemies.push(enemy);
        return enemy;
      }
    }
    return null;
  }

  function startExtortion() {
    if (state.extortionStarted) return;
    state.extortionStarted = true;
    state.racketBossAlive = true;
    spawnEnemy("boss", INTERIORS.casino.missionPoint, 110);
    spawnEnemy("goon", INTERIORS.casino.missionPoint, 170);
    spawnEnemy("goon", INTERIORS.casino.missionPoint, 195);
    state.owner.fleeing = 1.6;
    sound.alarm();
    addText(INTERIORS.casino.missionPoint.x, INTERIORS.casino.missionPoint.y - 70, "RACKET BOSS!", "#ffbe53");
  }

  function startRetaliation() {
    state.mission = 1;
    state.capture = 0;
    const ranks = ["goon", "goon", "goon", "goon", "enforcer", "enforcer", "lieutenant", "boss"];
    state.retaliationLeft = state.enemies.filter((enemy) => !POLICE_TYPES.includes(enemy.type) && enemy.location === state.location).length + ranks.length;
    ranks.forEach((rank, index) => spawnEnemy(rank, state.player, 260 + index * 22));
    state.pickups.push({ id: 99, location: state.location, x: state.player.x + 80, y: state.player.y + 40, type: "weapon_case", active: true, respawn: 0 });
    sound.alarm();
    addText(state.player.x, state.player.y - 60, "RANKED RETALIATION!", "#ff5277");
  }

  function completeExtortion() {
    if (state.owner.surrendered) return;
    state.owner.surrendered = true;
    state.owner.fleeing = 5;
    state.cash += 1800;
    sound.cash();
    haptic([25, 30, 25]);
    raiseHeat(0.9);
    addText(state.owner.x, state.owner.y - 55, "RACKET SEIZED · +$1,800", "#ffe393");
    startRetaliation();
  }

  function startEscortRacket() {
    if (state.escortStarted) return;
    state.escortStarted = true;
    state.escortLeft = 5;
    ["goon", "goon", "enforcer", "lieutenant", "boss"].forEach((rank, index) =>
      spawnEnemy(rank, { x: 450, y: 650 }, 210 + index * 25, "escort"));
    state.specialNpcs.filter((npc) => npc.type === "escort").forEach((npc) => { npc.fleeing = 4; });
    addText(450, 820, "ESCORT RACKET UNDER ATTACK!", "#ff5277");
    sound.alarm();
  }

  function completeEscortRacket() {
    state.cash += 2800;
    state.mission = 3;
    state.capture = 0;
    addText(state.player.x, state.player.y - 58, "RACKET SECURED · +$2,800", "#ffe393");
    sound.cash();
    haptic([20, 25, 35]);
  }

  function startCasinoHeist() {
    if (state.heistStarted) return;
    state.heistStarted = true;
    state.heistLeft = 6;
    state.allies = [
      { type: "crew", location: "casino", x: state.player.x - 55, y: state.player.y + 45, angle: 0, cooldown: 0 },
      { type: "crew", location: "casino", x: state.player.x + 55, y: state.player.y + 45, angle: 0, cooldown: 0 },
      { type: "crew", location: "casino", x: state.player.x, y: state.player.y + 85, angle: 0, cooldown: 0 },
    ];
    ["enforcer", "enforcer", "lieutenant", "lieutenant", "cop", "boss"].forEach((rank, index) =>
      spawnEnemy(rank, { x: 450, y: 720 }, 230 + index * 20, "heist"));
    state.heat = Math.max(2, state.heat);
    addText(450, 900, "HOLE-IN-THE-WALL CREW · GO!", "#65e6dd");
    sound.alarm();
  }

  function completeCasinoHeist() {
    state.cash += 6200;
    state.mission = 4;
    state.capture = 0;
    state.missionItems.push({ type: "casino_loot_bag", location: "casino", x: 450, y: 900 });
    addText(state.player.x, state.player.y - 60, "VAULT OPEN · +$6,200", "#ffe393");
    sound.cash();
    haptic([30, 20, 45]);
  }

  function completeCargoSale() {
    state.cash += 4800;
    state.mission = 5;
    state.cargoStage = 3;
    state.missionItems.push({ type: "fenced_cargo_crate", location: "marina", x: 520, y: 900 });
    addText(state.player.x, state.player.y - 55, "GOODS FENCED · +$4,800", "#ffe393");
    sound.cash();
    haptic([25, 20, 35]);
  }

  function startAirportHeist() {
    if (state.airportStage !== 0) return;
    state.airportStage = 1;
    state.airportLeft = 6;
    ["cop", "cop", "enforcer", "lieutenant", "lieutenant", "boss"].forEach((rank, index) =>
      spawnEnemy(rank, AIRPORT_HEIST_POINT, 260 + index * 28, "airport"));
    state.heat = 3;
    addText(AIRPORT_HEIST_POINT.x, AIRPORT_HEIST_POINT.y - 70, "AIRPORT HEIST · CLEAR SECURITY", "#ff5277");
    sound.alarm();
  }

  function completeAirportHijack() {
    state.airportStage = 4;
    state.mission = 7;
    state.cash += 8500;
    addText(state.player.x, state.player.y - 85, "JET HIJACKED · +$8,500", "#ffe393");
    sound.cash();
    haptic([35, 25, 45]);
  }

  function openShop() {
    if (state.shopOpen) return;
    state.shopOpen = true;
    onShop(state.upgrades, state.cash, null);
  }

  function closeShop() {
    state.shopOpen = false;
    onShop(null);
  }

  function buyUpgrade(key, quick = false) {
    if ((!state.shopOpen && !quick) || !(key in state.upgrades)) return;
    const level = state.upgrades[key];
    if (level >= 3) {
      if (state.shopOpen) onShop(state.upgrades, state.cash, "MAX LEVEL");
      return;
    }
    const cost = [1200, 2500, 4200][level];
    if (state.cash < cost) {
      if (state.shopOpen) onShop(state.upgrades, state.cash, "NOT ENOUGH CASH");
      return;
    }
    state.cash -= cost;
    state.upgrades[key] += 1;
    if (key === "armor") {
      state.player.maxHp += 20;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 30);
      state.player.armor = Math.min(80, state.player.armor + 20);
    }
    sound.cash();
    haptic(18);
    addText(state.player.x, state.player.y - 56, `${key.toUpperCase()} BUFF LV ${state.upgrades[key]}`, "#65e6dd");
    if (state.shopOpen) onShop(state.upgrades, state.cash, `${key.toUpperCase()} UPGRADED`);
  }

  function openProfile() { state.profileOpen = true; }
  function closeProfile() { state.profileOpen = false; }

  function openProperty(property) {
    state.propertyOpen = true;
    onProperty(property, state.cash, null);
  }

  function closeProperty() {
    state.propertyOpen = false;
    onProperty(null);
  }

  function buyProperty(id) {
    const property = PROPERTY_POINTS.find((entry) => entry.id === id);
    if (!property || state.properties[id]) return;
    if (state.cash < property.cost) {
      onProperty(property, state.cash, "NOT ENOUGH CASH");
      return;
    }
    state.cash -= property.cost;
    state.properties[id] = true;
    if (property.commercial && !state.wolfDeal.propertyId) {
      state.wolfDeal.propertyId = id;
      state.wolfDeal.cooldown = 0;
    }
    sound.cash();
    haptic([20, 18, 30]);
    onProperty(property, state.cash, "DEED SIGNED · PROPERTY OWNED");
  }

  function sideMissionText() {
    if (!state.wolfDeal.propertyId) return "";
    const property = PROPERTY_POINTS.find((entry) => entry.id === state.wolfDeal.propertyId);
    return property ? `WOLF ST DEAL · ${property.name.toUpperCase()}` : "";
  }

  function updateRealEstate(dt) {
    state.incomeTimer -= dt;
    if (state.incomeTimer <= 0) {
      state.incomeTimer = 10;
      const income = PROPERTY_POINTS.reduce((sum, property) => sum + (state.properties[property.id] ? property.income : 0), 0);
      if (income > 0) {
        state.cash += income;
        addText(state.player.x, state.player.y - 62, `PROPERTY INCOME +$${income}`, "#65e6dd");
      }
    }
    if (state.wolfDeal.propertyId) return;
    state.wolfDeal.cooldown -= dt;
    if (state.wolfDeal.cooldown > 0) return;
    const owned = PROPERTY_POINTS.filter((property) => property.commercial && state.properties[property.id]);
    if (owned.length) state.wolfDeal.propertyId = owned[Math.floor(state.time / 10) % owned.length].id;
  }

  function currentObjective() {
    if (state.location !== "city") {
      const room = INTERIORS[state.location];
      if (state.mission === 0 && state.location === "casino") return { ...room.missionPoint, radius: 78, short: "EXTORTION" };
      if (state.mission === 1 && state.location === "casino") return null;
      if (state.mission === 2 && state.location === "crown") return { x: 450, y: 850, radius: 82, short: "ESCORT RACKET" };
      if (state.mission === 3 && state.location === "casino") return { x: 450, y: 900, radius: 86, short: "CASINO VAULT" };
      if (state.mission === 4 && state.location === "marina" && state.cargoStage >= 2) return { x: 450, y: 900, radius: 78, short: "THE FENCE" };
      if (state.mission === 5 && state.location === "ledger") return { ...room.missionPoint, radius: 82, short: "CALL FLOOR" };
      return { ...room.exit, radius: 58, short: "EXIT" };
    }
    if (state.mission === 0) return { ...INTERIORS.casino.door, radius: 62, short: "ENTER CASINO" };
    if (state.mission === 1) return { ...INTERIORS.casino.door, radius: 62, short: "CASINO FIGHT" };
    if (state.mission === 2) return { ...INTERIORS.crown.door, radius: 62, short: "CROWN LOUNGE" };
    if (state.mission === 3) return { ...INTERIORS.casino.door, radius: 62, short: "CASINO HEIST" };
    if (state.mission === 4) {
      const truck = state.cars[state.cargoCarId];
      if (state.cargoStage === 0 || state.player.inCar !== state.cargoCarId && state.cargoStage === 1) return { x: truck.x, y: truck.y, radius: 72, short: "HIJACK TRUCK" };
      return { ...INTERIORS.marina.door, radius: 72, short: "DELIVER CARGO" };
    }
    if (state.mission === 5) return { ...INTERIORS.ledger.door, radius: 62, short: "ENTER LEDGER" };
    if (state.mission === 6) {
      const jet = state.cars[state.aircraftCarId];
      if (state.airportStage < 2) return AIRPORT_HEIST_POINT;
      if (state.airportStage === 2) return { x: jet.x, y: jet.y, radius: 105, short: "HIJACK JET" };
      return AIRPORT_ESCAPE_POINT;
    }
    if (state.mission === 7) return OBJECTIVES[2];
    return null;
  }

  function missionText() {
    if (state.location !== "city" && !["casino", "ledger", "crown", "marina"].includes(state.location)) return `${INTERIORS[state.location].name.toUpperCase()} · ACT AT EXIT TO LEAVE`;
    const requiredRoom = { 0: "casino", 1: "casino", 2: "crown", 3: "casino", 5: "ledger" }[state.mission];
    if (state.location !== "city" && requiredRoom && state.location !== requiredRoom) return `ACT AT EXIT · HEAD TO ${INTERIORS[requiredRoom].name.toUpperCase()}`;
    if (state.mission === 4 && state.location !== "city" && state.location !== "marina") return "ACT AT EXIT · DELIVER TO MARINA CLUB";
    if (state.mission === 1 && state.location === "city") return `RETALIATION · RETURN TO CASINO · ${state.retaliationLeft} LEFT`;
    if (state.mission >= 6 && state.location !== "city") return state.mission === 6 ? "AIRPORT HEIST · ACT AT EXIT TO HIT THE STREET" : "GETAWAY · ACT AT EXIT TO HIT THE STREET";
    if (state.mission === 0 && state.location === "city") return "EXTORTION · ENTER THE CASINO";
    if (state.mission === 0 && !state.extortionStarted) return "EXTORTION · ACT AT THE BACK OFFICE";
    if (state.mission === 0 && state.racketBossAlive) return "EXTORTION · BREAK THE RACKET BOSS";
    if (state.mission === 0) return `EXTORTION · OWNER NERVE ${Math.ceil(state.owner.nerve)}%`;
    if (state.mission === 1) return `RETALIATION · ${state.retaliationLeft} RANKED RIVALS LEFT`;
    if (state.mission === 2 && state.location === "city") return "ESCORT RACKET · ENTER CROWN LOUNGE";
    if (state.mission === 2 && !state.escortStarted) return "ESCORT RACKET · ACT TO TAKE THE FRONT";
    if (state.mission === 2) return `ESCORT RACKET · PROTECT THE WORKERS · ${state.escortLeft} LEFT`;
    if (state.mission === 3 && state.location === "city") return "CASINO HEIST · MEET THE HOLE-IN-THE-WALL CREW";
    if (state.mission === 3 && !state.heistStarted) return "CASINO HEIST · ACT AT THE VAULT";
    if (state.mission === 3 && state.heistLeft > 0) return `CASINO HEIST · CLEAR ${state.heistLeft} GUARDS`;
    if (state.mission === 3) return "CASINO HEIST · HOLD ACT TO CRACK THE VAULT";
    if (state.mission === 4 && state.cargoStage === 0) return "CARGO JOB · HIJACK THE BOX TRUCK";
    if (state.mission === 4 && state.cargoStage === 1) return "CARGO JOB · DRIVE THE TRUCK TO MARINA";
    if (state.mission === 4 && state.location === "marina") return "CARGO JOB · ACT TO SELL TO THE FENCE";
    if (state.mission === 4) return "CARGO JOB · ENTER MARINA CLUB";
    if (state.mission === 5 && state.location === "city") return "BOILER ROOM · ENTER LEDGER TOWER";
    if (state.mission === 5) return "BOILER ROOM · ACT AT THE EXECUTIVE DESK";
    if (state.mission === 6 && state.airportStage === 0) return "AIRPORT HEIST · HIT VICE AIR SECURITY";
    if (state.mission === 6 && state.airportStage === 1) return `AIRPORT HEIST · CLEAR ${state.airportLeft} SECURITY`;
    if (state.mission === 6 && state.airportStage === 2) return "AIRPORT HEIST · CAR BUTTON TO HIJACK THE JET";
    if (state.mission === 6) return "AIRPORT HIJACK · TAXI TO THE RUNWAY END";
    return "GETAWAY · REACH THE SAFEHOUSE";
  }

  function damagePlayer(amount) {
    if (state.mode !== "playing" || state.player.invulnerable > 0) return;
    let remaining = amount;
    if (state.player.armor > 0) {
      const blocked = Math.min(state.player.armor, remaining);
      state.player.armor -= blocked;
      remaining -= blocked;
    }
    state.player.hp = Math.max(0, state.player.hp - remaining);
    state.player.combo = 0;
    state.shake = Math.max(state.shake, 6 * effectScale());
    burst(state.player.x, state.player.y, "#ff5277", 7);
    sound.hit();
    haptic(25);
    if (state.player.hp <= 0) recoverPlayer();
  }

  function recoverPlayer() {
    const jailed = state.heat >= 1;
    const activeCar = state.player.inCar !== null ? state.cars[state.player.inCar] : null;
    if (activeCar) activeCar.occupied = false;
    state.player.inCar = null;
    state.location = "city";
    state.player.x = jailed ? 2820 : 2032;
    state.player.y = 1450;
    state.player.hp = state.player.maxHp;
    state.player.armor = 0;
    state.player.invulnerable = 2.8;
    const fee = Math.min(state.cash, Math.round(state.cash * (jailed ? 0.14 : 0.08)));
    state.cash -= fee;
    state.heat = jailed ? 0.4 : Math.max(0, state.heat - 1.5);
    state.bullets.length = 0;
    state.policeCars.length = 0;
    state.enemies = state.enemies.filter((enemy) => enemy.job !== "police");
    state.recovery = {
      timer: 2.4,
      message: jailed ? "BUSTED · COUNTY JAIL" : "HOSPITALIZED",
      detail: `${fee ? `-$${fee.toLocaleString()} · ` : ""}MISSION PROGRESS KEPT`,
    };
    haptic([45, 35, 55]);
  }

  function endRun(won) {
    if (state.mode === "ended") return;
    state.mode = "ended";
    state.bestCash = Math.max(state.bestCash, state.cash);
    state.endTitle = won ? "CITY PAID IN FULL" : "THE CITY COLLECTED";
    state.endDetail = `$${state.cash.toLocaleString()} banked · best $${state.bestCash.toLocaleString()}`;
    onEnd(state.cash, state.bestCash);
  }

  function toggleCar() {
    if (state.location !== "city") {
      addText(state.player.x, state.player.y - 35, "NO CARS INDOORS", "#a9bdc2");
      return;
    }
    if (state.player.inCar !== null) {
      const car = state.cars[state.player.inCar];
      car.occupied = false;
      state.player.inCar = null;
      state.player.x = clampToCity(car.x + Math.cos(car.angle) * 58, 24);
      state.player.y = clampToCity(car.y + Math.sin(car.angle) * 58, 24);
      return;
    }
    let nearest = null;
    let nearestDistance = 108;
    for (const car of state.cars) {
      const gap = distance(state.player, car);
      if (gap < nearestDistance) { nearest = car; nearestDistance = gap; }
    }
    if (nearest) {
      if (nearest.scenery) {
        addText(state.player.x, state.player.y - 35, "AIRPORT SERVICE VEHICLE", "#a9bdc2");
        return;
      }
      if (nearest.cargo && state.mission < 4) {
        addText(state.player.x, state.player.y - 35, "CARGO CONTRACT NOT READY", "#ffbe53");
        return;
      }
      if (nearest.missionLocked && (state.mission !== 6 || state.airportStage < 2)) {
        addText(state.player.x, state.player.y - 35, "JET LOCKED BEHIND SECURITY", "#ffbe53");
        return;
      }
      if (nearest.stealable && !nearest.stolen) {
        nearest.stolen = true;
        raiseHeat(2);
        addText(nearest.x, nearest.y - 90, "AIRCRAFT STOLEN · HEAT SPIKE", "#ff5277");
      }
      nearest.occupied = true;
      state.player.inCar = nearest.id;
      state.player.x = nearest.x;
      state.player.y = nearest.y;
      if (nearest.cargo && state.mission === 4 && state.cargoStage === 0) {
        state.cargoStage = 1;
        raiseHeat(0.9);
        addText(nearest.x, nearest.y - 75, "TRUCK HIJACKED · MOVE!", "#ff5277");
        spawnEnemy("cop", nearest, 300, "cargo");
        spawnEnemy("goon", nearest, 250, "cargo");
      }
      if (nearest.aircraft && state.mission === 6 && state.airportStage === 2) {
        state.airportStage = 3;
        addText(nearest.x, nearest.y - 110, "JET HIJACKED · TAKE THE RUNWAY", "#65e6dd");
      }
      haptic(18);
    } else {
      addText(state.player.x, state.player.y - 35, "NO CAR NEARBY", "#a9bdc2");
    }
  }

  function nearestCombatTarget(range) {
    let target = null;
    let nearest = range;
    for (const enemy of state.enemies) {
      if (enemy.location !== state.location) continue;
      const gap = distance(state.player, enemy);
      if (gap < nearest) { target = enemy; nearest = gap; }
    }
    if (state.location === "casino" && state.mission === 0 && state.extortionStarted && !state.racketBossAlive && !state.owner.surrendered) {
      const gap = distance(state.player, state.owner);
      if (gap < nearest) target = state.owner;
    }
    return target;
  }

  function hitOwner(damage, knockX, knockY) {
    state.owner.nerve = Math.max(0, state.owner.nerve - damage * 0.72);
    state.owner.hitFlash = 0.25;
    state.owner.fleeing = 1.2;
    moveEntity(state.owner, knockX * 0.35, knockY * 0.35, 18, "casino");
    raiseHeat(0.12);
    addText(state.owner.x, state.owner.y - 34, `NERVE ${Math.ceil(state.owner.nerve)}%`, "#ffbe53");
    if (state.owner.nerve <= 0) completeExtortion();
  }

  function damageEnemy(enemy, damage, knockback, direction) {
    enemy.hp -= damage;
    enemy.vx += Math.cos(direction) * knockback;
    enemy.vy += Math.sin(direction) * knockback;
    burst(enemy.x, enemy.y, POLICE_TYPES.includes(enemy.type) ? "#65e6dd" : "#ffb35c", 6);
  }

  function meleeAttack(heavy = false) {
    const player = state.player;
    if (player.inCar !== null || player.cooldown > 0) return;
    if (!heavy && !state.tutorial.done && state.tutorial.stage === 1) state.tutorial.stage = 2;
    if (heavy && player.heavyCooldown > 0) {
      addText(player.x, player.y - 35, "HEAVY RECHARGING", "#a9bdc2");
      return;
    }
    const target = nearestCombatTarget(heavy ? 145 : 120);
    let direction = player.angle + Math.PI / 2;
    if (target) direction = angleTo(player, target);
    player.angle = direction - Math.PI / 2;

    if (heavy) {
      if (target && Number.isFinite(target.hp) && distance(player, target) < 64) {
        const throwDamage = 72 * Number(tweaks.get("meleePower")) * (1 + state.upgrades.power * 0.15);
        player.heavyCooldown = 1.35;
        player.cooldown = 0.52;
        player.combo = 0;
        target.stun = 1.15;
        damageEnemy(target, throwDamage, 520, direction);
        state.effects.push({ type: "heavy_burst", location: state.location, x: target.x, y: target.y, angle: direction, age: 0, duration: 0.34, size: 190 });
        addText(target.x, target.y - 52, "MOB THROW", "#ffe393");
        sound.heavy();
        haptic([30, 18, 38]);
        return;
      }
      const finisher = player.combo >= 2;
      player.heavyCooldown = 2.4;
      player.cooldown = 0.46;
      player.combo = 0;
      state.effects.push({ type: "heavy_burst", location: state.location, x: player.x, y: player.y, angle: 0, age: 0, duration: 0.34, size: 250 });
      for (const enemy of state.enemies) {
        if (enemy.location !== state.location) continue;
        if (distance(player, enemy) < 145) {
          damageEnemy(enemy, (finisher ? 88 : 58) * Number(tweaks.get("meleePower")) * (player.meleeWeapon === "bat" ? 1.35 : 1) * (1 + state.upgrades.power * 0.15) * (1 + (state.level - 1) * 0.025), finisher ? 390 : 240, angleTo(player, enemy));
          if (finisher) enemy.stun = 0.7;
        }
      }
      if (finisher) addText(player.x, player.y - 58, "COMBO LAUNCHER", "#65e6dd");
      if (state.location === "casino" && !state.owner.surrendered && distance(player, state.owner) < 130 && !state.racketBossAlive) {
        hitOwner(48, Math.cos(direction) * 190, Math.sin(direction) * 190);
      }
      for (const npc of state.location === "city" ? state.npcs : []) {
        if (distance(player, npc) < 125) { npc.fleeing = 4; npc.hitFlash = 0.3; raiseHeat(0.08); }
      }
      sound.heavy();
      state.shake = Math.max(state.shake, 9 * effectScale());
      haptic([35, 20, 45]);
      return;
    }

    player.combo = player.comboWindow > 0 ? player.combo % 3 + 1 : 1;
    player.comboWindow = 0.72;
    player.cooldown = [0, 0.23, 0.27, 0.36][player.combo];
    const dashStrike = player.dashTime > 0;
    const damage = [0, 24, 31, 46][player.combo] * Number(tweaks.get("meleePower")) * (player.meleeWeapon === "bat" ? 1.35 : 1) * (1 + state.upgrades.power * 0.15) * (1 + (state.level - 1) * 0.025) * (dashStrike ? 1.45 : 1);
    const knockback = [0, 72, 105, 175][player.combo] * (dashStrike ? 1.5 : 1);
    const reach = [0, 92, 104, 122][player.combo];
    moveEntity(player, Math.cos(direction) * 14, Math.sin(direction) * 14, 20);
    state.effects.push({ type: "light_combo", location: state.location, x: player.x, y: player.y, angle: direction - Math.PI / 2, age: 0, duration: 0.23, size: 150 + player.combo * 10 });

    for (const enemy of state.enemies) {
      if (enemy.location !== state.location) continue;
      const gap = distance(player, enemy);
      const enemyDirection = angleTo(player, enemy);
      const facing = Math.cos(enemyDirection - direction);
      if (gap < reach && facing > -0.15) {
        damageEnemy(enemy, damage, knockback, enemyDirection);
        if (player.combo === 3 || dashStrike) enemy.stun = dashStrike ? 0.55 : 0.35;
      }
    }
    for (const npc of state.location === "city" ? state.npcs : []) {
      const gap = distance(player, npc);
      const npcDirection = angleTo(player, npc);
      if (gap < reach && Math.cos(npcDirection - direction) > -0.15) {
        npc.fleeing = 4;
        npc.hitFlash = 0.3;
        moveWithCollision(npc, Math.cos(npcDirection) * knockback * 0.25, Math.sin(npcDirection) * knockback * 0.25, 17);
        burst(npc.x, npc.y, "#65e6dd", 4);
        raiseHeat(0.08);
      }
    }
    if (state.location === "casino" && !state.owner.surrendered && !state.racketBossAlive && distance(player, state.owner) < reach) {
      hitOwner(damage, Math.cos(direction) * knockback, Math.sin(direction) * knockback);
    }
    sound.melee(player.combo);
    if (dashStrike) addText(player.x, player.y - 50, "DASH STRIKE", "#65e6dd");
    haptic(player.combo === 3 ? 28 : 12);
  }

  function dash() {
    const player = state.player;
    if (player.inCar !== null || player.dashCooldown > 0) return;
    if (!state.tutorial.done && state.tutorial.stage === 2) state.tutorial.stage = 3;
    const move = controls.movement();
    const length = Math.hypot(move.x, move.y);
    const direction = length > 0.1 ? Math.atan2(move.y, move.x) : player.angle + Math.PI / 2;
    player.dashX = Math.cos(direction);
    player.dashY = Math.sin(direction);
    player.angle = direction - Math.PI / 2;
    player.dashTime = 0.2;
    player.dashCooldown = 1.05 * (1 - state.upgrades.mobility * 0.12);
    player.invulnerable = 0.28;
    state.effects.push({ type: "light_combo", location: state.location, x: player.x, y: player.y, angle: direction, age: 0, duration: 0.16, size: 105 });
    burst(player.x, player.y, "#65e6dd", 8);
    sound.dash();
    haptic(10);
  }

  function shoot() {
    const player = state.player;
    if (player.inCar !== null || player.cooldown > 0) return;
    if (player.ammo <= 0) {
      player.cooldown = 0.4;
      addText(player.x, player.y - 34, "OUT OF AMMO", "#ff9cae");
      return;
    }
    const target = nearestCombatTarget(450);
    const direction = target ? angleTo(player, target) : player.angle + Math.PI / 2;
    const stats = {
      pistol: { cooldown: 0.19, damage: 40, speed: 760, pellets: 1, spread: 0 },
      shotgun: { cooldown: 0.68, damage: 25, speed: 700, pellets: 5, spread: 0.22 },
      carbine: { cooldown: 0.105, damage: 28, speed: 820, pellets: 1, spread: 0.035 },
      revolver: { cooldown: 0.44, damage: 72, speed: 790, pellets: 1, spread: 0.018 },
    }[player.weapon];
    player.angle = direction - Math.PI / 2;
    player.cooldown = stats.cooldown;
    player.ammo -= 1;
    player.ammoByWeapon[player.weapon] = player.ammo;
    for (let pellet = 0; pellet < stats.pellets; pellet += 1) {
      const shotDirection = direction + (Math.random() - 0.5) * stats.spread;
      state.bullets.push({
        x: player.x, y: player.y,
        vx: Math.cos(shotDirection) * stats.speed, vy: Math.sin(shotDirection) * stats.speed,
        life: 0.68, damage: stats.damage * (1 + state.upgrades.ballistics * 0.15) * (1 + (state.level - 1) * 0.025), location: state.location,
      });
    }
    sound.gun();
    raiseHeat(0.06);
    if (!state.tutorial.done && state.tutorial.stage === 3) state.tutorial.done = true;
  }

  function updatePlayer(dt) {
    const player = state.player;
    const move = controls.movement();
    if (!state.tutorial.done && state.tutorial.stage === 0 && Math.hypot(move.x, move.y) > 0.2) state.tutorial.stage = 1;
    if (controls.takePress("car")) toggleCar();
    if (controls.takePress("attack")) meleeAttack(false);
    if (controls.takePress("heavy")) meleeAttack(true);
    if (controls.takePress("dash")) dash();
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.comboWindow = Math.max(0, player.comboWindow - dt);
    player.heavyCooldown = Math.max(0, player.heavyCooldown - dt);
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    if (player.comboWindow === 0) player.combo = 0;
    if (controls.firing()) shoot();

    if (player.inCar !== null) {
      const car = state.cars[player.inCar];
      car.bumpCooldown = Math.max(0, (car.bumpCooldown || 0) - dt);
      const traction = state.environment.weather === "storm" ? 0.62 : state.environment.weather === "rain" ? 0.78 : 1;
      if (Math.hypot(move.x, move.y) > 0.1) {
        const desiredAngle = Math.atan2(move.y, move.x) + Math.PI / 2;
        const delta = ((desiredAngle - car.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        car.angle += delta * Math.min(1, dt * 8 * traction);
        const vehicleBase = car.aircraft ? 1.28 : car.cargo ? 0.72 : 1;
        const maxSpeed = Number(tweaks.get("carSpeed")) * vehicleBase * (1 + state.upgrades.engine * 0.08) * (0.9 + traction * 0.1);
        car.speed += (maxSpeed - car.speed) * Math.min(1, dt * 5 * traction);
      } else {
        car.speed *= Math.max(0, 1 - dt * 4);
      }
      const oldX = car.x;
      const oldY = car.y;
      moveWithCollision(car, Math.sin(car.angle) * car.speed * dt, -Math.cos(car.angle) * car.speed * dt, car.aircraft ? 58 : car.cargo ? 42 : 32);
      const invalidWater = car.boat ? !isRiverWater(car.x, car.y) : !car.aircraft && isRiverWater(car.x, car.y);
      if (invalidWater) {
        car.x = oldX;
        car.y = oldY;
        car.speed *= 0.25;
      }
      const vehicleHit = resolveVehicleContacts(car, [...state.cars, ...state.policeCars], oldX, oldY);
      if (!vehicleHit && Math.hypot(car.x - oldX, car.y - oldY) < Math.abs(car.speed * dt) * 0.35 && car.speed > 150) {
        car.speed *= -0.15;
        damagePlayer(8);
        raiseHeat(0.12);
        sound.crash();
      }
      player.x = car.x;
      player.y = car.y;
      player.angle = car.angle;
    } else if (player.dashTime > 0) {
      player.dashTime -= dt;
      moveEntity(player, player.dashX * 820 * dt, player.dashY * 820 * dt, 18);
      if (Math.random() < 0.65) burst(player.x, player.y, "#65e6dd", 1);
    } else {
      player.swimming = state.location === "city" && isRiverWater(player.x, player.y);
      const speed = Number(tweaks.get("playerSpeed")) * (player.swimming ? 0.55 : 1);
      moveEntity(player, move.x * speed * dt, move.y * speed * dt, 20);
      if (Math.hypot(move.x, move.y) > 0.08) player.angle = Math.atan2(move.y, move.x) - Math.PI / 2;
    }
  }

  function openPhone() {
    if (state.phoneOpen) return;
    state.phoneOpen = true;
    state.callRound = 0;
    state.callCorrect = 0;
    onPhoneCall(PHONE_CALLS[0], 0, 0);
  }

  function finishCalls() {
    state.phoneOpen = false;
    onPhoneCall(null);
    if (state.callCorrect >= 2) {
      state.cash += 5200;
      state.mission = 6;
      state.heat = 3;
      state.crimeQuiet = -8;
      addText(state.player.x, state.player.y - 65, "WIRE LANDED · +$5,200 · MOVE!", "#ffe393");
      sound.cash();
      for (let i = 0; i < 3; i += 1) spawnEnemy("cop", state.player, 360 + i * 45);
    } else {
      addText(state.player.x, state.player.y - 60, "PITCH FAILED · TRY AGAIN", "#ff5277");
      raiseHeat(0.8);
      spawnEnemy("lieutenant", state.player, 250);
      spawnEnemy("goon", state.player, 290);
    }
  }

  function answerCall(choice) {
    if (!state.phoneOpen) return;
    const call = PHONE_CALLS[state.callRound];
    const correct = choice === call.correct;
    if (correct) {
      state.callCorrect += 1;
      state.cash += 900;
      sound.cash();
    } else {
      raiseHeat(0.32);
      sound.alarm();
    }
    state.callRound += 1;
    if (state.callRound >= PHONE_CALLS.length) {
      finishCalls();
    } else {
      onPhoneCall(PHONE_CALLS[state.callRound], state.callRound, state.callCorrect, correct);
    }
  }

  function enterInterior(id) {
    const room = INTERIORS[id];
    if (state.player.inCar !== null) {
      addText(state.player.x, state.player.y - 38, "EXIT THE CAR FIRST", "#ffbe53");
      return;
    }
    state.location = id;
    state.player.x = room.exit.x;
    state.player.y = room.exit.y - 48;
    state.player.angle = Math.PI;
    state.bullets.length = 0;
    state.effects.length = 0;
    state.texts.length = 0;
    addText(state.player.x, state.player.y - 45, room.name.toUpperCase(), "#65e6dd");
  }

  function leaveInterior() {
    const room = INTERIORS[state.location];
    state.location = "city";
    state.player.x = room.streetSpawn.x;
    state.player.y = room.streetSpawn.y;
    state.player.angle = Math.PI / 2;
    state.bullets.length = 0;
    state.effects.length = 0;
    state.texts.length = 0;
    addText(state.player.x, state.player.y - 40, "BACK ON THE STREET", "#65e6dd");
  }

  function handleDoor(actPressed) {
    if (!actPressed) return false;
    if (state.location === "city") {
      const room = Object.values(INTERIORS).find((entry) => distance(state.player, entry.door) < 66);
      if (!room) return false;
      enterInterior(room.id);
      return true;
    }
    const room = INTERIORS[state.location];
    if (distance(state.player, room.exit) < 68) {
      leaveInterior();
      return true;
    }
    return false;
  }

  function updateMission(dt) {
    const objective = currentObjective();
    const actPressed = controls.takePress("act");
    const nearbyProperty = state.location === "city"
      ? PROPERTY_POINTS.find((property) => distance(state.player, property) < 72)
      : null;
    if (nearbyProperty && actPressed) {
      if (!state.properties[nearbyProperty.id]) {
        openProperty(nearbyProperty);
      } else if (nearbyProperty.safehouse) {
        state.player.hp = state.player.maxHp;
        state.player.armor = Math.max(state.player.armor, 25);
        state.heat = Math.max(0, state.heat - 2);
        addText(nearbyProperty.x, nearbyProperty.y - 48, "SAFEHOUSE RESET · HEALTH + HEAT", "#65e6dd");
      } else if (state.wolfDeal.propertyId === nearbyProperty.id) {
        const reward = 1200 + nearbyProperty.income * 8;
        state.cash += reward;
        gainXp(320);
        state.wolfDeal.propertyId = null;
        state.wolfDeal.cooldown = 22;
        addText(nearbyProperty.x, nearbyProperty.y - 50, `WOLF ST DEAL +$${reward}`, "#ffe393");
        sound.cash();
      } else {
        addText(nearbyProperty.x, nearbyProperty.y - 45, "PROPERTY EARNING · DEAL PENDING", "#a9bdc2");
      }
      return;
    }
    if (state.location === "city" && distance(state.player, UPGRADE_SHOP_POINT) < UPGRADE_SHOP_POINT.radius && actPressed) {
      openShop();
      return;
    }
    if (state.mission === 4 && state.cargoStage === 1 && state.location === "city" &&
      state.player.inCar === state.cargoCarId && distance(state.player, INTERIORS.marina.door) < 95) {
      state.cargoStage = 2;
      addText(state.player.x, state.player.y - 75, "CARGO DELIVERED · MEET THE FENCE", "#65e6dd");
    }
    if (handleDoor(actPressed)) return;
    if (state.mission === 7 && state.location === "city" && objective && distance(state.player, objective) < objective.radius) {
      endRun(true);
      return;
    }
    if (state.mission === 0) {
      if (state.location === "casino" && !state.extortionStarted && distance(state.player, INTERIORS.casino.missionPoint) < 86 && actPressed) {
        startExtortion();
      }
      if (state.location === "casino" && state.extortionStarted && !state.racketBossAlive && !state.owner.surrendered) {
        const close = distance(state.player, state.owner) < 72;
        if (close && controls.acting()) {
          state.owner.nerve = Math.max(0, state.owner.nerve - dt * 100 / Number(tweaks.get("captureSeconds")));
          state.capture = 1 - state.owner.nerve / 100;
          if (state.owner.nerve <= 0) completeExtortion();
        }
      }
    } else if (state.mission === 2 && state.location === "crown" && objective && distance(state.player, objective) < objective.radius && actPressed) {
      startEscortRacket();
    } else if (state.mission === 3 && state.location === "casino" && objective && distance(state.player, objective) < objective.radius) {
      if (!state.heistStarted && actPressed) startCasinoHeist();
      if (state.heistStarted && state.heistLeft === 0 && controls.acting()) {
        state.capture = Math.min(1, state.capture + dt / 4.2);
        if (state.capture >= 1) completeCasinoHeist();
      }
    } else if (state.mission === 4 && state.location === "marina" && state.cargoStage >= 2 && objective && distance(state.player, objective) < objective.radius && actPressed) {
      completeCargoSale();
    } else if (state.mission === 5 && state.location === "ledger" && objective && distance(state.player, objective) < objective.radius && actPressed) {
      openPhone();
    } else if (state.mission === 6 && state.location === "city" && objective) {
      if (state.airportStage === 0 && distance(state.player, objective) < objective.radius && actPressed) startAirportHeist();
      if (state.airportStage === 3 && state.player.inCar === state.aircraftCarId && distance(state.player, AIRPORT_ESCAPE_POINT) < AIRPORT_ESCAPE_POINT.radius) {
        completeAirportHijack();
      }
    }
  }

  function updatePickups(dt) {
    for (const pickup of state.pickups) {
      if (pickup.location !== state.location) continue;
      if (!pickup.active) {
        pickup.respawn -= dt;
        if (pickup.respawn <= 0 && pickup.id !== 99) pickup.active = true;
        continue;
      }
      if (distance(state.player, pickup) > 44) continue;
      pickup.active = false;
      pickup.respawn = 24;
      if (pickup.type === "weapon_case") {
        state.player.ammo = Math.min(99, state.player.ammo + 36);
        state.player.ammoByWeapon[state.player.weapon] = state.player.ammo;
        addText(pickup.x, pickup.y - 30, "+36 AMMO");
      } else if (pickup.type.startsWith("weapon_")) {
        const weapon = pickup.type.replace("weapon_", "");
        if (weapon === "baseball_bat") {
          state.player.meleeWeapon = "bat";
          addText(pickup.x, pickup.y - 30, "BAT EQUIPPED · +35% MELEE", "#ffbe53");
        } else {
          const weaponMap = {
            pump_shotgun: ["shotgun", 18, "PUMP SHOTGUN"],
            compact_carbine: ["carbine", 55, "COMPACT CARBINE"],
            heavy_revolver: ["revolver", 24, "HEAVY REVOLVER"],
          };
          const [name, ammo, label] = weaponMap[weapon];
          state.player.weaponsOwned[name] = true;
          state.player.weapon = name;
          state.player.ammo = ammo;
          state.player.ammoByWeapon[name] = ammo;
          addText(pickup.x, pickup.y - 30, `${label} · ${ammo} ROUNDS`, "#ffbe53");
        }
      } else if (pickup.type === "armor_vest") {
        state.player.armor = Math.min(60, state.player.armor + 40);
        addText(pickup.x, pickup.y - 30, "+40 ARMOR", "#65e6dd");
      } else {
        state.cash += 350;
        addText(pickup.x, pickup.y - 30, "+$350");
      }
      burst(pickup.x, pickup.y, "#ffe393", 10);
      sound.cash();
      haptic(15);
    }
  }

  function killEnemy(enemy, index) {
    const stats = ENEMY_STATS[enemy.type];
    state.enemies.splice(index, 1);
    state.cash += stats.reward;
    gainXp(Math.max(35, Math.round(stats.reward * 0.55)));
    addText(enemy.x, enemy.y - 25, `+$${stats.reward}`);
    burst(enemy.x, enemy.y, POLICE_TYPES.includes(enemy.type) ? "#65e6dd" : "#ff5277", 11);
    if (enemy.job === "contract") {
      state.cash += 1800;
      gainXp(420);
      state.contract.target = null;
      state.contract.cooldown = 24;
      state.contract.index = (state.contract.index + 1) % CONTRACT_POINTS.length;
      addText(enemy.x, enemy.y - 65, "CONTRACT COMPLETE · +$1,800", "#ffe393");
    } else if (state.mission === 0 && enemy.type === "boss") {
      state.racketBossAlive = false;
      state.owner.fleeing = 0;
      addText(enemy.x, enemy.y - 58, "BOSS BROKEN · PRESS THE OWNER", "#ffe393");
    } else if (state.mission === 1 && !POLICE_TYPES.includes(enemy.type)) {
      state.retaliationLeft = Math.max(0, state.retaliationLeft - 1);
      if (state.retaliationLeft === 0) {
        state.mission = 2;
        state.cash += 1400;
        addText(enemy.x, enemy.y - 55, "CROWN RACKET OPEN · +$1,400", "#ffe393");
        sound.cash();
      }
    } else if (state.mission === 2 && enemy.job === "escort") {
      state.escortLeft = Math.max(0, state.escortLeft - 1);
      if (state.escortLeft === 0) completeEscortRacket();
    } else if (state.mission === 3 && enemy.job === "heist") {
      state.heistLeft = Math.max(0, state.heistLeft - 1);
      if (state.heistLeft === 0) addText(enemy.x, enemy.y - 55, "VAULT CLEAR · HOLD ACT", "#65e6dd");
    } else if (state.mission === 6 && enemy.job === "airport") {
      state.airportLeft = Math.max(0, state.airportLeft - 1);
      if (state.airportLeft === 0) {
        state.airportStage = 2;
        addText(enemy.x, enemy.y - 60, "SECURITY DOWN · TAKE THE JET", "#65e6dd");
      }
    }
  }

  function updateBullets(dt) {
    for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = state.bullets[i];
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      let hit = false;
      for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
        const enemy = state.enemies[j];
        if (enemy.location !== state.location) continue;
        if (distance(bullet, enemy) < 25) {
          damageEnemy(enemy, bullet.damage || 40, 75, Math.atan2(bullet.vy, bullet.vx));
          if (enemy.hp <= 0) killEnemy(enemy, j);
          hit = true;
          break;
        }
      }
      if (!hit && state.location === "casino" && state.mission === 0 && !state.racketBossAlive && !state.owner.surrendered && distance(bullet, state.owner) < 24) {
        hitOwner(36, bullet.vx * 0.1, bullet.vy * 0.1);
        hit = true;
      }
      const hitWall = state.location === "city"
        ? collidesBuilding(bullet.x, bullet.y, 2)
        : collidesInterior(state.location, bullet.x, bullet.y, 2);
      if (hit || bullet.life <= 0 || hitWall) state.bullets.splice(i, 1);
    }
  }

  function updateEnemies(dt) {
    const pressure = enemyPressure();
    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      if (enemy.location !== state.location) continue;
      const stats = ENEMY_STATS[enemy.type];
      enemy.cooldown -= dt;
      enemy.vx *= Math.max(0, 1 - dt * 7);
      enemy.vy *= Math.max(0, 1 - dt * 7);
      moveEntity(enemy, enemy.vx * dt, enemy.vy * dt, 20, enemy.location);
      if (enemy.hp <= 0) { killEnemy(enemy, i); continue; }
      if (enemy.stun > 0) { enemy.stun = Math.max(0, enemy.stun - dt); continue; }
      const gap = distance(enemy, state.player);
      const direction = angleTo(enemy, state.player);
      enemy.angle = direction - Math.PI / 2;
      if (enemy.windup > 0) {
        enemy.windup -= dt;
        if (enemy.windup <= 0) {
          if (distance(enemy, state.player) < stats.reach + 12) damagePlayer(stats.damage);
          enemy.cooldown = (enemy.type === "boss" ? 1.35 : 0.85) / pressure;
        }
      } else if (gap > stats.reach) {
        moveEntity(enemy, Math.cos(direction) * stats.speed * pressure * dt, Math.sin(direction) * stats.speed * pressure * dt, 20, enemy.location);
      } else if (enemy.cooldown <= 0) {
        enemy.windup = enemy.type === "boss" ? 0.52 : 0.32;
      }
      if (state.player.inCar !== null && gap < 50 && state.cars[state.player.inCar].speed > 170) {
        damageEnemy(enemy, state.cars[state.player.inCar].speed * 0.24, 250, direction + Math.PI);
        state.cars[state.player.inCar].speed *= 0.78;
        raiseHeat(POLICE_TYPES.includes(enemy.type) ? 0.45 : 0.18);
        sound.crash();
      }
    }
  }

  function updateNpcs(dt) {
    if (state.location !== "city" && state.location !== "casino") return;
    const threats = state.enemies.some((enemy) => enemy.location === state.location) || state.heat > 0.6;
    for (const npc of state.location === "city" ? state.npcs : []) {
      const activeCar = state.player.inCar !== null ? state.cars[state.player.inCar] : null;
      if (activeCar && Math.abs(activeCar.speed) > 100 && distance(npc, activeCar) < 55 && !npc.knocked) {
        npc.knocked = 2.4;
        npc.angle = activeCar.angle;
        raiseHeat(0.45);
        burst(npc.x, npc.y, "#ffbe53", 7);
        addText(npc.x, npc.y - 28, "PEDESTRIAN HIT · HEAT UP", "#ff5277");
      }
      if (npc.knocked > 0) {
        npc.knocked = Math.max(0, npc.knocked - dt);
        continue;
      }
      npc.wander -= dt;
      npc.fleeing = Math.max(0, npc.fleeing - dt);
      npc.hitFlash = Math.max(0, npc.hitFlash - dt);
      let speed = 46;
      if (threats && distance(npc, state.player) < 240) npc.fleeing = Math.max(npc.fleeing, 1.2);
      if (npc.fleeing > 0) {
        npc.angle = angleTo(state.player, npc) - Math.PI / 2;
        speed = 160;
      } else if (npc.wander <= 0) {
        npc.wander = 1.5 + Math.random() * 3;
        npc.angle += (Math.random() - 0.5) * 2.4;
      }
      const direction = npc.angle + Math.PI / 2;
      const oldX = npc.x;
      const oldY = npc.y;
      moveWithCollision(npc, Math.cos(direction) * speed * dt, Math.sin(direction) * speed * dt, 17);
      if (isRiverWater(npc.x, npc.y)) { npc.x = oldX; npc.y = oldY; npc.angle += Math.PI * 0.7; }
      if (npc.x === oldX && npc.y === oldY) npc.angle += Math.PI * 0.7;
    }
    if (state.location !== "casino") return;
    state.owner.fleeing = Math.max(0, state.owner.fleeing - dt);
    state.owner.hitFlash = Math.max(0, state.owner.hitFlash - dt);
    if (state.owner.fleeing > 0) {
      const direction = angleTo(state.player, state.owner);
      state.owner.angle = direction - Math.PI / 2;
      moveEntity(state.owner, Math.cos(direction) * 105 * dt, Math.sin(direction) * 105 * dt, 18, "casino");
    }
  }

  function updateSpecialNpcs(dt) {
    for (const npc of state.specialNpcs) {
      if (npc.location !== state.location) continue;
      if (npc.type === "fence") continue;
      npc.fleeing = Math.max(0, npc.fleeing - dt);
      npc.wander -= dt;
      const threat = state.enemies.find((enemy) => enemy.location === npc.location && distance(enemy, npc) < 240);
      if (threat) npc.fleeing = 1.2;
      if (npc.fleeing > 0) {
        const direction = angleTo(threat || state.player, npc);
        npc.angle = direction - Math.PI / 2;
        moveEntity(npc, Math.cos(direction) * 130 * dt, Math.sin(direction) * 130 * dt, 18, npc.location);
      } else if (npc.wander <= 0) {
        npc.wander = 1.5 + Math.random() * 2.5;
        npc.angle += (Math.random() - 0.5) * 1.6;
      } else {
        const direction = npc.angle + Math.PI / 2;
        moveEntity(npc, Math.cos(direction) * 32 * dt, Math.sin(direction) * 32 * dt, 18, npc.location);
      }
    }
  }

  function updateAllies(dt) {
    for (let allyIndex = 0; allyIndex < state.allies.length; allyIndex += 1) {
      const ally = state.allies[allyIndex];
      if (ally.location !== state.location) continue;
      ally.cooldown = Math.max(0, ally.cooldown - dt);
      let target = null;
      let nearest = 260;
      for (const enemy of state.enemies) {
        if (enemy.location !== ally.location) continue;
        const gap = distance(ally, enemy);
        if (gap < nearest) { target = enemy; nearest = gap; }
      }
      const followPoint = target || {
        x: state.player.x + (allyIndex - 1) * 48,
        y: state.player.y + 58,
      };
      const direction = angleTo(ally, followPoint);
      ally.angle = direction - Math.PI / 2;
      if (nearest > 58 || !target) {
        if (distance(ally, followPoint) > 38) moveEntity(ally, Math.cos(direction) * 145 * dt, Math.sin(direction) * 145 * dt, 18, ally.location);
      } else if (ally.cooldown <= 0) {
        ally.cooldown = 0.52;
        damageEnemy(target, 22, 55, direction);
        sound.melee(1);
        if (target.hp <= 0) {
          const index = state.enemies.indexOf(target);
          if (index >= 0) killEnemy(target, index);
        }
      }
    }
  }

  function updateMobmons(dt) {
    for (let index = 0; index < state.mobmons.length; index += 1) {
      const mobmon = state.mobmons[index];
      if (mobmon.location !== state.location) {
        mobmon.location = state.location;
        mobmon.x = state.player.x + (index - 1) * 38;
        mobmon.y = state.player.y + 55;
      }
      mobmon.cooldown = Math.max(0, mobmon.cooldown - dt);
      let target = null;
      const ranged = mobmon.type === "shooter" || mobmon.type === "scout";
      let nearest = ranged ? 260 : 170;
      for (const enemy of state.enemies) {
        if (enemy.location !== state.location) continue;
        const gap = distance(mobmon, enemy);
        if (gap < nearest) { target = enemy; nearest = gap; }
      }
      if (mobmon.type === "medic" && mobmon.cooldown <= 0 && state.player.hp < state.player.maxHp) {
        mobmon.cooldown = 2.2;
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 5 + state.level);
        burst(state.player.x, state.player.y, "#65e6dd", 5);
      }
      const follow = target || { x: state.player.x + (index - 1) * 42, y: state.player.y + 62 };
      if (distance(mobmon, state.player) > 420) { mobmon.x = follow.x; mobmon.y = follow.y; }
      const direction = angleTo(mobmon, follow);
      mobmon.angle = direction - Math.PI / 2;
      const attackRange = mobmon.type === "shooter" ? 210 : mobmon.type === "scout" ? 180 : 50;
      if (target && nearest <= attackRange && mobmon.cooldown <= 0) {
        mobmon.cooldown = mobmon.type === "bruiser" ? 0.7 : 0.95;
        const damage = mobmon.type === "bruiser" ? 18 + state.level * 2 : mobmon.type === "scout" ? 14 + state.level * 1.6 : 12 + state.level * 1.4;
        damageEnemy(target, damage, mobmon.type === "bruiser" ? 85 : 20, direction);
        if (target.hp <= 0) {
          const enemyIndex = state.enemies.indexOf(target);
          if (enemyIndex >= 0) killEnemy(target, enemyIndex);
        }
      } else if (distance(mobmon, follow) > 32) {
        moveEntity(mobmon, Math.cos(direction) * 170 * dt, Math.sin(direction) * 170 * dt, 12, mobmon.location);
      }
    }
  }

  function updateContract(dt) {
    if (state.contract.target && !state.enemies.includes(state.contract.target)) state.contract.target = null;
    if (state.contract.target) return;
    state.contract.cooldown -= dt;
    if (state.contract.cooldown > 0) return;
    const point = CONTRACT_POINTS[state.contract.index];
    const target = spawnEnemy(state.contract.index % 2 === 0 ? "boss" : "lieutenant", point, 48, "contract", "city");
    if (!target) { state.contract.cooldown = 4; return; }
    target.contractName = point.name;
    state.contract.target = target;
    state.contract.cooldown = 999;
  }

  function spawnPoliceCar() {
    const angle = Math.random() * Math.PI * 2;
    const x = clampToCity(state.player.x + Math.cos(angle) * 520, 40);
    const y = clampToCity(state.player.y + Math.sin(angle) * 520, 40);
    if (!collidesBuilding(x, y, 36)) state.policeCars.push({ x, y, angle: 0, speed: 220, cooldown: 0 });
  }

  function updatePolice(dt) {
    if (state.location !== "city") return;
    state.crimeQuiet += dt;
    if (state.crimeQuiet > 7 && state.mission !== 3) state.heat = Math.max(0, state.heat - dt * 0.11);
    const level = Math.ceil(state.heat - 0.15);
    state.policeTimer -= dt;
    if (level > 0 && state.policeTimer <= 0) {
      state.policeTimer = Math.max(2.6, 7 - level * 1.2) / enemyPressure();
      const cops = state.enemies.filter((enemy) => POLICE_TYPES.includes(enemy.type) && enemy.location === "city").length;
      const rank = level >= 4 ? "tactical" : level >= 3 ? "detective" : "cop";
      if (cops < level * 2) spawnEnemy(rank, state.player, 420, "police", "city");
      if (level >= 2 && state.policeCars.length < level - 1) spawnPoliceCar();
    }
    for (const car of state.policeCars) {
      car.bumpCooldown = Math.max(0, (car.bumpCooldown || 0) - dt);
      const direction = angleTo(car, state.player);
      const desired = direction + Math.PI / 2;
      const delta = ((desired - car.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      car.angle += delta * Math.min(1, dt * 4.5);
      car.speed += ((250 + level * 45) - car.speed) * Math.min(1, dt * 2);
      const oldX = car.x;
      const oldY = car.y;
      moveWithCollision(car, Math.cos(direction) * car.speed * dt, Math.sin(direction) * car.speed * dt, 32);
      if (isRiverWater(car.x, car.y)) { car.x = oldX; car.y = oldY; car.speed *= 0.5; }
      resolveVehicleContacts(car, [...state.cars, ...state.policeCars], oldX, oldY);
      car.cooldown -= dt;
      if (distance(car, state.player) < 55 && car.cooldown <= 0) {
        car.cooldown = 1.1;
        damagePlayer(14);
        sound.crash();
      }
    }
  }

  function updateEffects(dt) {
    state.shake = Math.max(0, state.shake - dt * 18);
    for (let i = state.effects.length - 1; i >= 0; i -= 1) {
      state.effects[i].age += dt;
      if (state.effects[i].age >= state.effects[i].duration) state.effects.splice(i, 1);
    }
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const particle = state.particles[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.94;
      particle.vy *= 0.94;
      particle.life -= dt;
      if (particle.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.texts.length - 1; i >= 0; i -= 1) {
      state.texts[i].y -= dt * 25;
      state.texts[i].life -= dt;
      if (state.texts[i].life <= 0) state.texts.splice(i, 1);
    }
  }

  function updateEnvironment(dt) {
    state.environment.hour = (state.environment.hour + dt * 0.12) % 24;
    state.environment.weatherTimer -= dt;
    if (state.environment.weatherTimer > 0) return;
    const cycle = ["clear", "rain", "fog", "clear", "storm", "rain"];
    state.environment.weather = cycle[Math.floor(state.time / 28) % cycle.length];
    state.environment.weatherTimer = 28;
    addText(state.player.x, state.player.y - 68, `WEATHER · ${state.environment.weather.toUpperCase()}`, "#65e6dd");
  }

  return {
    state,
    currentObjective,
    missionText,
    answerCall,
    buyUpgrade,
    closeShop,
    openProfile,
    closeProfile,
    setProfile,
    selectWeapon,
    tutorialText,
    skipTutorial,
    setWeaponWheel,
    closeProperty,
    buyProperty,
    sideMissionText,
    start() { state.mode = "playing"; },
    update(dt) {
      if (state.mode !== "playing" || state.phoneOpen || state.shopOpen || state.profileOpen || state.propertyOpen || state.weaponWheelOpen) return;
      const step = Math.min(0.033, dt);
      if (state.recovery.timer > 0) {
        state.recovery.timer = Math.max(0, state.recovery.timer - step);
        sound.update(step, state.heat);
        return;
      }
      state.time += step;
      state.animTime += step;
      updateEnvironment(step);
      updatePlayer(step);
      updateMission(step);
      updatePickups(step);
      updateBullets(step);
      updateEnemies(step);
      updateNpcs(step);
      updateSpecialNpcs(step);
      updateAllies(step);
      updateMobmons(step);
      resolveCrowdContacts();
      updateContract(step);
      updateRealEstate(step);
      updatePolice(step);
      updateEffects(step);
      sound.update(step, state.heat);
    },
  };
}
