export const WORLD_SIZE = 4000;
export const ROAD_WIDTH = 190;
export const ROAD_CENTERS = [300, 1100, 1900, 2700];

export const BUILDINGS = [
  { x: 430, y: 430, w: 500, h: 390, tone: 0, label: "CASINO" },
  { x: 430, y: 920, w: 500, h: 85, tone: 1 },
  { x: 1270, y: 430, w: 480, h: 370, tone: 2, label: "LEDGER" },
  { x: 430, y: 1270, w: 470, h: 390, tone: 1, label: "MARINA" },
  { x: 1290, y: 1280, w: 450, h: 390, tone: 0, label: "CROWN" },
  { x: 40, y: 450, w: 150, h: 360, tone: 2 },
  { x: 2000, y: 460, w: 150, h: 350, tone: 1 },
  { x: 40, y: 1280, w: 150, h: 380, tone: 0 },
  { x: 2000, y: 1280, w: 150, h: 370, tone: 2 },
  { x: 2050, y: 430, w: 230, h: 220, tone: 0, label: "BAKERY", art: "bakery" },
  { x: 2335, y: 430, w: 230, h: 220, tone: 1, label: "DRY CLEANER", art: "dry_cleaner" },
  { x: 2050, y: 735, w: 230, h: 220, tone: 2, label: "BUTCHER", art: "butcher_shop" },
  { x: 2335, y: 735, w: 230, h: 220, tone: 0, label: "LIQUOR", art: "liquor_shop" },
  { x: 2850, y: 430, w: 300, h: 245, tone: 1, label: "PAWN + BUFFS", art: "pawn_shop" },
  { x: 3260, y: 430, w: 460, h: 270, tone: 2, label: "RESTAURANT", art: "restaurant" },
  { x: 2850, y: 760, w: 500, h: 230, tone: 1, label: "GAS", art: "gas_station" },
  { x: 2070, y: 1240, w: 510, h: 430, tone: 0, label: "HOSPITAL", art: "hospital" },
  { x: 2860, y: 1240, w: 510, h: 420, tone: 2, label: "POLICE", art: "police_station" },
  { x: 620, y: 2860, w: 860, h: 360, tone: 1, label: "VICE AIR TERMINAL", art: "airport_terminal" },
  { x: 1650, y: 2900, w: 650, h: 300, tone: 2, label: "HANGAR 1", art: "aircraft_hangar" },
  { x: 2440, y: 2900, w: 650, h: 300, tone: 2, label: "HANGAR 2", art: "aircraft_hangar" },
  { x: 3400, y: 1100, w: 480, h: 330, tone: 0, label: "CITY BANK", art: "city_bank" },
  { x: 3430, y: 1650, w: 360, h: 300, tone: 2, label: "JEWELRY", art: "jewelry_store" },
  { x: 3200, y: 2850, w: 650, h: 320, tone: 0, label: "GRAND HOTEL", art: "grand_hotel" },
  { x: 2820, y: 2000, w: 540, h: 180, tone: 1, label: "RIVER WAREHOUSE", art: "river_warehouse" },
  { x: 1500, y: 2470, w: 380, h: 130, tone: 2, label: "RECORD CLUB", art: "record_club" },
];

export const AIRPORT_RUNWAY = { x: 460, y: 3420, w: 3260, h: 270 };
export const AIRPORT_HEIST_POINT = { x: 1520, y: 3260, radius: 92, short: "AIRPORT HEIST" };
export const AIRPORT_ESCAPE_POINT = { x: 3690, y: 3555, radius: 105, short: "TAKE OFF" };
export const UPGRADE_SHOP_POINT = { x: 2818, y: 555, radius: 66, short: "BUFF SHOP" };
export const RIVER = { x: 0, y: 2200, w: WORLD_SIZE, h: 250 };
export const CONTRACT_POINTS = [
  { x: 3600, y: 1470, name: "BANK DIRECTOR" },
  { x: 3600, y: 1990, name: "JEWEL BROKER" },
  { x: 3400, y: 2810, name: "HOTEL FIXER" },
  { x: 3100, y: 1960, name: "WAREHOUSE BOSS" },
  { x: 1450, y: 2550, name: "CLUB PROMOTER" }
];

export const PROPERTY_POINTS = [
  { id: "harbor_safehouse", name: "Harbor Safehouse", x: 350, y: 1880, cost: 2500, income: 0, safehouse: true },
  { id: "east_loft", name: "East Loft", x: 2815, y: 1060, cost: 4500, income: 0, safehouse: true },
  { id: "bakery_front", name: "Bakery Front", x: 2020, y: 550, cost: 3500, income: 180, commercial: true },
  { id: "cleaner_front", name: "Dry Cleaner Front", x: 2305, y: 550, cost: 4200, income: 230, commercial: true },
  { id: "restaurant_front", name: "Restaurant Front", x: 3230, y: 610, cost: 6500, income: 400, commercial: true },
  { id: "record_front", name: "Record Club Front", x: 1450, y: 2550, cost: 7000, income: 500, commercial: true }
];

export const PARKED_CARS = [
  { x: 470, y: 1050, angle: Math.PI / 2, frame: "black_sedan" },
  { x: 1070, y: 650, angle: 0, frame: "red_coupe" },
  { x: 1130, y: 1560, angle: Math.PI, frame: "black_sedan" },
  { x: 1850, y: 1040, angle: -Math.PI / 2, frame: "red_coupe" },
  { x: 320, y: 1780, angle: 0, frame: "black_sedan" },
  { x: 2690, y: 2100, angle: Math.PI, frame: "black_sedan" },
  { x: 3500, y: 1090, angle: Math.PI / 2, frame: "red_coupe" },
];

