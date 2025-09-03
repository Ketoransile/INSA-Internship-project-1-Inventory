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
  createFixedAssetReturn,
  getStores,
  getDepartments,
  getEmployees,
  getItems,
  getNextFixedAssetReturnNumber,
} from "../../api/inventoryApi";
import { useNavigate } from "react-router-dom";

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

const CreateFixedAssetReturn = () => {
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
  const [employees, setEmployees] = useState([]);
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

        const [storesRes, departmentsRes, employeesRes, itemsRes, returnNoRes] =
          await Promise.all([
            getStores(tenantId),
            getDepartments(tenantId),
            getEmployees(tenantId),
            getItems(tenantId),
            getNextFixedAssetReturnNumber(tenantId),
          ]);
        console.log("returnNoRes", returnNoRes);
        console.log("employeesRes", employeesRes);
        setStores(storesRes.data || []);
        setDepartments(departmentsRes.data || []);
        setEmployees(employeesRes.data || []);
        setItems(itemsRes.data || []);

        setFormInitialValues({
          assetReturnNo: returnNoRes?.data.returnNumber || "",
          storeId: "",
          departmentId: "",
          returnedById: "",
          returnStatus: "PENDING",
          receivedDate: new Date().toISOString().split("T")[0],
          returnedDate: new Date().toISOString().split("T")[0],
          returnDetailRequests: [
            {
              id: uuidv4(),
              itemId: "",
              description: "",
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        setErrorLoadingData(true);
        setNotification({
          open: true,
          message: `Failed to load data: ${error.message || "Unknown error"}`,
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

      console.log("Payload sent to backend:", payload);

      const response = await createFixedAssetReturn(tenantId, payload);

      if (response.status === 200 || response.status === 201) {
        setNotification({
          open: true,
          message: "Fixed Asset Return created successfully!",
          severity: "success",
        });
        setTimeout(() => {
          navigate("/list-fixed-asset-return");
        }, 1000);
        resetForm({ values: formInitialValues });
      } else {
        setNotification({
          open: true,
          message: "Failed to create return. Please try again.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error creating return:", error);
      setNotification({
        open: true,
        message: `An error occurred: ${error.response?.data?.message || error.message}`,
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
    return null;
  }

  return (
    <Box m="20px">
      <Header subtitle="Create New Fixed Asset Return" />
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
              <TextField
                fullWidth
                label="Asset Return No"
                name="assetReturnNo"
                value={values.assetReturnNo}
                InputProps={{ readOnly: true }}
                sx={{ gridColumn: "span 2" }}
              />

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

              <FieldArray name="returnDetailRequests">
                {({ push, remove }) => (
                  <>
                    <Box sx={{ gridColumn: "span 4", mt: 2 }}>
                      <h3 style={{ margin: "0 0 15px 0" }}>Return Details</h3>
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
                        })
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
              {loading ? (
                <Button variant="outlined" disabled>
                  Submitting...
                </Button>
              ) : (
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  disabled={loading}
                >
                  Create Fixed Asset Return
                </Button>
              )}
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

export default CreateFixedAssetReturn;
