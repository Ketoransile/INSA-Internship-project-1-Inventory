import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  Typography,
} from "@mui/material";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import {
  createInventoryCount,
  getStores,
  getCommittees,
  getItems, // Assuming this API helper exists to fetch all items for the dropdown
} from "../../Api/inventoryApi"; // Make sure your API path is correct
import useMediaQuery from "@mui/material/useMediaQuery";
// import Header from "../../common/Header"; // Uncomment if you use a Header component
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

/**
 * CreateInventoryCount.jsx
 * -----------------------------------------------------
 * A form for creating an Inventory Count Sheet that mirrors the Java DTO
 * InventoryCountRequest on the Spring-Boot side. It follows the same UX
 * conventions as the existing CreateRetirement component: Formik for form
 * state/validation, Material-UI for layout, Jotai for auth context, and a
 * Snackbar for feedback.
 * -----------------------------------------------------
 * Required API helpers (stub them if they don't yet exist):
 * - createInventoryCount(tenantId: UUID, payload: InventoryCountRequest)
 * - getStores(tenantId: UUID)           → [{ id, name, storeMan, storeType }]
 * - getCommittees(tenantId: UUID)       → [{ id, name, members:[{id,name}] }]
 * - getItems(tenantId: UUID)            → [{ id, code, name, unitMeasure }] (for dropdown)
 * - getItemById(tenantId: UUID, itemId: UUID) → { id, code, name, unitMeasure } (optional, for populating item details)
 */

const COUNT_TYPES = [
  { value: "PERIODIC", label: "Periodic" },
  { value: "PERPETUAL", label: "Perpetual" },
];

const STORE_TYPES = [
  { value: "INTERNAL", label: "Internal" },
  { value: "MERCHANDISED", label: "Merchandised" },
];

