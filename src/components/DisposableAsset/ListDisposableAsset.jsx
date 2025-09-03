import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  IconButton,
  Box,
  Snackbar,
  Alert,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import { Add, Search, Edit, Delete } from "@mui/icons-material";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import { useNavigate } from "react-router-dom";
import Header from "../../common/Header";

import {
  getAllDisposableAssets,
  deleteDisposableAsset,
  getDepartments,
  getItems,
  getStores,
} from "../../api/inventoryApi";

const ListDisposableAsset = () => {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stores, setStores] = useState([]);

  const navigate = useNavigate();

  // Lookup data
  const fetchLookupData = useCallback(async () => {
    try {
      const [itemsRes, deptRes, storeRes] = await Promise.all([
        getItems(tenantId),
        getDepartments(tenantId),
        getStores(tenantId),
      ]);
      setItems(itemsRes.data || []);
      setDepartments(deptRes.data || []);
      setStores(storeRes.data || []);
    } catch (err) {
      console.error(err);
      setNotification({
        open: true,
        message: "Failed to load lookup data.",
        severity: "error",
      });
    }
  }, [tenantId]);

  // Fetch paginated assets
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllDisposableAssets(tenantId, page, pageSize);
      const content = res.data.content || [];

      const processed = content.map((req) => {
        const departmentName =
          departments.find((d) => d.id === req.departmentId)?.departmentName ||
          "Unknown";
        const storeName =
          stores.find((s) => s.id === req.storeId)?.name || "Unknown";

        const assetDetails = (req.disposableFixedAssetDetails || []).map(
          (detail) => ({
            ...detail,
            itemName:
              items.find((i) => i.id === detail.itemId)?.name || "Unknown",
          })
        );

        return {
          ...req,
          departmentName,
          storeName,
          assetDetails,
        };
      });

      setData(processed);
      setFilteredData(filterData(processed));
      setTotalRows(res.data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setNotification({
        open: true,
        message: "Failed to fetch disposable assets.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, pageSize, departments, stores, items]);

  // Filtering
  const filterData = useCallback(
    (list) => {
      const query = searchQuery.toLowerCase();
      return list.filter(
        (r) =>
          r.drNo?.toLowerCase().includes(query) ||
          r.disposableType?.toLowerCase().includes(query) ||
          r.disposalStatus?.toLowerCase().includes(query) ||
          r.departmentName?.toLowerCase().includes(query) ||
          r.storeName?.toLowerCase().includes(query) ||
          r.assetDetails.some(
            (d) =>
              d.itemName?.toLowerCase().includes(query) ||
              d.description?.toLowerCase().includes(query) ||
              d.batchNo?.toLowerCase().includes(query)
          )
      );
    },
    [searchQuery]
  );

  // Delete
  // const handleDelete = async (id) => {
  //   if (!window.confirm("Delete this request?")) return;
  //   try {
  //     await deleteDisposableAsset(tenantId, id);
  //     setNotification({
  //       open: true,
  //       message: "Deleted successfully.",
  //       severity: "success",
  //     });
  //     fetchData();
  //   } catch (err) {
  //     console.error(err);
  //     setNotification({
  //       open: true,
  //       message: "Failed to delete.",
  //       severity: "error",
  //     });
  //   }
  // };
  const handleDelete = (id) => {
    navigate("/disposable-asset/delete", {
      state: { disposableAssetId: id },
    });
  };
  // Edit
  const handleEdit = (id) => {
    navigate(`/disposable-asset/update/${id}`);
  };

  // Create
  const handleCreate = () => {
    navigate("/create-disposable-asset");
  };

  // Effects
  useEffect(() => {
    fetchLookupData();
  }, [fetchLookupData]);

  useEffect(() => {
    if (departments.length && stores.length && items.length) {
      fetchData();
    }
  }, [fetchData, departments, stores, items]);

  useEffect(() => {
    setFilteredData(filterData(data));
  }, [data, searchQuery, filterData]);

  const columns = [
    { field: "drNo", headerName: "DR No.", flex: 1 },
    { field: "disposableType", headerName: "Type", flex: 1 },
    { field: "disposalStatus", headerName: "Status", flex: 1 },
    { field: "storeName", headerName: "Store", flex: 1 },
    { field: "departmentName", headerName: "Department", flex: 1 },
    {
      field: "requisitionDate",
      headerName: "Requisition Date",
      flex: 1,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "",
    },
    {
      field: "assetDetails",
      headerName: "Items",
      flex: 2,
      renderCell: (params) => (
        <Box>
          {params.value.map((d, idx) => (
            <div key={idx}>
              {d.itemName} — Qty: {d.quantity}
            </div>
          ))}
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Tooltip title="Edit">
            <IconButton
              onClick={() => handleEdit(params.row.id)}
              color="primary"
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              onClick={() => handleDelete(params.row.id)}
              color="error"
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header subtitle="List of Disposable Asset Requests" />
      <Box m="40px 0 0 0">
        <Box display="flex" justifyContent="space-between" mb={2}>
          <TextField
            label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: "300px" }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Create New
          </Button>
        </Box>
        <DataGrid
          rows={filteredData}
          getRowId={(row) => row.id}
          columns={columns}
          loading={loading}
          pagination
          paginationMode="server"
          rowCount={totalRows}
          pageSizeOptions={[5, 10, 25, 50]}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          disableRowSelectionOnClick
          autoHeight
        />
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ListDisposableAsset;
