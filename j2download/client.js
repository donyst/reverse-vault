#!/usr/bin/env node
/**
 * ============================================================================
 * j2download.com — Pure HTTP Client with Auto-Generated Cookies (Zero Browser)
 * ============================================================================
 * Key RE Insights:
 *   - NO BROWSER REQUIRED (no Chrome, no CDP, no Puppeteer).
 *   - NO PRESET COOKIES REQUIRED: Server automatically generates a fresh
 *     session cookie on the initial GET /vi request if no cookie is supplied!
 *   - Solves PoW (Classic & Alt double-round) in 1-5ms.
 *   - Auto-handles bootstrap rotation & session refreshes.
 * ============================================================================
 */

const https = require('https');
const { solvePow, parseBootstrap } = require('./pow_solver');

const DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36";

function sendRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

class J2DownloadClient {
  constructor(cookie = '') {
    this.cookie = cookie || process.env.J2_COOKIE || '';
    this.userAgent = DEFAULT_UA;
    this.accessToken = '';
  }

  mergeCookies(setCookieHeaders) {
    if (!setCookieHeaders || !Array.isArray(setCookieHeaders)) return;
    for (const sc of setCookieHeaders) {
      const parts = sc.split(';')[0].trim();
      const [name, val] = parts.split('=');
      if (name && val) {
        if (this.cookie.includes(name + '=')) {
          this.cookie = this.cookie.replace(new RegExp(name + '=[^;]+'), `${name}=${val}`);
        } else {
          this.cookie = this.cookie ? `${this.cookie}; ${parts}` : parts;
        }
      }
    }
  }

  async fetchBootstrap() {
    const headers = {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
      'user-agent': this.userAgent,
      'sec-ch-ua': '"Chromium";v="155", "Not?A_Brand";v="24", "Google Chrome";v="155"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1'
    };

    if (this.cookie) {
      headers['cookie'] = this.cookie;
    }

    const res = await sendRequest('https://j2download.com/vi', {
      method: 'GET',
      headers
    });

    // Auto-capture session cookie from Set-Cookie header
    if (res.headers['set-cookie']) {
      this.mergeCookies(res.headers['set-cookie']);
    }

    const bootstrap = parseBootstrap(res.body);
    if (!bootstrap) {
      throw new Error(`Không thể tìm thấy window.__BOOTSTRAP__. HTTP status: ${res.status}`);
    }
    return bootstrap;
  }

  async issueToken(bootstrap, turnstileToken = '') {
    let currentBootstrap = bootstrap;
    let solution = solvePow(currentBootstrap);
    if (!solution) {
      throw new Error('Giải PoW thất bại');
    }

    const headers = {
      'accept': 'application/json, text/plain, */*',
      'content-type': 'application/x-www-form-urlencoded',
      'origin': 'https://j2download.com',
      'referer': 'https://j2download.com/vi',
      'user-agent': this.userAgent,
      'cookie': this.cookie,
      'x-page-nonce': currentBootstrap.nonce,
      'x-pow-solution': solution,
      ...(turnstileToken ? { 'x-turnstile-token': turnstileToken } : {})
    };

    let res = await sendRequest('https://j2download.com/api/auth/issue', {
      method: 'POST',
      headers
    }, '');

    if (res.headers['set-cookie']) {
      this.mergeCookies(res.headers['set-cookie']);
    }

    let data;
    try {
      data = JSON.parse(res.body);
    } catch {
      throw new Error(`Issue token response error (${res.status}): ${res.body}`);
    }

    // Auto-retry if bootstrap_expired
    if (data.error === 'bootstrap_expired' && data.nonce) {
      currentBootstrap = data;
      solution = solvePow(currentBootstrap);
      headers['x-page-nonce'] = currentBootstrap.nonce;
      headers['x-pow-solution'] = solution;

      res = await sendRequest('https://j2download.com/api/auth/issue', {
        method: 'POST',
        headers
      }, '');

      if (res.headers['set-cookie']) {
        this.mergeCookies(res.headers['set-cookie']);
      }
      data = JSON.parse(res.body);
    }

    if (!data.accessToken) {
      throw new Error(`Issue token error (${res.status}): ${res.body}`);
    }
    this.accessToken = data.accessToken;
    return data.accessToken;
  }

  async resolveAutolink(mediaUrl, accessToken = null) {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new Error('Chưa có accessToken. Hãy gọi issueToken trước.');
    }

    const payload = JSON.stringify({
      data: {
        url: mediaUrl,
        unlock: true
      }
    });

    const res = await sendRequest('https://j2download.com/api/autolink', {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'authorization': `Bearer ${token}`,
        'origin': 'https://j2download.com',
        'referer': 'https://j2download.com/vi',
        'user-agent': this.userAgent,
        'cookie': this.cookie
      }
    }, payload);

    if (res.headers['set-cookie']) {
      this.mergeCookies(res.headers['set-cookie']);
    }

    try {
      return JSON.parse(res.body);
    } catch {
      return { status: res.status, raw: res.body };
    }
  }
}

// CLI Execution
if (require.main === module) {
  const targetUrl = process.argv[2] || "https://www.facebook.com/groups/1528487012172019/permalink/1685137529840299/";
  console.log('==================================================');
  console.log('  J2Download Pure HTTP Solver (Auto-Gen Cookie)   ');
  console.log('==================================================');
  console.log('[*] Mode: Pure HTTP (ZERO BROWSER / KHÔNG TRÌNH DUYỆT)');
  console.log('[*] Target URL:', targetUrl);

  (async () => {
    const client = new J2DownloadClient();
    try {
      console.log('[*] Step 1: Connecting to j2download.com (Auto-generating session cookie)...');
      const bootstrap = await client.fetchBootstrap();
      console.log(`[+] Auto-generated session: ${client.cookie}`);
      console.log(`[+] Got bootstrap: nonce=${bootstrap.nonce}, difficulty=${bootstrap.powDifficulty}, type=${bootstrap.challengeType}`);

      console.log('[*] Step 2: Solving Proof-of-Work & requesting Bearer JWT...');
      const t0 = performance.now();
      const token = await client.issueToken(bootstrap);
      const elapsed = (performance.now() - t0).toFixed(2);
      console.log(`[+] Solved PoW & Acquired JWT in ${elapsed}ms: ${token.substring(0, 36)}...`);

      console.log('[*] Step 3: Resolving media download links...');
      const result = await client.resolveAutolink(targetUrl, token);
      console.log('==================================================');
      console.log('               MEDIA RESOLVE SUCCESS              ');
      console.log('==================================================');
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('[-] Error:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  J2DownloadClient,
  solvePow,
  parseBootstrap
};
