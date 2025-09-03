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
import { deleteDisposableAsset } from "../../api/inventoryApi";
import NotPageHandle from "../../common/NoPageHandle";

const DeleteDisposableAsset = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { disposableAssetId } = location.state || {};
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
      await deleteDisposableAsset(tenantId, disposableAssetId);
      setNotification({
        open: true,
        message: "Disposable Asset Request deleted successfully.",
        severity: "success",
      });
      setTimeout(() => {
        navigate("/list-disposable-asset"); // Navigate to list instead of back
      }, 1000);
    } catch (error) {
      console.error("Error deleting disposable asset request:", error);
      setNotification({
        open: true,
        message:
          error.response?.data?.message ||
          "Failed to delete disposable asset request.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!disposableAssetId) {
    return (
      <NotPageHandle
        message="No Disposable Asset selected to Delete"
        navigateTo="/disposable-asset/list"
      />
    );
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Disposable Asset Request? This
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

export default DeleteDisposableAsset;