export const PICKUP_SPAWNS = [
  { x: 570, y: 1050, type: "weapon_case" },
  { x: 1020, y: 330, type: "armor_vest" },
  { x: 1880, y: 1230, type: "weapon_case" },
  { x: 330, y: 920, type: "cash_bundle" },
  { x: 1200, y: 1900, type: "cash_bundle" },
];

export const OBJECTIVES = [
  { x: 350, y: 560, radius: 78, name: "Casino Cage", short: "EXTORTION" },
  { x: 1810, y: 590, radius: 82, name: "Boiler Room", short: "BOILER ROOM" },
  { x: 350, y: 1880, radius: 92, name: "Safehouse", short: "GETAWAY" },
];

export const INTERIORS = {
  casino: {
    id: "casino", name: "Casino Cage", w: 900, h: 1200, tone: 0,
    door: { x: 408, y: 625 }, streetSpawn: { x: 382, y: 625 },
    exit: { x: 450, y: 1135 }, missionPoint: { x: 450, y: 220 },
    props: [
      { type: "roulette_table", x: 250, y: 440, w: 190, h: 105 },
      { type: "roulette_table", x: 650, y: 440, w: 190, h: 105 },
      { type: "curved_bar", x: 720, y: 155, w: 190, h: 150 },
      { type: "leather_booth", x: 170, y: 690, w: 165, h: 120 },
      { type: "executive_desk", x: 450, y: 105, w: 175, h: 115 }
    ]
  },
  ledger: {
    id: "ledger", name: "Ledger Tower", w: 900, h: 1200, tone: 2,
    door: { x: 1248, y: 615 }, streetSpawn: { x: 1222, y: 615 },
    exit: { x: 450, y: 1135 }, missionPoint: { x: 450, y: 245 },
    props: [
      { type: "stock_terminal_bank", x: 230, y: 430, w: 220, h: 120 },
      { type: "stock_terminal_bank", x: 670, y: 430, w: 220, h: 120 },
      { type: "stock_terminal_bank", x: 230, y: 690, w: 220, h: 120 },
      { type: "stock_terminal_bank", x: 670, y: 690, w: 220, h: 120 },
      { type: "executive_desk", x: 450, y: 115, w: 190, h: 125 }
    ]
  },
  marina: {
    id: "marina", name: "Marina Club", w: 900, h: 1200, tone: 1,
    door: { x: 680, y: 1248 }, streetSpawn: { x: 680, y: 1222 },
    exit: { x: 450, y: 1135 }, missionPoint: { x: 450, y: 220 },
    props: [
      { type: "marina_counter", x: 450, y: 145, w: 220, h: 125 },
      { type: "leather_booth", x: 190, y: 470, w: 180, h: 130 },
      { type: "leather_booth", x: 710, y: 470, w: 180, h: 130 },
      { type: "curved_bar", x: 450, y: 710, w: 210, h: 160 }
    ]
  },
  crown: {
    id: "crown", name: "Crown Lounge", w: 900, h: 1200, tone: 0,
    door: { x: 1515, y: 1258 }, streetSpawn: { x: 1515, y: 1232 },
    exit: { x: 450, y: 1135 }, missionPoint: { x: 450, y: 220 },
    props: [
      { type: "curved_bar", x: 450, y: 150, w: 230, h: 165 },
      { type: "leather_booth", x: 180, y: 470, w: 180, h: 130 },
      { type: "leather_booth", x: 720, y: 470, w: 180, h: 130 },
      { type: "roulette_table", x: 450, y: 720, w: 190, h: 105 }
    ]
  }
};

export function collidesBuilding(x, y, radius = 20) {
  return BUILDINGS.some((b) =>
    x + radius > b.x && x - radius < b.x + b.w &&
    y + radius > b.y && y - radius < b.y + b.h
  );
}

export function clampToCity(value, padding = 24) {
  return Math.max(padding, Math.min(WORLD_SIZE - padding, value));
}

export function isBridge(x, y) {
  return y >= RIVER.y && y <= RIVER.y + RIVER.h && ROAD_CENTERS.some((center) => Math.abs(x - center) < ROAD_WIDTH * 0.64);
}

export function isRiverWater(x, y) {
  return x >= RIVER.x && x <= RIVER.x + RIVER.w && y >= RIVER.y && y <= RIVER.y + RIVER.h && !isBridge(x, y);
}

export function collidesInterior(id, x, y, radius = 20) {
  const room = INTERIORS[id];
  if (!room) return true;
  if (x - radius < 36 || y - radius < 36 || x + radius > room.w - 36 || y + radius > room.h - 30) return true;
  return room.props.some((prop) =>
    x + radius > prop.x - prop.w / 2 && x - radius < prop.x + prop.w / 2 &&
    y + radius > prop.y - prop.h / 2 && y - radius < prop.y + prop.h / 2
  );
}

export function clampToInterior(id, x, y, radius = 20) {
  const room = INTERIORS[id];
  return {
    x: Math.max(38 + radius, Math.min(room.w - 38 - radius, x)),
    y: Math.max(38 + radius, Math.min(room.h - 32 - radius, y)),
  };
}
