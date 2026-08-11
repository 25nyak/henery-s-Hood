export function createControls(root) {
  const joystick = root.querySelector(".joystick");
  const nub = root.querySelector(".joystick-nub");
  const buttons = [...root.querySelectorAll("[data-action]")];
  const keys = new Set();
  const actions = { shoot: false, attack: false, heavy: false, dash: false, act: false, car: false };
  const pressed = { attack: false, heavy: false, dash: false, act: false, car: false };
  let stickPointer = null;
  let stickX = 0;
  let stickY = 0;

  function setStick(clientX, clientY) {
    const rect = joystick.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const max = rect.width * 0.32;
    const length = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, max / length);
    const px = dx * scale;
    const py = dy * scale;
    stickX = px / max;
    stickY = py / max;
    nub.style.transform = `translate(${px}px, ${py}px)`;
  }

  function releaseStick(event) {
    if (event.pointerId !== stickPointer) return;
    stickPointer = null;
    stickX = 0;
    stickY = 0;
    nub.style.transform = "translate(0, 0)";
  }

  joystick.addEventListener("pointerdown", (event) => {
    stickPointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    setStick(event.clientX, event.clientY);
  });
  joystick.addEventListener("pointermove", (event) => {
    if (event.pointerId === stickPointer) setStick(event.clientX, event.clientY);
  });
  joystick.addEventListener("pointerup", releaseStick);
  joystick.addEventListener("pointercancel", releaseStick);

  for (const button of buttons) {
    const name = button.dataset.action;
    const down = (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      actions[name] = true;
      if (name !== "shoot") pressed[name] = true;
      button.classList.add("is-down");
    };
    const up = () => {
      actions[name] = false;
      button.classList.remove("is-down");
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
  }

  const onKeyDown = (event) => {
    if (keys.has(event.code)) return;
    keys.add(event.code);
    const pressMap = { KeyJ: "attack", KeyK: "heavy", KeyL: "dash", KeyF: "act", KeyE: "car" };
    if (pressMap[event.code]) pressed[pressMap[event.code]] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }
  };
  const onKeyUp = (event) => keys.delete(event.code);
  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp);

  return {
    movement() {
      let x = stickX + (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
        (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
      let y = stickY + (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
        (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
      const length = Math.hypot(x, y);
      if (length > 1) { x /= length; y /= length; }
      return { x, y };
    },
    firing: () => actions.shoot || keys.has("Space"),
    acting: () => actions.act || keys.has("KeyF"),
    takePress(name) {
      const value = Boolean(pressed[name]);
      pressed[name] = false;
      return value;
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
