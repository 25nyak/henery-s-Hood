export function createHud(root) {
  const cash = root.querySelector("[data-hud='cash']");
  const healthFill = root.querySelector("[data-hud='health']");
  const armor = root.querySelector("[data-hud='armor']");
  const ammo = root.querySelector("[data-hud='ammo']");
  const heat = root.querySelector("[data-hud='heat']");
  const mission = root.querySelector("[data-hud='mission']");
  const combo = root.querySelector("[data-hud='combo']");
  const carButton = root.querySelector("[data-action='car']");
  const level = root.querySelector("[data-hud='level']");
  const xp = root.querySelector("[data-hud='xp']");
  const sideMission = root.querySelector("[data-hud='side-mission']");
  const recovery = root.querySelector("[data-recovery]");
  const tutorial = root.querySelector("[data-tutorial]");
  const weather = root.querySelector("[data-hud='weather']");

  return {
    update(simulation) {
      const state = simulation.state;
      cash.textContent = `$${state.cash.toLocaleString()}`;
      healthFill.style.width = `${state.player.hp / state.player.maxHp * 100}%`;
      armor.textContent = state.player.armor > 0 ? `◆ ${Math.ceil(state.player.armor)}` : "";
      const melee = state.player.meleeWeapon === "bat" ? "BAT · " : "";
      ammo.textContent = state.player.ammo > 0
        ? `${melee}${state.player.weapon.toUpperCase()} ${state.player.ammo}`
        : `${melee}${state.player.weapon.toUpperCase()} EMPTY`;
      const stars = Math.max(0, Math.min(5, Math.ceil(state.heat - 0.15)));
      heat.innerHTML = [0, 1, 2, 3, 4].map((index) => `<i class="heat-pip ${index < stars ? "is-hot" : ""}"></i>`).join("");
      mission.textContent = simulation.missionText();
      combo.textContent = state.player.combo > 1 ? `${state.player.combo} HIT COMBO` : "";
      combo.classList.toggle("is-live", state.player.combo > 1);
      carButton.textContent = state.player.inCar === null ? "CAR" : "EXIT";
      level.textContent = `LV ${state.level}`;
      xp.style.width = `${Math.min(100, state.xp / state.nextXp * 100)}%`;
      const sideText = simulation.sideMissionText();
      sideMission.textContent = sideText;
      sideMission.hidden = !sideText;
      recovery.hidden = state.recovery.timer <= 0;
      recovery.querySelector("strong").textContent = state.recovery.message;
      recovery.querySelector("span").textContent = state.recovery.detail;
      const tutorialCopy = simulation.tutorialText();
      tutorial.hidden = !tutorialCopy;
      tutorial.querySelector("span").textContent = tutorialCopy;
      const hour = Math.floor(state.environment.hour);
      const minute = Math.floor((state.environment.hour - hour) * 60);
      weather.textContent = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} · ${state.environment.weather.toUpperCase()}`;
    },
  };
}
