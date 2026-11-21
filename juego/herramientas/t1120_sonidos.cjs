// Los sonidos sin oído: renderiza efectos de audio/sonido.ts fuera de línea (OfflineAudioContext, `_renderEfecto`) y los
// guarda en WAV (mono, 44,1 kHz, 16 bits) para escucharlos y para el espectrograma (t1120_espectro.py).
// Uso: node juego/herramientas/t1120_sonidos.cjs [ids] [etiqueta]
//   ids: separados por coma (por omisión las formas del druida, el Festín y unos de referencia para el volumen)
//   MODULO=/src/audio/otro.ts otra copia del módulo (el antes), SECO=1 además el efecto seco (sin la cadena del juego), SEG=4 segundos de cada uno, VECES=3 tomas de cada uno (el azar)
// Salida: /tmp/requiem-pruebas/sonidos/<etiqueta>_<id>[_<n>].wav y <etiqueta>_medidas.json (pico y RMS).
// En la nube: CHROMIUM=/opt/pw-browsers/chromium URL=http://127.0.0.1:5197/
const { chromium } = require('playwright');
const fs = require('fs');
const IDS = (process.argv[2] || 'forma_lobo,forma_oso,forma_hombre,festin,rugido_jefe,grito_guerra,golpe_carne,invocar,muerte_monstruo,chapoteo,hueso_cruje').split(',');
const ET = process.argv[3] || 'ahora';
const URL = process.env.URL || 'http://127.0.0.1:5197/';
const OUT = '/tmp/requiem-pruebas/sonidos'; fs.mkdirSync(OUT, { recursive: true });
const SEG = +(process.env.SEG || 4.5), VECES = +(process.env.VECES || 1);

function wav(muestras, sr) {
  const n = muestras.length, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(muestras[i] * 32767))), 44 + i * 2);
  return b;
}
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(1500);
  if (process.env.MODULO) await p.evaluate((m) => { window.__modSon = m; }, process.env.MODULO);
  const med = {};
  for (const id of IDS) for (let v = 0; v < VECES; v++) for (const juego of process.env.SECO ? [true, false] : [true]) {
    const r = await p.evaluate(async ([id, seg, juego]) => { const m = await import(window.__modSon || '/src/audio/sonido.ts'); const x = await m._renderEfecto(id, seg, true, juego); return { pico: x.pico, rms: x.rms, activo: x.activo, d: x.d }; }, [id, SEG, juego]);
    // RMS de lo que suena (de la primera muestra audible a la última), y la ventana de 100 ms más fuerte
    const d = r.d, sr = 44100; let i0 = d.findIndex((x) => Math.abs(x) > 0.01), i1 = Math.floor(r.activo * sr); if (i0 < 0) i0 = 0;
    let s = 0; for (let i = i0; i <= i1; i++) s += d[i] * d[i];
    let max100 = 0; const w = 4410; let acc = 0; for (let i = 0; i < d.length; i++) { acc += d[i] * d[i]; if (i >= w) acc -= d[i - w] * d[i - w]; if (i >= w - 1) max100 = Math.max(max100, Math.sqrt(Math.max(0, acc) / w)); }
    const nom = `${ET}_${id}${VECES > 1 ? '_' + v : ''}${juego ? '' : '_seco'}`;
    fs.writeFileSync(`${OUT}/${nom}.wav`, wav(d.slice(0, Math.min(d.length, i1 + sr * 0.3)), sr));
    const db = (x) => +(20 * Math.log10(Math.max(x, 1e-6))).toFixed(1);
    med[nom] = { pico_db: db(r.pico), rms_db: db(Math.sqrt(s / Math.max(1, i1 - i0 + 1))), rms100_db: db(max100), dur: +((i1 - i0) / sr).toFixed(2) };
    console.log(nom.padEnd(34), JSON.stringify(med[nom]));
  }
  fs.writeFileSync(`${OUT}/${ET}_medidas.json`, JSON.stringify(med, null, 1));
  if (errs.length) console.log('errores', errs.slice(0, 5));
  await b.close();
})();
