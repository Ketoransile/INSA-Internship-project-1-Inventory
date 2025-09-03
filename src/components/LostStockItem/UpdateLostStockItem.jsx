import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Grid,
  Paper,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import { v4 as uuidv4 } from "uuid";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, FieldArray, Form } from "formik";
import * as Yup from "yup";
import Header from "../../common/Header";
import {
  getStores,
  getDepartments,
  getItems,
  getEmployees,
  getLostStockItemById,
  updateLostStockItem,
} from "../../api/inventoryApi";

const lostItemDetailSchema = Yup.object().shape({
  itemId: Yup.string().required("Item is required"),
  quantity: Yup.number()
    .min(1, "Quantity must be at least 1")
    .required("Quantity is required"),
  description: Yup.string(),
  duration: Yup.string(),
  remark: Yup.string(),
});

const lostStockItemSchema = Yup.object().shape({
  storeId: Yup.string().required("Store is required"),
  departmentId: Yup.string().required("Department is required"),
  registrationDate: Yup.date()
    .required("Registration Date is required")
    .typeError("Invalid date"),
  status: Yup.string().required("Status is required"),
  region: Yup.string().required("Region is required"),
  committeeMembersId: Yup.array()
    .min(1, "Select at least one committee member")
    .required("Committee Members are required"),
  lostStockItemDetails: Yup.array()
    .of(lostItemDetailSchema)
    .min(1, "At least one lost item detail is required"),
});

