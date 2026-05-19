import type { Recordable, UserInfo } from '@vben/types';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import {
  completeCasdoorLogin,
  getCasdoorAccountUrl,
  isCasdoorAuthMode,
  logoutCasdoor,
  parseCasdoorUser,
  startCasdoorLogin as redirectToCasdoorLogin,
  takeCasdoorRedirect,
} from '#/auth/casdoor';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);
  const casdoorEnabled = computed(() => isCasdoorAuthMode());
  const casdoorAccountUrl = computed(() =>
    getCasdoorAccountUrl(accessStore.accessToken),
  );

  function getLoginRedirect() {
    const redirect = router.currentRoute.value.query?.redirect;
    return typeof redirect === 'string'
      ? decodeURIComponent(redirect)
      : preferences.app.defaultHomePath;
  }

  async function startCasdoorLogin(redirect?: string) {
    await redirectToCasdoorLogin(redirect ?? getLoginRedirect());
  }

  async function handleLoginSuccess(userInfo: UserInfo, onSuccess?: () => any) {
    userStore.setUserInfo(userInfo);

    if (accessStore.loginExpired) {
      accessStore.setLoginExpired(false);
    } else {
      onSuccess
        ? await onSuccess?.()
        : await router.push(
            userInfo.homePath || preferences.app.defaultHomePath,
          );
    }

    if (userInfo.realName) {
      notification.success({
        description: `${$t('authentication.loginSuccessDesc')}:${userInfo.realName}`,
        duration: 3,
        message: $t('authentication.loginSuccess'),
      });
    }
  }

  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    if (casdoorEnabled.value) {
      await startCasdoorLogin();
      return { userInfo: null };
    }

    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { accessToken } = await loginApi(params);

      if (accessToken) {
        accessStore.setAccessToken(accessToken);

        const [fetchUserInfoResult, accessCodes] = await Promise.all([
          fetchUserInfo(),
          getAccessCodesApi(),
        ]);

        userInfo = fetchUserInfoResult;
        accessStore.setAccessCodes(accessCodes);
        await handleLoginSuccess(userInfo, onSuccess);
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function handleCasdoorCallback() {
    try {
      loginLoading.value = true;
      const { accessCodes, accessToken, refreshToken, userInfo } =
        await completeCasdoorLogin();

      accessStore.setAccessToken(accessToken);
      accessStore.setRefreshToken(refreshToken);
      accessStore.setAccessCodes(accessCodes);
      userStore.setUserInfo(userInfo);
      accessStore.setLoginExpired(false);

      await router.replace(takeCasdoorRedirect());
    } finally {
      loginLoading.value = false;
    }
  }

  async function logout(redirect: boolean = true) {
    const accessToken = accessStore.accessToken;

    try {
      if (casdoorEnabled.value) {
        await logoutCasdoor(accessToken);
      } else {
        await logoutApi();
      }
    } catch {
      // Always clear local state even if remote logout fails.
    }

    resetAllStores();
    accessStore.setLoginExpired(false);

    if (redirect) {
      await router.replace({
        path: LOGIN_PATH,
        query: {},
      });
    }
  }

  async function fetchUserInfo() {
    if (casdoorEnabled.value && accessStore.accessToken) {
      const { accessCodes, userInfo } = parseCasdoorUser(
        accessStore.accessToken,
      );
      accessStore.setAccessCodes(accessCodes);
      userStore.setUserInfo(userInfo);
      return userInfo;
    }

    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    casdoorAccountUrl,
    casdoorEnabled,
    fetchUserInfo,
    handleCasdoorCallback,
    loginLoading,
    logout,
    startCasdoorLogin,
  };
});
