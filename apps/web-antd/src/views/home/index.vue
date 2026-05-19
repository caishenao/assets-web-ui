<script lang="ts" setup>
defineOptions({ name: 'Home' });
</script>

<template>
  <div class="p-6">
    <RouterLink class="asset-home-link" to="/assets">
      Enter Asset Management Platform
    </RouterLink>
  </div>
</template>

<style scoped>
.asset-home-link {
  align-items: center;
  background: #1677ff;
  border-radius: 8px;
  color: #fff;
  display: inline-flex;
  font-weight: 600;
  padding: 10px 16px;
}
</style>
