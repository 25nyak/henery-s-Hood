import { loadArt } from "./art.js";
import { createSound } from "./audio.js";
import { createControls } from "./controls.js";
import { createHud } from "./hud.js";
import { createRenderer } from "./renderer.js";
import { createSimulation } from "./simulation.js";

function gameMarkup() {
  return `
    <section class="game-shell">
      <canvas class="game-surface" hidden aria-label="Henry's Hood city"></canvas>

      <div class="hud-layer" aria-live="polite">
        <div class="hud-top hud-row">
          <div class="cash-badge badge"><span class="hud-kicker">BANK</span><strong data-hud="cash">$0</strong></div>
          <div class="vitals badge">
            <span class="health-track"><i data-hud="health"></i></span>
            <span class="armor" data-hud="armor"></span>
            <span class="weather" data-hud="weather">17:30 · RAIN</span>
          </div>
          <div class="heat badge" data-hud="heat" aria-label="Police heat"></div>
        </div>
        <div class="mission-ribbon" data-hud="mission">EXTORTION · HOLD ACT AT CASINO CAGE</div>
        <div class="side-ribbon" data-hud="side-mission" hidden></div>
        <div class="ammo-badge badge" data-hud="ammo">FISTS</div>
        <button class="weapon-wheel-button" type="button" data-weapon-wheel>WEAPONS</button>
        <div class="combo-badge" data-hud="combo"></div>
        <div class="level-badge"><b data-hud="level">LV 1</b><span><i data-hud="xp"></i></span></div>
        <button class="style-button" type="button" data-style>STYLE</button>
        <button class="radio-strip" type="button" data-radio hidden><span>RADIO</span><b data-radio-name>VICE FM · NIGHT DRIVE</b><i>›</i></button>
      </div>

      <div class="recovery-banner" data-recovery hidden><strong></strong><span></span></div>
      <div class="tutorial-banner" data-tutorial hidden><span></span><button type="button" data-tutorial-skip>SKIP</button></div>

      <div class="quick-buy" aria-label="Quick buy buffs">
        <button type="button" data-quick="power"><b>PWR</b><span></span></button>
        <button type="button" data-quick="ballistics"><b>GUN</b><span></span></button>
        <button type="button" data-quick="armor"><b>HP</b><span></span></button>
      </div>

      <div class="home-overlay" hidden>
        <section class="home-panel">
          <div class="home-title">HENRY'S HOOD</div>
          <small>CHOOSE YOUR MOBSTER</small>
          <div class="home-look-grid">
            <button type="button" data-home-look="ledger_runner">HENRY</button>
            <button type="button" data-home-look="velvet_viper">VIPER</button>
            <button type="button" data-home-look="dock_baron">BARON</button>
            <button type="button" data-home-look="neon_widow">WIDOW</button>
            <button type="button" data-home-look="old_fox">FOX</button>
          </div>
          <small>SELECT 3 MINI GANGSTER MOBMONS</small>
          <div class="home-mobmon-grid">
            <button type="button" data-home-mobmon="bruiser">BRUISER</button>
            <button type="button" data-home-mobmon="shooter">SHOOTER</button>
            <button type="button" data-home-mobmon="medic">MEDIC</button>
            <button type="button" data-home-mobmon="scout">SCOUT</button>
          </div>
          <label>CODENAME<input data-home-codename maxlength="16" value="Rook" autocomplete="off"></label>
          <button class="home-play" type="button" data-home-play>PLAY THE HOOD</button>
        </section>
      </div>

      <div class="weapon-wheel" hidden>
        <button type="button" data-weapon="pistol">PISTOL<i></i></button>
        <button type="button" data-weapon="shotgun">SHOTGUN<i></i></button>
        <button type="button" data-weapon="carbine">CARBINE<i></i></button>
        <button type="button" data-weapon="revolver">REVOLVER<i></i></button>
        <button class="wheel-close" type="button" data-wheel-close>×</button>
      </div>

      <div class="touch-layer">
        <div class="joystick" aria-label="Move">
          <i class="joystick-ring"></i><i class="joystick-nub"></i>
        </div>
        <div class="action-cluster">
          <button class="action-btn attack-btn" data-action="attack" type="button">HIT</button>
          <button class="action-btn heavy-btn" data-action="heavy" type="button">HEAVY</button>
          <button class="action-btn dash-btn" data-action="dash" type="button">DASH</button>
          <button class="action-btn shoot-btn" data-action="shoot" type="button">SHOOT</button>
          <button class="action-btn act-btn" data-action="act" type="button">ACT</button>
          <button class="action-btn car-btn" data-action="car" type="button">CAR</button>
        </div>
      </div>

      <div class="phone-overlay" hidden>
        <section class="phone-panel" aria-live="polite">
          <div class="phone-topline"><span>BOILER ROOM CALL</span><b data-phone="progress">1 / 3</b></div>
          <strong data-phone="target">D. MERCER · MOONPRAWN</strong>
          <p data-phone="signal">Cautious. Wants certainty.</p>
          <div class="phone-choices">
            <button type="button" data-pitch="0"></button>
            <button type="button" data-pitch="1"></button>
            <button type="button" data-pitch="2"></button>
          </div>
          <small data-phone="feedback">READ THE SIGNAL. PICK THE PITCH.</small>
        </section>
      </div>

      <div class="shop-overlay" hidden>
        <section class="shop-panel" aria-live="polite">
          <div class="shop-heading"><span>PAWN + BUFFS</span><b data-shop-cash>$0</b></div>
          <div class="upgrade-grid">
            <button type="button" data-upgrade="power"><strong>POWER</strong><span>MELEE +15%</span><i></i></button>
            <button type="button" data-upgrade="ballistics"><strong>BALLISTICS</strong><span>GUN DAMAGE +15%</span><i></i></button>
            <button type="button" data-upgrade="armor"><strong>ARMOR</strong><span>MAX HP +20</span><i></i></button>
            <button type="button" data-upgrade="mobility"><strong>MOBILITY</strong><span>DASH COOLDOWN −12%</span><i></i></button>
            <button type="button" data-upgrade="engine"><strong>ENGINE</strong><span>VEHICLE SPEED +8%</span><i></i></button>
          </div>
          <small data-shop-feedback>BUY PERMANENT RUN BUFFS · MAX LEVEL 3</small>
          <button class="shop-close" type="button" data-shop-close>BACK TO CITY</button>
        </section>
      </div>

      <div class="profile-overlay" hidden>
        <section class="profile-panel">
          <div class="profile-heading">BUILD YOUR MOBSTER</div>
          <div class="look-grid">
            <button type="button" data-look="ledger_runner">THE LEDGER</button>
            <button type="button" data-look="velvet_viper">VELVET VIPER</button>
            <button type="button" data-look="dock_baron">DOCK BARON</button>
            <button type="button" data-look="neon_widow">NEON WIDOW</button>
            <button type="button" data-look="old_fox">OLD FOX</button>
          </div>
          <label>CODENAME<input data-codename maxlength="16" value="Rook" autocomplete="off"></label>
          <button class="profile-save" type="button" data-profile-save>USE THIS MOBSTER</button>
        </section>
      </div>

      <div class="property-overlay" hidden>
        <section class="property-panel">
          <span>HENRY'S HOOD REALTY</span>
          <strong data-property-name>PROPERTY</strong>
          <p data-property-detail></p>
          <b data-property-cash>$0</b>
          <small data-property-feedback>BUY SAFEHOUSES AND COMMERCIAL FRONTS</small>
          <button type="button" data-property-buy>BUY PROPERTY</button>
          <button type="button" data-property-close>BACK TO CITY</button>
        </section>
      </div>

      <button class="start-overlay" type="button">
        <span class="start-title">HENRY'S HOOD</span>
        <span class="start-status">LOADING CITY…</span>
      </button>

      <div class="end-overlay" hidden>
        <div class="end-copy">
          <strong data-end="title">THE CITY COLLECTED</strong>
          <span data-end="detail">$0 banked</span>
          <button type="button" data-retry>RUN IT BACK</button>
        </div>
      </div>
    </section>
  `;
}

