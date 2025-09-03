import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Paper,
  IconButton,
  Grid,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import { v4 as uuidv4 } from "uuid";
import Header from "../../common/Header";
import {
  createLostFixedAsset,
  getStores,
  getDepartments,
  getItems,
  getNextLostItemNo,
} from "../../api/inventoryApi";
import { useNavigate } from "react-router-dom";

const CreateLostFixedAsset = () => {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const tenantName = authState.username || "";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [lostItemNo, setLostItemNo] = useState("");

  // Form state
  const [storeId, setStoreId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [registrationDate, setRegistrationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [lostItemDetails, setLostItemDetails] = useState([
    {
      id: uuidv4(),
      itemId: "",
      duration: "",
      description: "",
      remark: "",
    },
  ]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch initial data
  useEffect(() => {
    if (!tenantId) return;

    async function fetchData() {
      try {
        const [storesRes, deptRes, itemsRes, lostNoRes] = await Promise.all([
          getStores(tenantId),
          getDepartments(tenantId),
          getItems(tenantId),
          getNextLostItemNo(tenantId),
        ]);
        console.log("lostNoRes", lostNoRes);
        setStores(Array.isArray(storesRes.data) ? storesRes.data : []);
        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
        setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);

        setLostItemNo(lostNoRes?.data?.itemNumber || "");
      } catch (error) {
        console.error("Error fetching form data:", error);
        setNotification({
          open: true,
          message: "Failed to fetch form data",
          severity: "error",
        });
      }
    }
    fetchData();
  }, [tenantId]);

  // Handle detail field changes
  const handleDetailChange = (id, field, value) => {
    setLostItemDetails((prev) =>
      prev.map((detail) =>
        detail.id === id ? { ...detail, [field]: value } : detail
      )
    );
  };

  // Add detail
  const addDetail = () => {
    setLostItemDetails((prev) => [
      ...prev,
      { id: uuidv4(), itemId: "", duration: "", description: "", remark: "" },
    ]);
  };

  // Remove detail
  const removeDetail = (id) => {
    if (lostItemDetails.length > 1) {
      setLostItemDetails((prev) => prev.filter((detail) => detail.id !== id));
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!storeId || !departmentId || !registrationDate) {
      setNotification({
        open: true,
        message: "Please fill all required fields",
        severity: "error",
      });
      return;
    }

    if (
      lostItemDetails.some(
        (d) => !d.itemId || !d.duration || !d.description || !d.remark
      )
    ) {
      setNotification({
        open: true,
        message: "All lost item details must be completed",
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        lostItemNo,
        storeId,
        departmentId,
        registrationDate,
        lostItemDetails: lostItemDetails.map((d) => ({
          itemId: d.itemId,
          duration: d.duration,
          description: d.description,
          remark: d.remark,
        })),
      };

      const formData = new FormData();
      formData.append(
        "request",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await createLostFixedAsset(tenantId, formData);

      if (response.status === 200 || response.status === 201) {
        setNotification({
          open: true,
          message: "Lost Fixed Asset created successfully!",
          severity: "success",
        });
        setTimeout(() => {
          navigate("/list-lost-fixed-asset");
        }, 1000);
        // Reset
        setStoreId("");
        setDepartmentId("");
        setRegistrationDate(new Date().toISOString().split("T")[0]);
        setLostItemDetails([
          {
            id: uuidv4(),
            itemId: "",
            duration: "",
            description: "",
            remark: "",
          },
        ]);
        setSelectedFile(null);

        // Refresh lost item number
        try {
          const lostNoRes = await getNextLostItemNo(tenantId);
          setLostItemNo(lostNoRes?.data?.lostItemNo || "");
        } catch (err) {
          console.error("Error fetching next lost item number:", err);
        }
      } else {
        setNotification({
          open: true,
          message: "Failed to create lost fixed asset.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error creating lost fixed asset:", error);
      setNotification({
        open: true,
        message:
          error.response?.data?.message || error.message || "Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Box m="20px">
      <Header subtitle="Create New Lost Fixed Asset" />

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Tenant */}
          <Grid item xs={12} sm={6}>
            <TextField label="Tenant" value={tenantName} disabled fullWidth />
          </Grid>

          {/* Lost Item No */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Lost Item No"
              value={lostItemNo}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* Store */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Store</InputLabel>
              <Select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
              >
                {stores.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.storeName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Department */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.departmentName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Registration Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Registration Date"
              value={registrationDate}
              onChange={(e) => setRegistrationDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          {/* Lost Item Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Lost Item Details
            </Typography>

            {lostItemDetails.map((detail) => (
              <Paper key={detail.id} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  {/* Item Dropdown */}
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth required>
                      <InputLabel>Item</InputLabel>
                      <Select
                        value={detail.itemId}
                        onChange={(e) =>
                          handleDetailChange(
                            detail.id,
                            "itemId",
                            e.target.value
                          )
                        }
                      >
                        {items.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.itemName || item.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Duration */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Duration"
                      value={detail.duration}
                      onChange={(e) =>
                        handleDetailChange(
                          detail.id,
                          "duration",
                          e.target.value
                        )
                      }
                      required
                    />
                  </Grid>

                  {/* Description */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={detail.description}
                      onChange={(e) =>
                        handleDetailChange(
                          detail.id,
                          "description",
                          e.target.value
                        )
                      }
                      required
                    />
                  </Grid>

                  {/* Remark */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Remark"
                      value={detail.remark}
                      onChange={(e) =>
                        handleDetailChange(detail.id, "remark", e.target.value)
                      }
                      required
                    />
                  </Grid>

                  {/* Remove button */}
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end">
                      <IconButton
                        color="error"
                        onClick={() => removeDetail(detail.id)}
                        disabled={lostItemDetails.length === 1}
                      >
                        <Remove />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            ))}

            {/* Add button */}
            <Button
              variant="outlined"
              onClick={addDetail}
              startIcon={<Add />}
              sx={{ mt: 1 }}
            >
              Add Lost Item Detail
            </Button>
          </Grid>

          {/* File Upload */}
          <Grid item xs={12}>
            <Button variant="contained" component="label">
              Upload File
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            {selectedFile && <Typography>{selectedFile.name}</Typography>}
          </Grid>

          {/* Submit */}
          <Grid item xs={12}>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                "Create Lost Fixed Asset"
              )}
            </Button>
          </Grid>
        </Grid>
      </form>

      {/* Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={notification.severity}
          onClose={handleCloseSnackbar}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateLostFixedAsset;
