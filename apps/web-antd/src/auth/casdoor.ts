import type { UserInfo } from '@vben/types';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';

import CasdoorSDK from 'casdoor-js-sdk';

const CASDOOR_REDIRECT_KEY = 'BASIC_WEB_UI_CASDOOR_REDIRECT';

const { auth } = useAppConfig(import.meta.env, import.meta.env.PROD);

interface CasdoorRole {
  displayName?: string;
  name?: string;
}

interface CasdoorPermission {
  actions?: string[];
  displayName?: string;
  name?: string;
}

interface CasdoorJwtPayload {
  avatar?: string;
  displayName?: string;
  email?: string;
  groups?: string[];
  id?: string;
  isAdmin?: boolean;
  name?: string;
  owner?: string;
  permissions?: CasdoorPermission[];
  permanentAvatar?: string;
  phone?: string;
  roles?: CasdoorRole[];
  sub?: string;
}

interface CasdoorTokenResponse {
  access_token: string;
  expires_in?: number;
  id_token?: string;
  refresh_token?: string;
  token_type?: string;
}

function assertCasdoorConfig() {
  const { appName, clientId, organizationName, serverUrl } = auth.casdoor;
  if (!serverUrl || !clientId || !appName || !organizationName) {
    throw new Error(
      'Casdoor config is incomplete. Please check VITE_GLOB_CASDOOR_* env values.',
    );
  }
}

function createCasdoorSdk() {
  assertCasdoorConfig();

  return new CasdoorSDK({
    appName: auth.casdoor.appName,
    clientId: auth.casdoor.clientId,
    organizationName: auth.casdoor.organizationName,
    redirectPath: auth.casdoor.redirectPath,
    scope: auth.casdoor.scope,
    serverUrl: auth.casdoor.serverUrl,
    storage: localStorage,
  });
}

function roleName(role: CasdoorRole) {
  return role.name || role.displayName || '';
}

function permissionCodes(permission: CasdoorPermission) {
  const name = permission.name || permission.displayName || '';
  const actions = permission.actions ?? [];

  return [
    name,
    ...actions.map((action) => (name ? `${name}:${action}` : action)),
  ].filter(Boolean);
}

function buildAccessCodes(payload: CasdoorJwtPayload) {
  const roleCodes = (payload.roles ?? []).map(roleName);
  const permissionList = (payload.permissions ?? []).flatMap(permissionCodes);
  const groupCodes = payload.groups ?? [];

  return Array.from(
    new Set([
      ...roleCodes,
      ...permissionList,
      ...groupCodes,
      ...(payload.isAdmin ? ['admin'] : []),
    ]),
  );
}

function mapUserInfo(
  accessToken: string,
  payload: CasdoorJwtPayload,
): UserInfo {
  const username = payload.name || payload.sub || '';
  const realName = payload.displayName || username;

  return {
    avatar: payload.avatar || payload.permanentAvatar || '',
    desc: payload.email || payload.owner || '',
    email: payload.email,
    groups: payload.groups ?? [],
    homePath: preferences.app.defaultHomePath,
    organization: payload.owner,
    phone: payload.phone,
    realName,
    roles: buildAccessCodes(payload),
    token: accessToken,
    userId: payload.id || payload.sub || username,
    username,
  };
}

export function isCasdoorAuthMode() {
  return auth.mode === 'casdoor';
}

export function rememberCasdoorRedirect(redirect?: string) {
  if (redirect) {
    sessionStorage.setItem(CASDOOR_REDIRECT_KEY, redirect);
  }
}

export function takeCasdoorRedirect() {
  const redirect = sessionStorage.getItem(CASDOOR_REDIRECT_KEY);
  sessionStorage.removeItem(CASDOOR_REDIRECT_KEY);
  return redirect || preferences.app.defaultHomePath;
}

export async function startCasdoorLogin(redirect?: string) {
  rememberCasdoorRedirect(redirect);
  await createCasdoorSdk().signin_redirect();
}

export async function completeCasdoorLogin() {
  const sdk = createCasdoorSdk();
  const tokenResponse =
    (await sdk.exchangeForAccessToken()) as CasdoorTokenResponse;
  const accessToken = tokenResponse.access_token;
  if (!accessToken) {
    throw new Error('Casdoor did not return an access token.');
  }
  const { payload } = sdk.parseAccessToken(accessToken);
  const userInfo = mapUserInfo(accessToken, payload as CasdoorJwtPayload);

  return {
    accessCodes: buildAccessCodes(payload as CasdoorJwtPayload),
    accessToken,
    refreshToken: tokenResponse.refresh_token ?? null,
    userInfo,
  };
}

export function parseCasdoorUser(accessToken: string) {
  const { payload } = createCasdoorSdk().parseAccessToken(accessToken);
  const userInfo = mapUserInfo(accessToken, payload as CasdoorJwtPayload);

  return {
    accessCodes: buildAccessCodes(payload as CasdoorJwtPayload),
    userInfo,
  };
}

export function getCasdoorAccountUrl(accessToken?: null | string) {
  if (!isCasdoorAuthMode()) {
    return '';
  }

  try {
    const account = accessToken ? ({ accessToken } as any) : undefined;
    return createCasdoorSdk().getMyProfileUrl(account, window.location.href);
  } catch {
    return '';
  }
}

export async function logoutCasdoor(accessToken?: null | string) {
  if (!isCasdoorAuthMode() || !accessToken || !auth.casdoor.serverUrl) {
    return;
  }

  await fetch(`${auth.casdoor.serverUrl.replace(/\/$/, '')}/api/sso-logout`, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'POST',
  });
}
