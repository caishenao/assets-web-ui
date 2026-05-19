<script lang="ts" setup>
import { computed } from 'vue';

import { BasicLayout, LockScreen, UserDropdown } from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import { useAuthStore } from '#/store';

const userStore = useUserStore();
const authStore = useAuthStore();

const avatar = computed(() => {
  return userStore.userInfo?.avatar || preferences.app.defaultAvatar;
});

const menus = computed(() => {
  const items: Array<{
    handler: () => void;
    icon: string;
    text: string;
  }> = [];

  if (authStore.casdoorAccountUrl) {
    items.push({
      handler: () => {
        openWindow(authStore.casdoorAccountUrl, {
          target: '_blank',
        });
      },
      icon: 'lucide:user-cog',
      text: '账号中心',
    });
  }

  return items;
});

async function handleLogout() {
  await authStore.logout();
}
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        :description="userStore.userInfo?.username"
        @logout="handleLogout"
      />
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
