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
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../common/Header";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import {
  getStores,
  getItems,
  getStockDisposalById,
  updateStockDisposal,
} from "../../api/inventoryApi";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";

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

export default function UpdateStockDisposal() {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const { id } = useParams();
  const navigate = useNavigate();

  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch stores, items, and disposal details
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    if (!tenantId || !id) return;

    async function fetchData() {
      try {
        const [storesRes, itemsRes, disposalRes] = await Promise.all([
          getStores(tenantId),
          getItems(tenantId),
          getStockDisposalById(tenantId, id),
        ]);

        setStores(Array.isArray(storesRes.data) ? storesRes.data : []);
        setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);

        const disposal = disposalRes.data;

        setInitialValues({
          disposalNo: disposal.disposalNo || "",
          storeId: disposal.storeId || "",
          disposalStatus: disposal.disposalStatus || DisposalStatus.PENDING,
          proposeDate: disposal.proposeDate?.split("T")[0] || "",
          approvedDate: disposal.approvedDate?.split("T")[0] || "",
          stockDisposalDetails:
            Array.isArray(disposal.stockDisposalDetails) &&
            disposal.stockDisposalDetails.length > 0
              ? disposal.stockDisposalDetails.map((d) => ({
                  id: uuidv4(),
                  itemId: d.itemId || "",
                  disposalMethod: d.disposalMethod || DisposalMethod.SELL,
                  description: d.description || "",
                  sellingPrice: d.sellingPrice || 0,
                  expirationDate: d.expirationDate?.split("T")[0] || "",
                }))
              : [
                  {
                    id: uuidv4(),
                    itemId: "",
                    disposalMethod: DisposalMethod.SELL,
                    description: "",
                    sellingPrice: 0,
                    expirationDate: new Date().toISOString().split("T")[0],
                  },
                ],
        });
      } catch (error) {
        console.error("Error fetching update data:", error);
        setNotification({
          open: true,
          message: "Failed to load stock disposal",
          severity: "error",
        });
      }
    }

    fetchData();
  }, [tenantId, id]);

  const validationSchema = yup.object().shape({
    storeId: yup.string().required("Store is required"),
    disposalStatus: yup
      .string()
      .oneOf(Object.values(DisposalStatus))
      .required("Status is required"),
    proposeDate: yup.date().required("Propose date is required"),
    approvedDate: yup.date().nullable(),
    stockDisposalDetails: yup
      .array()
      .of(
        yup.object().shape({
          itemId: yup.string().required("Item is required"),
          disposalMethod: yup
            .string()
            .oneOf(Object.values(DisposalMethod))
            .required("Method is required"),
          description: yup.string(),
          sellingPrice: yup
            .number()
            .min(0, "Price must be at least 0")
            .required("Selling price required"),
          expirationDate: yup.date().required("Expiration date required"),
        })
      )
      .min(1, "At least one detail is required"),
  });

  if (!initialValues) return <CircularProgress />;

  return (
    <Box m="20px">
      <Header subtitle="Update Stock Disposal" />
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          try {
            setLoading(true);
            const payload = { ...values };

            const formData = new FormData();
            formData.append(
              "request",
              new Blob([JSON.stringify(payload)], { type: "application/json" })
            );
            if (file) formData.append("file", file);

            const response = await updateStockDisposal(tenantId, id, formData);

            if (response.status === 200) {
              setNotification({
                open: true,
                message: "Stock Disposal updated successfully!",
                severity: "success",
              });
              setTimeout(() => navigate("/list-stock-disposal"), 1500);
            } else {
              setNotification({
                open: true,
                message: "Failed to update stock disposal",
                severity: "error",
              });
            }
          } catch (error) {
            console.error("Error updating stock disposal:", error);
            setNotification({
              open: true,
              message: error.response?.data?.message || "Update failed",
              severity: "error",
            });
          } finally {
            setLoading(false);
          }
        }}
      >
        {({
          values,
          handleChange,
          handleSubmit,
          // setFieldValue,
          errors,
          touched,
        }) => (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Store */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Store</InputLabel>
                  <Select
                    name="storeId"
                    value={values.storeId}
                    onChange={handleChange}
                    error={touched.storeId && Boolean(errors.storeId)}
                  >
                    {stores.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.storeName}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.storeId && errors.storeId && (
                    <Typography color="error" variant="caption">
                      {errors.storeId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Disposal No */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Disposal No"
                  value={values.disposalNo}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Grid>

              {/* Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="disposalStatus"
                    value={values.disposalStatus}
                    onChange={handleChange}
                    error={
                      touched.disposalStatus && Boolean(errors.disposalStatus)
                    }
                  >
                    {Object.values(DisposalStatus).map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.disposalStatus && errors.disposalStatus && (
                    <Typography color="error" variant="caption">
                      {errors.disposalStatus}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Propose Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Propose Date"
                  type="date"
                  name="proposeDate"
                  value={values.proposeDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  error={touched.proposeDate && Boolean(errors.proposeDate)}
                  helperText={touched.proposeDate && errors.proposeDate}
                />
              </Grid>

              {/* Approved Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Approved Date"
                  type="date"
                  name="approvedDate"
                  value={values.approvedDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  error={touched.approvedDate && Boolean(errors.approvedDate)}
                  helperText={touched.approvedDate && errors.approvedDate}
                />
              </Grid>

              {/* Stock Disposal Details */}
              <Grid item xs={12}>
                <Typography variant="h6">Stock Disposal Details</Typography>
                <FieldArray name="stockDisposalDetails">
                  {({ push, remove }) => (
                    <>
                      {values.stockDisposalDetails.map((detail, index) => (
                        <Paper key={detail.id} sx={{ p: 2, mb: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={3}>
                              <FormControl fullWidth required>
                                <InputLabel>Item</InputLabel>
                                <Select
                                  name={`stockDisposalDetails[${index}].itemId`}
                                  value={detail.itemId}
                                  onChange={handleChange}
                                  error={
                                    touched.stockDisposalDetails &&
                                    touched.stockDisposalDetails[index]
                                      ?.itemId &&
                                    Boolean(
                                      errors.stockDisposalDetails &&
                                        errors.stockDisposalDetails[index]
                                          ?.itemId
                                    )
                                  }
                                >
                                  {items.map((i) => (
                                    <MenuItem key={i.id} value={i.id}>
                                      {i.itemName}
                                    </MenuItem>
                                  ))}
                                </Select>
                                {touched.stockDisposalDetails &&
                                  touched.stockDisposalDetails[index]?.itemId &&
                                  errors.stockDisposalDetails &&
                                  errors.stockDisposalDetails[index]
                                    ?.itemId && (
                                    <Typography color="error" variant="caption">
                                      {
                                        errors.stockDisposalDetails[index]
                                          .itemId
                                      }
                                    </Typography>
                                  )}
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={3}>
                              <FormControl fullWidth required>
                                <InputLabel>Disposal Method</InputLabel>
                                <Select
                                  name={`stockDisposalDetails[${index}].disposalMethod`}
                                  value={detail.disposalMethod}
                                  onChange={handleChange}
                                  error={
                                    touched.stockDisposalDetails &&
                                    touched.stockDisposalDetails[index]
                                      ?.disposalMethod &&
                                    Boolean(
                                      errors.stockDisposalDetails &&
                                        errors.stockDisposalDetails[index]
                                          ?.disposalMethod
                                    )
                                  }
                                >
                                  {Object.values(DisposalMethod).map(
                                    (method) => (
                                      <MenuItem key={method} value={method}>
                                        {method}
                                      </MenuItem>
                                    )
                                  )}
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={3}>
                              <TextField
                                label="Description"
                                name={`stockDisposalDetails[${index}].description`}
                                value={detail.description}
                                onChange={handleChange}
                                fullWidth
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Selling Price"
                                type="number"
                                name={`stockDisposalDetails[${index}].sellingPrice`}
                                value={detail.sellingPrice}
                                onChange={handleChange}
                                fullWidth
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Expiration Date"
                                type="date"
                                name={`stockDisposalDetails[${index}].expirationDate`}
                                value={detail.expirationDate}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                              />
                            </Grid>

                            <Grid item xs={12}>
                              <IconButton
                                color="error"
                                onClick={() => remove(index)}
                                disabled={
                                  values.stockDisposalDetails.length === 1
                                }
                              >
                                <Remove />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}

                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() =>
                          push({
                            id: uuidv4(),
                            itemId: "",
                            disposalMethod: DisposalMethod.SELL,
                            description: "",
                            sellingPrice: 0,
                            expirationDate: new Date()
                              .toISOString()
                              .split("T")[0],
                          })
                        }
                      >
                        Add Item
                      </Button>
                    </>
                  )}
                </FieldArray>
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
                    "Update Stock Disposal"
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>

      {/* Snackbar */}
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
