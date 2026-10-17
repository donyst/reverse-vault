const https = require('https');
const crypto = require('crypto');

const COOKIE = "session=68718ecc191b88aee567179b3169cd78; cf_clearance=DnHQws86oqmiMsibFPe_0c1.MUuU0XMf8EeUPNlfdsA-1792263995-1.2.1.1-e81g2cXWI6yjanJD4xwOxxM9w_i279JS83It0Z3W6mk5tdq2iI04RGOc2IUQlZNgkqRNKknj4Ev8rYFoyW21rJ8vy6mi1.v7JZXCDzEKRzthStUf2w2PMIFXHVXnWErkeQUpkP2BetxA4JsC35Lhr0lUN5QvUExEgoplyJwId3gSx9d.FUuLdy2znVRHFyNBrcktQ9Q8c.pEUzf0eU3iuWQFfp2rwIkPUevx5pi023cSKpo.QFcrkHog0baMI4djknPFgeRGrsBLDmDYHDjbOiXKT35Gu8sK1TIXmtEpS7muPiO8pTmb5OZD1d0j83.wChNsnbKke4A0ndGjt9krZzZhG7qjAyf7WvlFDRg10R1KjmzEfcLMeXaJJgbPUPpeG5nc1k9DNA_bjSvESeuYJxz.je.WkoyZ_c8qBPfIGgu_ggSMClSdfUTIZGnvvAIX6qsrnnuADaPsmE0YtESrYQ";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

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
  const t0 = performance.now();
  const solution = solvePow(bootstrap);
  const elapsed = (performance.now() - t0).toFixed(2);
  console.log(`[+] PoW Solution (${elapsed}ms):`, solution);

  console.log('3. Requesting access token via /api/auth/issue...');
  const issueHeaders = {
    'accept': 'application/json, text/plain, */*',
    'content-type': 'application/x-www-form-urlencoded',
    'origin': 'https://j2download.com',
    'referer': 'https://j2download.com/vi',
    'user-agent': UA,
    'cookie': COOKIE,
    'x-page-nonce': bootstrap.nonce,
    'x-pow-solution': solution
  };

  const resIssue = await request('https://j2download.com/api/auth/issue', {
    method: 'POST',
    headers: issueHeaders
  }, '');

  const issueData = JSON.parse(resIssue.body);
  if (!issueData.accessToken) {
    console.error('[-] Failed to get accessToken:', resIssue.body);
    return;
  }
  console.log('[+] Access Token acquired:', issueData.accessToken);

  console.log('4. Querying /api/autolink...');
  const targetUrl = "https://www.facebook.com/groups/1528487012172019/permalink/1685137529840299/";
  const postBody = JSON.stringify({
    data: {
      url: targetUrl,
      unlock: true
    }
  });

  const autolinkHeaders = {
    'accept': 'application/json, text/plain, */*',
    'content-type': 'application/json',
    'authorization': `Bearer ${issueData.accessToken}`,
    'origin': 'https://j2download.com',
    'referer': 'https://j2download.com/vi',
    'user-agent': UA,
    'cookie': COOKIE
  };

  const resAutolink = await request('https://j2download.com/api/autolink', {
    method: 'POST',
    headers: autolinkHeaders
  }, postBody);

  console.log('Autolink Status:', resAutolink.status);
  console.log('Autolink Response Body:');
  try {
    console.log(JSON.stringify(JSON.parse(resAutolink.body), null, 2));
  } catch {
    console.log(resAutolink.body);
  }
}

run().catch(console.error);
