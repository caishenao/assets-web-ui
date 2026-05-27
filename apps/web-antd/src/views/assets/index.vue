<script lang="ts" setup>
import type {
  AssetCategory,
  AssetDashboard,
  AssetDepreciationRecord,
  AssetFlowRecord,
  AssetInfo,
  AssetInventoryTask,
  AssetRepairRecord,
} from '#/api/asset';

import { computed, h, onMounted, ref, shallowRef } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Col,
  message,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  calculateDepreciationApi,
  createInventoryTaskApi,
  getAssetCategoriesApi,
  getAssetDashboardApi,
  getAssetFlowsApi,
  getAssetListApi,
  getDepreciationRecordsApi,
  getInventoryTasksApi,
  getRepairRecordsApi,
} from '#/api/asset';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import AssetFormDrawer from './components/asset-form-drawer.vue';
import CategoryFormDrawer from './components/category-form-drawer.vue';
import OperationDrawer from './components/operation-drawer.vue';

defineOptions({ name: 'AssetsWorkbench' });

// --- State ---
const dashboard = ref<AssetDashboard>();
const categories = shallowRef<AssetCategory[]>([]);
const assets = shallowRef<AssetInfo[]>([]);
const flows = shallowRef<AssetFlowRecord[]>([]);
const repairs = shallowRef<AssetRepairRecord[]>([]);
const inventoryTasks = shallowRef<AssetInventoryTask[]>([]);
const depreciations = shallowRef<AssetDepreciationRecord[]>([]);
const total = ref(0);
const loading = ref(false);
const selectedRowKeys = ref<number[]>([]);

// Drawer refs
const assetFormDrawerRef = ref<InstanceType<typeof AssetFormDrawer>>();
const categoryFormDrawerRef = ref<InstanceType<typeof CategoryFormDrawer>>();
const operationDrawerRef = ref<InstanceType<typeof OperationDrawer>>();

