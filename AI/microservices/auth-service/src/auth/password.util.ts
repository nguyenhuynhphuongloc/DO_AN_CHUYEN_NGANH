import { createHash, randomBytes, scryptSync, timingSafeEqual, pbkdf2Sync } from 'node:crypto';

const CURRENT_SCRYPT_N = 1 << 14;
const CURRENT_SCRYPT_R = 8;
const CURRENT_SCRYPT_P = 1;
const CURRENT_SCRYPT_DKLEN = 64;

type EncodedPassword =
  | {
      algorithm: 'scrypt';
      n: number;
      r: number;
      p: number;
      dklen: number;
      digest: string;
    }
  | {
      algorithm: 'pbkdf2';
      digestAlgorithm: string;
      iterations: number;
      dklen: number;
      digest: string;
    };

function timingSafeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length || left.length % 2 !== 0) {
    return false;
  }

  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeCurrentHash(password: string, saltHex: string): string {
  const digest = scryptSync(password, Buffer.from(saltHex, 'hex'), CURRENT_SCRYPT_DKLEN, {
    N: CURRENT_SCRYPT_N,
    r: CURRENT_SCRYPT_R,
    p: CURRENT_SCRYPT_P,
  }).toString('hex');

  return `scrypt$${CURRENT_SCRYPT_N}$${CURRENT_SCRYPT_R}$${CURRENT_SCRYPT_P}$${CURRENT_SCRYPT_DKLEN}$${digest}`;
}

function decodeStoredHash(storedHash: string): EncodedPassword | null {
  const parts = storedHash.split('$');

  if (parts.length === 6 && parts[0] === 'scrypt') {
    const [, n, r, p, dklen, digest] = parts;
    return {
      algorithm: 'scrypt',
      n: Number(n),
      r: Number(r),
      p: Number(p),
      dklen: Number(dklen),
      digest,
    };
  }

  if (parts.length === 5 && parts[0] === 'pbkdf2') {
    const [, digestAlgorithm, iterations, dklen, digest] = parts;
    return {
      algorithm: 'pbkdf2',
      digestAlgorithm,
      iterations: Number(iterations),
      dklen: Number(dklen),
      digest,
    };
  }

  return null;
}

function verifyEncodedHash(password: string, saltHex: string, encoded: EncodedPassword): boolean {
  const salt = Buffer.from(saltHex, 'hex');

  if (encoded.algorithm === 'scrypt') {
    const derived = scryptSync(password, salt, encoded.dklen, {
      N: encoded.n,
      r: encoded.r,
      p: encoded.p,
    }).toString('hex');

    return timingSafeEqualHex(derived, encoded.digest);
  }

  const derived = pbkdf2Sync(
    password,
    salt,
    encoded.iterations,
    encoded.dklen,
    encoded.digestAlgorithm,
  ).toString('hex');

  return timingSafeEqualHex(derived, encoded.digest);
}

function verifyLegacyHash(password: string, saltHex: string, storedHash: string): boolean {
  const salt = Buffer.from(saltHex, 'hex');
  const legacyCandidates: string[] = [];

  const pbkdf2Variants: Array<[string, number, number]> = [
    ['sha512', 100000, 512],
    ['sha512', 10000, 512],
    ['sha512', 1000, 512],
    ['sha512', 100000, 64],
    ['sha512', 10000, 64],
  ];
  for (const [digest, iterations, dklen] of pbkdf2Variants) {
    legacyCandidates.push(pbkdf2Sync(password, salt, iterations, dklen, digest).toString('hex'));
  }

  const scryptVariants: Array<[number, number, number, number]> = [
    [1 << 14, 8, 1, 512],
    [1 << 15, 8, 1, 512],
    [1 << 14, 8, 2, 512],
    [1 << 14, 8, 1, 64],
  ];
  for (const [n, r, p, dklen] of scryptVariants) {
    legacyCandidates.push(
      scryptSync(password, salt, dklen, {
        N: n,
        r,
        p,
      }).toString('hex'),
    );
  }

  const directHashes = [
    createHash('sha256').update(Buffer.concat([Buffer.from(password), salt])).digest('hex'),
    createHash('sha256').update(Buffer.concat([salt, Buffer.from(password)])).digest('hex'),
    createHash('sha512').update(Buffer.concat([Buffer.from(password), salt])).digest('hex'),
    createHash('sha512').update(Buffer.concat([salt, Buffer.from(password)])).digest('hex'),
  ];
  legacyCandidates.push(...directHashes);

  return legacyCandidates.some((candidate) => timingSafeEqualHex(candidate, storedHash));
}

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(32).toString('hex');
  return {
    salt,
    hash: encodeCurrentHash(password, salt),
  };
}

export function verifyPassword(password: string, saltHex: string | null, storedHash: string | null): boolean {
  if (!saltHex || !storedHash) {
    return false;
  }

  const encoded = decodeStoredHash(storedHash);
  if (encoded) {
    return verifyEncodedHash(password, saltHex, encoded);
  }

  return verifyLegacyHash(password, saltHex, storedHash);
}
