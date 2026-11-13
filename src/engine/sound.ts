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

/** Bir power chord. `ring` saniye cinsinden ne kadar çınlayacağı. */
function chord(semi: number, ring: number, level: number) {
  if (!on || !ctx || !drive) return;
  const t = ctx.currentTime;
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
