import type { RouteMeta as IRouteMeta } from '@vben-core/typings';

import 'vue-router';

declare module 'vue-router' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RouteMeta extends IRouteMeta {}
}

export type AuthMode = 'casdoor' | 'local';

export interface VbenAdminProAppConfigRaw {
  VITE_GLOB_API_URL?: string;
  VITE_GLOB_AUTH_MODE?: AuthMode;
  VITE_GLOB_AUTH_DINGDING_CLIENT_ID?: string;
  VITE_GLOB_AUTH_DINGDING_CORP_ID?: string;
  VITE_GLOB_CASDOOR_APP_NAME?: string;
  VITE_GLOB_CASDOOR_CLIENT_ID?: string;
  VITE_GLOB_CASDOOR_ORG_NAME?: string;
  VITE_GLOB_CASDOOR_REDIRECT_PATH?: string;
  VITE_GLOB_CASDOOR_SCOPE?: string;
  VITE_GLOB_CASDOOR_SERVER_URL?: string;
  VITE_GLOB_ENABLE_ENCRYPT?: string;
  VITE_GLOB_ENCRYPT_HEADER_KEY?: string;
  VITE_GLOB_RSA_PRIVATE_KEY?: string;
  VITE_GLOB_RSA_PUBLIC_KEY?: string;
}

export interface CasdoorConfig {
  appName: string;
  clientId: string;
  organizationName: string;
  redirectPath: string;
  scope: string;
  serverUrl: string;
}

export interface EncryptionConfig {
  enabled: boolean;
  headerKey: string;
  rsaPrivateKey?: string;
  rsaPublicKey: string;
}

export interface ApplicationConfig {
  apiURL: string;
  auth: {
    casdoor: CasdoorConfig;
    dingding?: {
      clientId: string;
      corpId: string;
    };
    mode: AuthMode;
  };
  encryption: EncryptionConfig;
}

declare global {
  interface Window {
    _VBEN_ADMIN_PRO_APP_CONF_: VbenAdminProAppConfigRaw;
  }
}
