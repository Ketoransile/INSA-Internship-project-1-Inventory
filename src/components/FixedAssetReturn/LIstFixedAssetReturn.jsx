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
  getAllFixedAssetReturns,
  deleteFixedAssetReturn,
  getDepartments,
  getItems,
  getStores,
} from "../../api/inventoryApi";

const ListFixedAssetReturn = () => {
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

  // Fetch paginated fixed asset returns
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllFixedAssetReturns(tenantId, page, pageSize);
      const content = res.data.content || [];

      const processed = content.map((req) => {
        const departmentName =
          departments.find((d) => d.id === req.departmentId)?.departmentName ||
          "Unknown";
        const storeName =
          stores.find((s) => s.id === req.storeId)?.name || "Unknown";

        const assetDetails = (req.returnDetails || []).map((detail) => ({
          ...detail,
          itemName:
            items.find((i) => i.id === detail.itemId)?.name || "Unknown",
        }));

        return {
          ...req,
          returnNo: req.assetReturnNo,
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
        message: "Failed to fetch fixed asset returns.",
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
          r.returnNo?.toLowerCase().includes(query) ||
          r.returnStatus?.toLowerCase().includes(query) ||
          r.departmentName?.toLowerCase().includes(query) ||
          r.storeName?.toLowerCase().includes(query) ||
          r.assetDetails.some(
            (d) =>
              d.itemName?.toLowerCase().includes(query) ||
              d.serialNo?.toLowerCase().includes(query)
          )
      );
    },
    [searchQuery]
  );

  // Delete
  const handleDelete = (id) => {
    navigate("/fixed-asset-return/delete", {
      state: { fixedAssetReturnId: id },
    });
  };

  // Edit
  const handleEdit = (id) => {
    navigate(`/fixed-asset-return/update/${id}`);
  };

  // Create
  const handleCreate = () => {
    navigate("/create-fixed-asset-return");
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
    { field: "returnNo", headerName: "Return No.", flex: 1 },
    { field: "returnStatus", headerName: "Status", flex: 1 },
    { field: "storeName", headerName: "Store", flex: 1 },
    { field: "departmentName", headerName: "Department", flex: 1 },
    // Returned Date column commented out as per request
    // {
    //   field: "returnedDate",
    //   headerName: "Returned Date",
    //   flex: 1,
    //   valueFormatter: (params) => {
    //     if (!params?.value) return "";
    //     try {
    //       return new Date(params.value).toLocaleDateString();
    //     } catch {
    //       return params.value;
    //     }
    //   },
    // },
    {
      field: "assetDetails",
      headerName: "Returned Items",
      flex: 2,
      renderCell: (params) => (
        <Box>
          {params.value && params.value.length > 0 ? (
            params.value.map((d, idx) => (
              <div key={idx}>
                {d.itemName} — Qty: {d.quantity} — Serial: {d.serialNo}
              </div>
            ))
          ) : (
            <span>No Items</span>
          )}
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
      <Header subtitle="List of Fixed Asset Returns" />
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

export default ListFixedAssetReturn;
