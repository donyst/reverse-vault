#!/usr/bin/env node
/**
 * ============================================================================
 * j2download.com — Full Client & Media Link Resolver (Node.js)
 * ============================================================================
 */

const https = require('https');
const { solvePow, parseBootstrap } = require('./pow_solver');

const DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

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
    this.cookie = cookie;
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
        'sec-ch-ua': '"Chromium";v="152", "Not?A_Brand";v="24", "Google Chrome";v="152"',
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
    const solution = solvePow(bootstrap);
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
      'x-page-nonce': bootstrap.nonce,
      'x-pow-solution': solution,
      ...(turnstileToken ? { 'x-turnstile-token': turnstileToken } : {})
    };

    const res = await sendRequest('https://j2download.com/api/auth/issue', {
      method: 'POST',
      headers
    }, '');

    try {
      const data = JSON.parse(res.body);
      if (!data.accessToken) {
        throw new Error(data.error || res.body);
      }
      this.accessToken = data.accessToken;
      return data.accessToken;
    } catch (e) {
      throw new Error(`Issue token error (${res.status}): ${res.body}`);
    }
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

module.exports = {
  J2DownloadClient,
  solvePow,
  parseBootstrap
};

// CLI Execution
if (require.main === module) {
  const targetUrl = process.argv[2] || "https://www.facebook.com/groups/1528487012172019/permalink/1685137529840299/";
  console.log('=== J2Download PoW Solver & Link Extractor ===');
  console.log('Target URL:', targetUrl);
  console.log('Use programmatic API: const { J2DownloadClient } = require("./client");');
}
