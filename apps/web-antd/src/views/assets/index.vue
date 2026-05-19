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

import { computed, onMounted, reactive, ref } from 'vue';

import {
  calculateDepreciationApi,
  completeRepairApi,
  createAssetApi,
  createAssetCategoryApi,
  createInventoryTaskApi,
  createRepairOrderApi,
  createUseOrderApi,
  getAssetCategoriesApi,
  getAssetDashboardApi,
  getAssetFlowsApi,
  getAssetListApi,
  getDepreciationRecordsApi,
  getInventoryTasksApi,
  getRepairRecordsApi,
  returnAssetApi,
  scrapAssetApi,
  transferAssetApi,
} from '#/api/asset';

defineOptions({ name: 'AssetsWorkbench' });

const statusOptions = [
  { label: 'Draft', value: 0 },
  { label: 'In Stock', value: 1 },
  { label: 'Idle', value: 2 },
  { label: 'In Use', value: 3 },
  { label: 'Repairing', value: 5 },
  { label: 'Pending Scrap', value: 7 },
  { label: 'Scrapped', value: 8 },
  { label: 'Lost', value: 9 },
];

const dashboard = ref<AssetDashboard>();
const categories = ref<AssetCategory[]>([]);
const assets = ref<AssetInfo[]>([]);
const flows = ref<AssetFlowRecord[]>([]);
const repairs = ref<AssetRepairRecord[]>([]);
const inventoryTasks = ref<AssetInventoryTask[]>([]);
const depreciations = ref<AssetDepreciationRecord[]>([]);
const total = ref(0);
const loading = ref(false);
const activeTab = ref('ledger');
const selectedAssetId = ref<number>();

const filters = reactive({
  assetCode: '',
  assetName: '',
  categoryId: undefined as number | undefined,
  pageNo: 1,
  pageSize: 20,
  status: undefined as number | undefined,
});

const assetForm = reactive({
  assetName: 'New Asset',
  brand: '',
  categoryId: undefined as number | undefined,
  model: '',
  originalValue: 1000,
  purchasePrice: 1000,
  serialNumber: '',
});

const categoryForm = reactive({
  assetType: 'Fixed Asset',
  categoryCode: '',
  categoryName: '',
  defaultLifeMonth: 60,
  defaultResidualRate: 0.05,
  depreciationRequired: true,
});

const operationForm = reactive({
  applicantName: 'Demo User',
  departmentName: 'Administration',
  faultDescription: 'Device failure',
  locationName: 'A-101',
  reason: 'Business change',
  repairDescription: 'Repaired and verified',
  toDepartmentName: 'Operations',
  toUserName: 'Li Si',
});

const selectedAsset = computed(() =>
  assets.value.find((asset) => asset.id === selectedAssetId.value),
);

const categoryMap = computed(() =>
  Object.fromEntries(categories.value.map((item) => [item.id, item.categoryName])),
);

function money(value?: number) {
  return new Intl.NumberFormat('zh-CN', {
    currency: 'CNY',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(value ?? 0);
}

function statusClass(status: number) {
  if ([1, 2].includes(status)) return 'ok';
  if (status === 3) return 'work';
  if ([5, 6, 7, 9].includes(status)) return 'warn';
  if (status === 8) return 'off';
  return 'draft';
}

function selectAsset(asset: AssetInfo) {
  selectedAssetId.value = asset.id;
}

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
      getAssetListApi(filters),
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
    selectedAssetId.value = selectedAssetId.value ?? assets.value[0]?.id;
    assetForm.categoryId = assetForm.categoryId ?? categories.value[0]?.id;
  } finally {
    loading.value = false;
  }
}

async function searchAssets() {
  filters.pageNo = 1;
  const data = await getAssetListApi(filters);
  assets.value = data.records;
  total.value = data.total;
  selectedAssetId.value = assets.value[0]?.id;
}

async function createAsset() {
  if (!assetForm.categoryId) return;
  await createAssetApi({
    ...assetForm,
    categoryName: categoryMap.value[assetForm.categoryId],
    status: 2,
  });
  await loadAll();
}

async function createCategory() {
  await createAssetCategoryApi(categoryForm);
  categoryForm.categoryCode = '';
  categoryForm.categoryName = '';
  await loadAll();
}

function requireSelected() {
  if (!selectedAsset.value) {
    throw new Error('Select an asset first');
  }
  return selectedAsset.value;
}

