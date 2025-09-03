import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Snackbar,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import { deleteInventoryCount } from "../../api/inventoryApi";
import NotPageHandle from "../../common/NoPageHandle";

const DeleteInventoryCount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { inventoryCountId } = location.state || {};
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    navigate("/list-inventory-count");
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await deleteInventoryCount(tenantId, inventoryCountId);
      console.log("response", response);

      setNotification({
        open: true,
        message: "Inventory Count record deleted successfully.",
        severity: "success",
      });

      setTimeout(() => {
        navigate("/list-inventory-count");
      }, 2000);
    } catch (error) {
      console.error("Error deleting inventory count record:", error);

      // API sends back text like: "This disposable asset is already used..."
      const errorMessage =
        (error.response &&
          (error.response.data?.message || error.response.data)) ||
        error.message ||
        "Failed to delete inventory count record. Please try again.";

      setNotification({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!inventoryCountId) {
    return (
      <NotPageHandle
        message="No Inventory Count selected to Delete"
        navigateTo="/list-inventory-count"
      />
    );
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Inventory Count record? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

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
          variant="filled" // Makes error messages more prominent
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DeleteInventoryCount;
