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
  getAllFixedAssetDisposals,
  deleteFixedAssetDisposal,
} from "../../api/inventoryApi";

const FixedAssetDisposalList = () => {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const navigate = useNavigate();

  const [disposals, setDisposals] = useState([]);
  const [filteredDisposals, setFilteredDisposals] = useState([]);
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

  // Fetch paginated disposals
  const fetchDisposals = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await getAllFixedAssetDisposals(
        tenantId,
        page,
        pageSize
      );
      console.log("response is ", response);
      setDisposals(response.data.content);
      setTotalRows(response.data.totalElements);
    } catch (error) {
      console.error("Error fetching disposal records:", error);
      setNotification({
        open: true,
        message: "Failed to fetch disposal records.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, pageSize]);

  // Filter disposals
  const filterDisposals = useCallback(
    (data) => {
      if (!searchQuery) return data;

      const searchLower = searchQuery.toLowerCase();
      return data.filter((d) => {
        return (
          (d.id?.toLowerCase() || "").includes(searchLower) ||
          (d.createdBy?.toLowerCase() || "").includes(searchLower) ||
          (d.fixedAssetDisposalNo?.toLowerCase() || "").includes(searchLower) ||
          (d.disposalStatus?.toLowerCase() || "").includes(searchLower) ||
          (d.createdAt?.toLowerCase() || "").includes(searchLower)
        );
      });
    },
    [searchQuery]
  );

  useEffect(() => {
    fetchDisposals();
  }, [fetchDisposals]);

  useEffect(() => {
    if (disposals.length > 0) {
      setFilteredDisposals(filterDisposals(disposals));
    } else {
      setFilteredDisposals([]);
    }
  }, [disposals, searchQuery, filterDisposals]);

  const handleDelete = (id) => {
    navigate("/fixed-asset-disposal/delete", {
      state: { fixedAssetDisposalId: id },
    });
  };

  const handleEdit = (id) => {
    navigate(`/fixed-asset-disposal/update/${id}`);
  };

  const handleCreate = () => {
    navigate("/create-fixed-asset-disposal");
  };

  const handleView = (id) => {
    navigate(`/fixed-asset-disposal/${id}`);
  };

  const columns = [
    { field: "id", headerName: "ID", flex: 1.5 },
    { field: "fixedAssetDisposalNo", headerName: "Disposal No", flex: 1 },
    {
      field: "approvedDate",
      headerName: "Approved Date",
      flex: 1,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "",
    },
    {
      field: "proposedDate",
      headerName: "Proposed Date",
      flex: 1,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "",
    },
    { field: "disposalStatus", headerName: "Status", flex: 1 },
    { field: "createdBy", headerName: "Created By", flex: 1 },
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
      flex: 1.5,
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
      <Header subtitle="List of Fixed Asset Disposals" />
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
            getRowId={(row) => row.id}
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

export default FixedAssetDisposalList;
