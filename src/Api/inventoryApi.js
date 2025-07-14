import axios from "axios";

const BASE_URL = (import.meta.env.BACKEND_BASE_URL ? 
    `${import.meta.env.BACKEND_BASE_URL}/api` : 
    'http://gateway.172.20.136.101.sslip.io/api');
const KEYCLOAK_BASE_URL = (import.meta.env.KEYCLOAK_BASE_URL ? 
    `${import.meta.env.KEYCLOAK_BASE_URL}/realms/${import.meta.env.KEYCLOAK_REALM}/protocol/openid-connect/token` :
    'http://keycloak.172.20.136.101.sslip.io/realms/saas-erp/protocol/openid-connect/token');

const createApiClient = (baseURL) => {
  const api = axios.create({ baseURL });
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return api;
};

const apiClient_inventory = createApiClient(`${BASE_URL}/inventory`);
const apiClient_store = createApiClient(`${BASE_URL}/store`);
const apiClient_committee = createApiClient(`${BASE_URL}/committee`);
const apiClient_employee = createApiClient(`${BASE_URL}/employee`);
const apiClient_item = createApiClient(`${BASE_URL}/item`);

export const createInventoryCount = (tenantId, data) => {
  return apiClient_inventory.post(`/counts/${tenantId}/add`, data);
};

export const getStores = (tenantId) => {
  return apiClient_store.get(`/stores/${tenantId}/get-all`);
};

export const getCommittees = (tenantId) => {
  return apiClient_committee.get(`/committees/${tenantId}/get-all`);
};

export const getEmployees = (tenantId) => {
  return apiClient_employee.get(`/employees/${tenantId}/get-all`);
};

export const getItems = (tenantId) => {
  return apiClient_item.get(`/items/${tenantId}/get-all`);
};
