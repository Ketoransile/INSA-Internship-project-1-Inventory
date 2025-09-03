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
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import {
  getDepartments,
  getItems,
  getFixedAssetTransferById,
  updateFixedAssetTransfer,
} from "../../api/inventoryApi";
import Header from "../../common/Header";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";

// ✅ Yup Validation Schema
const transferDetailSchema = Yup.object().shape({
  itemId: Yup.string().required("Item is required"),
  quantity: Yup.number()
    .min(1, "Quantity must be at least 1")
    .required("Quantity is required"),
  remark: Yup.string().nullable(),
  description: Yup.string().nullable(),
});

const fixedAssetTransferSchema = Yup.object().shape({
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
    .of(transferDetailSchema)
    .min(1, "At least one transfer item is required"),
});

export default function UpdateFixedAssetTransfer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;
  const tenantName = authState.username || "";

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [initialValues, setInitialValues] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ✅ Fetch initial data
  useEffect(() => {
    if (!tenantId || !id) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [deptRes, itemsRes, transferRes] = await Promise.all([
          getDepartments(tenantId),
          getItems(tenantId),
          getFixedAssetTransferById(tenantId, id),
        ]);

        setDepartments(deptRes.data || []);
        setItems(itemsRes.data || []);

        const transfer = transferRes.data;

        setInitialValues({
          transferNo: transfer.transferNo,
          departmentId: transfer.departmentId,
          transferFromId: transfer.transferFromId,
          transferToId: transfer.transferToId,
          transferType: transfer.transferType,
          transferDetails: transfer.transferDetails.map((detail) => ({
            id: uuidv4(),
            itemId: detail.itemId,
            quantity: detail.quantity,
            remark: detail.remark || "",
            description: detail.description || "",
          })),
        });
      } catch {
        setNotification({
          open: true,
          message: "Failed to fetch form data",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tenantId, id]);

  const handleCloseSnackbar = () =>
    setNotification((n) => ({ ...n, open: false }));

  if (loading || !initialValues) {
    return (
      <Box m="20px">
        <Header subtitle="Update Fixed Asset Transfer" />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="60vh"
        >
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header
        subtitle={`Update Fixed Asset Transfer - ${initialValues.transferNo}`}
      />
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={fixedAssetTransferSchema}
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
            await updateFixedAssetTransfer(tenantId, id, payload);
            setNotification({
              open: true,
              message: "Fixed Asset Transfer Updated Successfully",
              severity: "success",
            });
            setTimeout(() => navigate("/list-fixed-asset-transfer"), 1000);
          } catch {
            setNotification({
              open: true,
              message: "Failed to update Fixed Asset Transfer",
              severity: "error",
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleSubmit,
          isSubmitting,
        }) => (
          <Form onSubmit={handleSubmit}>
            {/* Top Fields */}
            <Box display="grid" gap={2} gridTemplateColumns="repeat(2, 1fr)">
              <TextField label="Tenant" value={tenantName} disabled fullWidth />
              <TextField
                label="Transfer No"
                value={values.transferNo}
                disabled
                fullWidth
              />

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
              </FormControl>

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
              </FormControl>

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
              </FormControl>

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
              </FormControl>
            </Box>

            {/* Transfer Items */}
            <Box mt={4}>
              <Typography variant="h6">Transfer Items</Typography>
              <FieldArray
                name="transferDetails"
                render={(arrayHelpers) => (
                  <>
                    {values.transferDetails.map((detail, index) => (
                      <Paper key={detail.id} sx={{ p: 2, mb: 2 }}>
                        <Box
                          display="grid"
                          gap={2}
                          gridTemplateColumns="repeat(4, 1fr)"
                        >
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
                          </FormControl>

                          <TextField
                            name={`transferDetails.${index}.quantity`}
                            label="Quantity"
                            type="number"
                            inputProps={{ min: 1 }}
                            value={detail.quantity}
                            onChange={handleChange}
                            error={
                              touched.transferDetails?.[index]?.quantity &&
                              !!errors.transferDetails?.[index]?.quantity
                            }
                            fullWidth
                          />

                          <TextField
                            name={`transferDetails.${index}.remark`}
                            label="Remark"
                            value={detail.remark}
                            onChange={handleChange}
                            fullWidth
                          />
                          <TextField
                            name={`transferDetails.${index}.description`}
                            label="Description"
                            value={detail.description}
                            onChange={handleChange}
                            fullWidth
                          />
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => arrayHelpers.remove(index)}
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
                        arrayHelpers.push({
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
              />
            </Box>

            <Box mt={3}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                fullWidth
              >
                {isSubmitting ? (
                  <CircularProgress size={24} />
                ) : (
                  "Update Transfer"
                )}
              </Button>
            </Box>
          </Form>
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