export function createGame({ mount, sdk, tweaks, assets }) {
  let cleanup = () => {};

  return {
    start() {
      mount.innerHTML = gameMarkup();
      const shell = mount.querySelector(".game-shell");
      const canvas = shell.querySelector("canvas");
      const startOverlay = shell.querySelector(".start-overlay");
      const startStatus = shell.querySelector(".start-status");
      const endOverlay = shell.querySelector(".end-overlay");
      const endTitle = shell.querySelector("[data-end='title']");
      const endDetail = shell.querySelector("[data-end='detail']");
      const retry = shell.querySelector("[data-retry]");
      const phoneOverlay = shell.querySelector(".phone-overlay");
      const phoneTarget = shell.querySelector("[data-phone='target']");
      const phoneSignal = shell.querySelector("[data-phone='signal']");
      const phoneProgress = shell.querySelector("[data-phone='progress']");
      const phoneFeedback = shell.querySelector("[data-phone='feedback']");
      const pitchButtons = [...shell.querySelectorAll("[data-pitch]")];
      const radioButton = shell.querySelector("[data-radio]");
      const radioName = shell.querySelector("[data-radio-name]");
      const shopOverlay = shell.querySelector(".shop-overlay");
      const shopCash = shell.querySelector("[data-shop-cash]");
      const shopFeedback = shell.querySelector("[data-shop-feedback]");
      const upgradeButtons = [...shell.querySelectorAll("[data-upgrade]")];
      const shopClose = shell.querySelector("[data-shop-close]");
      const styleButton = shell.querySelector("[data-style]");
      const profileOverlay = shell.querySelector(".profile-overlay");
      const lookButtons = [...shell.querySelectorAll("[data-look]")];
      const codenameInput = shell.querySelector("[data-codename]");
      const profileSave = shell.querySelector("[data-profile-save]");
      const quickButtons = [...shell.querySelectorAll("[data-quick]")];
      const propertyOverlay = shell.querySelector(".property-overlay");
      const propertyName = shell.querySelector("[data-property-name]");
      const propertyDetail = shell.querySelector("[data-property-detail]");
      const propertyCash = shell.querySelector("[data-property-cash]");
      const propertyFeedback = shell.querySelector("[data-property-feedback]");
      const propertyBuy = shell.querySelector("[data-property-buy]");
      const propertyClose = shell.querySelector("[data-property-close]");
      const homeOverlay = shell.querySelector(".home-overlay");
      const homeLookButtons = [...shell.querySelectorAll("[data-home-look]")];
      const homeMobmonButtons = [...shell.querySelectorAll("[data-home-mobmon]")];
      const homeCodename = shell.querySelector("[data-home-codename]");
      const homePlay = shell.querySelector("[data-home-play]");
      const weaponWheelButton = shell.querySelector("[data-weapon-wheel]");
      const weaponWheel = shell.querySelector(".weapon-wheel");
      const weaponButtons = [...shell.querySelectorAll("[data-weapon]")];
      const wheelClose = shell.querySelector("[data-wheel-close]");
      const tutorialSkip = shell.querySelector("[data-tutorial-skip]");
      const controls = createControls(shell);
      const hud = createHud(shell);
      let renderer = null;
      let simulation = null;
      let sound = null;
      let audio = null;
      let raf = 0;
      let previous = performance.now();
      let destroyed = false;
      let started = false;
      let selectedLook = "ledger_runner";
      let selectedProperty = null;
      let homeLook = "ledger_runner";
      let homeMobmons = ["bruiser", "shooter", "medic"];

      const onPhoneCall = (call, round = 0, correct = 0, previousCorrect) => {
        if (!call) {
          phoneOverlay.hidden = true;
          return;
        }
        phoneOverlay.hidden = false;
        phoneTarget.textContent = call.target;
        phoneSignal.textContent = call.signal;
        phoneProgress.textContent = `${round + 1} / 3 · ${correct} CLOSED`;
        phoneFeedback.textContent = previousCorrect === undefined
          ? "READ THE SIGNAL. PICK THE PITCH."
          : previousCorrect ? "WIRE COMMITTED." : "THEY HUNG UP. HEAT RISING.";
        pitchButtons.forEach((button, index) => { button.textContent = call.choices[index]; });
      };

      const onShop = (upgrades, cash = 0, feedback = null) => {
        if (!upgrades) {
          shopOverlay.hidden = true;
          return;
        }
        shopOverlay.hidden = false;
        shopCash.textContent = `$${cash.toLocaleString()}`;
        shopFeedback.textContent = feedback || "BUY PERMANENT RUN BUFFS · MAX LEVEL 3";
        upgradeButtons.forEach((button) => {
          const level = upgrades[button.dataset.upgrade];
          const price = level >= 3 ? "MAX" : `$${[1200, 2500, 4200][level].toLocaleString()}`;
          button.querySelector("i").textContent = `LV ${level} · ${price}`;
          button.disabled = level >= 3;
        });
      };

      const onProperty = (property, cash = 0, feedback = null) => {
        if (!property) {
          propertyOverlay.hidden = true;
          selectedProperty = null;
          return;
        }
        selectedProperty = property;
        propertyOverlay.hidden = false;
        propertyName.textContent = property.name;
        propertyDetail.textContent = property.safehouse
          ? `Safehouse · heal and cut heat · $${property.cost.toLocaleString()}`
          : `Commercial front · $${property.income}/10s · Wolf St deals · $${property.cost.toLocaleString()}`;
        propertyCash.textContent = `BANK $${cash.toLocaleString()}`;
        propertyFeedback.textContent = feedback || "BUY SAFEHOUSES AND COMMERCIAL FRONTS";
        propertyBuy.hidden = feedback === "DEED SIGNED · PROPERTY OWNED";
      };

      const onRunEnd = (score, bestCash) => {
        endTitle.textContent = simulation.state.endTitle;
        endDetail.textContent = simulation.state.endDetail;
        endOverlay.hidden = false;
        sound.stop();
        void sdk.gameState.save({ version: 1, bestCash, profile: simulation.state.profile }).catch(() => {});
        const safeScore = Math.max(0, Math.min(score, Number.MAX_SAFE_INTEGER));
        void sdk.leaderboard.submit(safeScore).catch(() => {});
      };

      const onProfile = (profile) => {
        void sdk.gameState.save({ version: 1, bestCash: simulation.state.bestCash, profile }).catch(() => {});
      };

      const newRun = (bestCash, profile) => {
        simulation = createSimulation({ controls, tweaks, sound, sdk, bestCash, savedProfile: profile, onEnd: onRunEnd, onPhoneCall, onShop, onProfile, onProperty });
        hud.update(simulation);
        return simulation;
      };

      const loop = (now) => {
        if (destroyed) return;
        const dt = Math.min(0.05, (now - previous) / 1000);
        previous = now;
        if (started) simulation.update(dt);
        const driving = simulation.state.player.inCar !== null;
        sound.setDriving(driving);
        radioButton.hidden = !driving;
        quickButtons.forEach((button) => {
          const key = button.dataset.quick;
          const level = simulation.state.upgrades[key];
          const cost = level >= 3 ? null : [1200, 2500, 4200][level];
          button.hidden = level >= 3;
          button.disabled = cost === null || simulation.state.cash < cost;
          button.querySelector("span").textContent = cost === null ? "MAX" : `$${cost}`;
        });
        weaponButtons.forEach((button) => {
          const weapon = button.dataset.weapon;
          const owned = simulation.state.player.weaponsOwned[weapon];
          button.disabled = !owned;
          button.classList.toggle("is-selected", simulation.state.player.weapon === weapon);
          button.querySelector("i").textContent = owned ? `${simulation.state.player.ammoByWeapon[weapon] || 0}` : "LOCKED";
        });
        hud.update(simulation);
        renderer.render(simulation, dt);
        raf = requestAnimationFrame(loop);
      };

      const resizeObserver = new ResizeObserver(() => renderer?.resize());
      resizeObserver.observe(shell);

      const activate = () => {
        if (!renderer || started || startOverlay.dataset.ready !== "true") return;
        started = true;
        startOverlay.hidden = true;
        homeLook = simulation.state.profile.look;
        homeMobmons = [...simulation.state.profile.mobmons];
        homeCodename.value = simulation.state.profile.codename;
        homeLookButtons.forEach((button) => button.classList.toggle("is-selected", button.dataset.homeLook === homeLook));
        homeMobmonButtons.forEach((button) => button.classList.toggle("is-selected", homeMobmons.includes(button.dataset.homeMobmon)));
        homeOverlay.hidden = false;
        sound.startMusic();
        void audio.unlock().catch(() => {});
      };
      startOverlay.addEventListener("click", activate);

      retry.addEventListener("click", () => {
        const bestCash = simulation.state.bestCash;
        const profile = simulation.state.profile;
        endOverlay.hidden = true;
        newRun(bestCash, profile);
        homeLook = profile.look;
        homeMobmons = [...profile.mobmons];
        homeCodename.value = profile.codename;
        homeLookButtons.forEach((button) => button.classList.toggle("is-selected", button.dataset.homeLook === homeLook));
        homeMobmonButtons.forEach((button) => button.classList.toggle("is-selected", homeMobmons.includes(button.dataset.homeMobmon)));
        homeOverlay.hidden = false;
        sound.startMusic();
      });

      pitchButtons.forEach((button) => {
        button.addEventListener("click", () => simulation?.answerCall(Number(button.dataset.pitch)));
      });
      radioButton.addEventListener("click", () => {
        radioName.textContent = sound.cycleRadio();
      });
      upgradeButtons.forEach((button) => {
        button.addEventListener("click", () => simulation?.buyUpgrade(button.dataset.upgrade));
      });
      shopClose.addEventListener("click", () => simulation?.closeShop());
      quickButtons.forEach((button) => {
        button.addEventListener("click", () => simulation?.buyUpgrade(button.dataset.quick, true));
      });
      styleButton.addEventListener("click", () => {
        selectedLook = simulation.state.profile.look;
        codenameInput.value = simulation.state.profile.codename;
        lookButtons.forEach((button) => button.classList.toggle("is-selected", button.dataset.look === selectedLook));
        profileOverlay.hidden = false;
        simulation.openProfile();
      });
      lookButtons.forEach((button) => {
        button.addEventListener("click", () => {
          selectedLook = button.dataset.look;
          lookButtons.forEach((entry) => entry.classList.toggle("is-selected", entry === button));
        });
      });
      profileSave.addEventListener("click", () => {
        simulation.setProfile({ look: selectedLook, codename: codenameInput.value });
        simulation.closeProfile();
        profileOverlay.hidden = true;
      });
      propertyBuy.addEventListener("click", () => {
        if (selectedProperty) simulation.buyProperty(selectedProperty.id);
      });
      propertyClose.addEventListener("click", () => simulation?.closeProperty());
      homeLookButtons.forEach((button) => {
        button.addEventListener("click", () => {
          homeLook = button.dataset.homeLook;
          homeLookButtons.forEach((entry) => entry.classList.toggle("is-selected", entry === button));
        });
      });
      homeMobmonButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const type = button.dataset.homeMobmon;
          if (homeMobmons.includes(type)) {
            if (homeMobmons.length > 1) homeMobmons = homeMobmons.filter((entry) => entry !== type);
          } else if (homeMobmons.length < 3) {
            homeMobmons.push(type);
          } else {
            homeMobmons.shift();
            homeMobmons.push(type);
          }
          homeMobmonButtons.forEach((entry) => entry.classList.toggle("is-selected", homeMobmons.includes(entry.dataset.homeMobmon)));
          homePlay.disabled = homeMobmons.length !== 3;
        });
      });
      homePlay.addEventListener("click", () => {
        if (homeMobmons.length !== 3) return;
        simulation.setProfile({ look: homeLook, codename: homeCodename.value, mobmons: homeMobmons });
        homeOverlay.hidden = true;
        simulation.start();
      });
      weaponWheelButton.addEventListener("click", () => {
        weaponWheel.hidden = false;
        simulation.setWeaponWheel(true);
      });
      weaponButtons.forEach((button) => {
        button.addEventListener("click", () => {
          if (simulation.selectWeapon(button.dataset.weapon)) {
            weaponWheel.hidden = true;
            simulation.setWeaponWheel(false);
          }
        });
      });
      wheelClose.addEventListener("click", () => {
        weaponWheel.hidden = true;
        simulation.setWeaponWheel(false);
      });
      tutorialSkip.addEventListener("click", () => simulation?.skipTutorial());

      Promise.all([
        loadArt(assets),
        sdk.audio.getContext(),
        sdk.gameState.load().catch(() => null),
      ]).then(([art, audioHandle, saved]) => {
        if (destroyed) return;
        audio = audioHandle;
        sound = createSound(audio);
        renderer = createRenderer(canvas, art, tweaks);
        const savedBest = saved?.version === 1 && Number.isFinite(saved.bestCash) ? Math.max(0, saved.bestCash) : 0;
        const savedProfile = saved?.version === 1 && saved.profile ? saved.profile : undefined;
        newRun(savedBest, savedProfile);
        canvas.hidden = false;
        renderer.resize();
        renderer.render(simulation, 0);
        startOverlay.dataset.ready = "true";
        startStatus.textContent = "TAP TO TAKE THE CITY";
        previous = performance.now();
        raf = requestAnimationFrame(loop);
      }).catch(() => {
        startStatus.textContent = "CITY FAILED TO LOAD · RELOAD";
        startOverlay.classList.add("has-error");
      });

      cleanup = () => {
        destroyed = true;
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        controls.destroy();
        sound?.stop();
        void audio?.dispose();
        mount.replaceChildren();
      };
    },
    destroy() {
      cleanup();
      cleanup = () => {};
    },
  };
}
