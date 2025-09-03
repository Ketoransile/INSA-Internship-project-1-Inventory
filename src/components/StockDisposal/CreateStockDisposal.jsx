import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  IconButton,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import Header from "../../common/Header";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import {
  getStores,
  getItems,
  getDisposalNumber,
  createStockDisposal,
} from "../../api/inventoryApi";

// Enums
const DisposalStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
};

const DisposalMethod = {
  SELL: "SELL",
  DONATE: "DONATE",
  RECYCLE: "RECYCLE",
  DESTROY: "DESTROY",
  TRANSFER: "TRANSFER",
};

export default function CreateStockDisposal() {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;

  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [disposalNo, setDisposalNo] = useState("");
  const [storeId, setStoreId] = useState("");
  const [disposalStatus, setDisposalStatus] = useState(DisposalStatus.PENDING);
  const [proposeDate, setProposeDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [approvedDate, setApprovedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [stockDisposalDetails, setStockDisposalDetails] = useState([
    {
      id: uuidv4(),
      itemId: "",
      disposalMethod: DisposalMethod.SELL,
      description: "",
      sellingPrice: 0,
      expirationDate: new Date().toISOString().split("T")[0],
    },
  ]);

  const [file, setFile] = useState(null); // NEW: optional file

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storesRes, itemsRes, disposalNumberRes] = await Promise.all([
          getStores(tenantId),
          getItems(tenantId),
          getDisposalNumber(tenantId),
        ]);

        setStores(storesRes.data || []);
        setItems(itemsRes.data || []);
        setDisposalNo(disposalNumberRes.data.disposalNumber || "");
      } catch (error) {
        setNotification({
          open: true,
          message: "Failed to fetch form data",
          severity: "error",
        });
      }
    };

    if (tenantId) fetchData();
  }, [tenantId]);

  // Handlers for stock disposal details
  const handleDetailChange = (id, field, value) => {
    setStockDisposalDetails((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const addDetail = () => {
    setStockDisposalDetails((prev) => [
      ...prev,
      {
        id: uuidv4(),
        itemId: "",
        disposalMethod: DisposalMethod.SELL,
        description: "",
        sellingPrice: 0,
        expirationDate: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const removeDetail = (id) => {
    setStockDisposalDetails((prev) => prev.filter((d) => d.id !== id));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!storeId) {
      setNotification({
        open: true,
        message: "Store is required",
        severity: "error",
      });
      return;
    }

    if (stockDisposalDetails.some((d) => !d.itemId)) {
      setNotification({
        open: true,
        message: "All items must be selected",
        severity: "error",
      });
      return;
    }

    const payload = {
      storeId,
      disposalNo,
      disposalStatus,
      proposeDate,
      approvedDate,
      stockDisposalDetails: stockDisposalDetails.map(
        ({
          itemId,
          disposalMethod,
          description,
          sellingPrice,
          expirationDate,
        }) => ({
          itemId,
          disposalMethod,
          description,
          sellingPrice,
          expirationDate,
        })
      ),
    };

    try {
      setLoading(true);

      // Wrap payload in FormData for optional file upload
      // const formData = new FormData();
      // formData.append(
      //   "request",
      //   new Blob([JSON.stringify(payload)], { type: "application/json" })
      // );
      // if (file) formData.append("file", file);

      // const response = await createStockDisposal(tenantId, formData);
      const response = await createStockDisposal(tenantId, payload, file);
      if (response.status === 200 || response.status === 201) {
        setNotification({
          open: true,
          message: "Stock Disposal created!",
          severity: "success",
        });

        // reset form
        setStoreId("");
        setDisposalStatus(DisposalStatus.PENDING);
        setProposeDate(new Date().toISOString().split("T")[0]);
        setApprovedDate(new Date().toISOString().split("T")[0]);
        setStockDisposalDetails([
          {
            id: uuidv4(),
            itemId: "",
            disposalMethod: DisposalMethod.SELL,
            description: "",
            sellingPrice: 0,
            expirationDate: new Date().toISOString().split("T")[0],
          },
        ]);
        setFile(null);

        // get new disposal number
        const disposalNumberRes = await getDisposalNumber(tenantId);
        setDisposalNo(disposalNumberRes.data || "");
      }
    } catch (error) {
      setNotification({
        open: true,
        message: "Failed to create disposal",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () =>
    setNotification({ ...notification, open: false });

  return (
    <Box m="20px">
      <Header subtitle="Create Stock Disposal" />
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
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

          {/* Disposal No */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Disposal No"
              value={disposalNo}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Grid>

          {/* Status */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                value={disposalStatus}
                onChange={(e) => setDisposalStatus(e.target.value)}
              >
                {Object.values(DisposalStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Propose Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Propose Date"
              type="date"
              value={proposeDate}
              onChange={(e) => setProposeDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Grid>

          {/* Approved Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Approved Date"
              type="date"
              value={approvedDate}
              onChange={(e) => setApprovedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>

          {/* Stock Disposal Details */}
          <Grid item xs={12}>
            <Typography variant="h6">Stock Disposal Details</Typography>
            {stockDisposalDetails.map((detail) => (
              <Paper key={detail.id} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
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
                        {items.map((i) => (
                          <MenuItem key={i.id} value={i.id}>
                            {i.itemName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth required>
                      <InputLabel>Disposal Method</InputLabel>
                      <Select
                        value={detail.disposalMethod}
                        onChange={(e) =>
                          handleDetailChange(
                            detail.id,
                            "disposalMethod",
                            e.target.value
                          )
                        }
                      >
                        {Object.values(DisposalMethod).map((method) => (
                          <MenuItem key={method} value={method}>
                            {method}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Description"
                      value={detail.description}
                      onChange={(e) =>
                        handleDetailChange(
                          detail.id,
                          "description",
                          e.target.value
                        )
                      }
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    <TextField
                      label="Selling Price"
                      type="number"
                      value={detail.sellingPrice}
                      onChange={(e) =>
                        handleDetailChange(
                          detail.id,
                          "sellingPrice",
                          parseFloat(e.target.value)
                        )
                      }
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    <TextField
                      label="Expiration Date"
                      type="date"
                      value={detail.expirationDate}
                      onChange={(e) =>
                        handleDetailChange(
                          detail.id,
                          "expirationDate",
                          e.target.value
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <IconButton
                      color="error"
                      onClick={() => removeDetail(detail.id)}
                      disabled={stockDisposalDetails.length === 1}
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

          {/* File Upload */}
          <Grid item xs={12}>
            <Button variant="contained" component="label">
              Upload File (optional)
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.jpg,.png"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </Button>
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {file.name}
              </Typography>
            )}
          </Grid>

          {/* Submit */}
          <Grid item xs={12}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                "Create Stock Disposal"
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
          onClose={handleCloseSnackbar}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