const CreateInventoryCount = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [authState] = useAtom(authAtom);
  const { tenantId, username } = authState;
  console.log("tenatn id is", tenantId)
  console.log("username is", username)

  const [stores, setStores] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [items, setItems] = useState([]); // State to hold all available items

  /* --------------------------------------------------
   * Data fetching helpers
   * -------------------------------------------------- */
  const fetchReferenceData = async () => {
    try {
      const [storeRes, committeeRes, itemsRes] = await Promise.all([
        getStores(tenantId),
        getCommittees(tenantId),
        getItems(tenantId), // Fetch all items for the dropdown
      ]);
      setStores(storeRes.data);
      setCommittees(committeeRes.data);
      setItems(itemsRes.data);
    } catch (err) {
      console.error("Failed to fetch reference data:", err);
      setNotification({
        open: true,
        message: "Failed to load reference data.",
        severity: "error",
      });
    }
  };

 
  useEffect(() => {
    // Only proceed if tenantId is available
    if (tenantId) {
        const response  = fetchReferenceData();
        console.log("Response of fetchReference data");
    } else {
      // Optionally, handle the case where tenantId is not yet available
      // e.g., show a loading spinner, or log a message
      console.log("Waiting for tenantId to be available...");
    }
  }, [tenantId]); // This dependency correctly re-runs when tenantId changes
  /* --------------------------------------------------
   * Form handlers
   * -------------------------------------------------- */
  const handleFormSubmit = async (values, { resetForm }) => {
    try {
      // Prepare payload according to InventoryCountRequest DTO
      const requestBody = {
        tenantId: tenantId, // Ensure tenantId is included in the payload
        inventoryCountNo: values.inventoryCountNo,
        storeId: values.storeId,
        storeName: values.storeName,
        storeMan: values.storeMan,
        budgetYear: values.budgetYear,
        storeType: values.storeType,
        countType: values.countType,
        committeeId: values.committeeId,
        committeeMemberIds: values.committeeMemberIds,
        preparedBy: values.preparedBy,
        preparedOn: values.preparedOn, // Already formatted to YYYY-MM-DD
        inventoryItems: values.inventoryItems.map((item) => ({
          itemId: item.itemId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          unitMeasure: item.unitMeasure,
          quantity: item.quantity,
          remark: item.remark,
        })),
      };

      const res = await createInventoryCount(tenantId, requestBody);
      if (res.status === 200 || res.status === 201) {
        setNotification({
          open: true,
          message: "Inventory Count created successfully!",
          severity: "success",
        });
        resetForm();
      }
    } catch (err) {
      console.error("Error creating inventory count:", err);
      let msg = "An unexpected error occurred.";
      if (err.response?.data?.message) msg = err.response.data.message;
      setNotification({ open: true, message: msg, severity: "error" });
    }
  };

  /* --------------------------------------------------
   * Initial values & validation
   * -------------------------------------------------- */
  const initialValues = {
    inventoryCountNo: "",
    storeId: "",
    storeName: "", // Will be populated from selected store
    storeMan: "", // Will be populated from selected store
    budgetYear: new Date().getFullYear().toString(),
    storeType: "INTERNAL", // Default to INTERNAL
    countType: "PERIODIC", // Default to PERIODIC
    committeeId: "",
    committeeMemberIds: [], // Will be populated from selected committee
    preparedBy: username || "",
    preparedOn: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    inventoryItems: [
      {
        itemId: "",
        itemCode: "",
        itemName: "",
        unitMeasure: "",
        quantity: 0,
        remark: "",
      },
    ],
  };

  const validationSchema = yup.object().shape({
    inventoryCountNo: yup.string().required("Inventory count number is required"),
    storeId: yup.string().required("Store is required"),
    storeName: yup.string(), // Not directly validated, derived
    storeMan: yup.string(), // Not directly validated, derived
    budgetYear: yup
      .string()
      .matches(/^[0-9]{4}$/, "Budget year must be a 4-digit number")
      .required("Budget year is required"),
    storeType: yup.string().required("Store type is required"),
    countType: yup.string().required("Count type is required"),
    committeeId: yup.string().required("Committee is required"),
    committeeMemberIds: yup.array().min(1, "At least one committee member is required").required(),
    preparedBy: yup.string(), // Not directly validated, derived
    preparedOn: yup.string(), // Not directly validated, derived
    inventoryItems: yup
      .array()
      .of(
        yup.object().shape({
          itemId: yup.string().required("Item is required"),
          itemCode: yup.string(), // Not directly validated, derived
          itemName: yup.string(), // Not directly validated, derived
          unitMeasure: yup.string(), // Not directly validated, derived
          quantity: yup
            .number()
            .typeError("Quantity must be a number")
            .positive("Quantity must be positive")
            .required("Quantity is required"),
          remark: yup.string().nullable(),
        })
      )
      .min(1, "At least one inventory item is required"),
  });

  /* --------------------------------------------------
   * Snackbar helpers
   * -------------------------------------------------- */
  const handleCloseSnackbar = () =>
    setNotification((prev) => ({ ...prev, open: false }));

  /* --------------------------------------------------
   * Main render
   * -------------------------------------------------- */
  return (
    <Box m="20px">
      {/* {Header && <Header subtitle="Create Inventory Count" />} */}
      <Typography variant="h5" mb={3}>
        Create Inventory Count
      </Typography>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleFormSubmit}
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
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{ "& > div": { gridColumn: isNonMobile ? undefined : "span 4" } }}
            >
              {/* Header Fields */}
              <TextField
                fullWidth
                label="Inventory Count No"
                name="inventoryCountNo"
                value={values.inventoryCountNo}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!touched.inventoryCountNo && !!errors.inventoryCountNo}
                helperText={touched.inventoryCountNo && errors.inventoryCountNo}
                sx={{ gridColumn: "span 2" }}
              />

              <FormControl fullWidth sx={{ gridColumn: "span 2" }} error={!!touched.storeId && !!errors.storeId}>
                <InputLabel id="store-select-label">Store</InputLabel>
                <Select
                  labelId="store-select-label"
                  name="storeId"
                  value={values.storeId}
                  label="Store"
                  onChange={(e) => {
                    const selectedStore = stores.find((s) => s.id === e.target.value);
                    setFieldValue("storeId", e.target.value);
                    setFieldValue("storeName", selectedStore?.name || "");
                    setFieldValue("storeMan", selectedStore?.storeMan || ""); // Populate storeMan
                  }}
                  onBlur={handleBlur}
                >
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name}
                    </MenuItem>
                  ))}
                </Select>
                {touched.storeId && errors.storeId && (
                  <Typography variant="caption" color="error">
                    {errors.storeId}
                  </Typography>
                )}
              </FormControl>

              <TextField
                fullWidth
                label="Store Name"
                name="storeName"
                value={values.storeName}
                disabled // This field is derived
                sx={{ gridColumn: "span 2" }}
              />

              <TextField
                fullWidth
                label="Store Man"
                name="storeMan"
                value={values.storeMan}
                disabled // This field is derived
                sx={{ gridColumn: "span 2" }}
              />

              <FormControl fullWidth sx={{ gridColumn: "span 2" }} error={!!touched.storeType && !!errors.storeType}>
                <InputLabel id="store-type-label">Store Type</InputLabel>
                <Select
                  labelId="store-type-label"
                  name="storeType"
                  value={values.storeType}
                  label="Store Type"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {STORE_TYPES.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {touched.storeType && errors.storeType && (
                  <Typography variant="caption" color="error">
                    {errors.storeType}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth sx={{ gridColumn: "span 2" }} error={!!touched.countType && !!errors.countType}>
                <InputLabel id="count-type-label">Count Type</InputLabel>
                <Select
                  labelId="count-type-label"
                  name="countType"
                  value={values.countType}
                  label="Count Type"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {COUNT_TYPES.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {touched.countType && errors.countType && (
                  <Typography variant="caption" color="error">
                    {errors.countType}
                  </Typography>
                )}
              </FormControl>

              <TextField
                fullWidth
                label="Budget Year"
                name="budgetYear"
                value={values.budgetYear}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!touched.budgetYear && !!errors.budgetYear}
                helperText={touched.budgetYear && errors.budgetYear}
                sx={{ gridColumn: "span 2" }}
              />

              <FormControl fullWidth sx={{ gridColumn: "span 2" }} error={!!touched.committeeId && !!errors.committeeId}>
                <InputLabel id="committee-select-label">Committee</InputLabel>
                <Select
                  labelId="committee-select-label"
                  name="committeeId"
                  value={values.committeeId}
                  label="Committee"
                  onChange={(e) => {
                    const selectedCommittee = committees.find((c) => c.id === e.target.value);
                    setFieldValue("committeeId", e.target.value);
                    setFieldValue(
                      "committeeMemberIds",
                      selectedCommittee?.members?.map((m) => m.id) || []
                    ); // Populate committeeMemberIds
                  }}
                  onBlur={handleBlur}
                >
                  {committees.map((committee) => (
                    <MenuItem key={committee.id} value={committee.id}>
                      {committee.name}
                    </MenuItem>
                  ))}
                </Select>
                {touched.committeeId && errors.committeeId && (
                  <Typography variant="caption" color="error">
                    {errors.committeeId}
                  </Typography>
                )}
              </FormControl>

              <TextField
                fullWidth
                label="Prepared By"
                name="preparedBy"
                value={values.preparedBy}
                disabled // This field is derived
                sx={{ gridColumn: "span 2" }}
              />

              <TextField
                fullWidth
                label="Prepared On"
                type="date"
                name="preparedOn"
                value={values.preparedOn}
                disabled // This field is derived
                InputLabelProps={{ shrink: true }}
                sx={{ gridColumn: "span 2" }}
              />

              {/* Member list display (read-only) */}
              {values.committeeMemberIds.length > 0 && (
                <Box gridColumn="span 4">
                  <Typography variant="subtitle2" mb={1}>
                    Committee Members:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap="10px">
                    {values.committeeMemberIds.map((memberId) => {
                      // Find the selected committee to get member names
                      const selectedCommittee = committees.find(
                        (c) => c.id === values.committeeId
                      );
                      const member = selectedCommittee?.members?.find(
                        (m) => m.id === memberId
                      );
                      return (
                        <Box key={memberId} p={1} border="1px solid #ccc" borderRadius="4px">
                          {member?.name || memberId}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Inventory Items Section */}
            <Box mt={4}>
              <Typography variant="h6" mb={2}>
                Inventory Items
              </Typography>
              <FieldArray name="inventoryItems">
                {({ push, remove }) => (
                  <>
                    {values.inventoryItems.map((item, index) => (
                      <Box
                        key={index}
                        display="grid"
                        gap="20px"
                        gridTemplateColumns="repeat(12, 1fr)"
                        alignItems="center"
                        mb={2}
                      >
                        <FormControl
                          fullWidth
                          sx={{ gridColumn: "span 3" }}
                          error={
                            !!(touched.inventoryItems?.[index]?.itemId) &&
                            !!(errors.inventoryItems?.[index]?.itemId)
                          }
                        >
                          <InputLabel>Item</InputLabel>
                          <Select
                            name={`inventoryItems.${index}.itemId`}
                            value={item.itemId}
                            onChange={(e) => {
                              const selectedItem = items.find((i) => i.id === e.target.value);
                              setFieldValue(`inventoryItems.${index}.itemId`, e.target.value);
                              setFieldValue(`inventoryItems.${index}.itemCode`, selectedItem?.code || "");
                              setFieldValue(`inventoryItems.${index}.itemName`, selectedItem?.name || "");
                              setFieldValue(`inventoryItems.${index}.unitMeasure`, selectedItem?.unitMeasure || "");
                            }}
                            onBlur={handleBlur}
                            label="Item"
                          >
                            {items.map((i) => (
                              <MenuItem key={i.id} value={i.id}>
                                {i.name} ({i.code})
                              </MenuItem>
                            ))}
                          </Select>
                          {!!(touched.inventoryItems?.[index]?.itemId) &&
                            !!(errors.inventoryItems?.[index]?.itemId) && (
                              <Typography variant="caption" color="error">
                                {errors.inventoryItems?.[index]?.itemId}
                              </Typography>
                            )}
                        </FormControl>

                        <TextField
                          label="Item Code"
                          name={`inventoryItems.${index}.itemCode`}
                          value={item.itemCode}
                          disabled // Derived field
                          sx={{ gridColumn: "span 2" }}
                        />
                        <TextField
                          label="Item Name"
                          name={`inventoryItems.${index}.itemName`}
                          value={item.itemName}
                          disabled // Derived field
                          sx={{ gridColumn: "span 3" }}
                        />
                        <TextField
                          label="Unit"
                          name={`inventoryItems.${index}.unitMeasure`}
                          value={item.unitMeasure}
                          disabled // Derived field
                          sx={{ gridColumn: "span 1" }}
                        />
                        <TextField
                          label="Quantity"
                          type="number"
                          name={`inventoryItems.${index}.quantity`}
                          value={item.quantity}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            !!(touched.inventoryItems?.[index]?.quantity) &&
                            !!(errors.inventoryItems?.[index]?.quantity)
                          }
                          helperText={
                            touched.inventoryItems?.[index]?.quantity &&
                            errors.inventoryItems?.[index]?.quantity
                          }
                          sx={{ gridColumn: "span 2" }}
                        />
                        <TextField
                          label="Remark"
                          name={`inventoryItems.${index}.remark`}
                          value={item.remark}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          sx={{ gridColumn: "span 3" }}
                        />
                        <IconButton
                          onClick={() => remove(index)}
                          color="error"
                          sx={{ gridColumn: "span 1" }}
                        >
                          <RemoveCircleIcon />
                        </IconButton>
                      </Box>
                    ))}
                    {!!(touched.inventoryItems) && !!(errors.inventoryItems) && typeof errors.inventoryItems === 'string' && (
                        <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                            {errors.inventoryItems}
                        </Typography>
                    )}
                    <Button
                      variant="outlined"
                      startIcon={<AddCircleIcon />}
                      onClick={() =>
                        push({
                          itemId: "",
                          itemCode: "",
                          itemName: "",
                          unitMeasure: "",
                          quantity: 0,
                          remark: "",
                        })
                      }
                      sx={{ mt: 2 }}
                    >
                      Add Item
                    </Button>
                  </>
                )}
              </FieldArray>
            </Box>

            {/* Submit Button */}
            <Box display="flex" justifyContent="start" mt="30px">
              <Button type="submit" color="secondary" variant="contained">
                Create Inventory Count
              </Button>
            </Box>
          </form>
        )}
      </Formik>

      {/* Notification Snackbar */}
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

export default CreateInventoryCount;