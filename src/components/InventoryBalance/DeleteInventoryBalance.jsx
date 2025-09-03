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
import { deleteInventoryBalance } from "../../api/inventoryApi";
import NotPageHandle from "../../common/NoPageHandle";

const DeleteInventoryBalance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { inventoryBalanceId } = location.state || {};
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
    navigate(-1);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await deleteInventoryBalance(
        tenantId,
        inventoryBalanceId
      );
      console.log("resposne", response);
      setNotification({
        open: true,
        message: "Inventory Balance deleted successfully.",
        severity: "success",
      });
      setTimeout(() => {
        setOpen(false);
        navigate("/list-inventory-balance");
      }, 1000);
    } catch (error) {
      console.error("Error deleting inventory balance:", error);
      setNotification({
        open: true,
        message:
          error.response?.data?.message ||
          "Failed to delete inventory balance.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!inventoryBalanceId) {
    return (
      <NotPageHandle
        message="No Inventory Balance selected to Delete"
        navigateTo="/list-inventory-balance"
      />
    );
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Inventory Balance record? This
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
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DeleteInventoryBalance;
