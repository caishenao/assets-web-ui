<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';

import { Button } from 'ant-design-vue';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const formSchema = computed((): VbenFormSchema[] => [
  {
    component: 'VbenInput',
    componentProps: {
      placeholder: '用户名',
    },
    fieldName: 'username',
    label: '用户名',
    rules: z.string().min(1, { message: '请输入用户名' }),
  },
  {
    component: 'VbenInputPassword',
    componentProps: {
      placeholder: '密码',
    },
    fieldName: 'password',
    label: '密码',
    rules: z.string().min(1, { message: '请输入密码' }),
  },
]);
</script>

<template>
  <div v-if="authStore.casdoorEnabled">
    <div class="mb-8">
      <h1 class="text-2xl font-semibold">统一身份认证</h1>
      <p class="text-muted-foreground mt-2 text-sm">Basic Web UI</p>
    </div>
    <Button
      block
      size="large"
      type="primary"
      :loading="authStore.loginLoading"
      @click="authStore.startCasdoorLogin()"
    >
      使用 Casdoor 登录
    </Button>
  </div>
  <AuthenticationLogin
    v-else
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :show-code-login="false"
    :show-forget-password="false"
    :show-qrcode-login="false"
    :show-register="false"
    :show-third-party-login="false"
    @submit="authStore.authLogin"
  />
</template>