export default function UpdateLostStockItem() {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const tenantName = authState.username || "";

  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [initialValues, setInitialValues] = useState(null);
  const [file, setFile] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (!tenantId || !id) return;

    async function fetchData() {
      try {
        const [storesRes, deptRes, itemsRes, empRes, lostItemRes] =
          await Promise.all([
            getStores(tenantId),
            getDepartments(tenantId),
            getItems(tenantId),
            getEmployees(tenantId),
            getLostStockItemById(tenantId, id),
          ]);

        setStores(storesRes.data || []);
        setDepartments(deptRes.data || []);
        setItems(itemsRes.data || []);
        setEmployees(empRes.data || []);

        const data = lostItemRes.data;

        setInitialValues({
          lostStockItemNo: data.lostStockItemNo || "",
          storeId: data.storeId || "",
          departmentId: data.departmentId || "",
          registrationDate: data.registrationDate?.split("T")[0] || "",
          status: data.status || "",
          region: data.region || "",
          committeeId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          committeeMembersId: data.committeeMembersId || [],
          lostStockItemDetails:
            Array.isArray(data.lostStockItemDetails) &&
            data.lostStockItemDetails.length > 0
              ? data.lostStockItemDetails.map((d) => ({
                  id: uuidv4(),
                  itemId: d.itemId,
                  quantity: d.quantity || 1,
                  description: d.description || "",
                  duration: d.duration || "",
                  remark: d.remark || "",
                }))
              : [
                  {
                    id: uuidv4(),
                    itemId: "",
                    quantity: 1,
                    description: "",
                    duration: "",
                    remark: "",
                  },
                ],
        });
      } catch (error) {
        console.log("error", error);
        setNotification({
          open: true,
          message: "Failed to load Lost Stock Item",
          severity: "error",
        });
      }
    }

    fetchData();
  }, [tenantId, id]);

  if (!initialValues) return <CircularProgress />;

  return (
    <Box m="20px">
      <Header subtitle="Update Lost Stock Item" />
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={lostStockItemSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            setLoading(true);
            const payload = {
              lostStockItemNo: values.lostStockItemNo,
              registrationDate: values.registrationDate,
              departmentId: values.departmentId,
              status: values.status,
              region: values.region,
              committeeId: values.committeeId,
              committeeMembersId: values.committeeMembersId,
              storeId: values.storeId,
              lostStockItemDetailRequest: values.lostStockItemDetails.map(
                ({ itemId, quantity, description, duration, remark }) => ({
                  itemId,
                  quantity,
                  description,
                  duration,
                  remark,
                })
              ),
            };

            const response = await updateLostStockItem(
              tenantId,
              id,
              payload,
              file
            );

            if (response.status === 200) {
              setNotification({
                open: true,
                message: "Lost Stock Item updated successfully!",
                severity: "success",
              });
              setTimeout(() => navigate("/lost-stock-item/list"), 1500);
            } else {
              setNotification({
                open: true,
                message: "Failed to update Lost Stock Item",
                severity: "error",
              });
            }
          } catch (error) {
            console.log("error", error);
            setNotification({
              open: true,
              message: "Error while updating Lost Stock Item",
              severity: "error",
            });
          } finally {
            setLoading(false);
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          setFieldValue,
          isSubmitting,
        }) => (
          <Form>
            <Grid container spacing={2}>
              {/* Tenant */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tenant"
                  value={tenantName}
                  disabled
                  fullWidth
                />
              </Grid>

              {/* Lost Stock Item No */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Lost Stock Item No"
                  value={values.lostStockItemNo}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Grid>

              {/* Store */}
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  error={touched.storeId && Boolean(errors.storeId)}
                >
                  <InputLabel>Store</InputLabel>
                  <Select
                    name="storeId"
                    value={values.storeId}
                    onChange={handleChange}
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

              {/* Department */}
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  error={touched.departmentId && Boolean(errors.departmentId)}
                >
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="departmentId"
                    value={values.departmentId}
                    onChange={handleChange}
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

              {/* Registration Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Registration Date"
                  type="date"
                  name="registrationDate"
                  value={values.registrationDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  error={
                    touched.registrationDate && Boolean(errors.registrationDate)
                  }
                  helperText={
                    touched.registrationDate && errors.registrationDate
                  }
                />
              </Grid>

              {/* Status */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Status"
                  name="status"
                  value={values.status}
                  onChange={handleChange}
                  fullWidth
                  error={touched.status && Boolean(errors.status)}
                  helperText={touched.status && errors.status}
                />
              </Grid>

              {/* Region */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Region"
                  name="region"
                  value={values.region}
                  onChange={handleChange}
                  fullWidth
                  error={touched.region && Boolean(errors.region)}
                  helperText={touched.region && errors.region}
                />
              </Grid>

              {/* Committee Members */}
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  error={
                    touched.committeeMembersId &&
                    Boolean(errors.committeeMembersId)
                  }
                >
                  <InputLabel>Committee Members</InputLabel>
                  <Select
                    multiple
                    name="committeeMembersId"
                    value={values.committeeMembersId}
                    onChange={(e) =>
                      setFieldValue(
                        "committeeMembersId",
                        typeof e.target.value === "string"
                          ? e.target.value.split(",")
                          : e.target.value
                      )
                    }
                    input={<OutlinedInput label="Committee Members" />}
                    renderValue={(selected) =>
                      employees
                        .filter((emp) => selected.includes(emp.id))
                        .map((emp) => `${emp.firstName} ${emp.lastName}`)
                        .join(", ")
                    }
                  >
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        <Checkbox
                          checked={values.committeeMembersId.includes(emp.id)}
                        />
                        <ListItemText
                          primary={`${emp.firstName} ${emp.lastName}`}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.committeeMembersId && errors.committeeMembersId && (
                    <Typography color="error">
                      {errors.committeeMembersId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Lost Stock Item Details */}
              <Grid item xs={12}>
                <Typography variant="h6">Lost Stock Item Details</Typography>
                <FieldArray name="lostStockItemDetails">
                  {({ push, remove }) => (
                    <>
                      {values.lostStockItemDetails.map((detail, index) => (
                        <Paper key={detail.id} sx={{ p: 2, mb: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={3}>
                              <FormControl
                                fullWidth
                                error={
                                  touched.lostStockItemDetails?.[index]
                                    ?.itemId &&
                                  Boolean(
                                    errors.lostStockItemDetails?.[index]?.itemId
                                  )
                                }
                              >
                                <InputLabel>Item</InputLabel>
                                <Select
                                  name={`lostStockItemDetails[${index}].itemId`}
                                  value={detail.itemId}
                                  onChange={handleChange}
                                >
                                  {items.map((i) => (
                                    <MenuItem key={i.id} value={i.id}>
                                      {i.itemName}
                                    </MenuItem>
                                  ))}
                                </Select>
                                {touched.lostStockItemDetails?.[index]
                                  ?.itemId &&
                                  errors.lostStockItemDetails?.[index]
                                    ?.itemId && (
                                    <Typography color="error">
                                      {
                                        errors.lostStockItemDetails[index]
                                          .itemId
                                      }
                                    </Typography>
                                  )}
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Quantity"
                                type="number"
                                name={`lostStockItemDetails[${index}].quantity`}
                                value={detail.quantity}
                                inputProps={{ min: 1 }}
                                onChange={handleChange}
                                fullWidth
                                error={
                                  touched.lostStockItemDetails?.[index]
                                    ?.quantity &&
                                  Boolean(
                                    errors.lostStockItemDetails?.[index]
                                      ?.quantity
                                  )
                                }
                                helperText={
                                  touched.lostStockItemDetails?.[index]
                                    ?.quantity &&
                                  errors.lostStockItemDetails?.[index]?.quantity
                                }
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Duration"
                                name={`lostStockItemDetails[${index}].duration`}
                                value={detail.duration}
                                onChange={handleChange}
                                fullWidth
                              />
                            </Grid>

                            <Grid item xs={12} sm={3}>
                              <TextField
                                label="Description"
                                name={`lostStockItemDetails[${index}].description`}
                                value={detail.description}
                                onChange={handleChange}
                                fullWidth
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Remark"
                                name={`lostStockItemDetails[${index}].remark`}
                                value={detail.remark}
                                onChange={handleChange}
                                fullWidth
                              />
                            </Grid>

                            <Grid item xs={12}>
                              <IconButton
                                color="error"
                                onClick={() => remove(index)}
                                disabled={
                                  values.lostStockItemDetails.length === 1
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
                            quantity: 1,
                            description: "",
                            duration: "",
                            remark: "",
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
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || isSubmitting}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Update Lost Stock Item"
                  )}
                </Button>
              </Grid>
            </Grid>
          </Form>
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
}
