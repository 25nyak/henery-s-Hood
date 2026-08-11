const FRAME_URLS = {
  characters: "/generated-assets/character_sheet-transparent.frames.json",
  cast: "/generated-assets/city_cast_sheet-transparent.frames.json",
  effects: "/generated-assets/combat_effect_sheet-transparent.frames.json",
  vehicles: "/generated-assets/vehicle_atlas-transparent.frames.json",
  pickups: "/generated-assets/pickup_atlas-transparent.frames.json",
  interiorProps: "/generated-assets/interior_prop_atlas-transparent.frames.json",
  racketCrew: "/generated-assets/racket_crew_sheet-transparent.frames.json",
  weapons: "/generated-assets/weapon_atlas-transparent.frames.json",
  cargoVehicles: "/generated-assets/cargo_vehicle_atlas-transparent.frames.json",
  heistLoot: "/generated-assets/heist_loot_atlas-transparent.frames.json",
  storefrontBuildings: "/generated-assets/storefront_building_atlas-transparent.frames.json",
  civicBuildings: "/generated-assets/civic_building_atlas-transparent.frames.json",
  airportVehicles: "/generated-assets/airport_vehicle_atlas-transparent.frames.json",
  playerRoster: "/generated-assets/player_roster_sheet-transparent.frames.json",
  mobmons: "/generated-assets/mobmon_sheet-transparent.frames.json",
  policeRanks: "/generated-assets/police_rank_sheet-transparent.frames.json",
  riverAirVehicles: "/generated-assets/river_air_vehicle_atlas-transparent.frames.json",
  missionBusinesses: "/generated-assets/mission_business_atlas-transparent.frames.json",
};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${url}`));
    image.src = url;
  });
}

export async function loadArt(assets) {
  const get = (key) => assets?.get(key);
  const [characters, cast, racketCrew, playerRoster, mobmons, policeRanks, effects, vehicles, cargoVehicles, airportVehicles, riverAirVehicles, pickups, weapons, heistLoot, storefrontBuildings, civicBuildings, missionBusinesses, asphalt, interiorFloor, interiorProps, characterData, castData, racketCrewData, playerRosterData, mobmonData, policeRankData, effectData, vehicleData, cargoVehicleData, airportVehicleData, riverAirVehicleData, pickupData, weaponData, heistLootData, storefrontBuildingData, civicBuildingData, missionBusinessData, interiorPropData] = await Promise.all([
    loadImage(get("CHARACTER_SHEET")),
    loadImage(get("CITY_CAST_SHEET")),
    loadImage(get("RACKET_CREW_SHEET")),
    loadImage(get("PLAYER_ROSTER_SHEET")),
    loadImage(get("MOBMON_SHEET")),
    loadImage(get("POLICE_RANK_SHEET")),
    loadImage(get("COMBAT_EFFECT_SHEET")),
    loadImage(get("VEHICLE_ATLAS")),
    loadImage(get("CARGO_VEHICLE_ATLAS")),
    loadImage(get("AIRPORT_VEHICLE_ATLAS")),
    loadImage(get("RIVER_AIR_VEHICLE_ATLAS")),
    loadImage(get("PICKUP_ATLAS")),
    loadImage(get("WEAPON_ATLAS")),
    loadImage(get("HEIST_LOOT_ATLAS")),
    loadImage(get("STOREFRONT_BUILDING_ATLAS")),
    loadImage(get("CIVIC_BUILDING_ATLAS")),
    loadImage(get("MISSION_BUSINESS_ATLAS")),
    loadImage(get("ASPHALT_TEXTURE")),
    loadImage(get("INTERIOR_FLOOR_TEXTURE")),
    loadImage(get("INTERIOR_PROP_ATLAS")),
    fetch(FRAME_URLS.characters).then((response) => response.json()),
    fetch(FRAME_URLS.cast).then((response) => response.json()),
    fetch(FRAME_URLS.racketCrew).then((response) => response.json()),
    fetch(FRAME_URLS.playerRoster).then((response) => response.json()),
    fetch(FRAME_URLS.mobmons).then((response) => response.json()),
    fetch(FRAME_URLS.policeRanks).then((response) => response.json()),
    fetch(FRAME_URLS.effects).then((response) => response.json()),
    fetch(FRAME_URLS.vehicles).then((response) => response.json()),
    fetch(FRAME_URLS.cargoVehicles).then((response) => response.json()),
    fetch(FRAME_URLS.airportVehicles).then((response) => response.json()),
    fetch(FRAME_URLS.riverAirVehicles).then((response) => response.json()),
    fetch(FRAME_URLS.pickups).then((response) => response.json()),
    fetch(FRAME_URLS.weapons).then((response) => response.json()),
    fetch(FRAME_URLS.heistLoot).then((response) => response.json()),
    fetch(FRAME_URLS.storefrontBuildings).then((response) => response.json()),
    fetch(FRAME_URLS.civicBuildings).then((response) => response.json()),
    fetch(FRAME_URLS.missionBusinesses).then((response) => response.json()),
    fetch(FRAME_URLS.interiorProps).then((response) => response.json()),
  ]);
  return {
    images: { characters, cast, racketCrew, playerRoster, mobmons, policeRanks, effects, vehicles, cargoVehicles, airportVehicles, riverAirVehicles, pickups, weapons, heistLoot, storefrontBuildings, civicBuildings, missionBusinesses, asphalt, interiorFloor, interiorProps },
    frames: {
      characters: new Map(characterData.frames.map((frame) => [frame.name, frame])),
      cast: new Map(castData.frames.map((frame) => [frame.name, frame])),
      racketCrew: new Map(racketCrewData.frames.map((frame) => [frame.name, frame])),
      playerRoster: new Map(playerRosterData.frames.map((frame) => [frame.name, frame])),
      mobmons: new Map(mobmonData.frames.map((frame) => [frame.name, frame])),
      policeRanks: new Map(policeRankData.frames.map((frame) => [frame.name, frame])),
      effects: new Map(effectData.frames.map((frame) => [frame.name, frame])),
      vehicles: new Map(vehicleData.frames.map((frame) => [frame.name, frame])),
      cargoVehicles: new Map(cargoVehicleData.frames.map((frame) => [frame.name, frame])),
      airportVehicles: new Map(airportVehicleData.frames.map((frame) => [frame.name, frame])),
      riverAirVehicles: new Map(riverAirVehicleData.frames.map((frame) => [frame.name, frame])),
      pickups: new Map(pickupData.frames.map((frame) => [frame.name, frame])),
      weapons: new Map(weaponData.frames.map((frame) => [frame.name, frame])),
      heistLoot: new Map(heistLootData.frames.map((frame) => [frame.name, frame])),
      storefrontBuildings: new Map(storefrontBuildingData.frames.map((frame) => [frame.name, frame])),
      civicBuildings: new Map(civicBuildingData.frames.map((frame) => [frame.name, frame])),
      missionBusinesses: new Map(missionBusinessData.frames.map((frame) => [frame.name, frame])),
      interiorProps: new Map(interiorPropData.frames.map((frame) => [frame.name, frame])),
    },
  };
}

export function drawCharacter(ctx, art, animation, frameIndex, x, y, angle, height = 68) {
  const sheet = art.frames.playerRoster.has(`${animation}_1`) ? "playerRoster"
    : art.frames.mobmons.has(`${animation}_1`) ? "mobmons"
      : art.frames.policeRanks.has(`${animation}_1`) ? "policeRanks"
        : art.frames.racketCrew.has(`${animation}_1`) ? "racketCrew"
          : art.frames.cast.has(`${animation}_1`) ? "cast" : "characters";
  const frameCount = sheet === "characters" ? 5 : 4;
  const frame = art.frames[sheet].get(`${animation}_${frameIndex % frameCount + 1}`);
  if (!frame) return;
  const image = art.images[sheet];
  const crop = frame.content || frame.source;
  const scale = height / frame.source.h;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(
    image,
    crop.x, crop.y, crop.w, crop.h,
    (crop.x - frame.anchor.x) * scale,
    (crop.y - frame.anchor.y) * scale,
    crop.w * scale,
    crop.h * scale,
  );
  ctx.restore();
}

export function drawCombatEffect(ctx, art, name, frameIndex, x, y, angle, size) {
  const frame = art.frames.effects.get(`${name}_${frameIndex % 4 + 1}`);
  if (!frame) return;
  const crop = frame.content || frame.source;
  const scale = size / frame.source.w;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(
    art.images.effects,
    crop.x, crop.y, crop.w, crop.h,
    (crop.x - frame.anchor.x) * scale,
    (crop.y - frame.anchor.y) * scale,
    crop.w * scale, crop.h * scale,
  );
  ctx.restore();
}

export function drawVehicle(ctx, art, name, x, y, angle, length = 112) {
  const sheet = art.frames.riverAirVehicles.has(name) ? "riverAirVehicles"
    : art.frames.airportVehicles.has(name) ? "airportVehicles"
      : art.frames.cargoVehicles.has(name) ? "cargoVehicles" : "vehicles";
  const frame = art.frames[sheet].get(name);
  if (!frame) return;
  const crop = frame.content || frame.source;
  const scale = length / crop.h;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(
    art.images[sheet],
    crop.x, crop.y, crop.w, crop.h,
    -crop.w * scale / 2, -crop.h * scale / 2,
    crop.w * scale, crop.h * scale,
  );
  ctx.restore();
}

export function drawBuilding(ctx, art, name, x, y, width, height) {
  const sheet = art.frames.missionBusinesses.has(name) ? "missionBusinesses"
    : art.frames.storefrontBuildings.has(name) ? "storefrontBuildings" : "civicBuildings";
  const frame = art.frames[sheet].get(name);
  if (!frame) return;
  const crop = frame.content || frame.source;
  const scale = Math.min(width / crop.w, height / crop.h);
  const drawW = crop.w * scale;
  const drawH = crop.h * scale;
  ctx.drawImage(art.images[sheet], crop.x, crop.y, crop.w, crop.h,
    x + (width - drawW) / 2, y + (height - drawH) / 2, drawW, drawH);
}

function drawAtlasObject(ctx, image, frames, name, x, y, size) {
  const frame = frames.get(name);
  if (!frame) return;
  const crop = frame.content || frame.source;
  const scale = size / Math.max(crop.w, crop.h);
  ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h,
    x - crop.w * scale / 2, y - crop.h * scale / 2, crop.w * scale, crop.h * scale);
}

export function drawWeaponPickup(ctx, art, name, x, y, size = 58) {
  drawAtlasObject(ctx, art.images.weapons, art.frames.weapons, name, x, y, size);
}

export function drawHeistLoot(ctx, art, name, x, y, size = 70) {
  drawAtlasObject(ctx, art.images.heistLoot, art.frames.heistLoot, name, x, y, size);
}

export function drawPickup(ctx, art, name, x, y, size = 50) {
  const frame = art.frames.pickups.get(name);
  if (!frame) return;
  const crop = frame.content || frame.source;
  const scale = size / Math.max(crop.w, crop.h);
  ctx.drawImage(
    art.images.pickups,
    crop.x, crop.y, crop.w, crop.h,
    x - crop.w * scale / 2, y - crop.h * scale / 2,
    crop.w * scale, crop.h * scale,
  );
}

export function drawInteriorProp(ctx, art, name, x, y, width, height) {
  const frame = art.frames.interiorProps.get(name);
  if (!frame) return;
  const crop = frame.content || frame.source;
  const scale = Math.min(width / crop.w, height / crop.h);
  ctx.drawImage(
    art.images.interiorProps,
    crop.x, crop.y, crop.w, crop.h,
    x - crop.w * scale / 2, y - crop.h * scale / 2,
    crop.w * scale, crop.h * scale,
  );
}
