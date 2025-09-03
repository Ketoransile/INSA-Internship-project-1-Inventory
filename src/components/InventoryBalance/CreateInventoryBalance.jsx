import {
  Box,
  Button,
  Grid,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Paper,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import {
  createInventoryBalance,
  getAllInventoryCounts,
  getItems, // <-- make sure you import your items API here
} from "../../api/inventoryApi";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const CreateInventoryBalance = () => {
  const [authState] = useAtom(authAtom);
  const username = authState.username;
  const tenantId = authState.tenantId;
  const isMobile = useMediaQuery("(max-width:600px)");
  const [notification, setNotification] = useState({
    open: false,
    type: "success",
    message: "",
  });
  const navigate = useNavigate();
  const [inventoryCounts, setInventoryCounts] = useState([]);
  const [items, setItems] = useState([]); // state for item list
  const [loading, setLoading] = useState(false);

  const STORE_TYPES = {
    INTERNAL: "INTERNAL",
    MERCHANDISED: "MERCHANDISED",
  };

  const formik = useFormik({
    initialValues: {
      preparedBy: username,
      preparedOn: new Date().toISOString().split("T")[0],
      inventoryCountId: "",
      storeType: STORE_TYPES.INTERNAL,
      inventoryBalanceItemRequest: [
        {
          id: uuidv4(),
          itemId: "",
          quantity: 0,
          binBalance: 100,
          // difference: 0,
          remark: "",
        },
      ],
    },
    validationSchema: Yup.object({
      preparedBy: Yup.string().required("Prepared By is required"),
      preparedOn: Yup.date().required("Prepared On is required"),
      inventoryCountId: Yup.string().required("Inventory Count is required"),
      storeType: Yup.string().required("Store Type is required"),
      inventoryBalanceItemRequest: Yup.array()
        .of(
          Yup.object().shape({
            itemId: Yup.string().required("Item is required"),
            quantity: Yup.number().required("Quantity is required").min(0),
            binBalance: Yup.number().required("Bin Balance is required"),
            // difference: Yup.number(),
            remark: Yup.string(),
          })
        )
        .min(1, "At least one item is required"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const payload = {
          inventoryCountId: values.inventoryCountId,
          storeType: values.storeType,
          inventoryBalanceItemRequest: values.inventoryBalanceItemRequest.map(
            (item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              binBalance: item.binBalance,
              // // difference: item.difference,
              remark: item.remark,
            })
          ),
        };

        await createInventoryBalance(tenantId, payload);
        setNotification({
          open: true,
          type: "success",
          message: "Inventory Balance created successfully!",
        });
        setTimeout(() => {
          navigate("/list-inventory-balance");
        }, 1000);
      } catch (error) {
        setNotification({
          open: true,
          type: "error",
          message:
            error.response?.data?.message ||
            "Failed to create Inventory Balance",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    const fetchInventoryCounts = async () => {
      try {
        const response = await getAllInventoryCounts(tenantId);
        setInventoryCounts(
          Array.isArray(response.data.content) ? response.data.content : []
        );
      } catch (error) {
        setNotification({
          open: true,
          type: "error",
          message: "Failed to load inventory counts",
        });
      }
    };

    const fetchItems = async () => {
      try {
        const res = await getItems(tenantId); // replace with your actual API
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        setNotification({
          open: true,
          type: "error",
          message: "Failed to load items",
        });
      }
    };

    fetchInventoryCounts();
    fetchItems();
  }, [tenantId]);

  const addItem = () => {
    formik.setFieldValue("inventoryBalanceItemRequest", [
      ...formik.values.inventoryBalanceItemRequest,
      {
        id: uuidv4(),
        itemId: "",
        quantity: 0,
        binBalance: 100,
        // difference: 0,
        remark: "",
      },
    ]);
  };

  const removeItem = (index) => {
    if (formik.values.inventoryBalanceItemRequest.length > 1) {
      const itemsCopy = [...formik.values.inventoryBalanceItemRequest];
      itemsCopy.splice(index, 1);
      formik.setFieldValue("inventoryBalanceItemRequest", itemsCopy);
    }
  };

  const handleItemChange = (index, field, value) => {
    const itemsCopy = [...formik.values.inventoryBalanceItemRequest];
    itemsCopy[index] = { ...itemsCopy[index], [field]: value };

    if (field === "quantity" || field === "binBalance") {
      // itemsCopy[index].difference =
      itemsCopy[index].quantity - itemsCopy[index].binBalance;
    }

    formik.setFieldValue("inventoryBalanceItemRequest", itemsCopy);
  };

  return (
    <Box p={isMobile ? 2 : 5}>
      <Typography variant="h5" mb={3}>
        Create Inventory Balance
      </Typography>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Prepared By */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="preparedBy"
              label="Prepared By"
              value={formik.values.preparedBy}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* Prepared On */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              name="preparedOn"
              label="Prepared On"
              InputLabelProps={{ shrink: true }}
              value={formik.values.preparedOn}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* Inventory Count Dropdown */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Inventory Count *</InputLabel>
              <Select
                name="inventoryCountId"
                value={formik.values.inventoryCountId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.inventoryCountId &&
                  Boolean(formik.errors.inventoryCountId)
                }
              >
                {inventoryCounts.map((count) => (
                  <MenuItem key={count.id} value={count.id}>
                    {count.inventoryCountNumber}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.inventoryCountId &&
                formik.errors.inventoryCountId && (
                  <Typography color="error" variant="caption">
                    {formik.errors.inventoryCountId}
                  </Typography>
                )}
            </FormControl>
          </Grid>

          {/* Store Type Dropdown */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Store Type *</InputLabel>
              <Select
                name="storeType"
                value={formik.values.storeType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.storeType && Boolean(formik.errors.storeType)
                }
              >
                {Object.entries(STORE_TYPES).map(([key, value]) => (
                  <MenuItem key={key} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.storeType && formik.errors.storeType && (
                <Typography color="error" variant="caption">
                  {formik.errors.storeType}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Inventory Items */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Inventory Items
            </Typography>
            {formik.values.inventoryBalanceItemRequest.map((item, index) => (
              <Paper key={item.id} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  {/* Item Dropdown */}
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>Item *</InputLabel>
                      <Select
                        value={item.itemId}
                        onChange={(e) =>
                          handleItemChange(index, "itemId", e.target.value)
                        }
                      >
                        {items.map((invItem) => (
                          <MenuItem key={invItem.id} value={invItem.id}>
                            {invItem.itemName}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.inventoryBalanceItemRequest?.[index]
                        ?.itemId &&
                        formik.errors.inventoryBalanceItemRequest?.[index]
                          ?.itemId && (
                          <Typography color="error" variant="caption">
                            {
                              formik.errors.inventoryBalanceItemRequest[index]
                                .itemId
                            }
                          </Typography>
                        )}
                    </FormControl>
                  </Grid>

                  {/* Quantity */}
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity *"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.inventoryBalanceItemRequest?.[index]
                          ?.quantity &&
                        Boolean(
                          formik.errors.inventoryBalanceItemRequest?.[index]
                            ?.quantity
                        )
                      }
                      helperText={
                        formik.touched.inventoryBalanceItemRequest?.[index]
                          ?.quantity &&
                        formik.errors.inventoryBalanceItemRequest?.[index]
                          ?.quantity
                      }
                    />
                  </Grid>

                  {/* Bin Balance */}
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Bin Balance"
                      value={item.binBalance}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>

                  {/* Difference */}
                  {/* <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Difference"
                      // value={item.difference}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid> */}

                  {/* Remark */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Remark"
                      value={item.remark}
                      onChange={(e) =>
                        handleItemChange(index, "remark", e.target.value)
                      }
                    />
                  </Grid>

                  {/* Remove Button */}
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end">
                      <IconButton
                        onClick={() => removeItem(index)}
                        color="error"
                        disabled={
                          formik.values.inventoryBalanceItemRequest.length <= 1
                        }
                      >
                        <Remove />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            ))}

            {/* Add Item Button */}
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addItem}
              sx={{ mt: 1 }}
            >
              Add Item
            </Button>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                "Create Inventory Balance"
              )}
            </Button>
          </Grid>
        </Grid>
      </form>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={notification.type}
          onClose={() => setNotification({ ...notification, open: false })}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateInventoryBalance;
