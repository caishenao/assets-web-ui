import JSEncrypt from 'jsencrypt';

import { BaseAsymmetricEncryption } from '../base';

export class RsaEncryption extends BaseAsymmetricEncryption {
  override decrypt(data: string): string {
    if (!this.privateKey) {
      throw new Error('RSA private key is required to decrypt data.');
    }

    const instance = new JSEncrypt();
    instance.setPrivateKey(this.privateKey);

    const result = instance.decrypt(data);
    if (result === false) {
      throw new Error('RSA decrypt failed.');
    }

    return result;
  }

  override encrypt(data: string): string {
    const instance = new JSEncrypt();
    instance.setPublicKey(this.publicKey);

    const result = instance.encrypt(data);
    if (result === false) {
      throw new Error('RSA encrypt failed.');
    }

    return result;
  }
}
