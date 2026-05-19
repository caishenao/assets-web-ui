import type { InternalAxiosRequestConfig } from '@vben/request';
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';
import { decryptHttpPayload, encryptHttpPayload } from '@vben/utils';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

const { apiURL, encryption } = useAppConfig(
  import.meta.env,
  import.meta.env.PROD,
);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired.');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);

    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.data;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  function isEncryptableMethod(method?: string) {
    return ['POST', 'PUT', 'PATCH'].includes(method?.toUpperCase() ?? '');
  }

  function isUnsupportedEncryptedPayload(data: unknown) {
    return (
      (typeof FormData !== 'undefined' && data instanceof FormData) ||
      (typeof Blob !== 'undefined' && data instanceof Blob) ||
      data instanceof ArrayBuffer ||
      data instanceof URLSearchParams
    );
  }

  function setHeader(
    config: InternalAxiosRequestConfig,
    key: string,
    value: string,
  ) {
    config.headers.set?.(key, value);
    if (!config.headers.has?.(key)) {
      config.headers[key] = value;
    }
  }

  function getHeader(headers: any, key: string) {
    return (
      headers?.get?.(key) ?? headers?.[key] ?? headers?.[key.toLowerCase()]
    );
  }

  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      const authorization = formatToken(accessStore.accessToken);

      if (authorization) {
        setHeader(config, 'Authorization', authorization);
      }
      setHeader(config, 'Accept-Language', preferences.app.locale);

      if (
        encryption.enabled &&
        config.encrypt &&
        isEncryptableMethod(config.method)
      ) {
        if (!encryption.rsaPublicKey) {
          throw new Error(
            'VITE_GLOB_RSA_PUBLIC_KEY is required for encryption.',
          );
        }
        if (isUnsupportedEncryptedPayload(config.data)) {
          throw new Error(
            'Encrypted requests only support JSON-compatible or string bodies.',
          );
        }

        const { data, encryptedKey } = encryptHttpPayload(config.data, {
          publicKey: encryption.rsaPublicKey,
        });
        config.data = data;
        config.transformRequest = (requestData) => requestData;
        setHeader(config, encryption.headerKey, encryptedKey);
        setHeader(config, 'Content-Type', 'application/json;charset=utf-8');
      }

      return config;
    },
  });

  client.addResponseInterceptor({
    fulfilled: (response) => {
      const encryptedKey = getHeader(response.headers, encryption.headerKey);
      if (encryptedKey) {
        if (!encryption.rsaPrivateKey || !encryption.rsaPublicKey) {
          throw new Error(
            'RSA public/private keys are required to decrypt data.',
          );
        }
        response.data = decryptHttpPayload(response.data, encryptedKey, {
          privateKey: encryption.rsaPrivateKey,
          publicKey: encryption.rsaPublicKey,
        });
      }
      return response;
    },
  });

  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.error ?? responseData?.message ?? '';
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
