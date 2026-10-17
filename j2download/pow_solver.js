/**
 * ============================================================================
 * j2download.com — Proof of Work (PoW) Solver
 * ============================================================================
 * Hỗ trợ 2 chế độ:
 *  - 'classic': băm "pow:<challenge>:<n>:<nonce>:<len>"
 *  - 'alt': 2 vòng băm, trả về "n1.n2"
 * ============================================================================
 */

const crypto = require('crypto');

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

function solveSinglePow(challengeType, challenge, nonce, difficulty, maxIterations = 100000000) {
  const prefix = challengeType === 'alt'
    ? 'pow:' + nonce + ':'
    : 'pow:' + challenge + ':';
  const suffix = challengeType === 'alt'
    ? ':' + challenge
    : ':' + nonce + ':' + challenge.length;

  for (let n = 0; n < maxIterations; n++) {
    const input = prefix + n + suffix;
    const hash = crypto.createHash('sha256').update(input).digest();
    if (hasLeadingZeroNibbles(hash, difficulty)) {
      return String(n);
    }
  }
  return null;
}

/**
 * Giải Proof of Work dựa trên bootstrap payload từ server
 * @param {Object} bootstrap - { nonce, powChallenge, powDifficulty, challengeType }
 * @returns {string|null} Chuỗi nghiệm PoW (VD: "5224" hoặc "18094.3089")
 */
function solvePow(bootstrap) {
  const { powChallenge, nonce, powDifficulty, challengeType = 'classic' } = bootstrap;
  if (!powChallenge || !nonce || !powDifficulty) {
    throw new Error('Dữ liệu bootstrap không đầy đủ');
  }

  const first = solveSinglePow(challengeType, powChallenge, nonce, powDifficulty);
  if (!first) return null;
  if (challengeType !== 'alt') return first;

  const secondChallenge = deriveAltChallenge(powChallenge, nonce, first);
  const second = solveSinglePow(challengeType, secondChallenge, nonce, powDifficulty);
  return second ? `${first}.${second}` : null;
}

/**
 * Trích xuất window.__BOOTSTRAP__ từ mã nguồn HTML
 * @param {string} html - HTML lấy từ trang /vi hoặc /
 * @returns {Object|null}
 */
function parseBootstrap(html) {
  const match = /window\.__BOOTSTRAP__\s*=\s*({[^<]+?});/i.exec(html);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

module.exports = {
  solvePow,
  solveSinglePow,
  deriveAltChallenge,
  hasLeadingZeroNibbles,
  parseBootstrap
};
