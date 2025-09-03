import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Button,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete, Visibility } from "@mui/icons-material";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import { useNavigate } from "react-router-dom";
import Header from "../../common/Header";
import { getAllInventoryCounts } from "../../api/inventoryApi";

const ListInventoryCount = () => {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch all inventory counts
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getAllInventoryCounts(tenantId);
      console.log("API response:", res);

      // Extract and map the data to match our table structure
      const mappedData = (res?.data?.content || []).map((item) => ({
        id: item.id,
        inventoryNumber: item.inventoryCountNumber,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        storeId: item.storeId,
        countType: item.countType,
        committeeMembers: item.committeeMembersId?.join(", ") || "N/A",
      }));

      setData(mappedData);
    } catch (error) {
      console.error("Error fetching inventory counts:", error);
      setNotification({
        open: true,
        message: "Failed to fetch inventory counts.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete - navigate to delete route
  const handleDelete = (id) => {
    navigate("/inventory-count/delete", {
      state: { inventoryCountId: id },
    });
  };

  // Handle view
  const handleView = (id) => {
    navigate(`/view-inventory-count/${id}`);
  };

  // Handle edit
  const handleEdit = (id) => {
    navigate(`/update-inventory-count/${id}`);
  };

  // Handle create
  const handleCreate = () => {
    navigate("/create-inventory-count");
  };

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId]);

  // Define columns for DataGrid
  const columns = [
    {
      field: "inventoryNumber",
      headerName: "Inventory #",
      flex: 1,
    },
    {
      field: "createdBy",
      headerName: "Created By",
      flex: 1,
    },
    {
      field: "storeId",
      headerName: "Store ID",
      flex: 1,
    },
    {
      field: "countType",
      headerName: "Count Type",
      flex: 1,
    },
    {
      field: "committeeMembers",
      headerName: "Committee Members",
      flex: 1.5,
    },
    {
      field: "createdAt",
      headerName: "Created At",
      flex: 1,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "N/A",
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          {/* <Tooltip title="View">
            <IconButton
              onClick={() => handleView(params.row.id)}
              color="primary"
            >
              <Visibility />
            </IconButton>
          </Tooltip> */}
          <Tooltip title="Edit">
            <IconButton
              onClick={() => handleEdit(params.row.id)}
              color="warning"
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
      <Header subtitle="List of Inventory Counts" />
      <Box m="40px 0 0 0">
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Create New
          </Button>
        </Box>
        <DataGrid
          rows={data}
          columns={columns}
          loading={loading}
          pagination
          pageSizeOptions={[5, 10, 25]}
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

export default ListInventoryCount;
