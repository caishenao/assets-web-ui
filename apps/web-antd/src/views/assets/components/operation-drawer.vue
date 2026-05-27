<script lang="ts" setup>
import type { AssetInfo } from '#/api/asset';
import type { VbenFormSchema } from '@vben/common-ui';

import { ref } from 'vue';

import { useVbenDrawer, useVbenForm, z } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import {
  completeRepairApi,
  createRepairOrderApi,
  createUseOrderApi,
  returnAssetApi,
  scrapAssetApi,
  transferAssetApi,
} from '#/api/asset';

defineOptions({ name: 'OperationDrawer' });

const emit = defineEmits<{
  success: [];
}>();

type OperationType = 'repair' | 'return' | 'scrap' | 'transfer' | 'use';

const operationType = ref<OperationType>('use');
const currentAsset = ref<AssetInfo | null>(null);

const operationTitles: Record<OperationType, string> = {
  repair: '维修资产',
  return: '归还资产',
  scrap: '报废资产',
  transfer: '调拨资产',
  use: '领用资产',
};

const baseSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { disabled: true },
    fieldName: 'assetName',
    label: '资产名称',
  },
];

function buildSchema(type: OperationType): VbenFormSchema[] {
  switch (type) {
    case 'repair': {
      return [
        ...baseSchema,
        {
          component: 'Input',
          componentProps: { placeholder: '请描述故障现象' },
          fieldName: 'faultDescription',
          label: '故障描述',
          rules: z.string().min(1, { message: '请描述故障' }),
        },
        {
          component: 'Input',
          componentProps: { placeholder: '维修人员' },
          fieldName: 'repairUserName',
          label: '维修人员',
        },
      ];
    }

    case 'return': {
      return [
        ...baseSchema,
        {
          component: 'Input',
          componentProps: { placeholder: '归还备注' },
          fieldName: 'remark',
          label: '备注',
        },
      ];
    }

    case 'scrap': {
      return [
        ...baseSchema,
        {
          component: 'Select',
          componentProps: {
            options: [
              { label: '回收处理', value: 'RECYCLE' },
              { label: '捐赠', value: 'DONATE' },
              { label: '销毁', value: 'DESTROY' },
            ],
            placeholder: '请选择处置方式',
          },
          fieldName: 'disposalMethod',
          label: '处置方式',
          rules: z.string().min(1, { message: '请选择处置方式' }),
        },
        {
          component: 'Textarea',
          componentProps: { placeholder: '报废原因', rows: 3 },
          fieldName: 'reason',
          label: '报废原因',
          rules: z.string().min(1, { message: '请填写报废原因' }),
        },
      ];
    }

    case 'transfer': {
      return [
        ...baseSchema,
        {
          component: 'Input',
          componentProps: { placeholder: '目标部门' },
          fieldName: 'toDepartmentName',
          label: '目标部门',
          rules: z.string().min(1, { message: '请填写目标部门' }),
        },
        {
          component: 'Input',
          componentProps: { placeholder: '接收人' },
          fieldName: 'toUserName',
          label: '接收人',
        },
        {
          component: 'Input',
          componentProps: { placeholder: '新位置' },
          fieldName: 'toLocationName',
          label: '目标位置',
        },
        {
          component: 'Input',
          componentProps: { placeholder: '调拨原因' },
          fieldName: 'reason',
          label: '调拨原因',
        },
      ];
    }

    case 'use': {
      return [
        ...baseSchema,
        {
          component: 'Input',
          componentProps: { placeholder: '领用人姓名' },
          fieldName: 'applicantName',
          label: '领用人',
          rules: z.string().min(1, { message: '请填写领用人' }),
        },
        {
          component: 'Input',
          componentProps: { placeholder: '所在部门' },
          fieldName: 'departmentName',
          label: '部门',
          rules: z.string().min(1, { message: '请填写部门' }),
        },
        {
          component: 'Input',
          componentProps: { placeholder: '使用位置' },
          fieldName: 'locationName',
          label: '使用位置',
        },
        {
          component: 'Input',
          componentProps: { placeholder: '领用原因' },
          fieldName: 'useReason',
          label: '领用原因',
        },
      ];
    }

    default: {
      return baseSchema;
    }
  }
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    formItemClass: 'col-span-2',
  },
  handleSubmit: onSubmit,
  layout: 'vertical',
  schema: baseSchema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: async () => {
    await formApi.validate();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<{
        asset?: AssetInfo;
        type?: OperationType;
      }>();
      operationType.value = data?.type ?? 'use';
      currentAsset.value = data?.asset ?? null;

      drawerApi.setState({
        title: operationTitles[operationType.value],
      });

      formApi.setState({ schema: buildSchema(operationType.value) });
      formApi.resetForm();
      formApi.setValues({
        applicantName: 'Demo User',
        assetName: currentAsset.value?.assetName ?? '',
        departmentName: '行政部',
        disposalMethod: 'RECYCLE',
        locationName: 'A-101',
      });
    }
  },
  title: '业务操作',
});

async function onSubmit(values: Record<string, any>) {
  const asset = currentAsset.value;
  if (!asset) {
    message.error('未选择资产');
    return;
  }

  try {
    drawerApi.lock(true);

    switch (operationType.value) {
      case 'repair': {
        const repair = await createRepairOrderApi({
          assetId: asset.id,
          faultDescription: values.faultDescription,
          repairType: 'INTERNAL',
          repairUserName: values.repairUserName || '维修工程师',
        });
        await completeRepairApi(repair.id, {
          laborCost: 120,
          materialCost: 80,
          repairDescription: '维修完成，已验证',
          repairResult: 'FIXED',
        });
        break;
      }
      case 'return': {
        await returnAssetApi({
          assetId: asset.id,
          returnStatus: 'NORMAL',
          returnUserId: asset.userId,
          remark: values.remark,
        });
        break;
      }
      case 'scrap': {
        await scrapAssetApi({
          assetId: asset.id,
          disposalMethod: values.disposalMethod,
          reason: values.reason,
        });
        break;
      }
      case 'transfer': {
        await transferAssetApi({
          assetIds: [asset.id],
          reason: values.reason,
          toDepartmentId: 2002,
          toDepartmentName: values.toDepartmentName,
          toLocationName: values.toLocationName,
          toUserId: 3002,
          toUserName: values.toUserName,
        });
        break;
      }
      case 'use': {
        await createUseOrderApi({
          applicantId: 3001,
          applicantName: values.applicantName,
          assetIds: [asset.id],
          departmentId: 2001,
          departmentName: values.departmentName,
          locationName: values.locationName,
          useReason: values.useReason,
        });
        break;
      }
    }

    message.success('操作成功');
    drawerApi.close();
    emit('success');
  } catch {
    message.error('操作失败，请重试');
  } finally {
    drawerApi.unlock();
  }
}

function openDrawer(type: OperationType, asset: AssetInfo) {
  drawerApi.setData({ asset, type });
  drawerApi.open();
}

defineExpose({ openDrawer });
</script>

<template>
  <Drawer>
    <Form />
  </Drawer>
</template>
