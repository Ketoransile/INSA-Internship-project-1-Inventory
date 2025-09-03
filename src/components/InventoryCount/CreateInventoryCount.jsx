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
  FormHelperText,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import {
  getEmployees,
  createInventoryCount,
  getItems,
  getStores,
  getinventoryCountNumber,
} from "../../api/inventoryApi";
import { v4 as uuidv4 } from "uuid";
import Header from "../../common/Header";
import { useNavigate } from "react-router-dom";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";

const validationSchema = yup.object().shape({
  storeId: yup.string().required("Store is required"),
  countDate: yup.date().required("Count Date is required").nullable(),
  committeeMembersId: yup
    .array()
    .of(yup.string().required())
    .min(1, "At least one committee member is required"),
  inventoryItems: yup
    .array()
    .of(
      yup.object().shape({
        itemId: yup.string().required("Item is required"),
        quantity: yup
          .number()
          .required("Quantity is required")
          .min(1, "Quantity must be at least 1")
          .integer("Quantity must be an integer")
          .typeError("Quantity must be a number"),
        remark: yup.string().nullable(),
      })
    )
    .min(1, "At least one inventory item is required"),
});

export default function CreateInventoryCount() {
  const navigate = useNavigate();
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const tenantName = authState.username || "";

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [stores, setStores] = useState([]);
  const [inventoryCountNumber, setInventoryCountNumber] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const committeeId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
  const budgetYearId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

  useEffect(() => {
    if (!tenantId) return;
    async function fetchData() {
      try {
        const [empRes, itemsRes, storeRes] = await Promise.all([
          getEmployees(tenantId),
          getItems(tenantId),
          getStores(tenantId),
        ]);
        setEmployees(empRes.data);
        setItems(itemsRes.data);
        setStores(storeRes.data);
      } catch {
        setNotification({
          open: true,
          message: "Failed to fetch form data",
          severity: "error",
        });
      }
    }
    fetchData();
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    const fetchNumber = async () => {
      const res = await getinventoryCountNumber(tenantId);
      setInventoryCountNumber(res.data.countNumber);
    };
    fetchNumber();
  }, [tenantId]);

  const handleCloseSnackbar = () =>
    setNotification({ ...notification, open: false });

  return (
    <Box m="20px">
      <Header subtitle="Create Inventory Count" />
      <Formik
        initialValues={{
          storeId: "",
          countDate: "",
          committeeMembersId: [],
          countType: "PERIODIC",
          storeType: "INTERNAL",
          inventoryItems: [
            { id: uuidv4(), itemId: "", itemCode: "", quantity: 1, remark: "" },
          ],
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            setLoading(true);
            const payload = {
              storeId: values.storeId,
              committeeId,
              inventoryCountNumber,
              committeeMembersId: values.committeeMembersId,
              countType: values.countType,
              storeType: values.storeType,
              budgetYearId,
              countDate: values.countDate,
              inventoryItems: values.inventoryItems.map(
                ({ itemId, quantity, remark }) => ({
                  itemId,
                  quantity,
                  remark,
                })
              ),
            };
            console.log("payload", payload);
            await createInventoryCount(tenantId, payload);
            setNotification({
              open: true,
              message: "Inventory Count Created Successfully",
              severity: "success",
            });
            setTimeout(() => {
              navigate(`/list-inventory-count`);
            }, 1000);
          } catch (error) {
            console.log("error", error);
            setNotification({
              open: true,
              message: "Failed to create inventory count",
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
          handleBlur,
          handleSubmit,
          setFieldValue,
        }) => (
          <form onSubmit={handleSubmit}>
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

              {/* Inventory Count No */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Inventory Count No"
                  value={inventoryCountNumber}
                  disabled
                  fullWidth
                />
              </Grid>

              {/* Store */}
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  error={touched.storeId && !!errors.storeId}
                >
                  <InputLabel>Store Name</InputLabel>
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
                    <FormHelperText>{errors.storeId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Count Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Count Date"
                  type="date"
                  name="countDate"
                  value={values.countDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  InputLabelProps={{ shrink: true }}
                  error={touched.countDate && !!errors.countDate}
                  helperText={touched.countDate && errors.countDate}
                  fullWidth
                />
              </Grid>

              {/* Store Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Store Type</InputLabel>
                  <Select
                    name="storeType"
                    value={values.storeType}
                    onChange={handleChange}
                  >
                    <MenuItem value="INTERNAL">Internal</MenuItem>
                    <MenuItem value="MERCHANDISED">Merchandised</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Count Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Count Type</InputLabel>
                  <Select
                    name="countType"
                    value={values.countType}
                    onChange={handleChange}
                  >
                    <MenuItem value="PERIODIC">Periodic</MenuItem>
                    <MenuItem value="PERPETUAL">Perpetual</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Committee Members */}
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  error={
                    touched.committeeMembersId && !!errors.committeeMembersId
                  }
                >
                  <InputLabel>Committee Members</InputLabel>
                  <Select
                    multiple
                    name="committeeMembersId"
                    value={values.committeeMembersId}
                    onChange={handleChange}
                    onBlur={handleBlur}
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
                    <FormHelperText>{errors.committeeMembersId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Inventory Items */}
              <Grid item xs={12}>
                <Typography variant="h6">Inventory Detail</Typography>
                <FieldArray name="inventoryItems">
                  {({ push, remove }) => (
                    <>
                      {values.inventoryItems.map((item, index) => (
                        <Paper key={item.id} sx={{ p: 2, mb: 2 }}>
                          <Grid container spacing={2}>
                            {/* Item */}
                            <Grid item xs={12} sm={4}>
                              <FormControl
                                fullWidth
                                error={
                                  touched.inventoryItems?.[index]?.itemId &&
                                  !!errors.inventoryItems?.[index]?.itemId
                                }
                              >
                                <InputLabel>Item</InputLabel>
                                <Select
                                  name={`inventoryItems[${index}].itemId`}
                                  value={item.itemId}
                                  onChange={(e) => {
                                    handleChange(e);
                                    const selectedItem = items.find(
                                      (i) => i.id === e.target.value
                                    );
                                    setFieldValue(
                                      `inventoryItems[${index}].itemCode`,
                                      selectedItem?.itemCode || ""
                                    );
                                  }}
                                >
                                  {items.map((i) => (
                                    <MenuItem key={i.id} value={i.id}>
                                      {i.itemName}
                                    </MenuItem>
                                  ))}
                                </Select>
                                {touched.inventoryItems?.[index]?.itemId &&
                                  errors.inventoryItems?.[index]?.itemId && (
                                    <FormHelperText>
                                      {errors.inventoryItems[index].itemId}
                                    </FormHelperText>
                                  )}
                              </FormControl>
                            </Grid>

                            {/* Item Code */}
                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Item Code"
                                value={item.itemCode}
                                disabled
                                fullWidth
                              />
                            </Grid>

                            {/* Quantity */}
                            <Grid item xs={12} sm={3}>
                              <TextField
                                label="Quantity"
                                type="number"
                                name={`inventoryItems[${index}].quantity`}
                                value={item.quantity}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                inputProps={{ min: 1 }}
                                error={
                                  touched.inventoryItems?.[index]?.quantity &&
                                  !!errors.inventoryItems?.[index]?.quantity
                                }
                                helperText={
                                  touched.inventoryItems?.[index]?.quantity &&
                                  errors.inventoryItems?.[index]?.quantity
                                }
                                fullWidth
                              />
                            </Grid>

                            {/* Remark */}
                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Remark"
                                name={`inventoryItems[${index}].remark`}
                                value={item.remark}
                                onChange={handleChange}
                                fullWidth
                              />
                            </Grid>

                            {/* Remove */}
                            <Grid item xs={12} sm={1}>
                              <IconButton
                                color="error"
                                onClick={() => remove(index)}
                                disabled={values.inventoryItems.length === 1}
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
                            itemCode: "",
                            quantity: 1,
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

              {/* Submit */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  fullWidth
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Create Inventory Count"
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
}
