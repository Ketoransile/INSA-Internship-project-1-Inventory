import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Paper,
  IconButton,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import Header from "../../common/Header";
import {
  getDepartments,
  getStores,
  getItems,
  getNeedAssessmentById,
  updateNeedAssessment,
} from "../../api/inventoryApi";
import { v4 as uuidv4 } from "uuid";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";

const UpdateNeedAssessment = () => {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [departments, setDepartments] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);

  const budgetYearId = "3fa85f64-5717-4562-b3fc-2c963f66afa6"; // constant

  useEffect(() => {
    if (!tenantId || !id) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [deptRes, storeRes, itemsRes, assessmentRes] = await Promise.all([
          getDepartments(tenantId),
          getStores(tenantId),
          getItems(tenantId),
          getNeedAssessmentById(tenantId, id),
        ]);

        setDepartments(deptRes.data || []);
        setStores(storeRes.data || []);
        setItems(itemsRes.data || []);

        const data = assessmentRes.data;

        const initialValues = {
          purchaseType: data.purchaseType || "GOODS",
          departmentId: data.departmentId || "",
          storeId: data.storeId || "",
          assessmentDetail:
            data.assessmentResponse.map((d) => ({
              id: uuidv4(),
              itemId: d.itemId,
              generalLedger: d.generalLedger || budgetYearId,
              budgetAmount: d.budgetAmount,
            })) || [],
        };

        setFormInitialValues(initialValues);
      } catch (error) {
        console.error("Failed to fetch assessment data:", error);
        setNotification({
          open: true,
          message: "Failed to fetch assessment data",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId, id]);

  const [formInitialValues, setFormInitialValues] = useState({
    purchaseType: "GOODS",
    departmentId: "",
    storeId: "",
    assessmentDetail: [
      {
        id: uuidv4(),
        itemId: "",
        generalLedger: budgetYearId,
        budgetAmount: 0,
      },
    ],
  });

  const validationSchema = yup.object().shape({
    purchaseType: yup.string().required("Purchase Type is required"),
    departmentId: yup.string().required("Department is required"),
    storeId: yup.string().required("Store is required"),
    assessmentDetail: yup
      .array()
      .of(
        yup.object().shape({
          itemId: yup.string().required("Item is required"),
          budgetAmount: yup
            .number()
            .min(0.01, "Budget Amount must be greater than 0")
            .required("Budget Amount is required"),
        })
      )
      .min(1, "At least one assessment detail is required"),
  });

  const handleSubmit = async (values) => {
    const payload = {
      purchaseType: values.purchaseType,
      departmentId: values.departmentId,
      storeId: values.storeId,
      budgetYearId,
      assessmentDetail: values.assessmentDetail.map(
        ({ itemId, generalLedger, budgetAmount }) => ({
          itemId,
          generalLedger,
          budgetAmount,
        })
      ),
    };

    try {
      setLoading(true);
      await updateNeedAssessment(tenantId, id, payload);
      setNotification({
        open: true,
        message: "Assessment updated successfully!",
        severity: "success",
      });
      navigate("/list-need-assessment");
    } catch (error) {
      console.error("Failed to update assessment:", error);
      setNotification({
        open: true,
        message: error.response?.data?.message || "Failed to update assessment",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header subtitle="Update Need Assessment" />

      <Formik
        enableReinitialize
        initialValues={formInitialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          // setFieldValue,
        }) => (
          <form onSubmit={(e) => e.preventDefault()}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl
                  fullWidth
                  error={touched.purchaseType && !!errors.purchaseType}
                >
                  <InputLabel>Purchase Type</InputLabel>
                  <Select
                    name="purchaseType"
                    value={values.purchaseType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <MenuItem value="GOODS">GOODS</MenuItem>
                    <MenuItem value="SERVICE">SERVICE</MenuItem>
                    <MenuItem value="WORK">WORK</MenuItem>
                  </Select>
                  {touched.purchaseType && errors.purchaseType && (
                    <Typography color="error">{errors.purchaseType}</Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl
                  fullWidth
                  error={touched.departmentId && !!errors.departmentId}
                >
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="departmentId"
                    value={values.departmentId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    {departments.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.departmentName}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.departmentId && errors.departmentId && (
                    <Typography color="error">{errors.departmentId}</Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl
                  fullWidth
                  error={touched.storeId && !!errors.storeId}
                >
                  <InputLabel>Store</InputLabel>
                  <Select
                    name="storeId"
                    value={values.storeId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    {stores.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.storeName}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.storeId && errors.storeId && (
                    <Typography color="error">{errors.storeId}</Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6">Assessment Details</Typography>
                <FieldArray
                  name="assessmentDetail"
                  render={(arrayHelpers) => (
                    <>
                      {values.assessmentDetail.map((detail, index) => (
                        <Paper key={detail.id} sx={{ p: 2, mb: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <FormControl
                                fullWidth
                                error={
                                  touched.assessmentDetail?.[index]?.itemId &&
                                  !!errors.assessmentDetail?.[index]?.itemId
                                }
                              >
                                <InputLabel>Item</InputLabel>
                                <Select
                                  name={`assessmentDetail[${index}].itemId`}
                                  value={detail.itemId}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                >
                                  {items.map((i) => (
                                    <MenuItem key={i.id} value={i.id}>
                                      {i.itemName}
                                    </MenuItem>
                                  ))}
                                </Select>
                                {touched.assessmentDetail?.[index]?.itemId &&
                                  errors.assessmentDetail?.[index]?.itemId && (
                                    <Typography color="error">
                                      {errors.assessmentDetail[index].itemId}
                                    </Typography>
                                  )}
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Budget Amount"
                                type="number"
                                fullWidth
                                name={`assessmentDetail[${index}].budgetAmount`}
                                value={detail.budgetAmount}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={
                                  touched.assessmentDetail?.[index]
                                    ?.budgetAmount &&
                                  !!errors.assessmentDetail?.[index]
                                    ?.budgetAmount
                                }
                                helperText={
                                  touched.assessmentDetail?.[index]
                                    ?.budgetAmount &&
                                  errors.assessmentDetail?.[index]?.budgetAmount
                                }
                                inputProps={{ min: 0 }}
                              />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="General Ledger"
                                value={detail.generalLedger}
                                disabled
                                fullWidth
                              />
                            </Grid>

                            <Grid item xs={12}>
                              <IconButton
                                color="error"
                                onClick={() => arrayHelpers.remove(index)}
                                disabled={values.assessmentDetail.length === 1}
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
                          arrayHelpers.push({
                            id: uuidv4(),
                            itemId: "",
                            generalLedger: budgetYearId,
                            budgetAmount: 0,
                          })
                        }
                      >
                        Add Detail
                      </Button>
                    </>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  onClick={() => handleSubmit(values)}
                >
                  {loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Update Assessment"
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>

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
};

export default UpdateNeedAssessment;
