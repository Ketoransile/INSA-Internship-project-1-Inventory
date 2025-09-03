import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  IconButton,
  Box,
  Button,
  Snackbar,
  Alert,
  Tooltip,
  TextField,
  InputAdornment,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Delete, Edit, Search } from "@mui/icons-material";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import { useNavigate } from "react-router-dom";
import Header from "../../common/Header";
import {
  getAllInventoryBalances,
  deleteInventoryBalance,
} from "../../api/inventoryApi";

const InventoryBalanceList = () => {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const navigate = useNavigate();

  const [inventoryBalances, setInventoryBalances] = useState([]);
  const [filteredBalances, setFilteredBalances] = useState([]);
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

  // Fetch paginated inventory balances
  const fetchInventoryBalances = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await getAllInventoryBalances(tenantId, page, pageSize);
      setInventoryBalances(response.data.content);
      setTotalRows(response.data.totalElements);
    } catch (error) {
      console.error("Error fetching inventory balance records:", error);
      setNotification({
        open: true,
        message: "Failed to fetch inventory balance records.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, pageSize]);

  // Filter inventory balances based on search query
  const filterBalances = useCallback(
    (data) => {
      if (!searchQuery) return data;

      const searchLower = searchQuery.toLowerCase();
      return data.filter((balance) => {
        return (
          (balance.id?.toLowerCase() || "").includes(searchLower) ||
          (balance.createdBy?.toLowerCase() || "").includes(searchLower) ||
          (balance.inventoryCountId?.toLowerCase() || "").includes(
            searchLower
          ) ||
          (balance.storeType?.toLowerCase() || "").includes(searchLower) ||
          (balance.createdAt?.toLowerCase() || "").includes(searchLower)
        );
      });
    },
    [searchQuery]
  );

  // Effect to fetch inventory balances when page, pageSize, or tenantId changes
  useEffect(() => {
    fetchInventoryBalances();
  }, [fetchInventoryBalances]);

  // Effect to filter data
  useEffect(() => {
    if (inventoryBalances.length > 0) {
      setFilteredBalances(filterBalances(inventoryBalances));
    } else {
      setFilteredBalances([]);
    }
  }, [inventoryBalances, searchQuery, filterBalances]);

  const handleDelete = (id) => {
    navigate("/inventory-balance/delete", {
      state: { inventoryBalanceId: id },
    });
  };

  const handleEdit = (id) => {
    navigate(`/inventory-balance/update/${id}`);
  };

  const handleCreate = () => {
    navigate("/create-inventory-balance");
  };

  const handleView = (id) => {
    navigate(`/inventory-balance/${id}`);
  };

  const columns = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "inventoryCountId", headerName: "Inventory Count ID", flex: 1.5 },
    { field: "storeType", headerName: "Store Type", flex: 1 },
    { field: "createdBy", headerName: "Prepared By", flex: 1.5 },
    {
      field: "createdAt",
      headerName: "Prepared On",
      flex: 1,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : "";
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.5,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Tooltip title="View">
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
      <Header subtitle="List of Inventory Balances" />
      <Box m="40px 0 0 0" height="75vh">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <TextField
            label="Search"
            variant="outlined"
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
          <Button variant="contained" color="primary" onClick={handleCreate}>
            Create New
          </Button>
        </Box>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="60vh"
          >
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredBalances}
            columns={columns}
            loading={loading}
            paginationMode="server"
            rowCount={totalRows}
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            autoHeight
          />
        )}
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryBalanceList;