// --- Helpers ---
function money(value?: number) {
  return new Intl.NumberFormat('zh-CN', {
    currency: 'CNY',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(value ?? 0);
}

function statusColor(status: number): string {
  const map: Record<number, string> = {
    0: 'default',
    1: 'green',
    2: 'cyan',
    3: 'blue',
    5: 'orange',
    7: 'gold',
    8: 'red',
    9: 'volcano',
  };
  return map[status] ?? 'default';
}

const selectedAsset = computed(() =>
  assets.value.find((a) => a.id === selectedRowKeys.value[0]),
);

// --- VxeGrid for Ledger ---
const [LedgerGrid, ledgerGridApi] = useVbenVxeGrid<AssetInfo>({
  gridOptions: {
    columns: [
      { field: 'assetCode', title: '资产编号', width: 140 },
      {
        field: 'assetName',
        title: '资产名称',
        minWidth: 160,
        slots: { default: 'assetNameCell' },
      },
      { field: 'categoryName', title: '分类', width: 120 },
      {
        field: 'status',
        title: '状态',
        width: 100,
        slots: { default: 'statusCell' },
      },
      { field: 'departmentName', title: '部门', width: 120 },
      { field: 'userName', title: '使用人', width: 100 },
      { field: 'locationName', title: '位置', width: 120 },
      {
        field: 'netValue',
        title: '净值',
        width: 120,
        formatter: ({ cellValue }: any) => money(cellValue),
      },
    ],
    keepSource: true,
    proxyConfig: {
      autoLoad: true,
      response: { result: 'records', total: 'total' },
      showActiveMsg: true,
    },
    rowConfig: { keyField: 'id', isCurrent: true, useKey: true },
    pagerConfig: { pageSize: 20 },
  },
  showSearchForm: true,
  formOptions: {
    schema: [
      {
        component: 'Input',
        fieldName: 'assetCode',
        label: '资产编号',
        componentProps: { placeholder: '请输入编号' },
      },
      {
        component: 'Input',
        fieldName: 'assetName',
        label: '资产名称',
        componentProps: { placeholder: '请输入名称' },
      },
      {
        component: 'Select',
        fieldName: 'status',
        label: '状态',
        componentProps: {
          allowClear: true,
          options: [
            { label: '在库', value: 1 },
            { label: '闲置', value: 2 },
            { label: '在用', value: 3 },
            { label: '维修中', value: 5 },
            { label: '待报废', value: 7 },
            { label: '已报废', value: 8 },
          ],
          placeholder: '全部状态',
        },
      },
    ],
    commonConfig: { formItemClass: 'col-span-1' },
    wrapperClass: 'grid-cols-3',
    handleReset: handleSearchReset,
    handleSubmit: handleSearch,
  },
});

async function handleSearch(values: Record<string, any>) {
  const data = await getAssetListApi({
    ...values,
    pageNo: 1,
    pageSize: 20,
  });
  assets.value = data.records;
  total.value = data.total;
  ledgerGridApi.grid?.reloadData(data.records);
}

async function handleSearchReset() {
  const data = await getAssetListApi({ pageNo: 1, pageSize: 20 });
  assets.value = data.records;
  total.value = data.total;
  ledgerGridApi.grid?.reloadData(data.records);
}

// --- Data Loading ---
async function loadAll() {
  loading.value = true;
  try {
    const [
      dashboardData,
      categoryData,
      assetData,
      flowData,
      repairData,
      inventoryData,
      depreciationData,
    ] = await Promise.all([
      getAssetDashboardApi(),
      getAssetCategoriesApi(),
      getAssetListApi({ pageNo: 1, pageSize: 20 }),
      getAssetFlowsApi(),
      getRepairRecordsApi(),
      getInventoryTasksApi(),
      getDepreciationRecordsApi(),
    ]);
    dashboard.value = dashboardData;
    categories.value = categoryData;
    assets.value = assetData.records;
    total.value = assetData.total;
    flows.value = flowData;
    repairs.value = repairData;
    inventoryTasks.value = inventoryData;
    depreciations.value = depreciationData;
    ledgerGridApi.grid?.reloadData(assetData.records);
  } finally {
    loading.value = false;
  }
}

// --- Operations ---
function openCreateAsset() {
  assetFormDrawerRef.value?.openDrawer();
}

function openCreateCategory() {
  categoryFormDrawerRef.value?.openDrawer();
}

function openOperation(type: 'repair' | 'return' | 'scrap' | 'transfer' | 'use') {
  if (!selectedAsset.value) {
    message.warning('请先在台账中选择一笔资产');
    return;
  }
  operationDrawerRef.value?.openDrawer(type, selectedAsset.value);
}

async function createInventory() {
  await createInventoryTaskApi({
    inventoryScope: 'ALL',
    taskName: `盘点任务 ${new Date().toISOString().slice(0, 10)}`,
  });
  message.success('盘点任务已创建');
  await loadAll();
}

async function runDepreciation() {
  await calculateDepreciationApi(new Date().toISOString().slice(0, 7));
  message.success('折旧计算完成');
  await loadAll();
}

function onRowClick({ row }: any) {
  selectedRowKeys.value = [row.id];
}

// --- Table Columns ---
const flowColumns = [
  { title: '类型', dataIndex: 'flowType', key: 'flowType', width: 100 },
  { title: '资产', dataIndex: 'assetName', key: 'assetName' },
  {
    title: '状态变更',
    key: 'statusChange',
    customRender: ({ record }: any) =>
      `${record.beforeStatusName || '-'} → ${record.afterStatusName || '-'}`,
  },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '时间', dataIndex: 'operateTime', key: 'operateTime', width: 180 },
];

const repairColumns = [
  { title: '工单号', dataIndex: 'workOrderNo', key: 'workOrderNo', width: 160 },
  { title: '资产', dataIndex: 'assetName', key: 'assetName' },
  { title: '结果', dataIndex: 'repairResult', key: 'repairResult', width: 100 },
  {
    title: '费用',
    key: 'totalCost',
    width: 120,
    customRender: ({ record }: any) => money(record.totalCost),
  },
];

const categoryColumns = [
  { title: '分类名称', dataIndex: 'categoryName', key: 'categoryName' },
  { title: '分类编码', dataIndex: 'categoryCode', key: 'categoryCode', width: 140 },
  { title: '资产类型', dataIndex: 'assetType', key: 'assetType', width: 120 },
  {
    title: '折旧',
    key: 'depreciation',
    width: 100,
    customRender: ({ record }: any) => {
      return record.depreciationRequired
        ? h(Tag, { color: 'blue' }, () => '需要折旧')
        : h(Tag, null, () => '不折旧');
    },
  },
];

const inventoryColumns = [
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName' },
  { title: '任务编号', dataIndex: 'taskNo', key: 'taskNo', width: 160 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    customRender: ({ record }: any) => {
      return record.status === 2
        ? h(Tag, { color: 'green' }, () => '已完成')
        : h(Tag, { color: 'processing' }, () => '进行中');
    },
  },
];

const depreciationColumns = [
  { title: '资产名称', dataIndex: 'assetName', key: 'assetName' },
  { title: '折旧月份', dataIndex: 'depreciationMonth', key: 'depreciationMonth', width: 120 },
  {
    title: '月折旧额',
    key: 'monthlyDepreciation',
    width: 120,
    customRender: ({ record }: any) => money(record.monthlyDepreciation),
  },
  {
    title: '净值',
    key: 'netValue',
    width: 120,
    customRender: ({ record }: any) => money(record.netValue),
  },
];

onMounted(loadAll);
</script>

<template>
  <Page>
    <!-- Dashboard Metrics -->
    <Row :gutter="[16, 16]" class="mb-5">
      <Col :xs="12" :sm="6">
        <Card :bordered="false" class="shadow-sm">
          <Statistic
            title="资产总数"
            :value="dashboard?.totalAssets ?? 0"
            suffix="件"
          />
          <div class="text-muted mt-1 text-xs">
            本月新增 {{ dashboard?.monthNewAssets ?? 0 }}
          </div>
        </Card>
      </Col>
      <Col :xs="12" :sm="6">
        <Card :bordered="false" class="shadow-sm">
          <Statistic
            title="资产原值"
            :value="dashboard?.originalValue ?? 0"
            :formatter="() => money(dashboard?.originalValue)"
          />
          <div class="text-muted mt-1 text-xs">
            净值 {{ money(dashboard?.netValue) }}
          </div>
        </Card>
      </Col>
      <Col :xs="12" :sm="6">
        <Card :bordered="false" class="shadow-sm">
          <Statistic
            title="在用资产"
            :value="dashboard?.inUseAssets ?? 0"
            suffix="件"
          />
          <div class="text-muted mt-1 text-xs">
            闲置 {{ dashboard?.idleAssets ?? 0 }}
          </div>
        </Card>
      </Col>
      <Col :xs="12" :sm="6">
        <Card :bordered="false" class="shadow-sm">
          <Statistic
            title="风险资产"
            :value="(dashboard?.repairingAssets ?? 0) + (dashboard?.pendingScrapAssets ?? 0)"
            suffix="件"
            :value-style="{ color: '#faad14' }"
          />
          <div class="text-muted mt-1 text-xs">
            维修 {{ dashboard?.repairingAssets ?? 0 }} / 待报废 {{ dashboard?.pendingScrapAssets ?? 0 }}
          </div>
        </Card>
      </Col>
    </Row>

    <!-- Main Content -->
    <Card :bordered="false" class="shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold">资产管理</span>
          <span class="text-muted text-xs">共 {{ total }} 条记录</span>
        </div>
      </template>
      <template #extra>
        <Space>
          <Button type="primary" @click="openCreateAsset">新增资产</Button>
          <Button @click="loadAll" :loading="loading">刷新</Button>
        </Space>
      </template>

      <!-- Ledger with VxeGrid -->
      <LedgerGrid @cell-click="onRowClick">
        <template #assetNameCell="{ row }">
          <div class="flex flex-col">
            <span class="font-medium">{{ row.assetName }}</span>
            <span class="text-muted text-xs">{{ row.brand }} {{ row.model }}</span>
          </div>
        </template>
        <template #statusCell="{ row }">
          <Tag :color="statusColor(row.status)">
            {{ row.statusName }}
          </Tag>
        </template>
      </LedgerGrid>

      <!-- Workflow Actions -->
      <div class="mt-4 flex flex-wrap gap-2 border-t pt-4">
        <span class="text-muted mr-2 text-sm leading-8">
          选中：{{ selectedAsset?.assetName || '未选择' }}
        </span>
        <Button size="small" @click="openOperation('use')">领用</Button>
        <Button size="small" @click="openOperation('return')">归还</Button>
        <Button size="small" @click="openOperation('transfer')">调拨</Button>
        <Button size="small" @click="openOperation('repair')">维修</Button>
        <Button size="small" danger @click="openOperation('scrap')">报废</Button>
      </div>
    </Card>

    <!-- Secondary Sections -->
    <Row :gutter="[16, 16]" class="mt-5">
      <Col :xs="24" :lg="14">
        <Card :bordered="false" class="shadow-sm" title="流转记录">
          <Table
            :columns="flowColumns"
            :data-source="flows"
            :pagination="{ pageSize: 8 }"
            size="small"
            row-key="id"
          />
        </Card>
      </Col>
      <Col :xs="24" :lg="10">
        <Card :bordered="false" class="shadow-sm" title="维修记录">
          <Table
            :columns="repairColumns"
            :data-source="repairs"
            :pagination="{ pageSize: 8 }"
            size="small"
            row-key="id"
          />
        </Card>
      </Col>
    </Row>

    <Row :gutter="[16, 16]" class="mt-5">
      <Col :xs="24" :lg="12">
        <Card :bordered="false" class="shadow-sm" title="资产分类">
          <template #extra>
            <Button size="small" type="primary" @click="openCreateCategory">新增分类</Button>
          </template>
          <Table
            :columns="categoryColumns"
            :data-source="categories"
            :pagination="false"
            size="small"
            row-key="id"
          />
        </Card>
      </Col>
      <Col :xs="24" :lg="12">
        <Card :bordered="false" class="shadow-sm" title="盘点任务">
          <template #extra>
            <Button size="small" type="primary" @click="createInventory">创建盘点</Button>
          </template>
          <Table
            :columns="inventoryColumns"
            :data-source="inventoryTasks"
            :pagination="false"
            size="small"
            row-key="id"
          />
        </Card>

        <Card :bordered="false" class="shadow-sm mt-5" title="折旧记录">
          <template #extra>
            <Button size="small" @click="runDepreciation">执行折旧</Button>
          </template>
          <Table
            :columns="depreciationColumns"
            :data-source="depreciations"
            :pagination="{ pageSize: 6 }"
            size="small"
            row-key="id"
          />
        </Card>
      </Col>
    </Row>

    <!-- Drawers -->
    <AssetFormDrawer
      ref="assetFormDrawerRef"
      :categories="categories"
      @success="loadAll"
    />
    <CategoryFormDrawer
      ref="categoryFormDrawerRef"
      @success="loadAll"
    />
    <OperationDrawer
      ref="operationDrawerRef"
      @success="loadAll"
    />
  </Page>
</template>

<style scoped>
.text-muted {
  color: #8c8c8c;
}
</style>
