<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { useVbenDrawer, useVbenForm, z } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { createAssetCategoryApi } from '#/api/asset';

defineOptions({ name: 'CategoryFormDrawer' });

const emit = defineEmits<{
  success: [];
}>();

const assetTypeOptions = [
  { label: '固定资产', value: '固定资产' },
  { label: '无形资产', value: '无形资产' },
  { label: '流动资产', value: '流动资产' },
];

const formSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '请输入分类名称' },
    fieldName: 'categoryName',
    label: '分类名称',
    rules: z.string().min(1, { message: '请输入分类名称' }),
  },
  {
    component: 'Input',
    componentProps: { placeholder: '如 IT-PC、FUR-CHAIR' },
    fieldName: 'categoryCode',
    label: '分类编码',
    rules: z.string().min(1, { message: '请输入分类编码' }),
  },
  {
    component: 'Select',
    componentProps: {
      options: assetTypeOptions,
      placeholder: '请选择资产类型',
    },
    fieldName: 'assetType',
    label: '资产类型',
    rules: z.string().min(1, { message: '请选择资产类型' }),
  },
  {
    component: 'InputNumber',
    componentProps: { min: 1, placeholder: '预计使用月数' },
    fieldName: 'defaultLifeMonth',
    label: '使用年限(月)',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, max: 1, step: 0.01, placeholder: '残值率' },
    fieldName: 'defaultResidualRate',
    label: '残值率',
  },
  {
    component: 'Switch',
    fieldName: 'depreciationRequired',
    label: '需要折旧',
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    formItemClass: 'col-span-2',
  },
  handleSubmit: onSubmit,
  layout: 'vertical',
  schema: formSchema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: async () => {
    await formApi.validate();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      formApi.resetForm();
      formApi.setValues({
        assetType: '固定资产',
        defaultLifeMonth: 60,
        defaultResidualRate: 0.05,
        depreciationRequired: true,
      });
    }
  },
  title: '新增分类',
});

async function onSubmit(values: Record<string, any>) {
  try {
    drawerApi.lock(true);
    await createAssetCategoryApi(values as any);
    message.success('分类创建成功');
    drawerApi.close();
    emit('success');
  } catch {
    message.error('创建失败，请重试');
  } finally {
    drawerApi.unlock();
  }
}

function openDrawer() {
  drawerApi.setData({});
  drawerApi.open();
}

defineExpose({ openDrawer });
</script>

<template>
  <Drawer>
    <Form />
  </Drawer>
</template>
