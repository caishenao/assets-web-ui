<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

defineOptions({ name: 'CasdoorCallback' });

const authStore = useAuthStore();
const errorMessage = ref('');

onMounted(async () => {
  try {
    await authStore.handleCasdoorCallback();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Casdoor login failed.';
    message.error(errorMessage.value);
  }
});
</script>

<template>
  <div class="p-6 text-center">
    <span v-if="!errorMessage">正在完成登录...</span>
    <span v-else class="text-destructive">{{ errorMessage }}</span>
  </div>
</template>
