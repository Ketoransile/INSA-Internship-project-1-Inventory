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
import Header from "../../common/Header";
import {
  getStores,
  getDepartments,
  getItems,
  getEmployees,
  getNextLostStockItemNumber,
  createLostStockItem,
} from "../../api/inventoryApi";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as yup from "yup";

// Yup validation schema
const validationSchema = yup.object({
  storeId: yup.string().required("Store is required"),
  departmentId: yup.string().required("Department is required"),
  status: yup.string().required("Status is required"),
  region: yup.string().required("Region is required"),
  committeeMembersId: yup
    .array()
    .min(1, "At least one committee member is required"),
  lostStockItemDetails: yup.array().of(
    yup.object({
      itemId: yup.string().required("Item is required"),
      quantity: yup
        .number()
        .min(1, "Quantity must be at least 1")
        .required("Quantity is required"),
      description: yup.string().nullable(),
      duration: yup.string().nullable(),
      remark: yup.string().nullable(),
    })
  ),
});

export default function CreateLostStockItem() {
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const tenantName = authState.username || "";

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [stores, setStores] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [lostStockItemNo, setLostStockItemNo] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [file, setFile] = useState(null);

  const committeeId = "3fa85f64-5717-4562-b3fc-2c963f66afa6"; // fixed constant

  // Formik hook for form management and validation
  const formik = useFormik({
    initialValues: {
      storeId: "",
      departmentId: "",
      registrationDate: new Date().toISOString().split("T")[0],
      status: "",
      region: "",
      committeeMembersId: [],
      lostStockItemDetails: [
        {
          id: uuidv4(),
          itemId: "",
          quantity: 1,
          description: "",
          duration: "",
          remark: "",
        },
      ],
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const payload = {
        lostStockItemNo,
        registrationDate: values.registrationDate,
        departmentId: values.departmentId,
        status: values.status,
        region: values.region,
        committeeId,
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

      try {
        const response = await createLostStockItem(tenantId, payload, file);
        if (response.status === 200 || response.status === 201) {
          setNotification({
            open: true,
            message: "Lost Stock Item created successfully!",
            severity: "success",
          });
          setTimeout(() => {
            navigate("/list-lost-stock-item");
          }, 1000);
        }
      } catch (error) {
        console.error("Failed to create Lost Stock Item:", error);
        setNotification({
          open: true,
          message: "Failed to create Lost Stock Item",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  // Handlers for lost item details
  const handleDetailChange = (id, field, value) => {
    const updatedDetails = formik.values.lostStockItemDetails.map((d) =>
      d.id === id ? { ...d, [field]: value } : d
    );
    formik.setFieldValue("lostStockItemDetails", updatedDetails);
  };

  const addDetail = () => {
    formik.setFieldValue("lostStockItemDetails", [
      ...formik.values.lostStockItemDetails,
      {
        id: uuidv4(),
        itemId: "",
        quantity: 1,
        description: "",
        duration: "",
        remark: "",
      },
    ]);
  };

  const removeDetail = (id) => {
    formik.setFieldValue(
      "lostStockItemDetails",
      formik.values.lostStockItemDetails.filter((d) => d.id !== id)
    );
  };

  const handleCloseSnackbar = () =>
    setNotification({ ...notification, open: false });

  // Fetch initial data
  useEffect(() => {
    if (!tenantId) return;
    async function fetchData() {
      try {
        const [storesRes, deptRes, itemsRes, empRes, lostNoRes] =
          await Promise.all([
            getStores(tenantId),
            getDepartments(tenantId),
            getItems(tenantId),
            getEmployees(tenantId),
            getNextLostStockItemNumber(tenantId),
          ]);
        setStores(storesRes.data || []);
        setDepartments(deptRes.data || []);
        setItems(itemsRes.data || []);
        setEmployees(empRes.data || []);
        setLostStockItemNo(lostNoRes.data.itemNumber || "");
      } catch (error) {
        setNotification({
          open: true,
          message: "Failed to fetch form data",
          severity: "error",
        });
      }
    }
    fetchData();
  }, [tenantId]);

  return (
    <Box m="20px">
      <Header subtitle="Create Lost Stock Item" />
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          {/* Tenant */}
          <Grid item xs={12} sm={6}>
            <TextField label="Tenant" value={tenantName} disabled fullWidth />
          </Grid>

          {/* Lost Stock Item No */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Lost Stock Item No"
              value={lostStockItemNo}
              disabled
              fullWidth
            />
          </Grid>

          {/* Store */}
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              error={formik.touched.storeId && Boolean(formik.errors.storeId)}
            >
              <InputLabel>Store</InputLabel>
              <Select
                name="storeId"
                value={formik.values.storeId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                {stores.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.storeName}
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

          {/* Department */}
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              error={
                formik.touched.departmentId &&
                Boolean(formik.errors.departmentId)
              }
            >
              <InputLabel>Department</InputLabel>
              <Select
                name="departmentId"
                value={formik.values.departmentId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.departmentName}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.departmentId && formik.errors.departmentId && (
                <Typography color="error" variant="caption">
                  {formik.errors.departmentId}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Registration Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Registration Date"
              type="date"
              name="registrationDate"
              value={formik.values.registrationDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Grid>

          {/* Status */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Status"
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              required
              fullWidth
              error={formik.touched.status && Boolean(formik.errors.status)}
              helperText={formik.touched.status && formik.errors.status}
            />
          </Grid>

          {/* Region */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Region"
              name="region"
              value={formik.values.region}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              required
              fullWidth
              error={formik.touched.region && Boolean(formik.errors.region)}
              helperText={formik.touched.region && formik.errors.region}
            />
          </Grid>

          {/* Committee Members */}
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              error={
                formik.touched.committeeMembersId &&
                Boolean(formik.errors.committeeMembersId)
              }
            >
              <InputLabel>Committee Members</InputLabel>
              <Select
                multiple
                name="committeeMembersId"
                value={formik.values.committeeMembersId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
                      checked={formik.values.committeeMembersId.includes(
                        emp.id
                      )}
                    />
                    <ListItemText
                      primary={`${emp.firstName} ${emp.lastName}`}
                    />
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.committeeMembersId &&
                formik.errors.committeeMembersId && (
                  <Typography color="error" variant="caption">
                    {formik.errors.committeeMembersId}
                  </Typography>
                )}
            </FormControl>
          </Grid>

          {/* Lost Stock Item Details */}
          <Grid item xs={12}>
            <Typography variant="h6">Lost Stock Item Details</Typography>
            {formik.values.lostStockItemDetails.map((detail, index) => (
              <Paper key={detail.id} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <FormControl
                      fullWidth
                      required
                      error={
                        formik.touched.lostStockItemDetails?.[index]?.itemId &&
                        Boolean(
                          formik.errors.lostStockItemDetails?.[index]?.itemId
                        )
                      }
                    >
                      <InputLabel>Item</InputLabel>
                      <Select
                        name={`lostStockItemDetails[${index}].itemId`}
                        value={detail.itemId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        {items.map((i) => (
                          <MenuItem key={i.id} value={i.id}>
                            {i.itemName}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.lostStockItemDetails?.[index]?.itemId &&
                        formik.errors.lostStockItemDetails?.[index]?.itemId && (
                          <Typography color="error" variant="caption">
                            {formik.errors.lostStockItemDetails[index].itemId}
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
                      onBlur={formik.handleBlur}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? ""
                            : Math.max(1, parseInt(e.target.value, 10) || 1);
                        handleDetailChange(detail.id, "quantity", value);
                      }}
                      inputProps={{ min: 1 }}
                      fullWidth
                      required
                      error={
                        formik.touched.lostStockItemDetails?.[index]
                          ?.quantity &&
                        Boolean(
                          formik.errors.lostStockItemDetails?.[index]?.quantity
                        )
                      }
                      helperText={
                        formik.touched.lostStockItemDetails?.[index]
                          ?.quantity &&
                        formik.errors.lostStockItemDetails?.[index]?.quantity
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      label="Duration"
                      name={`lostStockItemDetails[${index}].duration`}
                      value={detail.duration}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Description"
                      name={`lostStockItemDetails[${index}].description`}
                      value={detail.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      label="Remark"
                      name={`lostStockItemDetails[${index}].remark`}
                      value={detail.remark}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <IconButton
                      color="error"
                      onClick={() => removeDetail(detail.id)}
                      disabled={formik.values.lostStockItemDetails.length === 1}
                    >
                      <Remove />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button variant="outlined" startIcon={<Add />} onClick={addDetail}>
              Add Item
            </Button>
            {formik.touched.lostStockItemDetails &&
              formik.errors.lostStockItemDetails && (
                <Typography
                  color="error"
                  variant="caption"
                  sx={{ mt: 2, display: "block" }}
                >
                  {Array.isArray(formik.errors.lostStockItemDetails)
                    ? formik.errors.lostStockItemDetails.find((e) => e)?.itemId
                    : formik.errors.lostStockItemDetails}
                </Typography>
              )}
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
                "Create Lost Stock Item"
              )}
            </Button>
          </Grid>
        </Grid>
      </form>

      {/* Snackbar */}
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
