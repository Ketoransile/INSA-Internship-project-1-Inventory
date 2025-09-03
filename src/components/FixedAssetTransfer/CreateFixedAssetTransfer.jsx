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
  Paper,
  IconButton,
  Snackbar,
  Alert,
  FormHelperText,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import {
  getDepartments,
  getItems,
  getFixedAssetTransferNumber,
  createFixedAssetTransfer,
} from "../../api/inventoryApi";
import Header from "../../common/Header";
import { useNavigate } from "react-router-dom";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";

export default function CreateFixedAssetTransfer() {
  const navigate = useNavigate();
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const tenantName = authState.username || "";

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [transferNo, setTransferNo] = useState("");

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ✅ Yup validation schema
  const validationSchema = Yup.object().shape({
    transferNo: Yup.string().required("Transfer No is required"),
    departmentId: Yup.string().required("Originating Department is required"),
    transferFromId: Yup.string().required("Transfer From is required"),
    transferToId: Yup.string()
      .required("Transfer To is required")
      .notOneOf(
        [Yup.ref("transferFromId")],
        "Transfer From and Transfer To cannot be the same"
      ),
    transferType: Yup.string().required("Transfer Type is required"),
    transferDetails: Yup.array()
      .of(
        Yup.object().shape({
          itemId: Yup.string().required("Item is required"),
          quantity: Yup.number()
            .min(1, "Quantity must be at least 1")
            .required("Quantity is required"),
          remark: Yup.string().nullable(),
          description: Yup.string().nullable(),
        })
      )
      .min(1, "At least one transfer item is required"),
  });

  // Fetch departments & items
  useEffect(() => {
    if (!tenantId) return;
    async function fetchData() {
      try {
        const [deptRes, itemsRes] = await Promise.all([
          getDepartments(tenantId),
          getItems(tenantId),
        ]);
        setDepartments(deptRes.data || []);
        setItems(itemsRes.data || []);
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

  // Fetch transfer number
  useEffect(() => {
    if (!tenantId) return;
    const fetchNumber = async () => {
      try {
        const res = await getFixedAssetTransferNumber(tenantId);
        setTransferNo(res.data.transferNumber);
      } catch {
        setNotification({
          open: true,
          message: "Failed to fetch transfer number",
          severity: "error",
        });
      }
    };
    fetchNumber();
  }, [tenantId]);

  const handleCloseSnackbar = () =>
    setNotification((n) => ({ ...n, open: false }));

  return (
    <Box m="20px">
      <Header subtitle="Create Fixed Asset Transfer" />

      <Formik
        enableReinitialize
        initialValues={{
          transferNo,
          departmentId: "",
          transferFromId: "",
          transferToId: "",
          transferType: "WORK_UNIT_TO_WORK_UNIT",
          transferDetails: [
            {
              id: uuidv4(),
              itemId: "",
              quantity: 1,
              remark: "",
              description: "",
            },
          ],
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const payload = {
              ...values,
              transferDetails: values.transferDetails.map(
                ({ itemId, quantity, remark, description }) => ({
                  itemId,
                  quantity,
                  remark,
                  description,
                })
              ),
            };
            setLoading(true);
            await createFixedAssetTransfer(tenantId, payload);
            setNotification({
              open: true,
              message: "Fixed Asset Transfer Created Successfully",
              severity: "success",
            });
            setTimeout(() => {
              navigate("/list-fixed-asset-transfer");
            }, 1000);
          } catch {
            setNotification({
              open: true,
              message: "Failed to create Fixed Asset Transfer",
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
            <Box display="grid" gap={2} gridTemplateColumns="repeat(2, 1fr)">
              <TextField label="Tenant" value={tenantName} disabled fullWidth />
              <TextField
                label="Transfer No"
                value={values.transferNo}
                disabled
                fullWidth
              />

              {/* Department */}
              <FormControl
                fullWidth
                error={touched.departmentId && !!errors.departmentId}
              >
                <InputLabel>Originating Department</InputLabel>
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
                  <FormHelperText>{errors.departmentId}</FormHelperText>
                )}
              </FormControl>

              {/* Transfer From */}
              <FormControl
                fullWidth
                error={touched.transferFromId && !!errors.transferFromId}
              >
                <InputLabel>Transfer From</InputLabel>
                <Select
                  name="transferFromId"
                  value={values.transferFromId}
                  onChange={handleChange}
                >
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.departmentName}
                    </MenuItem>
                  ))}
                </Select>
                {touched.transferFromId && errors.transferFromId && (
                  <FormHelperText>{errors.transferFromId}</FormHelperText>
                )}
              </FormControl>

              {/* Transfer To */}
              <FormControl
                fullWidth
                error={touched.transferToId && !!errors.transferToId}
              >
                <InputLabel>Transfer To</InputLabel>
                <Select
                  name="transferToId"
                  value={values.transferToId}
                  onChange={handleChange}
                >
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.departmentName}
                    </MenuItem>
                  ))}
                </Select>
                {touched.transferToId && errors.transferToId && (
                  <FormHelperText>{errors.transferToId}</FormHelperText>
                )}
              </FormControl>

              {/* Transfer Type */}
              <FormControl
                fullWidth
                error={touched.transferType && !!errors.transferType}
              >
                <InputLabel>Transfer Type</InputLabel>
                <Select
                  name="transferType"
                  value={values.transferType}
                  onChange={handleChange}
                >
                  <MenuItem value="WORK_UNIT_TO_WORK_UNIT">
                    Work Unit to Work Unit
                  </MenuItem>
                  <MenuItem value="DEPARTMENT_TO_DEPARTMENT">
                    Department to Department
                  </MenuItem>
                </Select>
                {touched.transferType && errors.transferType && (
                  <FormHelperText>{errors.transferType}</FormHelperText>
                )}
              </FormControl>
            </Box>

            {/* Transfer Items */}
            <Box mt={4}>
              <Typography variant="h6">Transfer Items</Typography>
              <FieldArray name="transferDetails">
                {({ push, remove }) => (
                  <>
                    {values.transferDetails.map((detail, index) => (
                      <Paper key={detail.id} sx={{ p: 2, mb: 2 }}>
                        <Box
                          display="grid"
                          gap={2}
                          gridTemplateColumns="repeat(4, 1fr)"
                        >
                          {/* Item */}
                          <FormControl
                            fullWidth
                            error={
                              touched.transferDetails?.[index]?.itemId &&
                              !!errors.transferDetails?.[index]?.itemId
                            }
                          >
                            <InputLabel>Item</InputLabel>
                            <Select
                              name={`transferDetails.${index}.itemId`}
                              value={detail.itemId}
                              onChange={handleChange}
                            >
                              {items.map((i) => (
                                <MenuItem key={i.id} value={i.id}>
                                  {i.itemName}
                                </MenuItem>
                              ))}
                            </Select>
                            {touched.transferDetails?.[index]?.itemId &&
                              errors.transferDetails?.[index]?.itemId && (
                                <FormHelperText>
                                  {errors.transferDetails[index].itemId}
                                </FormHelperText>
                              )}
                          </FormControl>

                          {/* Quantity */}
                          <TextField
                            label="Quantity"
                            type="number"
                            inputProps={{ min: 1 }}
                            name={`transferDetails.${index}.quantity`}
                            value={detail.quantity}
                            onChange={(e) =>
                              setFieldValue(
                                `transferDetails.${index}.quantity`,
                                Math.max(1, parseInt(e.target.value, 10) || 1)
                              )
                            }
                            error={
                              touched.transferDetails?.[index]?.quantity &&
                              !!errors.transferDetails?.[index]?.quantity
                            }
                            helperText={
                              touched.transferDetails?.[index]?.quantity &&
                              errors.transferDetails?.[index]?.quantity
                            }
                            fullWidth
                          />

                          {/* Remark */}
                          <TextField
                            label="Remark"
                            name={`transferDetails.${index}.remark`}
                            value={detail.remark}
                            onChange={handleChange}
                            fullWidth
                          />

                          {/* Description */}
                          <TextField
                            label="Description"
                            name={`transferDetails.${index}.description`}
                            value={detail.description}
                            onChange={handleChange}
                            fullWidth
                          />
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => remove(index)}
                          disabled={values.transferDetails.length === 1}
                          sx={{ mt: 1 }}
                        >
                          <Remove />
                        </IconButton>
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
                          remark: "",
                          description: "",
                        })
                      }
                    >
                      Add Item
                    </Button>
                  </>
                )}
              </FieldArray>
              {touched.transferDetails &&
                typeof errors.transferDetails === "string" && (
                  <FormHelperText error>
                    {errors.transferDetails}
                  </FormHelperText>
                )}
            </Box>

            <Box mt={3}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || isSubmitting}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : "Create Transfer"}
              </Button>
            </Box>
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
