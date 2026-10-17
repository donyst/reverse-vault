const https = require('https');
const crypto = require('crypto');

const COOKIE = "session=68718ecc191b88aee567179b3169cd78; cf_clearance=DnHQws86oqmiMsibFPe_0c1.MUuU0XMf8EeUPNlfdsA-1792263995-1.2.1.1-e81g2cXWI6yjanJD4xwOxxM9w_i279JS83It0Z3W6mk5tdq2iI04RGOc2IUQlZNgkqRNKknj4Ev8rYFoyW21rJ8vy6mi1.v7JZXCDzEKRzthStUf2w2PMIFXHVXnWErkeQUpkP2BetxA4JsC35Lhr0lUN5QvUExEgoplyJwId3gSx9d.FUuLdy2znVRHFyNBrcktQ9Q8c.pEUzf0eU3iuWQFfp2rwIkPUevx5pi023cSKpo.QFcrkHog0baMI4djknPFgeRGrsBLDmDYHDjbOiXKT35Gu8sK1TIXmtEpS7muPiO8pTmb5OZD1d0j83.wChNsnbKke4A0ndGjt9krZzZhG7qjAyf7WvlFDRg10R1KjmzEfcLMeXaJJgbPUPpeG5nc1k9DNA_bjSvESeuYJxz.je.WkoyZ_c8qBPfIGgu_ggSMClSdfUTIZGnvvAIX6qsrnnuADaPsmE0YtESrYQ";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
const TURNSTILE = "1.OgvT7EvXjtNjo7jUcQLdELWQch05SflnFSDrcKBXjqWLbUhj5NoaWthUH6rMxOCotM02f0ge2cusAlI40SP8BXxqRWF0xI0z3-CD4gOhoYXBKW1bZgkiRe-uG9knEdSnAc3D9PrLo7ORSOnzCwJM8d6qlS_qiaT83nIdPT1AQltUI4DgPvYdYY8nxgmWJ0kVIT5UxREMWMlh45Oz6jH6onJEScBuWBP7Mm8-Qxt6qdq2eJCfOeWv_sugkHcWicz6Rn4_CAH7KsAlsatCf5uziHI9xdCqB5DQHIk3EJRMPzVRBBakfqibuH3cgENmSQakSoJ5uM2p0Q8RReV54Bqxk7bf4VpKXv2nId5u5W22gO5AA5AkyGKdfnYnApDB7-kxr6PiBoazknCSWSdVZV-fDiKhr0UR6cbs3bhsDhKO_avTnXNHFOak7kt0XzyMIxXNej00XldRI-Y-Zk5XVZKR9kb_Xljh1g2qIlbUvSXXCvfseoLdzX_sPqWIOWJpfYif1aiTCoBj6RHZk_VjOOBCkQ1Cg8L_rooL-pGVqp5y293TlUFEqRZP8mg5ZkH_dXn03RCYaSryzFJxU9KaZ9vbc7kNykcgjtDkmQTVxYsnrX3B4X6anUM5-j8k_dIlH92qExKGtGsVql2x6hkW01Iqfb5Wb_x7FLvwR0WsO6MC2Ek.xH2vn_3_vDrBllGGoW1MCQ.0d634d65c1c6915d13f11bff5237ec5433112e6e0586d022f6d0828dedce3122";

function request(url, options, postData) {
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

function hasLeadingZeroNibbles(bytes, difficulty) {
  const fullBytes = Math.floor(difficulty / 2);
  const hasHalfByte = (difficulty & 1) === 1;
  for (let i = 0; i < fullBytes; i++) {
    if (bytes[i] !== 0) return false;
  }
  if (hasHalfByte && (bytes[fullBytes] & 0xF0) !== 0) return false;
  return true;
}

function deriveAltChallenge(challenge, nonce, solution) {
  const msg = 'pow:alt:' + challenge + ':' + nonce + ':' + solution;
  const hash = crypto.createHash('sha256').update(msg).digest();
  return hash.subarray(0, 16).toString('hex');
}

function solveSinglePow(challengeType, challenge, nonce, difficulty) {
  const prefix = challengeType === 'alt'
    ? 'pow:' + nonce + ':'
    : 'pow:' + challenge + ':';
  const suffix = challengeType === 'alt'
    ? ':' + challenge
    : ':' + nonce + ':' + challenge.length;

  for (let n = 0; n < 100000000; n++) {
    const input = prefix + n + suffix;
    const hash = crypto.createHash('sha256').update(input).digest();
    if (hasLeadingZeroNibbles(hash, difficulty)) {
      return String(n);
    }
  }
  return null;
}

function solvePow(bootstrap) {
  const { powChallenge, nonce, powDifficulty, challengeType = 'classic' } = bootstrap;
  const first = solveSinglePow(challengeType, powChallenge, nonce, powDifficulty);
  if (!first) return null;
  if (challengeType !== 'alt') return first;
  const secondChallenge = deriveAltChallenge(powChallenge, nonce, first);
  const second = solveSinglePow(challengeType, secondChallenge, nonce, powDifficulty);
  return second ? first + '.' + second : null;
}

async function run() {
  console.log('1. Fetching page to get fresh window.__BOOTSTRAP__...');
  const resPage = await request('https://j2download.com/vi', {
    method: 'GET',
    headers: {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
      'user-agent': UA,
      'cookie': COOKIE,
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

  const bootstrapMatch = /window\.__BOOTSTRAP__\s*=\s*({[^<]+?});/i.exec(resPage.body);
  if (!bootstrapMatch) {
    console.error('[-] Could not find window.__BOOTSTRAP__ in HTML!');
    return;
  }

  const bootstrap = JSON.parse(bootstrapMatch[1]);
  console.log('[+] Got bootstrap:', bootstrap);

  console.log('2. Solving Proof of Work...');
  const solution = solvePow(bootstrap);
  console.log(`[+] PoW Solution:`, solution);

  console.log('3. Requesting access token via /api/auth/issue WITH turnstile token...');
  const resIssue = await request('https://j2download.com/api/auth/issue', {
    method: 'POST',
    headers: {
      'accept': 'application/json, text/plain, */*',
      'content-type': 'application/x-www-form-urlencoded',
      'origin': 'https://j2download.com',
      'referer': 'https://j2download.com/vi',
      'user-agent': UA,
      'cookie': COOKIE,
      'x-page-nonce': bootstrap.nonce,
      'x-pow-solution': solution,
      'x-turnstile-token': TURNSTILE
    }
  }, '');

  console.log('Response /api/auth/issue:', resIssue.status, resIssue.body);
}

run().catch(console.error);
