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
  const t0 = performance.now();
  const first = solveSinglePow(challengeType, powChallenge, nonce, powDifficulty);
  if (!first) return null;
  if (challengeType !== 'alt') {
    console.log(`[+] Solved classic PoW in ${(performance.now() - t0).toFixed(2)}ms: ${first}`);
    return first;
  }

  const secondChallenge = deriveAltChallenge(powChallenge, nonce, first);
  const second = solveSinglePow(challengeType, secondChallenge, nonce, powDifficulty);
  const solution = second ? first + '.' + second : null;
  console.log(`[+] Solved alt PoW in ${(performance.now() - t0).toFixed(2)}ms: ${solution}`);
  return solution;
}

// Test with the bootstrap we got earlier:
const testBootstrap = {
  nonce: "bd1d75c9681cc49758a735e14fac844d",
  powChallenge: "1f11a33a41972ce4437a8e87cb6d035b",
  challengeType: "classic",
  powDifficulty: 3
};

const sol = solvePow(testBootstrap);
console.log('Result solution:', sol);
