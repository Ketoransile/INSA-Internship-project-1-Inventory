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
import { deleteStockDisposal } from "../../api/inventoryApi"; // 👈 API for deletion
import NotPageHandle from "../../common/NoPageHandle";

const DeleteStockDisposal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stockDisposalId } = location.state || {}; // 👈 get id from navigation state
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
      await deleteStockDisposal(tenantId, stockDisposalId); // 👈 call API
      setNotification({
        open: true,
        message: "Stock Disposal record deleted successfully.",
        severity: "success",
      });
      setTimeout(() => {
        setOpen(false);
        navigate("/list-stock-disposal"); // 👈 redirect to list page
      }, 1500);
    } catch (error) {
      console.error("Error deleting stock disposal:", error);
      setNotification({
        open: true,
        message:
          error.response?.data?.message || "Failed to delete stock disposal.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!stockDisposalId) {
    return (
      <NotPageHandle
        message="No Stock Disposal selected to Delete"
        navigateTo="/list-stock-disposal"
      />
    );
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Stock Disposal record? This
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

export default DeleteStockDisposal;
