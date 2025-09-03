import axios from "axios";

// Environment-based base URLs
// const BASE_URL = import.meta.env.BACKEND_BASE_URL
//   ? `${import.meta.env.BACKEND_BASE_URL}/api`
//   : "http://gateway.172.20.136.101.sslip.io/api";
const BASE_URL = `http://gateway.172.20.136.101.sslip.io/api/inventory`;
// const BASE_URL = `http://172.20.85.31:9190/api/inventory`;
console.log("BAse URL is ", BASE_URL);

const KEYCLOAK_BASE_URL = import.meta.env.KEYCLOAK_BASE_URL
  ? `${import.meta.env.KEYCLOAK_BASE_URL}/realms/${import.meta.env.KEYCLOAK_REALM}/protocol/openid-connect/token`
  : "http://keycloak.172.20.136.101.sslip.io/realms/saas-erp/protocol/openid-connect/token";

// 📦 Token storage (localStorage-based)
function getAccessToken() {
  return localStorage.getItem("accessToken");
}

// 📦 Create API client with token handling
const createApiClient = (baseURL) => {
  const apiClient = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    // withCredentials: true,
  });

  // Attach token to each request
  apiClient.interceptors.request.use(
    async (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Refresh token if expired (401)
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken) {
          try {
            const data = new URLSearchParams({
              grant_type: "refresh_token",
              client_id: import.meta.env.KEYCLOAK_CLIENT_ID || "saas-client",
              client_secret:
                import.meta.env.KEYCLOAK_CLIENT_SECRET ||
                "APHalzvUVsfz9Jffe5ZAZ1XImFwv5a8K",
              refresh_token: refreshToken,
            });

            const response = await axios.post(KEYCLOAK_BASE_URL, data, {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            const newAccessToken = response.data.access_token;
            localStorage.setItem("accessToken", newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return apiClient(originalRequest);
          } catch (refreshError) {
            console.error("🔒 Token refresh failed:", refreshError);
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
};
// 📦 Create API client with multipart support
const createMultipartApiClient = (baseURL) => {
  const apiClient = axios.create({
    baseURL,
    headers: { "Content-Type": "multipart/form-data" },
    // withCredentials: true,
  });

  // Attach token to each request
  apiClient.interceptors.request.use(
    async (config) => {
      const token = localStorage.getItem("accessToken"); // or getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Handle 401 and refresh token
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken) {
          try {
            const data = new URLSearchParams({
              grant_type: "refresh_token",
              client_id: import.meta.env.KEYCLOAK_CLIENT_ID || "saas-client",
              client_secret:
                import.meta.env.KEYCLOAK_CLIENT_SECRET ||
                "APHalzvUVsfz9Jffe5ZAZ1XImFwv5a8K",
              refresh_token: refreshToken,
            });

            const response = await axios.post(KEYCLOAK_BASE_URL, data, {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            const newAccessToken = response.data.access_token;
            localStorage.setItem("accessToken", newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return apiClient(originalRequest);
          } catch (refreshError) {
            console.error("🔒 Token refresh failed:", refreshError);
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
};

// 📁 API clients

const apiClient_inventory = createApiClient(`${BASE_URL}/inventory-count`);
const apiClient_store = createApiClient(
  `http://gateway.172.20.136.101.sslip.io/api/store`
);
const apiClient_committee = createApiClient(`${BASE_URL}/committee`);
const apiClient_employee = createApiClient(
  `http://gateway.172.20.136.101.sslip.io/api/employee`
);
const apiClient_item = createApiClient(
  `http://gateway.172.20.136.101.sslip.io/api/item`
);
const apiClient_fixedAssetTransfer = createApiClient(
  `${BASE_URL}/fixed-asset-transfer`
);
const apiClient_organization = createApiClient(
  `http://gateway.172.20.136.101.sslip.io/api/organization`
);
// const apiClient_disposable = createApiClient(`${BASE_URL}/disposable`);
const apiClient_disposableAssets = createApiClient(
  `${BASE_URL}/disposable-assets`
);
const apiClient_fixedAssetDisposal = createMultipartApiClient(
  `${BASE_URL}/fixed-asset-disposal`
);
const apiClient_fixedAssetReturn = createApiClient(
  `${BASE_URL}/fixed-asset-return`
);

const apiClient_lostFixedAsset = createMultipartApiClient(
  `${BASE_URL}/lost-fixed-asset`
);
const apiClient_lostStockItem = createApiClient(`${BASE_URL}/lost-stock-item`);
const apiClient_needAssessment = createApiClient(`${BASE_URL}/need-assessment`);
const apiClient_stockDisposal = createApiClient(`${BASE_URL}/stock-disposal`);
// 📦 InventoryBalance API Client
const apiClient_inventoryBalance = createApiClient(
  `${BASE_URL}/inventory-balance`
);

// InventoryAPIs
export const createInventoryCount = (tenantId, data) =>
  apiClient_inventory.post(`/${tenantId}/add`, data);
export const getAllInventoryCounts = (tenantId) =>
  apiClient_inventory.get(`/${tenantId}/get-all`);
export const getInventoryCountById = (tenantId, id) =>
  apiClient_inventory.get(`/${tenantId}/get-by-id/${id}`);
export const updateInventoryCount = (tenantId, id, data) =>
  apiClient_inventory.put(`${tenantId}/update/${id}`, data);
export const deleteInventoryCount = (tenantId, id) =>
  apiClient_inventory.delete(`${tenantId}/delete/${id}`);

export const getStores = (tenantId) =>
  apiClient_store.get(`/stores/${tenantId}/get-all`);

export const getCommittees = (tenantId) =>
  apiClient_committee.get(`/committees/${tenantId}/get-all`);

export const getEmployees = (tenantId) =>
  apiClient_employee.get(`/employees/${tenantId}/get-all`);

export const getEmployeeById = (tenantId, username) =>
  apiClient_employee.get(`/employees/${tenantId}/get/${username}`);

export const getItems = (tenantId) =>
  apiClient_item.get(`/items/${tenantId}/get-all`);

export const getinventoryCountNumber = (tenantId) =>
  apiClient_inventory.get(`${tenantId}/next-count-number`);

// Fixed Asset APis

export const getDepartments = (tenantId) =>
  apiClient_organization.get(`/departments/${tenantId}/get-all`);

export const createFixedAssetTransfer = (tenantId, data) =>
  apiClient_fixedAssetTransfer.post(`/${tenantId}/add`, data);

export const getAllFixedAssetTransfers = (tenantId, page = 0, size = 10) =>
  apiClient_fixedAssetTransfer.get(
    `/${tenantId}/get-all?page=${page}&size=${size}`
  );

export const getFixedAssetTransferById = (tenantId, id) =>
  apiClient_fixedAssetTransfer.get(`/${tenantId}/get/${id}`);

export const updateFixedAssetTransfer = (tenantId, id, data) =>
  apiClient_fixedAssetTransfer.put(`/${tenantId}/update/${id}`, data);

export const deleteFixedAssetTransfer = (tenantId, id) =>
  apiClient_fixedAssetTransfer.delete(`/${tenantId}/delete/${id}`);
export const getFixedAssetTransferNumber = (tenantId) =>
  apiClient_fixedAssetTransfer.get(`/${tenantId}/next-transfer-number`);
// NEW: ✅ CRUD for Disposable Asset (these are the replacements)
export const createDisposableRequest = (tenantId, data) =>
  apiClient_disposableAssets.post(`/${tenantId}/add`, data);
export const getDrNo = (tenantId) =>
  apiClient_disposableAssets.get(`/${tenantId}/next-drNo-number`);
// apiClient_disposable.get(`{tenantId}/next-drNo-number?tenantId=${tenantId}`);

export const getAllDisposableRequests = (tenantId, page = 0, size = 10) =>
  apiClient_disposableAssets.get(
    `/${tenantId}/get-all?page=${page}&size=${size}`
  );
export const getAllDisposableAssets = (tenantId) =>
  apiClient_disposableAssets.get(`/${tenantId}/get-all`);
export const getDisposableAssetById = (tenantId, id) =>
  apiClient_disposableAssets.get(`/${tenantId}/get/${id}`);

export const updateDisposableAsset = (tenantId, id, data) =>
  apiClient_disposableAssets.put(`/${tenantId}/update/${id}`, data);

export const deleteDisposableAsset = (tenantId, id) =>
  apiClient_disposableAssets.delete(`/${tenantId}/delete/${id}`);

// ✅ FixedAssetDisposal APIs
// 📁 FixedAssetDisposal APIs
export const getNextFixedAssetDisposalNumber = (tenantId) =>
  apiClient_fixedAssetDisposal.get(`/${tenantId}/next-FAD-number`);
export const getFixedAssetDisposalById = (tenantId, disposalId) =>
  apiClient_fixedAssetDisposal.get(`/${tenantId}/get/${disposalId}`);
export const getAllFixedAssetDisposals = (tenantId) =>
  apiClient_fixedAssetDisposal.get(`/${tenantId}/get-all`);

// export const createFixedAssetDisposal = (tenantId, data) =>
//   apiClient_fixedAssetDisposal.post(`/${tenantId}/add`, data);
export const createFixedAssetDisposal = (tenantId, payload, file) => {
  const formData = new FormData();

  // JSON goes under "request"
  formData.append(
    "request",
    new Blob([JSON.stringify(payload)], { type: "application/json" })
  );

  // optional file
  if (file) {
    formData.append("file", file);
  }

  return apiClient_fixedAssetDisposal.post(`/${tenantId}/add`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateFixedAssetDisposal = (
  tenantId,
  disposalId,
  payload,
  file
) => {
  const formData = new FormData();
  formData.append(
    "request",
    new Blob([JSON.stringify(payload)], { type: "application/json" })
  );
  if (file) {
    formData.append("file", file);
  }
  return apiClient_fixedAssetDisposal.put(
    `/${tenantId}/update/${disposalId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};
export const deleteFixedAssetDisposal = (tenantId, disposalId) =>
  apiClient_fixedAssetDisposal.delete(`/${tenantId}/delete/${disposalId}`);

// export const getDisposalReasons = (tenantId) =>
//   apiClient_disposal.get(`/disposal-reason/${tenantId}/get-all`);

// export const getDisposalCommittees = (tenantId) =>
//   apiClient_disposal.get(`/disposal-committee/${tenantId}/get-all`);

export const getAssets = (tenantId) =>
  apiClient_disposableAssets.get(`/asset/${tenantId}/get-all`);

// 📦 FixedAssetReturn APIs

export const createFixedAssetReturn = (tenantId, formData) =>
  apiClient_fixedAssetReturn.post(`/${tenantId}/add`, formData);
export const getNextFixedAssetReturnNumber = (tenantId) =>
  apiClient_fixedAssetReturn.get(`/${tenantId}/next-return-number`);
export const getAllFixedAssetReturns = (tenantId) =>
  apiClient_fixedAssetReturn.get(`/${tenantId}/get-all`);

export const getFixedAssetReturnById = (tenantId, returnId) =>
  apiClient_fixedAssetReturn.get(`/${tenantId}/get/${returnId}`);

export const updateFixedAssetReturn = (tenantId, returnId, formData) =>
  apiClient_fixedAssetReturn.put(`/${tenantId}/update/${returnId}`, formData);

export const deleteFixedAssetReturn = (tenantId, returnId) =>
  apiClient_fixedAssetReturn.delete(`/${tenantId}/delete/${returnId}`);

export const changeFixedAssetReturnStatus = (tenantId, returnId, status) =>
  apiClient_fixedAssetReturn.put(
    `/return/${tenantId}/change-status/${returnId}`,
    { status }
  );

// ✅ CRUD API functions for Inventory Balance

export const createInventoryBalance = (tenantId, data) =>
  apiClient_inventoryBalance.post(`/${tenantId}/add`, data);

export const getAllInventoryBalances = (tenantId, page = 0, size = 10) =>
  apiClient_inventoryBalance.get(
    `/${tenantId}/get-all?page=${page}&size=${size}`
  );
export const updateInventoryBalance = (tenantId, disposalId, data) =>
  apiClient_inventoryBalance.put(`/${tenantId}/update/${disposalId}`, data);
export const getInventoryBalanceById = (tenantId, id) =>
  apiClient_inventoryBalance.get(`/${tenantId}/get/${id}`);

export const deleteInventoryBalance = (tenantId, id) =>
  apiClient_inventoryBalance.delete(`/${tenantId}/delete/${id}`);

// // InventoryCount APIs

// // export const createInventoryCount = (tenantId, data) =>
// //   apiClient_inventory.post(`/${tenantId}/inventory-count/add`, data);

// export const getInventoryCounts = (tenantId, page = 1, size = 10) =>
//   apiClient.get(`/inventory-count/${tenantId}/list?page=${page}&size=${size}`);

// // export const createInventoryCount = (tenantId, data) =>
// //   apiClient.post(`/inventory-count/${tenantId}/create`, data);

// export const updateInventoryCount = (tenantId, id, data) =>
//   apiClient.put(`/inventory-count/${tenantId}/update/${id}`, data);

// export const deleteInventoryCount = (tenantId, id) =>
//   apiClient.delete(`/inventory-count/${tenantId}/delete/${id}`);

// export const getInventoryCountById = (tenantId, id) =>
//   apiClient.get(`/inventory-count/${tenantId}/get/${id}`);

// ✅ CRUD for LostFixedAsset

export const createLostFixedAsset = (tenantId, formData) =>
  apiClient_lostFixedAsset.post(`/${tenantId}/add`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getNextLostItemNo = (tenantId) =>
  apiClient_lostFixedAsset.get(`${tenantId}/next-LostItem-number`);
export const getAllLostFixedAssets = (tenantId, page = 0, size = 10) =>
  apiClient_lostFixedAsset.get(
    `/${tenantId}/get-all?page=${page}&size=${size}`
  );

export const getLostFixedAssetById = (tenantId, id) =>
  apiClient_lostFixedAsset.get(`/${tenantId}/get/${id}`);

export const updateLostFixedAsset = (tenantId, id, formData) =>
  apiClient_lostFixedAsset.put(`/${tenantId}/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteLostFixedAsset = (tenantId, id) =>
  apiClient_lostFixedAsset.delete(`/${tenantId}/delete/${id}`);

// ✅ CRUD for LostStockItem

// export const createLostStockItem = (tenantId, formData) =>
//   apiClient_lostStockItem.post(`/${tenantId}/add`, formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
export const createLostStockItem = (tenantId, payload, file) => {
  const formData = new FormData();

  // JSON request body
  formData.append(
    "request",
    new Blob([JSON.stringify(payload)], { type: "application/json" })
  );

  // Optional file
  if (file) {
    formData.append("file", file);
  }

  return apiClient_lostStockItem.post(`/${tenantId}/add`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getNextLostStockItemNumber = (tenantId) =>
  apiClient_lostStockItem.get(`/${tenantId}/next-Item-number`);
export const getAllLostStockItems = (tenantId, page = 0, size = 10) =>
  apiClient_lostStockItem.get(`/${tenantId}/get-all?page=${page}&size=${size}`);

export const getLostStockItemById = (tenantId, id) =>
  apiClient_lostStockItem.get(`/${tenantId}/get-by-id/${id}`);

// export const updateLostStockItem = (tenantId, id, formData) =>
//   apiClient_lostStockItem.put(`/${tenantId}/update/${id}`, formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
export const updateLostStockItem = (tenantId, id, payload, file) => {
  const formData = new FormData();

  // JSON request body
  formData.append(
    "request",
    new Blob([JSON.stringify(payload)], { type: "application/json" })
  );

  // Optional file
  if (file) {
    formData.append("file", file);
  }

  return apiClient_lostStockItem.put(`/${tenantId}/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteLostStockItem = (tenantId, id) =>
  apiClient_lostStockItem.delete(`/${tenantId}/delete/${id}`);

// NEW: ✅ CRUD for Need Assessment
export const createNeedAssessment = (tenantId, data) =>
  apiClient_needAssessment.post(`/${tenantId}/add`, data);

export const getAllNeedAssessments = (tenantId, page = 0, size = 10) =>
  apiClient_needAssessment.get(
    `/${tenantId}/get-all?page=${page}&size=${size}`
  );

export const getNeedAssessmentById = (tenantId, id) =>
  apiClient_needAssessment.get(`/${tenantId}/get/${id}`);

export const updateNeedAssessment = (tenantId, id, data) =>
  apiClient_needAssessment.put(`/${tenantId}/update/${id}`, data);

export const deleteNeedAssessment = (tenantId, id) =>
  apiClient_needAssessment.delete(`/${tenantId}/delete/${id}`);

// NEW: ✅ CRUD for Stock Disposal
export const getTenantDetail = (tenantId) =>
  apiClient_organization.get(`/tenants/get/${tenantId}`);

export const getDisposalNumber = (tenantId) =>
  apiClient_stockDisposal.get(`/${tenantId}/next-disposal-number`);
// export const createStockDisposal = (tenantId, formData) =>
//   apiClient_stockDisposal.post(`/${tenantId}/create`, formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
export const createStockDisposal = (tenantId, payload, file) => {
  const formData = new FormData();

  // JSON request body
  formData.append(
    "request",
    new Blob([JSON.stringify(payload)], { type: "application/json" })
  );

  // Optional file
  if (file) {
    formData.append("file", file);
  }

  return apiClient_stockDisposal.post(`/${tenantId}/create`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getStockDisposalById = (tenantId, id) =>
  apiClient_stockDisposal.get(`/${tenantId}/${id}`);

export const getAllStockDisposals = (tenantId, page = 0, size = 10) =>
  apiClient_stockDisposal.get(`/${tenantId}/get-all?page=${page}&size=${size}`);

export const updateStockDisposal = (tenantId, id, request, file) => {
  const formData = new FormData();
  formData.append(
    "request",
    new Blob([JSON.stringify(request)], { type: "application/json" })
  );
  if (file) {
    formData.append("file", file);
  } else {
    formData.append("file", new Blob([]), ""); // Send empty blob if no file to avoid errors
  }
  return apiClient_stockDisposal.put(`/${tenantId}/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteStockDisposal = (tenantId, id) =>
  apiClient_stockDisposal.delete(`/${tenantId}/delete/${id}`);
