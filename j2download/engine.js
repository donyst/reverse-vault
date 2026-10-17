#!/usr/bin/env node
/**
 * ============================================================================
 * J2Download Autonomous Engine & Link Resolver
 * ----------------------------------------------------------------------------
 * Solves:
 *   1. Cloudflare Anti-Bot & Session Fingerprinting (via native Chrome CDP)
 *   2. Cloudflare Turnstile Bypass (auto-rendered & solved via page runtime)
 *   3. Custom Proof-of-Work (PoW classic & alt double-round solver in 15ms)
 *   4. Scoped JWT token issuance & autolink media extraction
 *
 * Requirements: Node.js 22+ (Native WebSocket, ZERO npm dependencies)
 * ============================================================================
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const { solvePow } = require('./pow_solver');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const CDP_PORT = 9222;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id && this.pending.has(msg.id)) {
            const { resolve, reject } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            else resolve(msg.result);
          }
        } catch {}
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression, awaitPromise = true) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(async () => { return (${expression}); })()`,
      awaitPromise: true,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      const msg = res.exceptionDetails.exception?.description || res.exceptionDetails.text;
      throw new Error('CDP Evaluate Exception: ' + msg);
    }
    return res.result?.value;
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }
  }
}

async function ensureChrome() {
  try {
    const targets = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json`);
    const page = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
    if (page) return page;
  } catch {}

  console.log('[*] Spawning Chrome with remote debugging on port ' + CDP_PORT + '...');
  spawn(CHROME_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { detached: true, stdio: 'ignore' }).unref();

  for (let i = 0; i < 20; i++) {
    await delay(500);
    try {
      const targets = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json`);
      const page = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch {}
  }
  throw new Error('Could not connect to Chrome CDP.');
}

async function resolveMedia(mediaUrl) {
  console.log('==================================================');
  console.log('   J2Download Autonomous Solver & Media Resolver  ');
  console.log('==================================================');
  console.log('[*] Target media URL:', mediaUrl);

  // 1. Connect to CDP
  const target = await ensureChrome();
  console.log('[+] Connected to Chrome page:', target.id);
  const cdp = new CDPClient(target.webSocketDebuggerUrl);
  await cdp.connect();

  try {
    // 2. Always navigate to /vi to obtain fresh session & bootstrap
    console.log('[*] Navigating to https://j2download.com/vi to refresh session & bootstrap...');
    await cdp.send('Page.navigate', { url: 'https://j2download.com/vi' });
    await delay(3000);

    // 3. Inject and ensure Turnstile script
    console.log('[*] Ensuring Turnstile challenge engine...');
    await cdp.evaluate(`
      new Promise((resolve, reject) => {
        if (window.turnstile && window.turnstile.render) return resolve();
        let s = document.getElementById('cf-turnstile-script');
        if (!s) {
          s = document.createElement('script');
          s.id = 'cf-turnstile-script';
          s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          s.async = true;
          s.defer = true;
          document.head.appendChild(s);
        }
        s.addEventListener('load', () => resolve(), { once: true });
        s.addEventListener('error', () => reject(new Error('Turnstile script failed')), { once: true });
      })
    `);

    // 4. Render Turnstile container & wait for solution token
    console.log('[*] Solving Cloudflare Turnstile token...');
    const rawToken = await cdp.evaluate(`
      new Promise((resolve, reject) => {
        const id = 'ts-' + Date.now();
        const container = document.createElement('div');
        container.id = id;
        container.style.cssText = 'position:fixed;bottom:-500px;left:-500px;opacity:0.01;';
        document.body.appendChild(container);

        const timeout = setTimeout(() => {
          const val = container.querySelector('input[name="cf-turnstile-response"]')?.value;
          if (val) resolve(val);
          else reject(new Error('Turnstile solve timed out (15s)'));
        }, 15000);

        window.turnstile.render(container, {
          sitekey: '0x4AAAAAABhlm-wzFjcykIge',
          callback: (tok) => {
            clearTimeout(timeout);
            resolve(tok);
          },
          'error-callback': (err) => {
            clearTimeout(timeout);
            reject(new Error('Turnstile error: ' + JSON.stringify(err)));
          }
        });
      })
    `);
    const turnstileToken = String(rawToken || '');
    console.log('[+] Acquired Turnstile Token:', turnstileToken.substring(0, 32) + '...');

    // 5. Get current bootstrap and solve PoW
    let bootstrap = await cdp.evaluate('window.__BOOTSTRAP__');
    console.log('[*] Initial bootstrap:', bootstrap);

    let powSolution = solvePow(bootstrap);
    console.log('[+] PoW Solution:', powSolution);

    // 6. Issue Access Token via /api/auth/issue
    console.log('[*] Requesting access token from /api/auth/issue...');
    let issueResult = await cdp.evaluate(`
      fetch('/api/auth/issue', {
        method: 'POST',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'content-type': 'application/x-www-form-urlencoded',
          'x-page-nonce': ${JSON.stringify(bootstrap.nonce)},
          'x-pow-solution': ${JSON.stringify(powSolution)},
          'x-turnstile-token': ${JSON.stringify(turnstileToken)}
        }
      }).then(r => r.json())
    `);

    // If bootstrap expired, the server provides the fresh challenge in the error payload!
    if (issueResult && issueResult.error === 'bootstrap_expired' && issueResult.nonce) {
      console.log('[!] Bootstrap expired. Server sent fresh challenge in payload:');
      console.log('    Nonce:', issueResult.nonce, '| Difficulty:', issueResult.powDifficulty, '| Type:', issueResult.challengeType);
      const freshPow = solvePow(issueResult);
      console.log('[+] Solved fresh PoW:', freshPow);

      issueResult = await cdp.evaluate(`
        fetch('/api/auth/issue', {
          method: 'POST',
          headers: {
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/x-www-form-urlencoded',
            'x-page-nonce': ${JSON.stringify(issueResult.nonce)},
            'x-pow-solution': ${JSON.stringify(freshPow)},
            'x-turnstile-token': ${JSON.stringify(turnstileToken)}
          }
        }).then(r => r.json())
      `);
    }

    if (!issueResult || !issueResult.accessToken) {
      throw new Error(`Token issuance failed: ${JSON.stringify(issueResult)}`);
    }

    console.log('[+] Access Token acquired successfully:');
    console.log('    ' + issueResult.accessToken.substring(0, 48) + '...');

    // 7. Resolve Media Link via /api/autolink
    console.log('[*] Resolving autolink for media...');
    const autolinkResult = await cdp.evaluate(`
      fetch('/api/autolink', {
        method: 'POST',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'content-type': 'application/json',
          'authorization': 'Bearer ' + ${JSON.stringify(issueResult.accessToken)}
        },
        body: JSON.stringify({
          data: {
            url: ${JSON.stringify(mediaUrl)},
            unlock: true
          }
        })
      }).then(r => r.json())
    `);

    console.log('==================================================');
    console.log('               MEDIA RESOLVE SUCCESS              ');
    console.log('==================================================');
    console.log(JSON.stringify(autolinkResult, null, 2));
    return autolinkResult;

  } finally {
    cdp.close();
  }
}

if (require.main === module) {
  const url = process.argv[2] || "https://www.facebook.com/groups/1528487012172019/permalink/1685137529840299/";
  resolveMedia(url).catch(err => {
    console.error('[-] Error:', err.message);
    process.exit(1);
  });
}

module.exports = { resolveMedia };