async function useSelectedAsset() {
  const asset = requireSelected();
  await createUseOrderApi({
    applicantId: 3001,
    applicantName: operationForm.applicantName,
    assetIds: [asset.id],
    departmentId: 2001,
    departmentName: operationForm.departmentName,
    locationName: operationForm.locationName,
    useReason: operationForm.reason,
  });
  await loadAll();
}

async function returnSelectedAsset(returnStatus = 'NORMAL') {
  const asset = requireSelected();
  await returnAssetApi({
    assetId: asset.id,
    returnStatus,
    returnUserId: asset.userId,
    remark: operationForm.reason,
  });
  await loadAll();
}

async function transferSelectedAsset() {
  const asset = requireSelected();
  await transferAssetApi({
    assetIds: [asset.id],
    reason: operationForm.reason,
    toDepartmentId: 2002,
    toDepartmentName: operationForm.toDepartmentName,
    toLocationName: operationForm.locationName,
    toUserId: 3002,
    toUserName: operationForm.toUserName,
  });
  await loadAll();
}

async function repairSelectedAsset() {
  const asset = requireSelected();
  const repair = await createRepairOrderApi({
    assetId: asset.id,
    faultDescription: operationForm.faultDescription,
    repairType: 'INTERNAL',
    repairUserName: 'Repair Engineer',
  });
  await completeRepairApi(repair.id, {
    laborCost: 120,
    materialCost: 80,
    repairDescription: operationForm.repairDescription,
    repairResult: 'FIXED',
  });
  await loadAll();
}

async function scrapSelectedAsset() {
  const asset = requireSelected();
  await scrapAssetApi({
    assetId: asset.id,
    disposalMethod: 'RECYCLE',
    reason: operationForm.reason,
  });
  await loadAll();
}

async function createInventoryTask() {
  await createInventoryTaskApi({
    inventoryScope: 'ALL',
    taskName: `Inventory ${new Date().toISOString().slice(0, 10)}`,
  });
  await loadAll();
}

async function calculateDepreciation() {
  await calculateDepreciationApi(new Date().toISOString().slice(0, 7));
  await loadAll();
}

onMounted(loadAll);
</script>

