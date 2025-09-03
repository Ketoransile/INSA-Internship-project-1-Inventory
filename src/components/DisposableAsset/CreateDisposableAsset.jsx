import React, { useState, useEffect } from "react";
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
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../common/Header";
import { v4 as uuidv4 } from "uuid";
import {
  createDisposableRequest,
  getStores,
  getDepartments,
  getItems,
  getDrNo,
} from "../../api/inventoryApi";
import { useNavigate } from "react-router-dom";

// Enums to match API
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

// Updated validation schema without tagNumber
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

const CreateDisposableAsset = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [formInitialValues, setFormInitialValues] = useState(null);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [errorLoadingData, setErrorLoadingData] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!tenantId) {
        setLoadingDropdowns(false);
        setErrorLoadingData(true);
        setNotification({
          open: true,
          message: "Tenant ID is missing. Please authenticate again.",
          severity: "error",
        });
        return;
      }

      try {
        setLoadingDropdowns(true);
        setErrorLoadingData(false);

        const [storesRes, departmentsRes, itemsRes, drNoRes] =
          await Promise.all([
            getStores(tenantId),
            getDepartments(tenantId),
            getItems(tenantId),
            getDrNo(tenantId),
          ]);
        console.log("result of drNoRes = === ", drNoRes);
        console.log("result of departments = === ", departmentsRes);

        setStores(storesRes.data || []);
        setDepartments(departmentsRes.data || []);
        setItems(itemsRes.data || []);

        setFormInitialValues({
          drNo: drNoRes?.data.drNumber || "",
          storeId: "",
          departmentId: "",
          disposableType: DisposableType.FIXED_ASSET,
          requisitionDate: new Date().toISOString().split("T")[0],
          disposalStatus: DisposalStatus.PENDING,
          disposableFixedAssetDetails: [
            {
              id: uuidv4(),
              itemId: "",
              description: "",
              quantity: 1,
              expirationDate: "",
              batchNo: "",
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        setErrorLoadingData(true);
        setNotification({
          open: true,
          message: `Failed to load necessary data: ${error.message || "Unknown error"}`,
          severity: "error",
        });
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdownData();
  }, [tenantId]);

  const handleCloseSnackbar = () => {
    setNotification({ ...notification, open: false });
  };

  const onSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      setLoading(true);
      const payload = {
        storeId: values.storeId,
        departmentId: values.departmentId,
        disposableType: values.disposableType,
        requisitionDate: values.requisitionDate,
        disposalStatus: values.disposalStatus,
        disposableFixedAssetDetails: values.disposableFixedAssetDetails.map(
          (detail) => ({
            itemId: detail.itemId,
            description: detail.description,
            quantity: parseInt(detail.quantity, 10),
            expirationDate: detail.expirationDate || null,
            batchNo: detail.batchNo || null,
          })
        ),
      };
      // Log the payload to verify its structure
      console.log("Payload sent to backend:", JSON.stringify(payload, null, 2));

      // Log the tenantId to ensure it's present
      console.log("Tenant ID:", tenantId);

      // Log the Authorization header (if set globally in Axios or authState)
      console.log("authState====", authState);
      console.log(
        "Authorization Header:",
        authState?.accessToken
          ? `Bearer ${authState?.accessToken}`
          : "No token found"
      );
      const response = await createDisposableRequest(tenantId, payload);
      console.log("Response from backend is ", response);

      if (response.status === 200 || response.status === 201) {
        setNotification({
          open: true,
          message: "Disposable Asset Request created successfully!",
          severity: "success",
        });
        resetForm({ values: formInitialValues });
        setTimeout(() => {
          navigate("/list-disposable-asset");
        }, 1000);
      } else {
        setNotification({
          open: true,
          message: "Failed to create request. Please try again.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error creating request:", error);
      setNotification({
        open: true,
        message: `An error occurred: ${error.response?.data?.message || error.message || "Please try again."}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  if (loadingDropdowns && !errorLoadingData) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading form data...
        </Typography>
      </Box>
    );
  }

  if (errorLoadingData) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        textAlign="center"
        p={3}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Failed to load required data
        </Typography>
        <Typography variant="body1" gutterBottom>
          {notification.message ||
            "An error occurred while loading the form data."}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!formInitialValues) {
    return null; // This shouldn't happen as we have error states covered above
  }

  return (
    <Box m="20px">
      <Header subtitle="Create New Disposable Asset Request" />
      <Formik
        initialValues={formInitialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
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
        }) => {
          // console.log("values ===== ", values);
          // console.log("errors ===== ", errors);
          // console.log("touched ===== ", touched);
          const handleItemChange = async (e, index) => {
            const selectedItemId = e.target.value;
            const batchNoPath = `disposableFixedAssetDetails[${index}].batchNo`;
            const expirationDatePath = `disposableFixedAssetDetails[${index}].expirationDate`;

            handleChange(e);
            const selectedItem = items.find(
              (item) => item.id === selectedItemId
            );

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

          return (
            <form onSubmit={handleSubmit}>
              {/* ... rest of your form JSX remains the same ... */}
              <Box
                display="grid"
                gap="30px"
                gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                sx={{
                  "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                }}
              >
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
                      {values.disposableFixedAssetDetails.map(
                        (detail, index) => (
                          <Paper
                            key={detail.id}
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
                                onChange={(e) => handleItemChange(e, index)}
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
                                errors.disposableFixedAssetDetails?.[index]
                                  ?.batchNo
                              }
                              sx={{ gridColumn: "span 1" }}
                            />
                            <TextField
                              fullWidth
                              label="DR No"
                              name="drNo"
                              value={values.drNo}
                              InputProps={{ readOnly: true }}
                              sx={{ gridColumn: "span 2" }}
                            />

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
                        )
                      )}
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
                {loading ? (
                  <Button variant="outlined" disabled>
                    Submitting...
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    color={loading ? "" : "primary"}
                    variant="contained"
                    disabled={loading}
                  >
                    Create Disposable Asset Request
                  </Button>
                )}
              </Box>
            </form>
          );
        }}
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

export default CreateDisposableAsset;
