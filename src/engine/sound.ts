/**
 * Ses: maskotun gitarı ve sahne efektleri. Hepsi Web Audio ile üretilir,
 * dosya yok. Tarayıcı ilk dokunuştan önce ses çalmaya izin vermez; bu yüzden
 * ses "Oynat"a basılınca açılır.
 */

export type Sfx = 'thump' | 'boom' | 'slap' | 'zap' | 'whoosh';

let ctx: AudioContext | null = null;
let drive: WaveShaperNode | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let on = false;

/** Mi2. Riff bu notanın üstüne yarım ses adımlarıyla kurulur. */
const E2 = 82.41;
const hz = (semi: number) => E2 * 2 ** (semi / 12);

function build() {
  if (ctx) return;
  ctx = new AudioContext();

  const squash = ctx.createDynamicsCompressor();
  squash.threshold.value = -16;
  squash.ratio.value = 8;
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(squash).connect(ctx.destination);

  // Gitar zinciri: bozucu, ardından kabin gibi tizleri kesen bir filtre.
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(((i / 1023) * 2 - 1) * 8);
  drive = ctx.createWaveShaper();
  drive.curve = curve;
  const cab = ctx.createBiquadFilter();
  cab.type = 'lowpass';
  cab.frequency.value = 2400;
  const amp = ctx.createGain();
  amp.gain.value = 0.2;
  drive.connect(cab).connect(amp).connect(master);

  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

export function isSoundOn(): boolean {
  return on;
}

export function setSound(next: boolean): void {
  on = next;
  if (!next) return;
  build();
  void ctx?.resume();
}

/** Bir power chord. `ring` saniye cinsinden ne kadar çınlayacağı. `at` verilmezse hemen çalar. */
function chord(semi: number, ring: number, level: number, at?: number) {
  if (!on || !ctx || !drive) return;
  const t = at ?? ctx.currentTime;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(level, t + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, t + ring);
  env.connect(drive);
  for (const ratio of [1, 1.498, 2.004]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = hz(semi) * ratio;
    osc.connect(env);
    osc.start(t);
    osc.stop(t + ring + 0.05);
  }
}

/** Riff notası: kısa, avuçla susturulmuş. */
export function chug(semi: number): void {
  chord(semi, 0.13, 0.42);
}

/** Tek tel: arpej notası. Power chord değil, tek ses ve biraz çınlar. */
export function note(semi: number): void {
  if (!on || !ctx || !drive) return;
  const t = ctx.currentTime;
  const ring = 0.38;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.32, t + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, t + ring);
  env.connect(drive);
  // Biraz akortsuz iki testere: tek tel ama ince ve cızırtılı değil.
  for (const detune of [-6, 6]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = hz(semi);
    osc.detune.value = detune;
    osc.connect(env);
    osc.start(t);
    osc.stop(t + ring + 0.05);
  }
}

/** Kullanıcının vurduğu nota: açık, uzun çınlar. Aynı tuş hep aynı notayı verir. */
export function pluck(key?: string): void {
  const SCALE = [0, 3, 5, 7, 10, 12, 15, 17];
  const code = key ? key.toLocaleLowerCase('tr').codePointAt(0) ?? 0 : Math.floor(Math.random() * 97);
  chord(SCALE[code % SCALE.length], 0.7, 0.6);
}

