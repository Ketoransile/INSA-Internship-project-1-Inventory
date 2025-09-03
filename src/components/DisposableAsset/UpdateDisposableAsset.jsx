import React, { useState, useEffect, useCallback } from "react";
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
  FormHelperText,
  Paper,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import { useNavigate, useParams } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../common/Header";
import NotPageHandle from "../../common/NoPageHandle";
import { v4 as uuidv4 } from "uuid";

// Import API functions
import {
  getDisposableAssetById,
  updateDisposableAsset,
  getStores,
  getDepartments,
  getItems,
} from "../../api/inventoryApi";

// Enums from Spring Boot DTOs
const DisposableType = {
  FIXED_ASSET: "FIXED_ASSET",
  NON_FIXED_ASSET: "NON_FIXED_ASSET",
  MERCHANDISED: "MERCHANDISED",
};

const DisposalStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

// Validation schema matching the create component
const validationSchema = yup.object().shape({
  storeId: yup.string().required("Store is required"),
  departmentId: yup.string().required("Department is required"),
  disposableType: yup.string().required("Disposable Type is required"),
  requisitionDate: yup
    .date()
    .required("Requisition Date is required")
    .nullable(),
  disposalStatus: yup.string().required("Disposal Status is required"),
  disposableFixedAssetDetails: yup
    .array()
    .of(
      yup.object().shape({
        itemId: yup.string().required("Item is required"),
        description: yup.string().required("Description is required"),
        quantity: yup
          .number()
          .required("Quantity is required")
          .min(1, "Quantity must be at least 1")
          .integer("Quantity must be an integer")
          .typeError("Quantity must be a number"),
        expirationDate: yup.date().nullable(),
        batchNo: yup.string().nullable(),
      })
    )
    .min(1, "At least one disposable asset detail is required"),
});