<template>
  <main class="asset-page">
    <section class="asset-toolbar">
      <div>
        <h1>Asset Management Platform</h1>
        <p>Asset intake, use, return, transfer, repair, inventory, depreciation and scrap workflow.</p>
      </div>
      <button class="primary" :disabled="loading" @click="loadAll">Refresh</button>
    </section>

    <section class="metric-grid">
      <article class="metric">
        <span>Total Assets</span>
        <strong>{{ dashboard?.totalAssets ?? 0 }}</strong>
        <small>New this month {{ dashboard?.monthNewAssets ?? 0 }}</small>
      </article>
      <article class="metric">
        <span>Original Value</span>
        <strong>{{ money(dashboard?.originalValue) }}</strong>
        <small>Net value {{ money(dashboard?.netValue) }}</small>
      </article>
      <article class="metric">
        <span>In Use</span>
        <strong>{{ dashboard?.inUseAssets ?? 0 }}</strong>
        <small>Idle {{ dashboard?.idleAssets ?? 0 }}</small>
      </article>
      <article class="metric">
        <span>Risk Assets</span>
        <strong>{{ (dashboard?.repairingAssets ?? 0) + (dashboard?.pendingScrapAssets ?? 0) }}</strong>
        <small>Repair {{ dashboard?.repairingAssets ?? 0 }} / Scrap {{ dashboard?.pendingScrapAssets ?? 0 }}</small>
      </article>
    </section>

    <section class="tabs">
      <button :class="{ active: activeTab === 'ledger' }" @click="activeTab = 'ledger'">Ledger</button>
      <button :class="{ active: activeTab === 'flow' }" @click="activeTab = 'flow'">Flows</button>
      <button :class="{ active: activeTab === 'category' }" @click="activeTab = 'category'">Categories</button>
      <button :class="{ active: activeTab === 'inventory' }" @click="activeTab = 'inventory'">Inventory</button>
    </section>

    <section v-if="activeTab === 'ledger'" class="workbench">
      <div class="panel grow">
        <div class="panel-title">
          <h2>Asset Ledger</h2>
          <span>{{ total }} records</span>
        </div>
        <div class="filters">
          <input v-model="filters.assetCode" placeholder="Asset code" />
          <input v-model="filters.assetName" placeholder="Asset name" />
          <select v-model="filters.categoryId">
            <option :value="undefined">All categories</option>
            <option v-for="item in categories" :key="item.id" :value="item.id">
              {{ item.categoryName }}
            </option>
          </select>
          <select v-model="filters.status">
            <option :value="undefined">All status</option>
            <option v-for="item in statusOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
          <button class="primary" @click="searchAssets">Search</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Department</th>
                <th>User</th>
                <th>Location</th>
                <th>Net Value</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="asset in assets"
                :key="asset.id"
                :class="{ selected: asset.id === selectedAssetId }"
                @click="selectAsset(asset)"
              >
                <td>{{ asset.assetCode }}</td>
                <td>
                  <strong>{{ asset.assetName }}</strong>
                  <small>{{ asset.brand }} {{ asset.model }}</small>
                </td>
                <td>{{ asset.categoryName }}</td>
                <td><span class="status" :class="statusClass(asset.status)">{{ asset.statusName }}</span></td>
                <td>{{ asset.departmentName || 'Unassigned' }}</td>
                <td>{{ asset.userName || '-' }}</td>
                <td>{{ asset.locationName || '-' }}</td>
                <td>{{ money(asset.netValue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <aside class="panel side">
        <div class="panel-title"><h2>Quick Intake</h2></div>
        <label>Name<input v-model="assetForm.assetName" /></label>
        <label>Category
          <select v-model="assetForm.categoryId">
            <option v-for="item in categories" :key="item.id" :value="item.id">
              {{ item.categoryName }}
            </option>
          </select>
        </label>
        <label>Brand<input v-model="assetForm.brand" /></label>
        <label>Model<input v-model="assetForm.model" /></label>
        <label>Original Value<input v-model.number="assetForm.originalValue" type="number" /></label>
        <button class="primary wide" @click="createAsset">Create Asset</button>

        <div class="divider"></div>
        <div class="panel-title compact">
          <h2>Workflow</h2>
          <span>{{ selectedAsset?.assetName || 'No asset selected' }}</span>
        </div>
        <label>Department<input v-model="operationForm.departmentName" /></label>
        <label>User<input v-model="operationForm.applicantName" /></label>
        <label>Location<input v-model="operationForm.locationName" /></label>
        <div class="action-grid">
          <button @click="useSelectedAsset">Use</button>
          <button @click="returnSelectedAsset('NORMAL')">Return</button>
          <button @click="transferSelectedAsset">Transfer</button>
          <button @click="repairSelectedAsset">Repair</button>
          <button @click="returnSelectedAsset('FAULT')">Fault Return</button>
          <button class="danger" @click="scrapSelectedAsset">Scrap</button>
        </div>
      </aside>
    </section>

    <section v-if="activeTab === 'flow'" class="workbench">
      <div class="panel grow">
        <div class="panel-title"><h2>Asset Flow Records</h2></div>
        <div class="timeline">
          <article v-for="flow in flows" :key="flow.id">
            <span>{{ flow.flowType }}</span>
            <strong>{{ flow.assetName }}</strong>
            <p>{{ flow.beforeStatusName || '-' }} -> {{ flow.afterStatusName || '-' }} 路 {{ flow.remark || 'No remark' }}</p>
            <small>{{ flow.operateTime }}</small>
          </article>
        </div>
      </div>
      <aside class="panel side">
        <div class="panel-title"><h2>Repair History</h2></div>
        <article v-for="record in repairs" :key="record.id" class="list-card">
          <strong>{{ record.workOrderNo }}</strong>
          <span>{{ record.assetName }}</span>
          <small>{{ record.repairResult }} / {{ money(record.totalCost) }}</small>
        </article>
      </aside>
    </section>

    <section v-if="activeTab === 'category'" class="workbench">
      <div class="panel grow">
        <div class="panel-title"><h2>Asset Categories</h2></div>
        <div class="category-grid">
          <article v-for="item in categories" :key="item.id">
            <strong>{{ item.categoryName }}</strong>
            <span>{{ item.categoryCode }}</span>
            <small>{{ item.assetType }} 路 {{ item.depreciationRequired ? 'Depreciable' : 'No depreciation' }}</small>
          </article>
        </div>
      </div>
      <aside class="panel side">
        <div class="panel-title"><h2>New Category</h2></div>
        <label>Name<input v-model="categoryForm.categoryName" /></label>
        <label>Code<input v-model="categoryForm.categoryCode" placeholder="IT-PC" /></label>
        <label>Asset Type<input v-model="categoryForm.assetType" /></label>
        <label>Life Months<input v-model.number="categoryForm.defaultLifeMonth" type="number" /></label>
        <label>Residual Rate<input v-model.number="categoryForm.defaultResidualRate" type="number" step="0.01" /></label>
        <button class="primary wide" @click="createCategory">Save Category</button>
      </aside>
    </section>

    <section v-if="activeTab === 'inventory'" class="workbench">
      <div class="panel grow">
        <div class="panel-title">
          <h2>Inventory Tasks</h2>
          <button class="primary" @click="createInventoryTask">Create Inventory</button>
        </div>
        <div class="category-grid">
          <article v-for="task in inventoryTasks" :key="task.id">
            <strong>{{ task.taskName }}</strong>
            <span>{{ task.taskNo }}</span>
            <small>{{ task.status === 2 ? 'Completed' : 'In Progress' }}</small>
          </article>
        </div>
      </div>
      <aside class="panel side">
        <div class="panel-title">
          <h2>Depreciation</h2>
          <button @click="calculateDepreciation">Run Month</button>
        </div>
        <article v-for="record in depreciations" :key="record.id" class="list-card">
          <strong>{{ record.assetName }}</strong>
          <span>{{ record.depreciationMonth }}</span>
          <small>Monthly {{ money(record.monthlyDepreciation) }} / Net {{ money(record.netValue) }}</small>
        </article>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.asset-page { color: #1f2937; display: flex; flex-direction: column; gap: 16px; padding: 20px; }
.asset-toolbar, .panel, .metric { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
.asset-toolbar { align-items: center; display: flex; justify-content: space-between; padding: 18px 20px; }
h1, h2, p { margin: 0; }
h1 { font-size: 24px; font-weight: 700; }
h2 { font-size: 16px; font-weight: 700; }
.asset-toolbar p { color: #64748b; margin-top: 6px; }
.metric-grid { display: grid; gap: 12px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.metric { display: flex; flex-direction: column; gap: 6px; padding: 16px; }
.metric span, .metric small, .panel-title span, td small, .list-card small, .category-grid small { color: #64748b; }
.metric strong { font-size: 24px; }
.tabs { display: flex; gap: 8px; }
button { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; color: #0f172a; cursor: pointer; min-height: 34px; padding: 0 12px; }
button.primary, .tabs button.active { background: #1677ff; border-color: #1677ff; color: #fff; }
button.danger { border-color: #ef4444; color: #dc2626; }
button.wide { width: 100%; }
.workbench { display: flex; gap: 16px; }
.grow { flex: 1; min-width: 0; }
.side { flex: 0 0 340px; }
.panel { padding: 16px; }
.panel-title { align-items: center; display: flex; justify-content: space-between; margin-bottom: 14px; }
.panel-title.compact { align-items: flex-start; flex-direction: column; gap: 4px; }
.filters { display: grid; gap: 8px; grid-template-columns: repeat(5, minmax(0, 1fr)); margin-bottom: 12px; }
input, select { border: 1px solid #cbd5e1; border-radius: 6px; min-height: 34px; padding: 0 10px; width: 100%; }
label { color: #475569; display: flex; flex-direction: column; font-size: 13px; gap: 6px; margin-bottom: 10px; }
.table-wrap { overflow: auto; }
table { border-collapse: collapse; min-width: 920px; width: 100%; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; text-align: left; }
th { color: #475569; font-size: 13px; font-weight: 600; }
tr.selected { background: #eff6ff; }
td strong, td small { display: block; }
.status { border-radius: 999px; display: inline-flex; font-size: 12px; padding: 2px 8px; }
.status.ok { background: #dcfce7; color: #166534; }
.status.work { background: #dbeafe; color: #1d4ed8; }
.status.warn { background: #fef3c7; color: #92400e; }
.status.off { background: #fee2e2; color: #991b1b; }
.status.draft { background: #f1f5f9; color: #475569; }
.divider { border-top: 1px solid #e5e7eb; margin: 16px 0; }
.action-grid { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.timeline { display: flex; flex-direction: column; gap: 10px; }
.timeline article, .list-card, .category-grid article { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
.timeline span { color: #1677ff; font-size: 12px; font-weight: 700; }
.timeline p { color: #475569; margin: 4px 0; }
.timeline small { color: #94a3b8; }
.list-card, .category-grid article { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.category-grid { display: grid; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
@media (max-width: 1100px) { .metric-grid, .filters, .category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .workbench { flex-direction: column; } .side { flex-basis: auto; } }
@media (max-width: 700px) { .asset-toolbar { align-items: flex-start; flex-direction: column; gap: 12px; } .metric-grid, .filters, .category-grid { grid-template-columns: 1fr; } }
</style>
