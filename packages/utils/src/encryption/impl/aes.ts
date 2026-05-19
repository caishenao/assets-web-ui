import CryptoJS from 'crypto-js';

import { BaseSymmetricEncryption } from '../base';

export class AesEncryption extends BaseSymmetricEncryption {
  override decrypt(data: string, key: string): string {
    const aesKey = CryptoJS.enc.Utf8.parse(key);
    const decrypted = CryptoJS.AES.decrypt(data, aesKey, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  override encrypt(data: string, key: string): string {
    const aesKey = CryptoJS.enc.Utf8.parse(key);
    const encrypted = CryptoJS.AES.encrypt(data, aesKey, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    return encrypted.toString();
  }
}