function burst(dur: number, level: number, type: BiquadFilterType, from: number, to: number) {
  if (!ctx || !master || !noise) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(level, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(env).connect(master);
  src.start(t);
  src.stop(t + dur + 0.02);
}

function drop(from: number, to: number, dur: number, level: number, type: OscillatorType = 'sine') {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(level, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(env).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Sahne efektleri: yere düşen amfi, yapıştırılan kağıt, kesme. */
export function sfx(name: Sfx): void {
  if (!on || !ctx) return;
  switch (name) {
    case 'thump':
      drop(150, 46, 0.16, 0.7);
      burst(0.05, 0.25, 'lowpass', 900, 200);
      break;
    case 'boom':
      drop(120, 30, 0.6, 0.95);
      burst(0.35, 0.5, 'lowpass', 2400, 120);
      break;
    case 'slap':
      burst(0.07, 0.5, 'highpass', 1800, 4200);
      break;
    case 'zap':
      drop(1900, 70, 0.4, 0.3, 'sawtooth');
      break;
    case 'whoosh':
      burst(0.3, 0.3, 'bandpass', 300, 3600);
      break;
  }
}

/* --- Techno: zamanı önceden planlanan sesler --------------------------------
 * Bu sesler `ctx.currentTime` yerine verilen `t` anında çalar; techno.ts onları
 * biraz ileriden planlar ki kare hızına bağlı kalmasın, vuruşlar kaymasın.
 * Gitar zincirindeki bozucuya girmezler, doğrudan ana çıkışa giderler.
 */

let echo: GainNode | null = null;

/** Lead için dub tarzı yankı: 3/16'lık gecikme, kendini besler, her turda kararır. */
function buildEcho(sixteenth: number) {
  if (echo || !ctx || !master) return;
  const delay = ctx.createDelay(1);
  delay.delayTime.value = sixteenth * 3;
  const fb = ctx.createGain();
  fb.gain.value = 0.38;
  const dark = ctx.createBiquadFilter();
  dark.type = 'lowpass';
  dark.frequency.value = 1800;
  const wet = ctx.createGain();
  wet.gain.value = 0.32;
  echo = ctx.createGain();
  echo.connect(delay).connect(dark).connect(fb).connect(delay);
  dark.connect(wet).connect(master);
}

/** Ses kartının saati. Ses kapalıysa null: techno o zaman sadece görüntüyü sürer. */
export function audioClock(): number | null {
  return on && ctx ? ctx.currentTime : null;
}

function env(t: number, peak: number, attack: number, decay: number): GainNode {
  const g = ctx!.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}

function noiseAt(t: number, dur: number, type: BiquadFilterType, freq: number, q: number, out: AudioNode) {
  const src = ctx!.createBufferSource();
  src.buffer = noise;
  const f = ctx!.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  src.connect(f).connect(out);
  src.start(t);
  src.stop(t + dur + 0.02);
}

export const techno = {
  init(sixteenth: number) {
    buildEcho(sixteenth);
  },

  /** Dörtlük kick: düşen sinüs ve kısa bir tık. */
  kick(t: number) {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    const g = env(t, 0.95, 0.002, 0.34);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.4);
    const click = env(t, 0.18, 0.001, 0.012);
    click.connect(master);
    noiseAt(t, 0.01, 'highpass', 3000, 0.7, click);
  },

  /** Hi-hat. Açık olan daha uzun ve daha yüksek. */
  hat(t: number, open = false) {
    if (!ctx || !master || !noise) return;
    const g = env(t, open ? 0.11 : 0.06, 0.001, open ? 0.16 : 0.035);
    g.connect(master);
    noiseAt(t, open ? 0.18 : 0.05, 'highpass', 7500, 0.8, g);
  },

  /** Clap: arka arkaya üç kısa gürültü, sonra kuyruk. */
  clap(t: number) {
    if (!ctx || !master || !noise) return;
    for (const [dt, peak, decay] of [
      [0, 0.32, 0.01],
      [0.011, 0.28, 0.01],
      [0.022, 0.3, 0.16],
    ]) {
      const g = env(t + dt, peak, 0.001, decay);
      g.connect(master);
      noiseAt(t + dt, decay + 0.02, 'bandpass', 1400, 0.9, g);
    }
  },

  /** Bas: testere, filtresi her notada açılıp kapanır. */
  bass(semi: number, t: number, len: number) {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = hz(semi);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 7;
    f.frequency.setValueAtTime(140, t);
    f.frequency.exponentialRampToValueAtTime(780, t + 0.02);
    f.frequency.exponentialRampToValueAtTime(140, t + len);
    const g = env(t, 0.36, 0.004, len);
    osc.connect(f).connect(g).connect(master);
    osc.start(t);
    osc.stop(t + len + 0.05);
  },

  /** Lead: kare ve testere, yankıya da gönderilir. */
  lead(semi: number, t: number, level = 0.17) {
    if (!ctx || !master) return;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 4;
    f.frequency.setValueAtTime(3200, t);
    f.frequency.exponentialRampToValueAtTime(700, t + 0.22);
    const g = env(t, level, 0.003, 0.24);
    f.connect(g);
    g.connect(master);
    if (echo) g.connect(echo);
    for (const [type, detune] of [
      ['square', 0],
      ['sawtooth', 7],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = hz(semi);
      osc.detune.value = detune;
      osc.connect(f);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  },

  /** Metal gitar: zamanı planlanmış power chord. Bozucudan geçer. */
  power(semi: number, t: number, ring: number) {
    chord(semi, ring, 0.5, t);
  },

  /** Avuçla susturulmuş chug: kısa, boğuk. */
  mute(semi: number, t: number) {
    chord(semi, 0.09, 0.36, t);
  },

  /** Trampet: kısa bir ton ve gürültü. */
  snare(t: number) {
    if (!ctx || !master || !noise) return;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    const body = env(t, 0.32, 0.001, 0.1);
    osc.connect(body).connect(master);
    osc.start(t);
    osc.stop(t + 0.15);
    const g = env(t, 0.42, 0.001, 0.17);
    g.connect(master);
    noiseAt(t, 0.2, 'highpass', 1600, 0.6, g);
  },

  /** Zil: uzun, parlak gürültü. Döngünün başını işaretler. */
  crash(t: number) {
    if (!ctx || !master || !noise) return;
    const g = env(t, 0.16, 0.002, 0.9);
    g.connect(master);
    noiseAt(t, 0.95, 'highpass', 5200, 0.5, g);
  },

  /** Pad: yavaş açılan, karanlık bir akor. */
  pad(semis: number[], t: number, len: number) {
    if (!ctx || !master) return;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 850;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + len * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    f.connect(g).connect(master);
    for (const semi of semis) {
      for (const detune of [-9, 9]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = hz(semi);
        osc.detune.value = detune;
        osc.connect(f);
        osc.start(t);
        osc.stop(t + len + 0.05);
      }
    }
  },
};
