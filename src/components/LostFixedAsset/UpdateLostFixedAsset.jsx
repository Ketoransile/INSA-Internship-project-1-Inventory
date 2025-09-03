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
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import Header from "../../common/Header";
import {
  getLostFixedAssetById,
  updateLostFixedAsset,
  getStores,
  getDepartments,
  getItems,
} from "../../api/inventoryApi";

// ✅ Yup Validation Schema
const lostItemDetailSchema = Yup.object().shape({
  itemId: Yup.string().required("Item is required"),
  duration: Yup.string().required("Duration is required"),
  description: Yup.string().required("Description is required"),
  remark: Yup.string().required("Remark is required"),
});

const lostFixedAssetSchema = Yup.object().shape({
  lostItemNo: Yup.string().required("Lost Item No is required"),
  storeId: Yup.string().required("Store is required"),
  departmentId: Yup.string().required("Department is required"),
  registrationDate: Yup.date()
    .required("Registration Date is required")
    .typeError("Invalid date format"),
  lostItemDetails: Yup.array()
    .of(lostItemDetailSchema)
    .min(1, "At least one lost item detail is required"),
});

const UpdateLostFixedAsset = () => {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const tenantName = authState.username || "";
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [initialValues, setInitialValues] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch initial data
  useEffect(() => {
    if (!tenantId || !id) return;

    async function fetchData() {
      try {
        const [storesRes, deptRes, itemsRes, lostAssetRes] = await Promise.all([
          getStores(tenantId),
          getDepartments(tenantId),
          getItems(tenantId),
          getLostFixedAssetById(tenantId, id),
        ]);

        setStores(Array.isArray(storesRes.data) ? storesRes.data : []);
        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
        setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);

        const asset = lostAssetRes.data;
        setInitialValues({
          lostItemNo: asset.lostItemNo || "",
          storeId: asset.storeId || "",
          departmentId: asset.departmentId || "",
          registrationDate: asset.registrationDate?.split("T")[0] || "",
          lostItemDetails:
            Array.isArray(asset.lostFixedAssetDetails) &&
            asset.lostFixedAssetDetails.length > 0
              ? asset.lostFixedAssetDetails.map((d) => ({
                  id: uuidv4(),
                  itemId: d.itemId || "",
                  duration: d.duration || "",
                  description: d.description || "",
                  remark: d.remark || "",
                }))
              : [
                  {
                    id: uuidv4(),
                    itemId: "",
                    duration: "",
                    description: "",
                    remark: "",
                  },
                ],
        });
      } catch (error) {
        console.error("Error fetching update data:", error);
        setNotification({
          open: true,
          message: "Failed to load data",
          severity: "error",
        });
      }
    }

    fetchData();
  }, [tenantId, id]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleCloseSnackbar = () =>
    setNotification({ ...notification, open: false });

  if (!initialValues) return <CircularProgress />;

  return (
    <Box m="20px">
      <Header subtitle="Update Lost Fixed Asset" />

      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={lostFixedAssetSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            setLoading(true);

            const payload = {
              lostItemNo: values.lostItemNo,
              storeId: values.storeId,
              departmentId: values.departmentId,
              registrationDate: values.registrationDate,
              lostItemDetails: values.lostItemDetails.map((d) => ({
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

            const response = await updateLostFixedAsset(tenantId, id, formData);

            if (response.status === 200) {
              setNotification({
                open: true,
                message: "Lost Fixed Asset updated successfully!",
                severity: "success",
              });
              setTimeout(() => navigate("/list-lost-fixed-asset"), 1500);
            } else {
              setNotification({
                open: true,
                message: "Failed to update lost fixed asset",
                severity: "error",
              });
            }
          } catch (error) {
            console.error("Error updating lost fixed asset:", error);
            setNotification({
              open: true,
              message: error.response?.data?.message || "Please try again",
              severity: "error",
            });
          } finally {
            setLoading(false);
            setSubmitting(false);
          }
        }}
      >
        {({ values, errors, touched, handleChange, handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tenant"
                  value={tenantName}
                  disabled
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lost Item No"
                  name="lostItemNo"
                  value={values.lostItemNo}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
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

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="departmentId"
                    value={values.departmentId}
                    onChange={handleChange}
                    error={touched.departmentId && Boolean(errors.departmentId)}
                  >
                    {departments.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.departmentName}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.departmentId && errors.departmentId && (
                    <Typography color="error" variant="caption">
                      {errors.departmentId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  name="registrationDate"
                  label="Registration Date"
                  value={values.registrationDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  error={
                    touched.registrationDate && Boolean(errors.registrationDate)
                  }
                  helperText={
                    touched.registrationDate && errors.registrationDate
                  }
                />
              </Grid>

              {/* Lost Item Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Lost Item Details
                </Typography>

                <FieldArray name="lostItemDetails">
                  {({ push, remove }) => (
                    <>
                      {values.lostItemDetails.map((detail, index) => (
                        <Paper key={detail.id} sx={{ p: 2, mb: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={3}>
                              <FormControl fullWidth>
                                <InputLabel>Item</InputLabel>
                                <Select
                                  name={`lostItemDetails[${index}].itemId`}
                                  value={detail.itemId}
                                  onChange={handleChange}
                                  error={
                                    touched.lostItemDetails?.[index]?.itemId &&
                                    Boolean(
                                      errors.lostItemDetails?.[index]?.itemId
                                    )
                                  }
                                >
                                  {items.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>
                                      {item.itemName || item.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                                {touched.lostItemDetails?.[index]?.itemId &&
                                  errors.lostItemDetails?.[index]?.itemId && (
                                    <Typography color="error" variant="caption">
                                      {errors.lostItemDetails[index].itemId}
                                    </Typography>
                                  )}
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                label="Duration"
                                name={`lostItemDetails[${index}].duration`}
                                value={detail.duration}
                                onChange={handleChange}
                                error={
                                  touched.lostItemDetails?.[index]?.duration &&
                                  Boolean(
                                    errors.lostItemDetails?.[index]?.duration
                                  )
                                }
                                helperText={
                                  touched.lostItemDetails?.[index]?.duration &&
                                  errors.lostItemDetails?.[index]?.duration
                                }
                              />
                            </Grid>

                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                label="Description"
                                name={`lostItemDetails[${index}].description`}
                                value={detail.description}
                                onChange={handleChange}
                                error={
                                  touched.lostItemDetails?.[index]
                                    ?.description &&
                                  Boolean(
                                    errors.lostItemDetails?.[index]?.description
                                  )
                                }
                                helperText={
                                  touched.lostItemDetails?.[index]
                                    ?.description &&
                                  errors.lostItemDetails?.[index]?.description
                                }
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                fullWidth
                                label="Remark"
                                name={`lostItemDetails[${index}].remark`}
                                value={detail.remark}
                                onChange={handleChange}
                                error={
                                  touched.lostItemDetails?.[index]?.remark &&
                                  Boolean(
                                    errors.lostItemDetails?.[index]?.remark
                                  )
                                }
                                helperText={
                                  touched.lostItemDetails?.[index]?.remark &&
                                  errors.lostItemDetails?.[index]?.remark
                                }
                              />
                            </Grid>

                            <Grid item xs={12} sm={1}>
                              <IconButton
                                color="error"
                                onClick={() => remove(index)}
                                disabled={values.lostItemDetails.length === 1}
                              >
                                <Remove />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}

                      <Button
                        variant="outlined"
                        onClick={() =>
                          push({
                            id: uuidv4(),
                            itemId: "",
                            duration: "",
                            description: "",
                            remark: "",
                          })
                        }
                        startIcon={<Add />}
                        sx={{ mt: 1 }}
                      >
                        Add Lost Item Detail
                      </Button>
                    </>
                  )}
                </FieldArray>
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
                    "Update Lost Fixed Asset"
                  )}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>

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

export default UpdateLostFixedAsset;
