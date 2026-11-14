/**
 * Görünmez bir Chrome/Edge açar ve DevTools protokolüyle sürer.
 * Sayfayı tam istenen boyutta açar, fontları bekler, PNG çeker.
 * Şeffaf arka plan da verebilir (karakter parçaları için).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ADAYLAR = [
  process.env.TARAYICI,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

export async function tarayiciAc() {
  const exe = ADAYLAR.find((p) => existsSync(p));
  if (!exe) throw new Error('Chrome ya da Edge bulunamadı. Yolunu TARAYICI ortam değişkeniyle ver.');

  const profil = mkdtempSync(join(tmpdir(), 'maskot-tarayici-'));
  const port = 9300 + Math.floor(Math.random() * 600);
  const surec = spawn(
    exe,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      `--user-data-dir=${profil}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  // Edge'in başlatıcısı hemen çıkıp tarayıcıyı arkada bırakabilir: porta bakılır.
  let wsUrl;
  for (let i = 0; i < 120 && !wsUrl; i++) {
    try {
      wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl;
    } catch {
      await bekle(150);
    }
  }
  if (!wsUrl) throw new Error(`Tarayıcı açılmadı: ${exe}`);

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let sira = 0;
  const bekleyen = new Map();
  const dinleyiciler = new Set();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && bekleyen.has(m.id)) {
      const { res, rej } = bekleyen.get(m.id);
      bekleyen.delete(m.id);
      if (m.error) rej(new Error(m.error.message));
      else res(m.result);
    } else for (const f of dinleyiciler) f(m);
  };
  const gonder = (method, params = {}, sessionId) =>
    new Promise((res, rej) => {
      const id = ++sira;
      bekleyen.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });

  const { targetId } = await gonder('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await gonder('Target.attachToTarget', { targetId, flatten: true });
  const s = (method, params) => gonder(method, params, sessionId);
  await s('Page.enable');

  const yuklenince = () =>
    new Promise((res) => {
      const f = (m) => {
        if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') {
          dinleyiciler.delete(f);
          res();
        }
      };
      dinleyiciler.add(f);
    });

  return {
    /** Dosyayı w x h görünümde açar; fontlar yüklenip iki kare çizilene kadar bekler. */
    async ac(dosya, w, h, { olcek = 1, seffaf = false } = {}) {
      await s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: olcek, mobile: false });
      await s('Emulation.setDefaultBackgroundColorOverride', seffaf ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {});
      const yuklendi = yuklenince();
      await s('Page.navigate', { url: pathToFileURL(dosya).href });
      await yuklendi;
      await this.calistir('document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))');
    },
    /** Sayfada bir ifade çalıştırır, sonucunu döndürür. */
    async calistir(ifade) {
      const r = await s('Runtime.evaluate', { expression: ifade, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    },
    async foto(cikti) {
      const { data } = await s('Page.captureScreenshot', { format: 'png' });
      writeFileSync(cikti, Buffer.from(data, 'base64'));
    },
    async kapat() {
      await gonder('Browser.close').catch(() => {});
      ws.close();
      surec.kill();
      // Tarayıcı profili bırakması biraz sürebilir.
      for (let i = 0; i < 10; i++) {
        try {
          rmSync(profil, { recursive: true, force: true });
          break;
        } catch {
          await bekle(300);
        }
      }
    },
  };
}
