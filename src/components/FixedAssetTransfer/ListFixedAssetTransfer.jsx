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
} from "@mui/material";
import { Delete, Edit, Add, Search } from "@mui/icons-material";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import { useNavigate } from "react-router-dom";
import Header from "../../common/Header";
import {
  getAllFixedAssetTransfers,
  getDepartments,
  getEmployees,
  getItems,
} from "../../api/inventoryApi";

const ListFixedAssetTransfer = () => {
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

  // Lookup states
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);

  const navigate = useNavigate();

  // --- Fetch lookup data ---
  const fetchLookupData = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [employeesRes, departmentsRes, itemsRes] = await Promise.all([
        getEmployees(tenantId),
        getDepartments(tenantId),
        getItems(tenantId),
      ]);
      setEmployees(employeesRes.data || []);
      setDepartments(departmentsRes.data || []);
      setItems(itemsRes.data || []);
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      setNotification({
        open: true,
        message: "Failed to load necessary lookup data.",
        severity: "error",
      });
    }
  }, [tenantId]);

  // --- Fetch transfers ---
  const fetchTransfers = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const res = await getAllFixedAssetTransfers(tenantId, page, pageSize);
      const content = res.data.content || [];

      // Process rows with lookup names
      const processed = content.map((transfer) => {
        const departmentName =
          departments.find((d) => d.id === transfer.departmentId)
            ?.departmentName || "Unknown";
        const transferToName =
          departments.find((d) => d.id === transfer.transferToId)
            ?.departmentName || "Unknown";
        const transferFromName =
          departments.find((d) => d.id === transfer.transferFromId)
            ?.departmentName || "Unknown";

        const transferDetailsWithNames = (transfer.transferDetails || []).map(
          (detail) => ({
            ...detail,
            itemName:
              items.find((i) => i.id === detail.itemId)?.itemName || "Unknown",
          })
        );

        return {
          ...transfer,
          departmentName,
          transferToName,
          transferFromName,
          transferDetailsWithNames,
          processedBy: transfer.createdBy || "Unknown",
          processedOn: transfer.createdAt,
        };
      });

      setData(processed);
      setFilteredData(filterTransfers(processed));
      setTotalRows(res.data.totalElements || 0);
    } catch (error) {
      console.error("Error fetching fixed asset transfers:", error);
      setNotification({
        open: true,
        message: "Failed to fetch fixed asset transfers.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, pageSize, departments, items]);

  // --- Filtering ---
  const filterTransfers = useCallback(
    (list) => {
      if (!searchQuery) return list;
      const query = searchQuery.toLowerCase();

      return list.filter(
        (transfer) =>
          transfer.transferNo?.toLowerCase().includes(query) ||
          transfer.departmentName?.toLowerCase().includes(query) ||
          transfer.transferToName?.toLowerCase().includes(query) ||
          transfer.transferFromName?.toLowerCase().includes(query) ||
          transfer.processedBy?.toLowerCase().includes(query) ||
          transfer.transferType?.toLowerCase().includes(query) ||
          transfer.transferDetailsWithNames.some(
            (d) =>
              d.itemName?.toLowerCase().includes(query) ||
              d.tagNumber?.toLowerCase().includes(query) ||
              d.quantity?.toString().toLowerCase().includes(query) ||
              d.remark?.toLowerCase().includes(query) ||
              d.description?.toLowerCase().includes(query)
          )
      );
    },
    [searchQuery]
  );

  // --- Effects ---
  useEffect(() => {
    fetchLookupData();
  }, [fetchLookupData]);

  useEffect(() => {
    if (departments.length && items.length) {
      fetchTransfers();
    }
  }, [fetchTransfers, departments, items]);

  useEffect(() => {
    setFilteredData(filterTransfers(data));
  }, [data, searchQuery, filterTransfers]);

  // --- Actions ---
  const handleDelete = (id) => {
    navigate("/fixed-asset-transfer/delete", {
      state: { fixedAssetTransferId: id },
    });
  };

  const handleEdit = (id) => {
    navigate(`/fixed-asset-transfer/update/${id}`);
  };

  const handleCreate = () => {
    navigate("/create-fixed-asset-transfer");
  };

  // --- Table Columns ---
  const columns = [
    { field: "transferNo", headerName: "Transfer No.", flex: 1 },
    { field: "departmentName", headerName: "Department", flex: 1.5 },
    { field: "transferFromName", headerName: "Transfer From", flex: 1.5 },
    { field: "transferToName", headerName: "Transfer To", flex: 1.5 },
    { field: "transferType", headerName: "Transfer Type", flex: 1 },
    { field: "processedBy", headerName: "Processed By", flex: 1.5 },
    {
      field: "processedOn",
      headerName: "Processed On",
      flex: 1,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "",
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
      <Header subtitle="List of Fixed Asset Transfers" />
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
            rows={filteredData}
            getRowId={(row) => row.id}
            columns={columns}
            loading={loading}
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
        )}
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

export default ListFixedAssetTransfer;