const UpdateDisposableAsset = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;

  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // States for dropdown data
  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);

  // Fetch all necessary lookup data (stores, departments, items)
  const fetchLookupData = useCallback(async () => {
    if (!tenantId) {
      setLoadingDropdowns(false);
      return;
    }
    try {
      setLoadingDropdowns(true);
      const [storesRes, departmentsRes, itemsRes] = await Promise.all([
        getStores(tenantId),
        getDepartments(tenantId),
        getItems(tenantId),
      ]);
      setStores(storesRes.data || []);
      setDepartments(departmentsRes.data || []);
      setItems(itemsRes.data || []);
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      setNotification({
        open: true,
        message: "Failed to load necessary data for form.",
        severity: "error",
      });
    } finally {
      setLoadingDropdowns(false);
    }
  }, [tenantId]);

  // Function to fetch the specific disposable asset data
  const fetchDisposableAssetData = useCallback(async () => {
    if (!id || !tenantId) {
      setLoading(false);
      setNotification({
        open: true,
        message: "Missing Disposable Asset ID or Tenant ID.",
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await getDisposableAssetById(tenantId, id);
      const data = response.data;

      // Map the response details to match the form structure
      const mappedDetails = (data.disposableFixedAssetDetails || []).map(
        (detail) => ({
          id: detail.id || uuidv4(),
          itemId: detail.itemId,
          description: detail.description || "",
          quantity: detail.quantity !== null ? detail.quantity.toString() : "1",
          expirationDate: detail.expirationDate || "",
          batchNo: detail.batchNo || "",
        })
      );

      // Set the initial values for the form
      setInitialValues({
        drNo: data.drNo || "",
        storeId: data.storeId || "",
        departmentId: data.departmentId || "",
        disposableType: data.disposableType || DisposableType.FIXED_ASSET,
        requisitionDate: data.requisitionDate
          ? new Date(data.requisitionDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        disposalStatus: data.disposalStatus || DisposalStatus.PENDING,
        disposableFixedAssetDetails: mappedDetails,
      });
    } catch (error) {
      console.error("Error fetching Disposable Asset data:", error);
      setNotification({
        open: true,
        message: "Failed to fetch Disposable Asset data.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [id, tenantId]);

  // Combined effect to fetch all data
  useEffect(() => {
    fetchLookupData();
    fetchDisposableAssetData();
  }, [fetchLookupData, fetchDisposableAssetData]);

  // Handle form submission
  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
      // Convert dates to YYYY-MM-DD format if they are not already
      const requisitionDate = values.requisitionDate
        ? new Date(values.requisitionDate).toISOString().split("T")[0]
        : null;

      const payload = {
        storeId: values.storeId,
        departmentId: values.departmentId,
        disposableType: values.disposableType,
        requisitionDate: requisitionDate,
        disposalStatus: values.disposalStatus,
        disposableFixedAssetDetails: values.disposableFixedAssetDetails.map(
          (detail) => ({
            itemId: detail.itemId,
            description: detail.description,
            quantity: parseInt(detail.quantity, 10),
            expirationDate: detail.expirationDate
              ? new Date(detail.expirationDate).toISOString().split("T")[0]
              : null,
            batchNo: detail.batchNo || null,
          })
        ),
      };

      const response = await updateDisposableAsset(tenantId, id, payload);
      console.log("response is ", response);

      if (response.status === 200 || response.status === 201) {
        setNotification({
          open: true,
          message: "Disposable Asset Request updated successfully!",
          severity: "success",
        });
        setTimeout(() => {
          navigate("/list-disposable-asset");
        }, 1000);
      } else {
        setNotification({
          open: true,
          message:
            "Failed to update Disposable Asset Request. Please try again.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error updating Disposable Asset Request:", error);
      setNotification({
        open: true,
        message: `An error occurred: ${error.response?.data?.message || error.message || "Please try again."}`,
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setNotification({ ...notification, open: false });
  };

  // Handle item change to populate batchNo and expirationDate
  const handleItemChange = async (e, index, setFieldValue) => {
    const selectedItemId = e.target.value;
    const batchNoPath = `disposableFixedAssetDetails[${index}].batchNo`;
    const expirationDatePath = `disposableFixedAssetDetails[${index}].expirationDate`;

    // Call the default handleChange first
    // e.persist();
    const handleChange = (e) => {
      setFieldValue(
        `disposableFixedAssetDetails[${index}].itemId`,
        e.target.value
      );
    };
    handleChange(e);

    const selectedItem = items.find((item) => item.id === selectedItemId);

    if (selectedItem) {
      setFieldValue(batchNoPath, selectedItem.bachNumber || "");
      const itemExpireDate = selectedItem.expireDate
        ? new Date(selectedItem.expireDate).toISOString().split("T")[0]
        : "";
      setFieldValue(expirationDatePath, itemExpireDate);
    } else {
      setFieldValue(batchNoPath, "");
      setFieldValue(expirationDatePath, "");
    }
  };

  // Handle case where ID is not provided in URL
  if (!id) {
    return (
      <NotPageHandle
        message="No Disposable Asset selected to Update"
        navigateTo="/disposable-asset/list"
      />
    );
  }

  // Show loading indicator while data is being fetched
  if (loading || loadingDropdowns) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Disposable Asset data...
        </Typography>
      </Box>
    );
  }

  // If data failed to load and initialValues is still null, show an error or a "not found" message
  if (!initialValues) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography variant="h6" color="error">
          Failed to load Disposable Asset. Please try again or check the ID.
        </Typography>
        <Button
          onClick={() => navigate("/disposable-asset/list")}
          sx={{ ml: 2 }}
        >
          Go to List
        </Button>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header
        subtitle={`Update Disposable Asset Request (DR No: ${initialValues.drNo})`}
      />
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleFormSubmit}
        enableReinitialize={true}
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
          setFieldValue,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit}>
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
              }}
            >
              {/* DR No (Read-only) */}
              <TextField
                fullWidth
                label="DR Number"
                name="drNo"
                value={values.drNo}
                InputProps={{ readOnly: true }}
                sx={{ gridColumn: "span 2" }}
              />

              {/* Store Dropdown */}
              <FormControl
                fullWidth
                sx={{ gridColumn: "span 2" }}
                error={!!touched.storeId && !!errors.storeId}
              >
                <InputLabel>Store</InputLabel>
                <Select
                  name="storeId"
                  value={values.storeId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  label="Store"
                >
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.storeName}
                    </MenuItem>
                  ))}
                </Select>
                {!!touched.storeId && !!errors.storeId && (
                  <FormHelperText>{errors.storeId}</FormHelperText>
                )}
              </FormControl>

              {/* Department Dropdown */}
              <FormControl
                fullWidth
                sx={{ gridColumn: "span 2" }}
                error={!!touched.departmentId && !!errors.departmentId}
              >
                <InputLabel>Department</InputLabel>
                <Select
                  name="departmentId"
                  value={values.departmentId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  label="Department"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </MenuItem>
                  ))}
                </Select>
                {!!touched.departmentId && !!errors.departmentId && (
                  <FormHelperText>{errors.departmentId}</FormHelperText>
                )}
              </FormControl>

              {/* Disposable Type Dropdown */}
              <FormControl
                fullWidth
                sx={{ gridColumn: "span 2" }}
                error={!!touched.disposableType && !!errors.disposableType}
              >
                <InputLabel>Disposable Type</InputLabel>
                <Select
                  name="disposableType"
                  value={values.disposableType}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  label="Disposable Type"
                >
                  {Object.values(DisposableType).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </Select>
                {!!touched.disposableType && !!errors.disposableType && (
                  <FormHelperText>{errors.disposableType}</FormHelperText>
                )}
              </FormControl>

              {/* Requisition Date */}
              <TextField
                fullWidth
                type="date"
                label="Requisition Date"
                name="requisitionDate"
                value={values.requisitionDate}
                onChange={handleChange}
                onBlur={handleBlur}
                InputLabelProps={{ shrink: true }}
                error={!!touched.requisitionDate && !!errors.requisitionDate}
                helperText={touched.requisitionDate && errors.requisitionDate}
                sx={{ gridColumn: "span 2" }}
              />

              {/* Disposal Status Dropdown */}
              <FormControl
                fullWidth
                sx={{ gridColumn: "span 2" }}
                error={!!touched.disposalStatus && !!errors.disposalStatus}
              >
                <InputLabel>Disposal Status</InputLabel>
                <Select
                  name="disposalStatus"
                  value={values.disposalStatus}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  label="Disposal Status"
                >
                  {Object.values(DisposalStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </Select>
                {!!touched.disposalStatus && !!errors.disposalStatus && (
                  <FormHelperText>{errors.disposalStatus}</FormHelperText>
                )}
              </FormControl>

              {/* Disposable Fixed Asset Details FieldArray */}
              <FieldArray name="disposableFixedAssetDetails">
                {({ push, remove }) => (
                  <>
                    <Box sx={{ gridColumn: "span 4", mt: 2 }}>
                      <h3 style={{ margin: "0 0 15px 0" }}>
                        Disposable Asset Details
                      </h3>
                    </Box>
                    {values.disposableFixedAssetDetails.map((detail, index) => (
                      <Paper
                        key={detail.id || index}
                        variant="outlined"
                        sx={{
                          gridColumn: "span 4",
                          p: 3,
                          mb: 3,
                          display: "grid",
                          gap: "20px",
                          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                          "& > div": {
                            gridColumn: isNonMobile ? undefined : "span 4",
                          },
                        }}
                      >
                        {/* Item Dropdown */}
                        <FormControl
                          fullWidth
                          sx={{ gridColumn: "span 1" }}
                          error={
                            !!touched.disposableFixedAssetDetails?.[index]
                              ?.itemId &&
                            !!errors.disposableFixedAssetDetails?.[index]
                              ?.itemId
                          }
                        >
                          <InputLabel>Item</InputLabel>
                          <Select
                            name={`disposableFixedAssetDetails[${index}].itemId`}
                            value={detail.itemId}
                            onChange={(e) =>
                              handleItemChange(e, index, setFieldValue)
                            }
                            onBlur={handleBlur}
                            label="Item"
                          >
                            {items.map((item) => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.itemName}
                              </MenuItem>
                            ))}
                          </Select>
                          {!!touched.disposableFixedAssetDetails?.[index]
                            ?.itemId &&
                            !!errors.disposableFixedAssetDetails?.[index]
                              ?.itemId && (
                              <FormHelperText>
                                {
                                  errors.disposableFixedAssetDetails[index]
                                    .itemId
                                }
                              </FormHelperText>
                            )}
                        </FormControl>

                        {/* Description */}
                        <TextField
                          fullWidth
                          label="Description"
                          name={`disposableFixedAssetDetails[${index}].description`}
                          value={detail.description}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            !!touched.disposableFixedAssetDetails?.[index]
                              ?.description &&
                            !!errors.disposableFixedAssetDetails?.[index]
                              ?.description
                          }
                          helperText={
                            touched.disposableFixedAssetDetails?.[index]
                              ?.description &&
                            errors.disposableFixedAssetDetails?.[index]
                              ?.description
                          }
                          sx={{ gridColumn: "span 1" }}
                        />

                        {/* Quantity */}
                        <TextField
                          fullWidth
                          type="number"
                          label="Quantity"
                          name={`disposableFixedAssetDetails[${index}].quantity`}
                          value={detail.quantity}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            !!touched.disposableFixedAssetDetails?.[index]
                              ?.quantity &&
                            !!errors.disposableFixedAssetDetails?.[index]
                              ?.quantity
                          }
                          helperText={
                            touched.disposableFixedAssetDetails?.[index]
                              ?.quantity &&
                            errors.disposableFixedAssetDetails?.[index]
                              ?.quantity
                          }
                          sx={{ gridColumn: "span 1" }}
                          InputProps={{
                            inputProps: { min: 1 },
                          }}
                        />

                        {/* Expiration Date */}
                        <TextField
                          fullWidth
                          type="date"
                          label="Expiration Date"
                          name={`disposableFixedAssetDetails[${index}].expirationDate`}
                          value={detail.expirationDate}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ readOnly: true }}
                          error={
                            !!touched.disposableFixedAssetDetails?.[index]
                              ?.expirationDate &&
                            !!errors.disposableFixedAssetDetails?.[index]
                              ?.expirationDate
                          }
                          helperText={
                            touched.disposableFixedAssetDetails?.[index]
                              ?.expirationDate &&
                            errors.disposableFixedAssetDetails?.[index]
                              ?.expirationDate
                          }
                          sx={{ gridColumn: "span 1" }}
                        />

                        {/* Batch No */}
                        <TextField
                          fullWidth
                          label="Batch No"
                          name={`disposableFixedAssetDetails[${index}].batchNo`}
                          value={detail.batchNo}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          InputProps={{ readOnly: true }}
                          error={
                            !!touched.disposableFixedAssetDetails?.[index]
                              ?.batchNo &&
                            !!errors.disposableFixedAssetDetails?.[index]
                              ?.batchNo
                          }
                          helperText={
                            touched.disposableFixedAssetDetails?.[index]
                              ?.batchNo &&
                            errors.disposableFixedAssetDetails?.[index]?.batchNo
                          }
                          sx={{ gridColumn: "span 1" }}
                        />

                        {/* Remove button for detail */}
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => remove(index)}
                          sx={{ gridColumn: "span 4", mt: 1 }}
                          startIcon={<Remove />}
                        >
                          Remove Detail
                        </Button>
                      </Paper>
                    ))}
                    <Button
                      variant="contained"
                      onClick={() =>
                        push({
                          id: uuidv4(),
                          itemId: "",
                          description: "",
                          quantity: 1,
                          expirationDate: "",
                          batchNo: "",
                        })
                      }
                      sx={{ gridColumn: "span 4", mt: 1 }}
                      startIcon={<Add />}
                    >
                      Add Disposable Asset Detail
                    </Button>
                  </>
                )}
              </FieldArray>
            </Box>

            <Box display="flex" justifyContent="start" mt="20px">
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Updating..."
                  : "Update Disposable Asset Request"}
              </Button>
            </Box>
          </form>
        )}
      </Formik>

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
};

export default UpdateDisposableAsset;
