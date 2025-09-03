import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import Header from "../../common/Header";
import {
  getDepartments,
  getStores,
  getItems,
  createNeedAssessment,
} from "../../api/inventoryApi";

const PURCHASE_TYPES = {
  GOODS: "GOODS",
  SERVICE: "SERVICE",
  WORK: "WORK",
};

const CONSTANT_BUDGET_YEAR_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"; // fixed constant

const CONSTANT_GENERAL_LEDGER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"; // fixed for generalLedger

export default function CreateNeedAssessment() {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);

  const [purchaseType, setPurchaseType] = useState(PURCHASE_TYPES.GOODS);
  const [departmentId, setDepartmentId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [assessmentDetails, setAssessmentDetails] = useState([
    { id: uuidv4(), itemId: "", budgetAmount: 0 },
  ]);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (!tenantId) return;
    async function fetchData() {
      try {
        const [deptRes, storeRes, itemsRes] = await Promise.all([
          getDepartments(tenantId),
          getStores(tenantId),
          getItems(tenantId),
        ]);
        setDepartments(deptRes.data || []);
        setStores(storeRes.data || []);
        setItems(itemsRes.data || []);
      } catch (error) {
        setNotification({
          open: true,
          message: "Failed to fetch initial data",
          severity: "error",
        });
      }
    }
    fetchData();
  }, [tenantId]);

  const handleDetailChange = (id, field, value) => {
    setAssessmentDetails((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const addDetail = () => {
    setAssessmentDetails((prev) => [
      ...prev,
      { id: uuidv4(), itemId: "", budgetAmount: 0 },
    ]);
  };

  const removeDetail = (id) => {
    setAssessmentDetails((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!departmentId || !storeId) {
      setNotification({
        open: true,
        message: "Please select department and store",
        severity: "error",
      });
      return;
    }

    if (assessmentDetails.some((d) => !d.itemId || d.budgetAmount <= 0)) {
      setNotification({
        open: true,
        message: "All assessment details must be valid",
        severity: "error",
      });
      return;
    }

    const payload = {
      purchaseType,
      departmentId,
      storeId,
      budgetYearId: CONSTANT_BUDGET_YEAR_ID,
      assessmentDetail: assessmentDetails.map((d) => ({
        itemId: d.itemId,
        generalLedger: CONSTANT_GENERAL_LEDGER_ID,
        budgetAmount: d.budgetAmount,
      })),
    };
    console.log("Payload is", payload);
    try {
      setLoading(true);
      const response = await createNeedAssessment(tenantId, payload);
      if (response.status === 200 || response.status === 201) {
        setNotification({
          open: true,
          message: "Need Assessment created successfully!",
          severity: "success",
        });
        // reset form
        setPurchaseType(PURCHASE_TYPES.GOODS);
        setDepartmentId("");
        setStoreId("");
        setAssessmentDetails([{ id: uuidv4(), itemId: "", budgetAmount: 0 }]);
      }
    } catch (error) {
      setNotification({
        open: true,
        message:
          error.response?.data?.message || "Failed to create Need Assessment",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box m="20px">
      <Header subtitle="Create Need Assessment" />
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Purchase Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Purchase Type</InputLabel>
              <Select
                value={purchaseType}
                onChange={(e) => setPurchaseType(e.target.value)}
              >
                {Object.values(PURCHASE_TYPES).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
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

          {/* Assessment Details */}
          <Grid item xs={12}>
            <Typography variant="h6">Assessment Details</Typography>
            {assessmentDetails.map((detail) => (
              <Paper key={detail.id} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
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
                        {items.map((i) => (
                          <MenuItem key={i.id} value={i.id}>
                            {i.itemName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Budget Amount"
                      type="number"
                      value={detail.budgetAmount}
                      inputProps={{ min: 1 }}
                      onChange={(e) =>
                        handleDetailChange(
                          detail.id,
                          "budgetAmount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <IconButton
                      color="error"
                      onClick={() => removeDetail(detail.id)}
                      disabled={assessmentDetails.length === 1}
                    >
                      <Remove />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button variant="outlined" startIcon={<Add />} onClick={addDetail}>
              Add Item
            </Button>
          </Grid>

          {/* Submit */}
          <Grid item xs={12}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Create Assessment"}
            </Button>
          </Grid>
        </Grid>
      </form>

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
}
