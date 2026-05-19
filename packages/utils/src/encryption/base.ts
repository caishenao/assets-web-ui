export interface AsymmetricEncryptionOptions {
  privateKey?: string;
  publicKey: string;
}

export abstract class BaseAsymmetricEncryption {
  protected privateKey?: string;
  protected publicKey: string;

  constructor(options: AsymmetricEncryptionOptions) {
    this.privateKey = options.privateKey;
    this.publicKey = options.publicKey;
  }

  abstract decrypt(data: string): string;

  abstract encrypt(data: string): string;
}

export abstract class BaseSymmetricEncryption {
  abstract decrypt(data: string, key: string): string;

  abstract encrypt(data: string, key: string): string;
}
