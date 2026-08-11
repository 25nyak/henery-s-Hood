export function createSound(audio) {
  const stations = [
    { name: "VICE FM · NIGHT DRIVE", notes: [73.42, 110, 146.83, 98], interval: 0.24, type: "sawtooth" },
    { name: "WALL ST 88 · CITY FUNK", notes: [82.41, 82.41, 123.47, 110], interval: 0.18, type: "square" },
    { name: "VELVET AM · AFTER HOURS", notes: [110, 138.59, 164.81, 123.47], interval: 0.34, type: "triangle" },
  ];
  let pulseTimer = 0;
  let musicStep = 0;
  let running = false;
  let driving = false;
  let stationIndex = 0;

  function blip(frequency, duration = 0.08, volume = 0.08, type = "square") {
    const context = audio.context;
    if (context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  function noise(duration = 0.08, volume = 0.12) {
    const context = audio.context;
    if (context.state !== "running") return;
    const length = Math.ceil(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) channel[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain).connect(context.destination);
    source.start();
  }

  return {
    startMusic() { running = true; },
    update(dt, heat = 0) {
      if (!running) return;
      pulseTimer -= dt;
      if (pulseTimer <= 0) {
        const station = stations[stationIndex];
        pulseTimer = driving ? station.interval : heat >= 2 ? 0.26 : 0.42;
        const notes = driving ? station.notes : [73.42, 73.42, 87.31, 65.41];
        blip(notes[musicStep % notes.length], driving ? 0.19 : 0.14, driving ? 0.038 : 0.022, driving ? station.type : "sawtooth");
        if (driving && musicStep % 4 === 2) blip(notes[(musicStep + 2) % notes.length] * 2, 0.11, 0.018, "triangle");
        musicStep += 1;
      }
    },
    setDriving(value) { driving = value; },
    cycleRadio() {
      stationIndex = (stationIndex + 1) % stations.length;
      pulseTimer = 0;
      blip(740, 0.05, 0.05, "square");
      return stations[stationIndex].name;
    },
    stationName() { return stations[stationIndex].name; },
    gun() { noise(0.07, 0.13); blip(120, 0.06, 0.07, "square"); },
    hit() { noise(0.045, 0.07); },
    melee(combo = 1) { noise(0.05, 0.08); blip(170 + combo * 35, 0.055, 0.055, "sawtooth"); },
    heavy() { noise(0.18, 0.14); blip(72, 0.2, 0.12, "sawtooth"); },
    dash() { noise(0.08, 0.045); blip(340, 0.08, 0.04, "triangle"); },
    cash() { blip(660, 0.06, 0.1); setTimeout(() => blip(990, 0.09, 0.08), 55); },
    crash() { noise(0.24, 0.16); blip(62, 0.18, 0.12, "sawtooth"); },
    alarm() { blip(420, 0.12, 0.07); setTimeout(() => blip(315, 0.16, 0.06), 120); },
    stop() { running = false; },
  };
}
