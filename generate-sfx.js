const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'public', 'shared', 'sfx');
fs.mkdirSync(outDir, { recursive: true });

function writeWav(filename, samples, sampleRate = 44100) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  fs.writeFileSync(path.join(outDir, filename), buffer);
  console.log('Generated:', path.join(outDir, filename));
}

const sr = 44100;

// 1. bass-hit.wav (0.6s impact punch)
const bassLen = Math.floor(sr * 0.6);
const bass = new Float32Array(bassLen);
let phase = 0;
for (let i = 0; i < bassLen; i++) {
  const t = i / sr;
  const freq = 38 + 90 * Math.exp(-t * 14);
  phase += (2 * Math.PI * freq) / sr;
  const env = Math.min(1, t / 0.005) * Math.exp(-t * 6.5);
  bass[i] = Math.sin(phase) * env * 0.9;
}
writeWav('bass-hit.wav', bass, sr);

// 2. whoosh.wav (0.35s smooth transition sweep)
const whooshLen = Math.floor(sr * 0.35);
const whoosh = new Float32Array(whooshLen);
let last = 0;
for (let i = 0; i < whooshLen; i++) {
  const t = i / whooshLen;
  const env = Math.sin(Math.PI * t) ** 1.6;
  const noise = Math.random() * 2 - 1;
  const alpha = 0.08 + 0.35 * env;
  last = last + alpha * (noise - last);
  whoosh[i] = last * env * 0.85;
}
writeWav('whoosh.wav', whoosh, sr);

// 3. tick.wav (0.06s sharp telemetry click)
const tickLen = Math.floor(sr * 0.06);
const tick = new Float32Array(tickLen);
for (let i = 0; i < tickLen; i++) {
  const t = i / sr;
  const env = Math.exp(-t * 85);
  tick[i] = (Math.sin(2 * Math.PI * 1850 * t) * 0.7 + Math.sin(2 * Math.PI * 3700 * t) * 0.3) * env * 0.75;
}
writeWav('tick.wav', tick, sr);
