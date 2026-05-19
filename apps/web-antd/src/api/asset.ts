import { requestClient } from '#/api/request';

export interface PageResult<T> {
  records: T[];
  total: number;
}

export interface StatPoint {
  amount: number;
  count: number;
  name: string;
}

export interface AssetDashboard {
  categoryStats: StatPoint[];
  departmentStats: StatPoint[];
  idleAssets: number;
  inUseAssets: number;
  monthNewAssets: number;
  monthScrapAssets: number;
  netValue: number;
  originalValue: number;
  pendingScrapAssets: number;
  repairingAssets: number;
  statusStats: StatPoint[];
  totalAssets: number;
  valueTrend: StatPoint[];
}

export interface AssetCategory {
  assetType?: string;
  categoryCode: string;
  categoryName: string;
  defaultLifeMonth?: number;
  defaultResidualRate?: number;
  depreciationRequired?: boolean;
  id: number;
  oneItemOneCode?: boolean;
  parentId?: number;
  sortOrder?: number;
  status?: number;
}

export interface AssetInfo {
  assetCode: string;
  assetName: string;
  assetType?: string;
  brand?: string;
  categoryId: number;
  categoryName: string;
  departmentId?: number;
  departmentName?: string;
  id: number;
  locationId?: number;
  locationName?: string;
  model?: string;
  netValue: number;
  originalValue: number;
  purchaseDate?: string;
  qrCode?: string;
  remark?: string;
  residualRate?: number;
  serialNumber?: string;
  status: number;
  statusName: string;
  usefulLifeMonth?: number;
  userId?: number;
  userName?: string;
  warehouseId?: number;
  warehouseName?: string;
}

export interface AssetFlowRecord {
  afterStatusName?: string;
  assetCode: string;
  assetName: string;
  beforeStatusName?: string;
  flowType: string;
  id: number;
  operateTime: string;
  remark?: string;
}

export interface AssetRepairRecord {
  assetCode: string;
  assetName: string;
  faultDescription?: string;
  id: number;
  repairResult: string;
  totalCost: number;
  workOrderNo: string;
}

export interface AssetInventoryTask {
  id: number;
  status: number;
  taskName: string;
  taskNo: string;
}

export interface AssetDepreciationRecord {
  assetCode: string;
  assetName: string;
  depreciationMonth: string;
  id: number;
  monthlyDepreciation: number;
  netValue: number;
}

export interface AssetQuery {
  assetCode?: string;
  assetName?: string;
  categoryId?: number;
  pageNo?: number;
  pageSize?: number;
  status?: number;
}

export function getAssetDashboardApi() {
  return requestClient.get<AssetDashboard>('/assets/dashboard');
}

export function getAssetListApi(params: AssetQuery) {
  return requestClient.get<PageResult<AssetInfo>>('/assets', { params });
}

export function createAssetApi(data: Partial<AssetInfo>) {
  return requestClient.post<AssetInfo>('/assets', data);
}

export function getAssetDetailApi(id: number) {
  return requestClient.get<Record<string, any>>(`/assets/${id}`);
}

export function getAssetCategoriesApi() {
  return requestClient.get<AssetCategory[]>('/assets/categories');
}

export function createAssetCategoryApi(data: Partial<AssetCategory>) {
  return requestClient.post<AssetCategory>('/assets/categories', data);
}

export function createUseOrderApi(data: Record<string, any>) {
  return requestClient.post('/assets/use-orders', data);
}

export function returnAssetApi(data: Record<string, any>) {
  return requestClient.post('/assets/return', data);
}

export function transferAssetApi(data: Record<string, any>) {
  return requestClient.post('/assets/transfer-orders', data);
}

export function createRepairOrderApi(data: Record<string, any>) {
  return requestClient.post<AssetRepairRecord>('/assets/repair-orders', data);
}

export function completeRepairApi(id: number, data: Record<string, any>) {
  return requestClient.post<AssetRepairRecord>(
    `/assets/repair-orders/${id}/complete`,
    data,
  );
}

export function scrapAssetApi(data: Record<string, any>) {
  return requestClient.post('/assets/scrap-orders', data);
}

export function getAssetFlowsApi(assetId?: number) {
  return requestClient.get<AssetFlowRecord[]>('/assets/flows', {
    params: assetId ? { assetId } : {},
  });
}

export function getRepairRecordsApi() {
  return requestClient.get<AssetRepairRecord[]>('/assets/repair-orders');
}

export function createInventoryTaskApi(data: Record<string, any>) {
  return requestClient.post<AssetInventoryTask>('/assets/inventory-tasks', data);
}

export function getInventoryTasksApi() {
  return requestClient.get<AssetInventoryTask[]>('/assets/inventory-tasks');
}

export function calculateDepreciationApi(month?: string) {
  return requestClient.post<AssetDepreciationRecord[]>(
    '/assets/depreciation/calculate',
    undefined,
    { params: month ? { month } : {} },
  );
}

export function getDepreciationRecordsApi() {
  return requestClient.get<AssetDepreciationRecord[]>('/assets/depreciation');
}
