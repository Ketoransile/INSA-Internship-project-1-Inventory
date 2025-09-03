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
import { useFormik } from "formik";
import * as Yup from "yup";
import Header from "../../common/Header";
import {
  createFixedAssetDisposal,
  getStores,
  getAllDisposableAssets,
  getNextFixedAssetDisposalNumber,
  getItems,
} from "../../api/inventoryApi";
import { useNavigate } from "react-router-dom";

// Enums
const DisposalMethod = {
  SELL: "SELL",
  DONATE: "DONATE",
  RECYCLE: "RECYCLE",
  DESTROY: "DESTROY",
  TRANSFER: "TRANSFER",
};

const CreateFixedAssetDisposal = () => {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const tenantName = authState.username || "";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [disposableAssets, setDisposableAssets] = useState([]);
  const [disposalNumber, setDisposalNumber] = useState("");

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ✅ Formik with Yup schema
  const formik = useFormik({
    initialValues: {
      storeId: "",
      fixedAssetDisposalNo: "",
      approvedDate: "",
      disposalStatus: "",
      proposedDate: new Date().toISOString().split("T")[0],
      disposableAssetId: "",
      disposalDetails: [
        {
          id: uuidv4(),
          itemId: "",
          itemLocation: "",
          disposalMethod: "",
          description: "",
        },
      ],
    },
    validationSchema: Yup.object({
      storeId: Yup.string().required("Store is required"),
      fixedAssetDisposalNo: Yup.string().required(
        "Disposal number is required"
      ),
      disposalStatus: Yup.string().required("Disposal status is required"),
      proposedDate: Yup.date().required("Proposed date is required"),
      disposableAssetId: Yup.string().required("Disposable asset is required"),
      disposalDetails: Yup.array()
        .of(
          Yup.object().shape({
            itemId: Yup.string().required("Item is required"),
            itemLocation: Yup.string(),
            disposalMethod: Yup.string().required(
              "Disposal method is required"
            ),
            description: Yup.string().required("Description is required"),
          })
        )
        .min(1, "At least one disposal detail is required"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const payload = {
          storeId: values.storeId,
          fixedAssetDisposalNo: disposalNumber,
          approvedDate: values.approvedDate || null,
          disposalStatus: values.disposalStatus,
          proposedDate: values.proposedDate,
          disposableAssetId: values.disposableAssetId,
          disposalDetails: values.disposalDetails.map((detail) => ({
            itemId: detail.itemId,
            itemLocation: detail.itemLocation,
            disposalMethod: detail.disposalMethod,
            description: detail.description,
          })),
        };

        const response = await createFixedAssetDisposal(tenantId, payload);

        if (response.status === 200 || response.status === 201) {
          setNotification({
            open: true,
            message: "Fixed Asset Disposal Request created successfully!",
            severity: "success",
          });
          setTimeout(() => navigate("/list-fixed-asset-disposal"), 1000);
          formik.resetForm();
        } else {
          setNotification({
            open: true,
            message: "Failed to create disposal request. Please try again.",
            severity: "error",
          });
        }
      } catch (error) {
        console.error("Error creating disposal request:", error);
        setNotification({
          open: true,
          message: `An error occurred: ${
            error.response?.data?.message ||
            error.message ||
            "Please try again."
          }`,
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  // Load stores, assets, items, and disposal number
  useEffect(() => {
    if (!tenantId) return;
    async function fetchData() {
      try {
        const [storesRes, disposableAssetsRes, itemsRes, disposalNoRes] =
          await Promise.all([
            getStores(tenantId),
            getAllDisposableAssets(tenantId),
            getItems(tenantId),
            getNextFixedAssetDisposalNumber(tenantId),
          ]);

        setStores(Array.isArray(storesRes.data) ? storesRes.data : []);
        setDisposableAssets(
          Array.isArray(disposableAssetsRes.data?.content)
            ? disposableAssetsRes.data.content
            : []
        );
        setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
        setDisposalNumber(disposalNoRes?.data?.FADNumber || "");
        formik.setFieldValue(
          "fixedAssetDisposalNo",
          disposalNoRes?.data?.FADNumber || ""
        );
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

  // ✅ Handle disposable asset selection (fix)
  const handleDisposableAssetChange = (assetId) => {
    formik.setFieldValue("disposableAssetId", assetId);

    const selectedAsset = disposableAssets.find(
      (asset) => asset.id === assetId
    );
    if (selectedAsset) {
      formik.setFieldValue(
        "disposalStatus",
        selectedAsset.disposalStatus || ""
      );
    } else {
      formik.setFieldValue("disposalStatus", "");
    }
  };

  const addDetail = () => {
    formik.setFieldValue("disposalDetails", [
      ...formik.values.disposalDetails,
      {
        id: uuidv4(),
        itemId: "",
        itemLocation: "",
        disposalMethod: "",
        description: "",
      },
    ]);
  };

  const removeDetail = (index) => {
    if (formik.values.disposalDetails.length > 1) {
      const copy = [...formik.values.disposalDetails];
      copy.splice(index, 1);
      formik.setFieldValue("disposalDetails", copy);
    }
  };

  const handleDetailChange = (index, field, value) => {
    const copy = [...formik.values.disposalDetails];
    if (field === "itemId") {
      const selectedItem = items.find((i) => i.id === value);
      copy[index] = {
        ...copy[index],
        itemId: value,
        itemLocation: selectedItem?.location || selectedItem?.binLocation || "",
      };
    } else {
      copy[index] = { ...copy[index], [field]: value };
    }
    formik.setFieldValue("disposalDetails", copy);
  };

  return (
    <Box m="20px">
      <Header subtitle="Create New Fixed Asset Disposal Request" />

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Tenant */}
          <Grid item xs={12} sm={6}>
            <TextField label="Tenant" value={tenantName} disabled fullWidth />
          </Grid>

          {/* Disposal Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Disposal Number"
              value={disposalNumber}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* Store */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Store *</InputLabel>
              <Select
                name="storeId"
                value={formik.values.storeId}
                onChange={formik.handleChange}
              >
                {stores.map((store) => (
                  <MenuItem key={store.id} value={store.id}>
                    {store.storeName}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.storeId && formik.errors.storeId && (
                <Typography color="error" variant="caption">
                  {formik.errors.storeId}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Disposable Asset */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Disposable Asset *</InputLabel>
              <Select
                name="disposableAssetId"
                value={formik.values.disposableAssetId}
                onChange={(e) => handleDisposableAssetChange(e.target.value)}
              >
                {disposableAssets.map((asset) => (
                  <MenuItem key={asset.id} value={asset.id}>
                    {asset.drNo || asset.id}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.disposableAssetId &&
                formik.errors.disposableAssetId && (
                  <Typography color="error" variant="caption">
                    {formik.errors.disposableAssetId}
                  </Typography>
                )}
            </FormControl>
          </Grid>

          {/* Disposal Status */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Disposal Status"
              value={formik.values.disposalStatus}
              InputProps={{ readOnly: true }}
              placeholder="Select a disposable asset to see its status"
            />
          </Grid>

          {/* Proposed Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              name="proposedDate"
              label="Proposed Date *"
              value={formik.values.proposedDate}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Approved Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              name="approvedDate"
              label="Approved Date (Optional)"
              value={formik.values.approvedDate}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Disposal Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Disposal Details
            </Typography>

            {formik.values.disposalDetails.map((detail, index) => (
              <Paper key={detail.id} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  {/* Item */}
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>Item *</InputLabel>
                      <Select
                        value={detail.itemId}
                        onChange={(e) =>
                          handleDetailChange(index, "itemId", e.target.value)
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

                  {/* Item Location */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Item Location"
                      value={detail.itemLocation}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>

                  {/* Disposal Method */}
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>Disposal Method *</InputLabel>
                      <Select
                        value={detail.disposalMethod}
                        onChange={(e) =>
                          handleDetailChange(
                            index,
                            "disposalMethod",
                            e.target.value
                          )
                        }
                      >
                        {Object.entries(DisposalMethod).map(([key, value]) => (
                          <MenuItem key={key} value={value}>
                            {key}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Description */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Description *"
                      value={detail.description}
                      onChange={(e) =>
                        handleDetailChange(index, "description", e.target.value)
                      }
                    />
                  </Grid>

                  {/* Remove Detail */}
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end">
                      <IconButton
                        color="error"
                        onClick={() => removeDetail(index)}
                        disabled={formik.values.disposalDetails.length === 1}
                      >
                        <Remove />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            ))}

            <Button
              variant="outlined"
              onClick={addDetail}
              startIcon={<Add />}
              sx={{ mt: 1 }}
            >
              Add Disposal Detail
            </Button>
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
                "Create Disposal Request"
              )}
            </Button>
          </Grid>
        </Grid>
      </form>

      {/* Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification({ ...notification, open: false })}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateFixedAssetDisposal;
