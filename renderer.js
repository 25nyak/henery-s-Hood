import { drawBuilding, drawCharacter, drawCombatEffect, drawHeistLoot, drawInteriorProp, drawPickup, drawVehicle, drawWeaponPickup } from "./art.js";
import { AIRPORT_RUNWAY, BUILDINGS, INTERIORS, PROPERTY_POINTS, RIVER, ROAD_CENTERS, ROAD_WIDTH, UPGRADE_SHOP_POINT, WORLD_SIZE } from "./world.js";

const ROOF_COLORS = ["#183a41", "#2a3546", "#3a2840"];
const EDGE_COLORS = ["#46aaa6", "#e3a75d", "#c95172"];

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, r);
}

export function createRenderer(canvas, art, tweaks) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let width = 1;
  let height = 1;
  let dpr = 1;
  let cameraX = 500;
  let cameraY = 1050;
  let lastLocation = "city";
  let asphaltPattern = null;
  let interiorPattern = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    width = rect.width;
    height = rect.height;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    asphaltPattern = ctx.createPattern(art.images.asphalt, "repeat");
    interiorPattern = ctx.createPattern(art.images.interiorFloor, "repeat");
  }

  function buildingElevation(building) {
    if (building.h < 130) return 24;
    if (/HOTEL|HOSPITAL|POLICE|LEDGER|CASINO/.test(building.label || "")) return 82;
    if (/TERMINAL|HANGAR|BANK/.test(building.label || "")) return 62;
    return building.art ? 42 : 54;
  }

  function buildingTop(building) {
    const elevation = buildingElevation(building);
    return { elevation, x: building.x - elevation * 0.22, y: building.y - elevation };
  }

  function drawBuildingRoof(building, topOnly = false) {
    const top = buildingTop(building);
    if (building.art) {
      drawBuilding(ctx, art, building.art, top.x, top.y, building.w, building.h);
    } else {
      ctx.fillStyle = ROOF_COLORS[building.tone];
      roundedRect(ctx, top.x, top.y, building.w, building.h, 16);
      ctx.fill();
      ctx.strokeStyle = EDGE_COLORS[building.tone];
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.lineWidth = 2;
      ctx.strokeRect(top.x + 18, top.y + 18, building.w - 36, building.h - 36);
      if (!topOnly && building.w > 250) {
        ctx.fillStyle = "rgba(11, 27, 33, 0.82)";
        ctx.fillRect(top.x + building.w * 0.22, top.y + building.h * 0.28, Math.min(90, building.w * 0.22), 34);
        ctx.strokeStyle = "rgba(101, 230, 221, 0.38)";
        ctx.strokeRect(top.x + building.w * 0.22, top.y + building.h * 0.28, Math.min(90, building.w * 0.22), 34);
      }
    }
  }

  function drawExtrudedBuilding(building, state) {
    const top = buildingTop(building);
    const edge = EDGE_COLORS[building.tone];
    const night = 1 - Math.max(0, Math.sin((state.environment.hour - 6) / 12 * Math.PI));
    ctx.fillStyle = `rgba(0, 0, 0, ${0.26 + night * 0.14})`;
    ctx.beginPath();
    ctx.ellipse(building.x + building.w * 0.54 + top.elevation * 0.3, building.y + building.h + 22, building.w * 0.53, 30 + top.elevation * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = ["#15343c", "#25323d", "#37253a"][building.tone];
    ctx.beginPath();
    ctx.moveTo(top.x, top.y + building.h);
    ctx.lineTo(top.x + building.w, top.y + building.h);
    ctx.lineTo(building.x + building.w, building.y + building.h);
    ctx.lineTo(building.x, building.y + building.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = ["#102b32", "#1d2934", "#2b1d2d"][building.tone];
    ctx.beginPath();
    ctx.moveTo(top.x + building.w, top.y);
    ctx.lineTo(building.x + building.w, building.y);
    ctx.lineTo(building.x + building.w, building.y + building.h);
    ctx.lineTo(top.x + building.w, top.y + building.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(101, 230, 221, 0.25)";
    ctx.stroke();

    const windows = Math.max(2, Math.min(8, Math.floor(building.w / 70)));
    const windowY = building.y + building.h - Math.max(15, top.elevation * 0.45);
    for (let index = 0; index < windows; index += 1) {
      ctx.fillStyle = index % 3 === 0
        ? `rgba(255, 198, 92, ${0.34 + night * 0.55})`
        : `rgba(74, 198, 193, ${0.18 + night * 0.24})`;
      ctx.fillRect(building.x + 20 + index * (building.w - 40) / windows, windowY, Math.max(13, (building.w - 55) / windows - 8), 10);
    }

    drawBuildingRoof(building);
    if (building.label) {
      ctx.fillStyle = "rgba(5, 18, 24, 0.9)";
      const labelW = Math.min(220, building.w * 0.76);
      roundedRect(ctx, building.x + building.w / 2 - labelW / 2, building.y + building.h - 35, labelW, 28, 7);
      ctx.fill();
      ctx.fillStyle = "#ffe393";
      ctx.font = `${building.w < 260 ? 16 : 20}px 'Bebas Neue', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(building.label, building.x + building.w / 2, building.y + building.h - 20);
    }
  }

  function drawCityRoofOverlay() {
    for (const building of BUILDINGS) drawBuildingRoof(building, true);
  }

  function drawCity(state) {
    ctx.fillStyle = asphaltPattern || "#142027";
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
    ctx.fillStyle = "rgba(6, 18, 24, 0.48)";
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    const water = ctx.createLinearGradient(0, RIVER.y, 0, RIVER.y + RIVER.h);
    water.addColorStop(0, "#0b4c59");
    water.addColorStop(0.5, "#126878");
    water.addColorStop(1, "#083d4b");
    ctx.fillStyle = water;
    ctx.fillRect(RIVER.x, RIVER.y, RIVER.w, RIVER.h);
    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.fillRect(RIVER.x, RIVER.y - 10, RIVER.w, 12);
    ctx.fillRect(RIVER.x, RIVER.y + RIVER.h, RIVER.w, 16);
    ctx.strokeStyle = "rgba(145, 240, 229, 0.24)";
    ctx.lineWidth = 3;
    for (let x = 40; x < WORLD_SIZE; x += 95) {
      ctx.beginPath();
      ctx.moveTo(x, RIVER.y + 55 + Math.sin(x * 0.02) * 12);
      ctx.lineTo(x + 45, RIVER.y + 55 + Math.sin(x * 0.02) * 12);
      ctx.moveTo(x + 25, RIVER.y + 165 + Math.cos(x * 0.018) * 10);
      ctx.lineTo(x + 72, RIVER.y + 165 + Math.cos(x * 0.018) * 10);
      ctx.stroke();
    }
    for (const center of ROAD_CENTERS) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
      ctx.fillRect(center - ROAD_WIDTH * 0.66 + 10, RIVER.y + RIVER.h + 6, ROAD_WIDTH * 1.32, 18);
      ctx.fillStyle = "#172128";
      ctx.fillRect(center - ROAD_WIDTH * 0.62, RIVER.y - 8, ROAD_WIDTH * 1.24, RIVER.h + 16);
      ctx.strokeStyle = "rgba(255, 190, 83, 0.45)";
      ctx.strokeRect(center - ROAD_WIDTH * 0.62, RIVER.y - 8, ROAD_WIDTH * 1.24, RIVER.h + 16);
      ctx.strokeStyle = "rgba(255, 227, 147, 0.72)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(center - ROAD_WIDTH * 0.62, RIVER.y + 8);
      ctx.lineTo(center - ROAD_WIDTH * 0.62, RIVER.y + RIVER.h - 8);
      ctx.moveTo(center + ROAD_WIDTH * 0.62, RIVER.y + 8);
      ctx.lineTo(center + ROAD_WIDTH * 0.62, RIVER.y + RIVER.h - 8);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(244, 194, 96, 0.28)";
    ctx.lineWidth = 3;
    ctx.setLineDash([24, 24]);
    for (const center of ROAD_CENTERS) {
      ctx.beginPath();
      ctx.moveTo(center, 0);
      ctx.lineTo(center, WORLD_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, center);
      ctx.lineTo(WORLD_SIZE, center);
      ctx.stroke();
    }

    ctx.fillStyle = "#172128";
    ctx.fillRect(AIRPORT_RUNWAY.x, AIRPORT_RUNWAY.y, AIRPORT_RUNWAY.w, AIRPORT_RUNWAY.h);
    ctx.strokeStyle = "rgba(101, 230, 221, 0.55)";
    ctx.lineWidth = 6;
    ctx.strokeRect(AIRPORT_RUNWAY.x, AIRPORT_RUNWAY.y, AIRPORT_RUNWAY.w, AIRPORT_RUNWAY.h);
    ctx.strokeStyle = "rgba(255, 240, 189, 0.78)";
    ctx.lineWidth = 8;
    ctx.setLineDash([72, 52]);
    ctx.beginPath();
    ctx.moveTo(AIRPORT_RUNWAY.x + 80, AIRPORT_RUNWAY.y + AIRPORT_RUNWAY.h / 2);
    ctx.lineTo(AIRPORT_RUNWAY.x + AIRPORT_RUNWAY.w - 80, AIRPORT_RUNWAY.y + AIRPORT_RUNWAY.h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(86, 206, 197, 0.18)";
    ctx.lineWidth = 10;
    for (const center of ROAD_CENTERS) {
      ctx.strokeRect(center - ROAD_WIDTH / 2, -10, ROAD_WIDTH, WORLD_SIZE + 20);
      ctx.strokeRect(-10, center - ROAD_WIDTH / 2, WORLD_SIZE + 20, ROAD_WIDTH);
    }

    for (const building of BUILDINGS) drawExtrudedBuilding(building, state);

    ctx.fillStyle = "rgba(5, 18, 24, 0.9)";
    roundedRect(ctx, UPGRADE_SHOP_POINT.x - 62, UPGRADE_SHOP_POINT.y - 22, 124, 44, 9);
    ctx.fill();
    ctx.strokeStyle = "#65e6dd";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#b9fff9";
    ctx.font = "18px 'Bebas Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ACT · BUFF SHOP", UPGRADE_SHOP_POINT.x, UPGRADE_SHOP_POINT.y + 1);

    for (const property of PROPERTY_POINTS) {
      const owned = Boolean(state.properties[property.id]);
      const deal = state.wolfDeal.propertyId === property.id;
      ctx.fillStyle = owned ? "rgba(22, 84, 78, 0.92)" : "rgba(5, 18, 24, 0.9)";
      roundedRect(ctx, property.x - 66, property.y - 24, 132, 48, 9);
      ctx.fill();
      ctx.strokeStyle = deal ? "#ffbe53" : owned ? "#65e6dd" : "#c68b58";
      ctx.lineWidth = deal ? 5 : 3;
      ctx.stroke();
      ctx.fillStyle = deal ? "#ffe393" : owned ? "#b9fff9" : "#f0c99f";
      ctx.font = "16px 'Bebas Neue', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(deal ? "ACT · WOLF ST DEAL" : owned ? "ACT · OWNED" : `ACT · $${property.cost}`, property.x, property.y + 1);
    }

    for (const room of Object.values(INTERIORS)) {
      ctx.fillStyle = "rgba(7, 18, 23, 0.94)";
      ctx.fillRect(room.door.x - 19, room.door.y - 28, 38, 56);
      ctx.strokeStyle = "#ffbe53";
      ctx.lineWidth = 4;
      ctx.strokeRect(room.door.x - 19, room.door.y - 28, 38, 56);
      ctx.fillStyle = "#ffe393";
      ctx.font = "15px 'Bebas Neue', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ACT", room.door.x, room.door.y - 38);
    }

    ctx.strokeStyle = "rgba(255, 82, 119, 0.65)";
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, WORLD_SIZE - 16, WORLD_SIZE - 16);
  }

  function drawInterior(room) {
    ctx.fillStyle = interiorPattern || "#311f32";
    ctx.fillRect(0, 0, room.w, room.h);
    const tint = ["rgba(76, 14, 43, 0.28)", "rgba(12, 72, 74, 0.3)", "rgba(42, 21, 73, 0.3)"][room.tone];
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, room.w, room.h);

    ctx.fillStyle = "#07151b";
    ctx.fillRect(0, 0, room.w, 38);
    ctx.fillRect(0, 0, 38, room.h);
    ctx.fillRect(room.w - 38, 0, 38, room.h);
    ctx.fillRect(0, room.h - 32, room.w, 32);
    ctx.strokeStyle = EDGE_COLORS[room.tone];
    ctx.lineWidth = 7;
    ctx.strokeRect(40, 40, room.w - 80, room.h - 76);

    ctx.fillStyle = "rgba(5, 18, 24, 0.8)";
    roundedRect(ctx, room.w / 2 - 150, 55, 300, 54, 10);
    ctx.fill();
    ctx.fillStyle = "#ffe393";
    ctx.font = "34px 'Bebas Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(room.name.toUpperCase(), room.w / 2, 82);

    ctx.fillStyle = "rgba(255, 207, 104, 0.16)";
    for (let y = 170; y < room.h - 120; y += 210) {
      ctx.beginPath();
      ctx.arc(70, y, 42, 0, Math.PI * 2);
      ctx.arc(room.w - 70, y, 42, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const prop of room.props) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
      ctx.beginPath();
      ctx.ellipse(prop.x + 10, prop.y + prop.h * 0.34, prop.w * 0.46, Math.max(12, prop.h * 0.18), 0, 0, Math.PI * 2);
      ctx.fill();
      drawInteriorProp(ctx, art, prop.type, prop.x, prop.y - 8, prop.w, prop.h);
    }

    ctx.fillStyle = "rgba(5, 18, 24, 0.92)";
    ctx.fillRect(room.exit.x - 48, room.h - 62, 96, 38);
    ctx.strokeStyle = "#65e6dd";
    ctx.lineWidth = 4;
    ctx.strokeRect(room.exit.x - 48, room.h - 62, 96, 38);
    ctx.fillStyle = "#b9fff9";
    ctx.font = "18px 'Bebas Neue', sans-serif";
    ctx.fillText("ACT · EXIT", room.exit.x, room.h - 43);
  }

  function drawObjective(simulation) {
    const objective = simulation.currentObjective();
    if (!objective) return;
    const state = simulation.state;
    const pulse = 1 + Math.sin(state.time * 5) * 0.06;
    ctx.save();
    ctx.translate(objective.x, objective.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = state.mission === 3 ? "rgba(101, 230, 221, 0.14)" : "rgba(255, 190, 83, 0.14)";
    ctx.strokeStyle = state.mission === 3 ? "#65e6dd" : "#ffbe53";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, objective.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(7, 18, 23, 0.9)";
    roundedRect(ctx, -64, -14, 128, 28, 8);
    ctx.fill();
    ctx.fillStyle = "#fff0bd";
    ctx.font = "20px 'Bebas Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(objective.short, 0, 1);
    ctx.restore();

    if (state.capture > 0) {
      ctx.strokeStyle = "#fff0bd";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(objective.x, objective.y, objective.radius + 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.capture);
      ctx.stroke();
    }
  }

  function drawPickupEntity(pickup, state) {
    const bob = Math.sin(state.time * 4 + pickup.id) * 5;
    const halo = ctx.createRadialGradient(pickup.x, pickup.y, 2, pickup.x, pickup.y, 45);
    halo.addColorStop(0, "rgba(255, 216, 112, 0.42)");
    halo.addColorStop(1, "rgba(255, 216, 112, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(pickup.x + 5, pickup.y + 16, 23, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    if (pickup.type.startsWith("weapon_")) {
      drawWeaponPickup(ctx, art, pickup.type.replace("weapon_", ""), pickup.x, pickup.y + bob, 62);
    } else {
      drawPickup(ctx, art, pickup.type, pickup.x, pickup.y + bob, pickup.type === "weapon_case" ? 60 : 50);
    }
  }

  function drawEntities(simulation) {
    const state = simulation.state;
    for (const pickup of state.pickups) if (pickup.active && pickup.location === state.location) drawPickupEntity(pickup, state);
    for (const item of state.missionItems) {
      if (item.location !== state.location) continue;
      drawHeistLoot(ctx, art, item.type, item.x, item.y, item.type === "fenced_cargo_crate" ? 82 : 70);
    }
    if (state.location === "city") for (const car of state.cars) {
      const length = car.aircraft ? 225 : car.boat ? 145 : car.scenery ? 92 : car.cargo ? 158 : car.heistVan ? 132 : 116;
      if (car.boat) {
        ctx.strokeStyle = "rgba(185, 255, 249, 0.48)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(car.x, car.y + 12, length * 0.22, length * 0.46, car.angle, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
        ctx.beginPath();
        ctx.ellipse(car.x + (car.aircraft ? 20 : 8), car.y + (car.aircraft ? 26 : 13), car.aircraft ? length * 0.34 : length * 0.19, car.aircraft ? length * 0.22 : length * 0.34, car.angle, 0, Math.PI * 2);
        ctx.fill();
      }
      drawVehicle(ctx, art, car.frame, car.x, car.y, car.angle, length);
    }
    if (state.location === "city") for (const car of state.policeCars) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
      ctx.beginPath();
      ctx.ellipse(car.x + 8, car.y + 13, 24, 41, car.angle, 0, Math.PI * 2);
      ctx.fill();
      drawVehicle(ctx, art, "police_cruiser", car.x, car.y, car.angle, 120);
      const flash = Math.floor(state.time * 8) % 2 === 0;
      ctx.fillStyle = flash ? "rgba(255, 38, 80, 0.42)" : "rgba(64, 153, 255, 0.42)";
      ctx.beginPath();
      ctx.arc(car.x, car.y, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    const actors = state.enemies.filter((enemy) => enemy.location === state.location).map((enemy) => ({ kind: "enemy", entity: enemy }));
    if (state.location === "city") state.npcs.forEach((npc) => actors.push({ kind: "civilian", entity: npc }));
    state.specialNpcs.filter((npc) => npc.location === state.location).forEach((npc) => actors.push({ kind: npc.type, entity: npc }));
    state.allies.filter((ally) => ally.location === state.location).forEach((ally) => actors.push({ kind: "crew", entity: ally }));
    state.mobmons.filter((mobmon) => mobmon.location === state.location).forEach((mobmon) => actors.push({ kind: "mobmon", entity: mobmon }));
    if (state.location === "casino" && (!state.owner.surrendered || state.owner.fleeing > 0)) actors.push({ kind: "owner", entity: state.owner });
    if (state.player.inCar === null) actors.push({ kind: "player", entity: state.player });
    actors.sort((a, b) => a.entity.y - b.entity.y);
    for (const actor of actors) {
      const entity = actor.entity;
      const frame = Math.floor(state.animTime * 8 + (entity.animOffset || 0)) % 5;
      ctx.fillStyle = actor.kind === "mobmon" ? "rgba(0, 0, 0, 0.25)" : "rgba(0, 0, 0, 0.32)";
      ctx.beginPath();
      ctx.ellipse(entity.x + 4, entity.y + 7, actor.kind === "mobmon" ? 13 : 20, actor.kind === "mobmon" ? 7 : 10, 0, 0, Math.PI * 2);
      ctx.fill();
      if (actor.kind === "player") {
        if (entity.swimming && state.location === "city") {
          ctx.strokeStyle = "rgba(185, 255, 249, 0.78)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(entity.x, entity.y + 5, 34, 16, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        drawCharacter(ctx, art, state.profile.look, frame, entity.x, entity.y, entity.angle, entity.swimming ? 58 : 74);
      } else if (actor.kind === "civilian") {
        drawCharacter(ctx, art, "city_civilian", frame, entity.x, entity.y, entity.angle + (entity.knocked ? Math.PI / 2 : 0), entity.knocked ? 58 : 66);
      } else if (actor.kind === "owner") {
        drawCharacter(ctx, art, "shop_owner", frame, entity.x, entity.y, entity.angle, 69);
        if (!entity.surrendered && state.extortionStarted && !state.racketBossAlive) {
          ctx.fillStyle = "rgba(7, 18, 23, 0.86)";
          ctx.fillRect(entity.x - 26, entity.y - 69, 52, 6);
          ctx.fillStyle = "#ffbe53";
          ctx.fillRect(entity.x - 26, entity.y - 69, 52 * entity.nerve / 100, 6);
          ctx.fillStyle = "#ffbe53";
          ctx.font = "15px 'Bebas Neue', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("SHOP OWNER", entity.x, entity.y - 79);
        }
      } else if (["escort", "fence", "crew"].includes(actor.kind)) {
        const animation = actor.kind === "escort" ? "escort_worker" : actor.kind === "fence" ? "marina_fence" : "wall_crew";
        drawCharacter(ctx, art, animation, frame, entity.x, entity.y, entity.angle, actor.kind === "crew" ? 72 : 69);
        ctx.fillStyle = actor.kind === "escort" ? "#ff9fcb" : actor.kind === "fence" ? "#65e6dd" : "#ffe393";
        ctx.font = "14px 'Bebas Neue', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(actor.kind === "escort" ? "ESCORT WORKER" : actor.kind === "fence" ? "FENCE" : "WALL CREW", entity.x, entity.y - 77);
      } else if (actor.kind === "mobmon") {
        const animation = `${entity.type}_mobmon`;
        drawCharacter(ctx, art, animation, frame, entity.x, entity.y, entity.angle, 44);
        ctx.fillStyle = entity.type === "medic" ? "#9dfff0" : entity.type === "shooter" ? "#ff9fcb" : "#ffe393";
        ctx.font = "12px 'Bebas Neue', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("MOBMON", entity.x, entity.y - 48);
      } else {
        const animation = entity.type === "detective" ? "city_detective"
          : entity.type === "tactical" ? "tactical_unit"
            : entity.type === "cop" ? "city_cop"
          : entity.type === "lieutenant" ? "rival_lieutenant"
            : entity.type === "boss" ? "racket_boss" : "rival_enforcer";
        const actorHeight = entity.type === "boss" ? 86 : entity.type === "tactical" ? 80 : entity.type === "enforcer" ? 79 : 72;
        drawCharacter(ctx, art, animation, frame, entity.x, entity.y, entity.angle, actorHeight);
        ctx.fillStyle = "rgba(7, 18, 23, 0.86)";
        ctx.fillRect(entity.x - 25, entity.y - actorHeight + 3, 50, 6);
        ctx.fillStyle = ["cop", "detective", "tactical"].includes(entity.type) ? "#65e6dd" : "#ff5277";
        ctx.fillRect(entity.x - 25, entity.y - actorHeight + 3, 50 * Math.max(0, entity.hp) / entity.maxHp, 6);
        if (entity.windup > 0) {
          ctx.strokeStyle = "#ffbe53";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(entity.x, entity.y, 30 + entity.windup * 20, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (entity.type === "boss" || entity.type === "lieutenant") {
          ctx.fillStyle = entity.type === "boss" ? "#ffe393" : "#dca7ff";
          ctx.font = "16px 'Bebas Neue', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(entity.type === "boss" ? "RACKET BOSS" : "LIEUTENANT", entity.x, entity.y - actorHeight - 7);
        }
        if (entity.job === "contract") {
          ctx.fillStyle = "#ffbe53";
          ctx.font = "16px 'Bebas Neue', sans-serif";
          ctx.fillText(`TARGET · ${entity.contractName || "CONTRACT"}`, entity.x, entity.y - actorHeight - 24);
          ctx.strokeStyle = "#ff5277";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(entity.x, entity.y, 38, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    for (const effect of state.effects) {
      if (effect.location !== state.location) continue;
      const progress = effect.age / effect.duration;
      drawCombatEffect(ctx, art, effect.type, Math.min(3, Math.floor(progress * 4)), effect.x, effect.y, effect.angle, effect.size);
    }

    ctx.strokeStyle = "#ffe393";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (const bullet of state.bullets) {
      if (bullet.location !== state.location) continue;
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y);
      ctx.lineTo(bullet.x - bullet.vx * 0.018, bullet.y - bullet.vy * 0.018);
      ctx.stroke();
    }
    for (const particle of state.particles) {
      if (particle.location !== state.location) continue;
      ctx.globalAlpha = Math.min(1, particle.life * 2.5);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
    ctx.font = "700 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const text of state.texts) {
      if (text.location !== state.location) continue;
      ctx.globalAlpha = Math.min(1, text.life * 2);
      ctx.fillStyle = "rgba(6, 16, 21, 0.82)";
      const measured = ctx.measureText(text.text).width;
      roundedRect(ctx, text.x - measured / 2 - 8, text.y - 12, measured + 16, 24, 7);
      ctx.fill();
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, text.x, text.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawObjectiveArrow(simulation, scale) {
    const objective = simulation.currentObjective();
    if (!objective) return;
    const dx = (objective.x - cameraX) * scale;
    const dy = (objective.y - cameraY) * scale;
    if (Math.abs(dx) < width * 0.43 && Math.abs(dy) < height * 0.4) return;
    const angle = Math.atan2(dy, dx);
    const radiusX = width * 0.39;
    const radiusY = height * 0.34;
    const amount = Math.min(radiusX / Math.max(1, Math.abs(Math.cos(angle))), radiusY / Math.max(1, Math.abs(Math.sin(angle))));
    const x = width / 2 + Math.cos(angle) * amount;
    const y = height / 2 + Math.sin(angle) * amount;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "#ffbe53";
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-10, -9);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawAtmosphere(state) {
    const hour = state.environment.hour;
    const sun = Math.max(0, Math.sin((hour - 6) / 12 * Math.PI));
    const night = 1 - sun;
    ctx.fillStyle = `rgba(4, 15, 42, ${0.06 + night * 0.34})`;
    ctx.fillRect(0, 0, width, height);
    const dusk = Math.max(0, 1 - Math.abs(hour - 19) / 2.5);
    if (dusk > 0) {
      ctx.fillStyle = `rgba(112, 35, 72, ${dusk * 0.1})`;
      ctx.fillRect(0, 0, width, height);
    }

    const weather = state.environment.weather;
    if (weather === "fog") {
      const fog = ctx.createLinearGradient(0, 0, width, height);
      fog.addColorStop(0, "rgba(170, 203, 198, 0.2)");
      fog.addColorStop(0.5, "rgba(90, 130, 132, 0.1)");
      fog.addColorStop(1, "rgba(196, 216, 207, 0.24)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, width, height);
    }
    if (weather === "rain" || weather === "storm") {
      const amount = Math.round((weather === "storm" ? 85 : 54) * Number(tweaks.get("effectsIntensity")));
      ctx.strokeStyle = weather === "storm" ? "rgba(198, 235, 245, 0.58)" : "rgba(157, 216, 226, 0.42)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let index = 0; index < amount; index += 1) {
        const x = (index * 83 + state.time * 250) % (width + 100) - 50;
        const y = (index * 137 + state.time * 540) % (height + 80) - 40;
        ctx.moveTo(x, y);
        ctx.lineTo(x - 8, y + 22);
      }
      ctx.stroke();
      ctx.fillStyle = weather === "storm" ? "rgba(8, 28, 45, 0.16)" : "rgba(8, 44, 55, 0.08)";
      ctx.fillRect(0, 0, width, height);
      if (weather === "storm" && Math.sin(state.time * 2.7) > 0.985) {
        ctx.fillStyle = "rgba(220, 239, 255, 0.22)";
        ctx.fillRect(0, 0, width, height);
      }
    }
  }

  function render(simulation, dt = 0) {
    const state = simulation.state;
    const zoom = Number(tweaks.get("cameraZoom"));
    const activeVehicle = state.player.inCar !== null ? state.cars[state.player.inCar] : null;
    const travelSpeed = Math.abs(activeVehicle?.speed || 0);
    const viewWidth = (650 + Math.min(120, travelSpeed * 0.2)) / zoom;
    const room = state.location === "city" ? null : INTERIORS[state.location];
    const scale = room ? Math.max(width / viewWidth, height / (1250 / zoom)) : width / viewWidth;
    const viewHeight = height / scale;
    const mapW = room?.w || WORLD_SIZE;
    const mapH = room?.h || WORLD_SIZE;
    const actualViewWidth = width / scale;
    const halfW = Math.min(mapW / 2, actualViewWidth / 2);
    const halfH = Math.min(mapH / 2, viewHeight / 2);
    const lead = Math.min(125, travelSpeed * 0.24);
    const focusX = state.player.x + (activeVehicle ? Math.sin(activeVehicle.angle) * lead : 0);
    const focusY = state.player.y + (activeVehicle ? -Math.cos(activeVehicle.angle) * lead : -26);
    const targetX = Math.max(halfW, Math.min(mapW - halfW, focusX));
    const targetY = Math.max(halfH, Math.min(mapH - halfH, focusY));
    if (lastLocation !== state.location) {
      cameraX = targetX;
      cameraY = targetY;
      lastLocation = state.location;
    }
    const follow = Math.min(1, dt * 6);
    cameraX += (targetX - cameraX) * follow;
    cameraY += (targetY - cameraY) * follow;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#071217";
    ctx.fillRect(0, 0, width, height);
    const shakeX = state.shake ? (Math.random() - 0.5) * state.shake : 0;
    const shakeY = state.shake ? (Math.random() - 0.5) * state.shake : 0;
    ctx.save();
    ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
    ctx.scale(scale, scale);
    ctx.translate(-cameraX, -cameraY);
    if (room) drawInterior(room);
    else drawCity(state);
    drawObjective(simulation);
    drawEntities(simulation);
    if (!room) drawCityRoofOverlay();
    ctx.restore();
    drawObjectiveArrow(simulation, scale);
    drawAtmosphere(state);

    const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.2, width / 2, height / 2, Math.max(width, height) * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,8,12,0.44)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  return { resize, render };
}
