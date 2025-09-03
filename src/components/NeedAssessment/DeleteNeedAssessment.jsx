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
import { deleteNeedAssessment } from "../../api/inventoryApi"; // 👈 make sure this API exists
import NotPageHandle from "../../common/NoPageHandle";

const DeleteNeedAssessment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { needAssessmentId } = location.state || {}; // 👈 get id from navigation state
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
      await deleteNeedAssessment(tenantId, needAssessmentId); // 👈 call API
      setNotification({
        open: true,
        message: "Need Assessment deleted successfully.",
        severity: "success",
      });
      setTimeout(() => {
        setOpen(false);
        navigate("/list-need-assessment"); // 👈 redirect to list page
      }, 1500);
    } catch (error) {
      console.error("Error deleting need assessment:", error);
      setNotification({
        open: true,
        message:
          error.response?.data?.message || "Failed to delete need assessment.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!needAssessmentId) {
    return (
      <NotPageHandle
        message="No Need Assessment selected to Delete"
        navigateTo="/need-assessment/list"
      />
    );
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Need Assessment record? This
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

export default DeleteNeedAssessment;
