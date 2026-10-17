#!/usr/bin/env node
/**
 * ============================================================================
 * j2download.com — Pure HTTP Client & Media Link Resolver (Zero Browser)
 * ============================================================================
 * Features:
 *   - 100% Pure HTTP (Node.js standard https, no browser/Chromium/Puppeteer)
 *   - High-performance SHA-256 Proof-of-Work solver (Classic & Alt double-round)
 *   - Automatic nonce & bootstrap recovery
 *   - Scoped JWT Token exchange & Autolink media resolution
 * ============================================================================
 */

const https = require('https');
const { solvePow, parseBootstrap } = require('./pow_solver');

const DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36";
const DEFAULT_COOKIE = "session=9aad33be9fab8ac3f45a44b8a69583f8; cf_clearance=tCevVOubBdxttSFJaaMuXnrBBqXq6UQBx7WQJ2IS6XE-1792266100-1.2.1.1-XZYgwvKVXx4IL6Os2VwzVKdBjUOdm3L44Uurg072Y0eOq6hBZqkkmsJ2OaFMF2QODFOV6u_CG3xBFfZ0zvTK1KslQcajgayPkEajSbUF0oDeGUCpXhnaaWmFP9TzEVzIBUYzalPrRZdomlG00lZbUp2sQpxLkGo8LvpFUNRJUojFCACMzQ7QI_wwSCcZot5N2whzZ52tARdqhQ6PJfVJTyvOTW_zNAoGDkmBTLtCfNqjGdHp1g4ReXG.trLjWkciWWK7bUn58Q2q6BEmw3m.W14ziE1XDW_qJcJ8zm5ZVFxGhDHKmearkbIAArTz.a9GAnxPAhOZxxQ7h07qLf310JDeZ.O631iAg62oVE8I9R900o0jXAG8iwNdtZb0lFDj3v1WvyFfs4VfWp_aMdNC5HbNDd33_w1_iYmiKorSMIG6Q4CXei7.rPwcdDNpu4wPH0Mks7U20cUp_k2eKq5WKg";

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
    this.cookie = cookie || process.env.J2_COOKIE || DEFAULT_COOKIE;
    this.userAgent = DEFAULT_UA;
    this.accessToken = '';
  }

  setCookie(cookie) {
    this.cookie = cookie;
  }

  async fetchBootstrap() {
    const res = await sendRequest('https://j2download.com/vi', {
      method: 'GET',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
        'user-agent': this.userAgent,
        'cookie': this.cookie,
        'sec-ch-ua': '"Chromium";v="155", "Not?A_Brand";v="24", "Google Chrome";v="155"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1'
      }
    });

    const bootstrap = parseBootstrap(res.body);
    if (!bootstrap) {
      throw new Error(`Không thể tìm thấy window.__BOOTSTRAP__. Kiểm tra lại cookie hoặc cf_clearance.`);
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
  console.log('  J2Download Pure HTTP Solver & Link Extractor   ');
  console.log('==================================================');
  console.log('[*] Mode: Pure HTTP (ZERO BROWSER / KHÔNG TRÌNH DUYỆT)');
  console.log('[*] Target URL:', targetUrl);

  (async () => {
    const client = new J2DownloadClient();
    try {
      console.log('[*] Fetching page bootstrap...');
      const bootstrap = await client.fetchBootstrap();
      console.log(`[+] Got bootstrap: nonce=${bootstrap.nonce}, difficulty=${bootstrap.powDifficulty}, type=${bootstrap.challengeType}`);

      const t0 = performance.now();
      const token = await client.issueToken(bootstrap);
      const elapsed = (performance.now() - t0).toFixed(2);
      console.log(`[+] Solved PoW & Acquired JWT in ${elapsed}ms: ${token.substring(0, 36)}...`);

      console.log('[*] Resolving autolink...');
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
