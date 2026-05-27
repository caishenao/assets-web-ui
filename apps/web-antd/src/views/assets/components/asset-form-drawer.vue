<script lang="ts" setup>
import type { AssetCategory, AssetInfo } from '#/api/asset';
import type { VbenFormSchema } from '@vben/common-ui';

import { ref, watch } from 'vue';

import { useVbenDrawer, useVbenForm, z } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { createAssetApi } from '#/api/asset';

defineOptions({ name: 'AssetFormDrawer' });

const props = defineProps<{
  categories: AssetCategory[];
}>();

const emit = defineEmits<{
  success: [];
}>();

const categoryOptions = ref<{ label: string; value: number }[]>([]);

watch(
  () => props.categories,
  (cats) => {
    categoryOptions.value = cats.map((c) => ({
      label: c.categoryName,
      value: c.id,
    }));
  },
  { immediate: true },
);

const formSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '请输入资产名称' },
    fieldName: 'assetName',
    label: '资产名称',
    rules: z.string().min(1, { message: '请输入资产名称' }),
  },
  {
    component: 'Select',
    componentProps: {
      options: categoryOptions,
      placeholder: '请选择资产分类',
    },
    fieldName: 'categoryId',
    label: '资产分类',
    rules: z.number({ required_error: '请选择资产分类' }),
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入品牌' },
    fieldName: 'brand',
    label: '品牌',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入型号' },
    fieldName: 'model',
    label: '型号',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, placeholder: '请输入原值', prefix: '¥' },
    fieldName: 'originalValue',
    label: '原值',
    rules: z.number().min(0, { message: '原值不能为负数' }),
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, placeholder: '请输入采购价格', prefix: '¥' },
    fieldName: 'purchasePrice',
    label: '采购价格',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入序列号' },
    fieldName: 'serialNumber',
    label: '序列号',
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
      const data = drawerApi.getData<{ asset?: AssetInfo }>();
      if (data?.asset) {
        formApi.setValues(data.asset);
      } else {
        formApi.resetForm();
        formApi.setValues({
          assetName: 'New Asset',
          originalValue: 1000,
          purchasePrice: 1000,
        });
      }
    }
  },
  title: '新增资产',
});

async function onSubmit(values: Record<string, any>) {
  try {
    drawerApi.lock(true);
    const category = props.categories.find(
      (c) => c.id === values.categoryId,
    );
    await createAssetApi({
      ...values,
      categoryName: category?.categoryName ?? '',
      status: 2,
    });
    message.success('资产创建成功');
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
