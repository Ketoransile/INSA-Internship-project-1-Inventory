import React, { useState, useEffect, useCallback } from "react";
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
  getAllNeedAssessments,
  getDepartments,
  getStores,
} from "../../api/inventoryApi";

const ListNeedAssessment = () => {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stores, setStores] = useState([]);
  const [departmentMap, setDepartmentMap] = useState({});
  const [storeMap, setStoreMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch assessments
  const fetchAssessments = useCallback(async () => {
    if (!tenantId) return setLoading(false);
    try {
      setLoading(true);
      const res = await getAllNeedAssessments(tenantId, page, pageSize);
      setAssessments(res.data.content || []);
      setTotalRows(res.data.totalElements || 0);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      setNotification({
        open: true,
        message: "Failed to fetch assessments",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, pageSize]);

  // Fetch departments and stores
  useEffect(() => {
    if (!tenantId) return;
    async function fetchData() {
      try {
        const [deptRes, storeRes] = await Promise.all([
          getDepartments(tenantId),
          getStores(tenantId),
        ]);
        setDepartments(deptRes.data || []);
        setStores(storeRes.data || []);

        const dMap = {};
        deptRes.data.forEach((d) => {
          dMap[d.id] = d.departmentName;
        });
        setDepartmentMap(dMap);

        const sMap = {};
        storeRes.data.forEach((s) => {
          sMap[s.id] = s.storeName;
        });
        setStoreMap(sMap);
      } catch (error) {
        console.error("Failed to fetch departments/stores", error);
      }
    }
    fetchData();
  }, [tenantId]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Filter assessments
  const filterAssessments = useCallback(
    (data) => {
      if (!searchQuery) return data;
      const q = searchQuery.toLowerCase();
      return data.filter(
        (d) =>
          (d.id?.toLowerCase() || "").includes(q) ||
          (d.purchaseType?.toLowerCase() || "").includes(q) ||
          (d.departmentId?.toLowerCase() || "").includes(q) ||
          (d.storeId?.toLowerCase() || "").includes(q)
      );
    },
    [searchQuery]
  );

  useEffect(() => {
    setFilteredAssessments(filterAssessments(assessments));
  }, [assessments, searchQuery, filterAssessments]);

  // Navigation handlers
  const handleEdit = (id) => {
    navigate(`/need-assessment/update/${id}`);
  };
  const handleDelete = (id) => {
    navigate("/need-assessment/delete", { state: { needAssessmentId: id } });
  };
  const handleCreate = () => {
    navigate("/create-need-assessment");
  };

  // Table columns
  const columns = [
    { field: "purchaseType", headerName: "Purchase Type", flex: 1 },
    {
      field: "departmentName",
      headerName: "Department",
      flex: 1,
      valueGetter: (params) =>
        params?.row ? departmentMap[params.row.departmentId] || "" : "",
    },
    {
      field: "storeName",
      headerName: "Store",
      flex: 1,
      valueGetter: (params) =>
        params?.row ? storeMap[params.row.storeId] || "" : "",
    },
    {
      field: "createdAt",
      headerName: "Created At",
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
      <Header subtitle="List of Need Assessments" />
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
            rows={filteredAssessments}
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

export default ListNeedAssessment;
