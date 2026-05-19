import { decodeBase64, encodeBase64, randomString } from './crypto';
import { AesEncryption } from './impl/aes';
import { RsaEncryption } from './impl/rsa';

export interface HttpEncryptionOptions {
  privateKey?: string;
  publicKey: string;
}

const aes = new AesEncryption();

function normalizePayload(payload: unknown) {
  return typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
}

function parsePayload(payload: string) {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

export function encryptHttpPayload(
  payload: unknown,
  options: HttpEncryptionOptions,
) {
  const rsa = new RsaEncryption(options);
  const secret = randomString(32);

  return {
    data: aes.encrypt(normalizePayload(payload), secret),
    encryptedKey: rsa.encrypt(encodeBase64(secret)),
  };
}

export function decryptHttpPayload(
  payload: unknown,
  encryptedKey: string,
  options: HttpEncryptionOptions,
) {
  const rsa = new RsaEncryption(options);
  const secret = decodeBase64(rsa.decrypt(encryptedKey));
  const rawPayload = typeof payload === 'string' ? payload : String(payload);
  const decrypted = aes.decrypt(rawPayload, secret);

  return parsePayload(decrypted);
}
