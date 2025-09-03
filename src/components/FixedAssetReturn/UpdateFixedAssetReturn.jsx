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

// API imports
import {
  getFixedAssetReturnById,
  updateFixedAssetReturn,
  getStores,
  getDepartments,
  getEmployees,
  getItems,
} from "../../api/inventoryApi";

// Validation schema (same as create)
const validationSchema = yup.object().shape({
  storeId: yup.string().required("Store is required"),
  departmentId: yup.string().required("Department is required"),
  returnedById: yup.string().required("Returned By is required"),
  receivedDate: yup.date().required("Received Date is required").nullable(),
  returnedDate: yup.date().required("Returned Date is required").nullable(),
  returnDetailRequests: yup
    .array()
    .of(
      yup.object().shape({
        itemId: yup.string().required("Item is required"),
        description: yup.string().required("Description is required"),
      })
    )
    .min(1, "At least one return detail is required"),
});

const UpdateFixedAssetReturn = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { id } = useParams();
  const navigate = useNavigate();
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;

  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch dropdown data
  const fetchLookupData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoadingDropdowns(true);
      const [storesRes, departmentsRes, employeesRes, itemsRes] =
        await Promise.all([
          getStores(tenantId),
          getDepartments(tenantId),
          getEmployees(tenantId),
          getItems(tenantId),
        ]);
      setStores(storesRes.data || []);
      setDepartments(departmentsRes.data || []);
      setEmployees(employeesRes.data || []);
      setItems(itemsRes.data || []);
    } catch (error) {
      console.error(error);
      setNotification({
        open: true,
        message: "Failed to load lookup data.",
        severity: "error",
      });
    } finally {
      setLoadingDropdowns(false);
    }
  }, [tenantId]);

  // Fetch Fixed Asset Return data
  const fetchFixedAssetReturnData = useCallback(async () => {
    if (!id || !tenantId) return;
    try {
      setLoading(true);
      const response = await getFixedAssetReturnById(tenantId, id);
      const data = response.data;
      console.log("data is ", data);

      const mappedDetails = (data.returnDetails || []).map((detail) => ({
        id: detail.id || uuidv4(),
        itemId: detail.itemId,
        description: detail.description || "",
      }));

      setInitialValues({
        assetReturnNo: data.assetReturnNo || "",
        storeId: data.storeId || "",
        departmentId: data.departmentId || "",
        returnedById: data.returnedById || "",
        returnStatus: data.returnStatus || "PENDING",
        receivedDate: data.receivedDate
          ? new Date(data.receivedDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        returnedDate: data.returnedDate
          ? new Date(data.returnedDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        returnDetailRequests: mappedDetails,
      });
    } catch (error) {
      console.error(error);
      setNotification({
        open: true,
        message: "Failed to fetch Fixed Asset Return data.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [id, tenantId]);

  useEffect(() => {
    fetchLookupData();
    fetchFixedAssetReturnData();
  }, [fetchLookupData, fetchFixedAssetReturnData]);

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        assetReturnNo: values.assetReturnNo,
        departmentId: values.departmentId,
        storeId: values.storeId,
        returnedById: values.returnedById,
        returnStatus: values.returnStatus,
        receivedDate: values.receivedDate,
        returnedDate: values.returnedDate,
        returnDetailRequests: values.returnDetailRequests.map((detail) => ({
          itemId: detail.itemId,
          itemStatus: "NORMAL",
          description: detail.description,
        })),
      };

      const response = await updateFixedAssetReturn(tenantId, id, payload);
      if (response.status === 200 || response.status === 201) {
        setNotification({
          open: true,
          message: "Fixed Asset Return updated successfully!",
          severity: "success",
        });
        navigate("/list-fixed-asset-return");
      } else {
        setNotification({
          open: true,
          message: "Failed to update Fixed Asset Return.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error(error);
      setNotification({
        open: true,
        message:
          error.response?.data?.message ||
          "An error occurred. Please try again.",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setNotification({ ...notification, open: false });
  };

  if (!id) {
    return (
      <NotPageHandle
        message="No Fixed Asset Return selected to Update"
        navigateTo="/fixed-asset-return/list"
      />
    );
  }

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
          Loading Fixed Asset Return data...
        </Typography>
      </Box>
    );
  }

  if (!initialValues) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography variant="h6" color="error">
          Failed to load Fixed Asset Return. Please check the ID.
        </Typography>
        <Button
          onClick={() => navigate("/fixed-asset-return/list")}
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
        subtitle={`Update Fixed Asset Return (No: ${initialValues.assetReturnNo})`}
      />
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleFormSubmit}
        enableReinitialize
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
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
              {/* Asset Return No (read-only) */}
              <TextField
                fullWidth
                label="Asset Return No"
                name="assetReturnNo"
                value={values.assetReturnNo}
                InputProps={{ readOnly: true }}
                sx={{ gridColumn: "span 2" }}
              />

              {/* Store */}
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

              {/* Department */}
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

              {/* Returned By */}
              <FormControl
                fullWidth
                sx={{ gridColumn: "span 2" }}
                error={!!touched.returnedById && !!errors.returnedById}
              >
                <InputLabel>Returned By</InputLabel>
                <Select
                  name="returnedById"
                  value={values.returnedById}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.firstName || emp.employeeName}
                    </MenuItem>
                  ))}
                </Select>
                {!!touched.returnedById && !!errors.returnedById && (
                  <FormHelperText>{errors.returnedById}</FormHelperText>
                )}
              </FormControl>

              {/* Received Date */}
              <TextField
                fullWidth
                type="date"
                label="Received Date"
                name="receivedDate"
                value={values.receivedDate}
                onChange={handleChange}
                onBlur={handleBlur}
                InputLabelProps={{ shrink: true }}
                error={!!touched.receivedDate && !!errors.receivedDate}
                helperText={touched.receivedDate && errors.receivedDate}
                sx={{ gridColumn: "span 2" }}
              />

              {/* Returned Date */}
              <TextField
                fullWidth
                type="date"
                label="Returned Date"
                name="returnedDate"
                value={values.returnedDate}
                onChange={handleChange}
                onBlur={handleBlur}
                InputLabelProps={{ shrink: true }}
                error={!!touched.returnedDate && !!errors.returnedDate}
                helperText={touched.returnedDate && errors.returnedDate}
                sx={{ gridColumn: "span 2" }}
              />

              {/* Return Details */}
              <FieldArray name="returnDetailRequests">
                {({ push, remove }) => (
                  <>
                    <Box sx={{ gridColumn: "span 4", mt: 2 }}>
                      <h3>Return Details</h3>
                    </Box>
                    {values.returnDetailRequests.map((detail, index) => (
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
                          sx={{ gridColumn: "span 2" }}
                          error={
                            !!touched.returnDetailRequests?.[index]?.itemId &&
                            !!errors.returnDetailRequests?.[index]?.itemId
                          }
                        >
                          <InputLabel>Item</InputLabel>
                          <Select
                            name={`returnDetailRequests[${index}].itemId`}
                            value={detail.itemId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          >
                            {items.map((item) => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.itemName}
                              </MenuItem>
                            ))}
                          </Select>
                          {!!touched.returnDetailRequests?.[index]?.itemId &&
                            !!errors.returnDetailRequests?.[index]?.itemId && (
                              <FormHelperText>
                                {errors.returnDetailRequests[index].itemId}
                              </FormHelperText>
                            )}
                        </FormControl>

                        {/* Description */}
                        <TextField
                          fullWidth
                          label="Description"
                          name={`returnDetailRequests[${index}].description`}
                          value={detail.description}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            !!touched.returnDetailRequests?.[index]
                              ?.description &&
                            !!errors.returnDetailRequests?.[index]?.description
                          }
                          helperText={
                            touched.returnDetailRequests?.[index]
                              ?.description &&
                            errors.returnDetailRequests?.[index]?.description
                          }
                          sx={{ gridColumn: "span 2" }}
                        />

                        {/* Remove button */}
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
                        push({ id: uuidv4(), itemId: "", description: "" })
                      }
                      sx={{ gridColumn: "span 4", mt: 1 }}
                      startIcon={<Add />}
                    >
                      Add Return Detail
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
                {isSubmitting ? "Updating..." : "Update Fixed Asset Return"}
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

export default UpdateFixedAssetReturn;
