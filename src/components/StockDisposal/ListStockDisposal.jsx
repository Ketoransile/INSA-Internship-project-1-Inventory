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
import { Delete, Edit, Search } from "@mui/icons-material";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import { useNavigate } from "react-router-dom";
import Header from "../../common/Header";
import {
  getAllStockDisposals,
  getStores,
  getDepartments,
} from "../../api/inventoryApi";

const ListStockDisposal = () => {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const navigate = useNavigate();

  const [disposals, setDisposals] = useState([]);
  const [filteredDisposals, setFilteredDisposals] = useState([]);
  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [storeMap, setStoreMap] = useState({});
  const [departmentMap, setDepartmentMap] = useState({});
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

  // Fetch stock disposals
  const fetchDisposals = useCallback(async () => {
    if (!tenantId) return setLoading(false);
    try {
      setLoading(true);
      const response = await getAllStockDisposals(tenantId, page, pageSize);
      setDisposals(response.data.content || []);
      setTotalRows(response.data.totalElements || 0);
    } catch (error) {
      console.error("Error fetching stock disposals:", error);
      setNotification({
        open: true,
        message: "Failed to fetch stock disposals.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, pageSize]);

  // Fetch stores and departments
  useEffect(() => {
    const fetchStoresAndDepartments = async () => {
      try {
        const storesRes = await getStores(tenantId);
        const departmentsRes = await getDepartments(tenantId);

        setStores(storesRes.data || []);
        setDepartments(departmentsRes.data || []);

        const sMap = {};
        storesRes.data.forEach((s) => {
          sMap[s.id] = s.name;
        });
        setStoreMap(sMap);

        const dMap = {};
        departmentsRes.data.forEach((d) => {
          dMap[d.id] = d.name;
        });
        setDepartmentMap(dMap);
      } catch (error) {
        console.error("Failed to fetch stores/departments", error);
      }
    };

    if (tenantId) fetchStoresAndDepartments();
  }, [tenantId]);

  // Filter disposals based on search
  const filterDisposals = useCallback(
    (data) => {
      if (!searchQuery) return data;
      const q = searchQuery.toLowerCase();
      return data.filter(
        (d) =>
          (d.disposalNo?.toLowerCase() || "").includes(q) ||
          (d.storeId?.toLowerCase() || "").includes(q) ||
          (d.departmentId?.toLowerCase() || "").includes(q) ||
          (d.createdBy?.toLowerCase() || "").includes(q) ||
          (d.proposeDate?.toLowerCase() || "").includes(q)
      );
    },
    [searchQuery]
  );

  useEffect(() => {
    fetchDisposals();
  }, [fetchDisposals]);

  useEffect(() => {
    setFilteredDisposals(filterDisposals(disposals));
  }, [disposals, searchQuery, filterDisposals]);

  const handleDelete = (id) => {
    navigate("/stock-disposal/delete", { state: { stockDisposalId: id } });
  };

  const handleEdit = (id) => {
    navigate(`/stock-disposal/update/${id}`);
  };

  const handleCreate = () => {
    navigate("/create-stock-disposal");
  };

  const columns = [
    { field: "disposalNo", headerName: "Disposal No", flex: 1 },
    {
      field: "storeName",
      headerName: "Store",
      flex: 1,
      valueGetter: (params) =>
        params?.row ? storeMap[params.row.storeId] || params.row.storeId : "",
    },
    {
      field: "departmentName",
      headerName: "Department",
      flex: 1,
      valueGetter: (params) =>
        params?.row
          ? departmentMap[params.row.departmentId] || params.row.departmentId
          : "",
    },

    {
      field: "proposeDate",
      headerName: "Propose Date",
      flex: 1,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "",
    },
    { field: "createdBy", headerName: "Created By", flex: 1 },
    { field: "disposalStatus", headerName: "Status", flex: 1 },
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
      <Header subtitle="List of Stock Disposals" />
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
            rows={filteredDisposals}
            columns={columns}
            getRowId={(row) => row.id}
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

export default ListStockDisposal;
