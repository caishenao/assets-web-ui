import CryptoJS from 'crypto-js';

const CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function randomString(length = 32) {
  const bytes = new Uint8Array(length);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => CHARS[byte % CHARS.length]).join('');
}

export function encodeBase64(data: string) {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data));
}

export function decodeBase64(data: string) {
  return CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
}
