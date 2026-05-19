import type {
  ApplicationConfig,
  AuthMode,
  VbenAdminProAppConfigRaw,
} from '@vben/types/global';

function getString(value: string | undefined, fallback = '') {
  return value && value.length > 0 ? value : fallback;
}

function getBoolean(value: string | undefined) {
  return value === 'true';
}

function getAuthMode(value: string | undefined): AuthMode {
  return value === 'local' ? 'local' : 'casdoor';
}

/**
 * Global app config injected by vite-extra-app-config in production.
 */
export function useAppConfig(
  env: Record<string, any>,
  isProduction: boolean,
): ApplicationConfig {
  const config = isProduction
    ? window._VBEN_ADMIN_PRO_APP_CONF_
    : (env as VbenAdminProAppConfigRaw);

  const applicationConfig: ApplicationConfig = {
    apiURL: getString(config.VITE_GLOB_API_URL, '/api'),
    auth: {
      casdoor: {
        appName: getString(config.VITE_GLOB_CASDOOR_APP_NAME),
        clientId: getString(config.VITE_GLOB_CASDOOR_CLIENT_ID),
        organizationName: getString(config.VITE_GLOB_CASDOOR_ORG_NAME),
        redirectPath: getString(
          config.VITE_GLOB_CASDOOR_REDIRECT_PATH,
          '/auth/casdoor-callback',
        ),
        scope: getString(
          config.VITE_GLOB_CASDOOR_SCOPE,
          'openid profile email',
        ),
        serverUrl: getString(config.VITE_GLOB_CASDOOR_SERVER_URL),
      },
      mode: getAuthMode(config.VITE_GLOB_AUTH_MODE),
    },
    encryption: {
      enabled: getBoolean(config.VITE_GLOB_ENABLE_ENCRYPT),
      headerKey: getString(config.VITE_GLOB_ENCRYPT_HEADER_KEY, 'encrypt-key'),
      rsaPrivateKey: getString(config.VITE_GLOB_RSA_PRIVATE_KEY),
      rsaPublicKey: getString(config.VITE_GLOB_RSA_PUBLIC_KEY),
    },
  };

  if (
    config.VITE_GLOB_AUTH_DINGDING_CLIENT_ID &&
    config.VITE_GLOB_AUTH_DINGDING_CORP_ID
  ) {
    applicationConfig.auth.dingding = {
      clientId: config.VITE_GLOB_AUTH_DINGDING_CLIENT_ID,
      corpId: config.VITE_GLOB_AUTH_DINGDING_CORP_ID,
    };
  }

  return applicationConfig;
}
