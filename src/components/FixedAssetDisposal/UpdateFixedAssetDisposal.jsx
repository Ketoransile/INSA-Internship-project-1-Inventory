import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import { v4 as uuidv4 } from "uuid";
import Header from "../../common/Header";
import {
  getFixedAssetDisposalById,
  updateFixedAssetDisposal,
  getStores,
  getAllDisposableAssets,
  getItems,
} from "../../api/inventoryApi";

// Enums
const DisposalMethod = {
  SELL: "SELL",
  DONATE: "DONATE",
  RECYCLE: "RECYCLE",
  DESTROY: "DESTROY",
  TRANSFER: "TRANSFER",
};

const UpdateFixedAssetDisposal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const username = authState.username || "";

  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [disposableAssets, setDisposableAssets] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    type: "success",
    message: "",
  });

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
          })
        )
        .min(1, "At least one disposal detail is required"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const payload = {
          storeId: values.storeId,
          fixedAssetDisposalNo: values.fixedAssetDisposalNo,
          approvedDate: values.approvedDate || null,
          disposalStatus: values.disposalStatus,
          proposedDate: values.proposedDate,
          disposableAssetId: values.disposableAssetId,
          disposalDetails: values.disposalDetails.map((detail) => ({
            itemId: detail.itemId,
            itemLocation: detail.itemLocation || "",
            disposalMethod: detail.disposalMethod,
            description: detail.description,
          })),
        };

        await updateFixedAssetDisposal(tenantId, id, payload);
        setNotification({
          open: true,
          type: "success",
          message: "Fixed Asset Disposal updated successfully!",
        });
        setTimeout(() => navigate("/list-fixed-asset-disposal"), 1500);
      } catch (error) {
        console.error("Error updating fixed asset disposal:", error);
        setNotification({
          open: true,
          type: "error",
          message:
            error.response?.data?.message ||
            "Failed to update Fixed Asset Disposal",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoad(true);

        const [storesRes, disposableAssetsRes, itemsRes, disposalRes] =
          await Promise.all([
            getStores(tenantId),
            getAllDisposableAssets(tenantId),
            getItems(tenantId),
            getFixedAssetDisposalById(tenantId, id),
          ]);
        console.log(disposalRes);
        const storesData = Array.isArray(storesRes.data) ? storesRes.data : [];
        const disposableAssetsData = Array.isArray(
          disposableAssetsRes.data?.content
        )
          ? disposableAssetsRes.data.content
          : [];
        const itemsData = Array.isArray(itemsRes.data) ? itemsRes.data : [];
        const disposalData = disposalRes.data;

        setStores(storesData);
        setDisposableAssets(disposableAssetsData);
        setItems(itemsData);

        // ✅ Map disposal details correctly from API response
        const mappedDetails = disposalData.disposalDetailResponses?.map(
          (detail) => {
            const itemFromDB = itemsData.find((i) => i.id === detail.itemId);

            return {
              id: uuidv4(),
              itemId: detail.itemId || "",
              itemLocation:
                detail.itemLocation ||
                itemFromDB?.location ||
                itemFromDB?.binLocation ||
                "",
              disposalMethod: detail.disposalMethod || "",
              description: detail.description || itemFromDB?.description || "", // ✅ fix here
            };
          }
        ) || [
          {
            id: uuidv4(),
            itemId: "",
            itemLocation: "",
            disposalMethod: "",
            description: "",
          },
        ];

        // ✅ Set formik values including pre-filled details
        formik.setValues({
          storeId: disposalData.storeId || "",
          fixedAssetDisposalNo:
            disposalData.fixedAssetDisposalNo ||
            disposalData.disposableNo ||
            "",
          approvedDate: disposalData.approvedDate || "",
          disposalStatus: disposalData.disposalStatus || "",
          proposedDate:
            disposalData.proposedDate || new Date().toISOString().split("T")[0],
          disposableAssetId: disposalData.disposableAssetId || "",
          disposalDetails: mappedDetails,
        });
      } catch (error) {
        console.error("Failed to load data:", error);
        setNotification({
          open: true,
          type: "error",
          message: "Failed to load data",
        });
      } finally {
        setInitialLoad(false);
      }
    };

    if (tenantId && id) {
      fetchData();
    }
  }, [tenantId, id]);

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
      const detailsCopy = [...formik.values.disposalDetails];
      detailsCopy.splice(index, 1);
      formik.setFieldValue("disposalDetails", detailsCopy);
    }
  };

  const handleDetailChange = (index, field, value) => {
    const detailsCopy = [...formik.values.disposalDetails];
    if (field === "itemId") {
      const selectedItem = items.find((item) => item.id === value);
      detailsCopy[index] = {
        ...detailsCopy[index],
        [field]: value,
        itemLocation: selectedItem?.location || selectedItem?.binLocation || "",
        description: selectedItem?.description || "",
      };
    } else {
      detailsCopy[index] = { ...detailsCopy[index], [field]: value };
    }
    formik.setFieldValue("disposalDetails", detailsCopy);
  };

  if (initialLoad) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header subtitle={`Update Fixed Asset Disposal - ${id}`} />

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Tenant */}
          <Grid item xs={12} sm={6}>
            <TextField label="Tenant" value={username} disabled fullWidth />
          </Grid>

          {/* Disposal Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Disposal Number"
              name="fixedAssetDisposalNo"
              value={formik.values.fixedAssetDisposalNo}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* Store Dropdown */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Store *</InputLabel>
              <Select
                name="storeId"
                value={formik.values.storeId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.storeId && Boolean(formik.errors.storeId)}
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

          {/* Disposable Asset Dropdown */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Disposable Asset *</InputLabel>
              <Select
                value={formik.values.disposableAssetId}
                onChange={(e) =>
                  formik.setFieldValue("disposableAssetId", e.target.value)
                }
                onBlur={formik.handleBlur}
                error={
                  formik.touched.disposableAssetId &&
                  Boolean(formik.errors.disposableAssetId)
                }
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
              name="disposalStatus"
              value={formik.values.disposalStatus}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* Proposed Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Proposed Date *"
              name="proposedDate"
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
              label="Approved Date (Optional)"
              name="approvedDate"
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
                  {/* Item Dropdown */}
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
              {loading ? <CircularProgress size={24} /> : "Update Disposal"}
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
          severity={notification.type}
          onClose={() => setNotification({ ...notification, open: false })}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UpdateFixedAssetDisposal;
