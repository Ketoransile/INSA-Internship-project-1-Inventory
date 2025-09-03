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
  CircularProgress, // For loading indicator within the button
} from "@mui/material";
import { useAtom } from "jotai";
import { authAtom } from "shell/authAtom";
import { deleteFixedAssetTransfer } from "../../api/inventoryApi"; // Import the actual API function
import NotPageHandle from "../../common/NoPageHandle"; // Assuming NotPageHandle is in common

const DeleteFixedAssetTransfer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Get the fixedAssetTransferId from the location state
  const { fixedAssetTransferId } = location.state || {};
  const [authState] = useAtom(authAtom);
  const tenantId = authState.tenantId;

  const [loading, setLoading] = useState(false); // State for loading indicator during deletion
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [open, setOpen] = useState(true); // Control the visibility of the dialog

  // Handle closing the dialog and navigating back
  const handleClose = () => {
    setOpen(false);
    navigate(-1); // Navigate back to the previous page
  };

  // Handle the deletion process
  const handleDelete = async () => {
    setLoading(true); // Set loading to true when deletion starts
    try {
      // Call the delete API with tenantId and the specific fixedAssetTransferId
      await deleteFixedAssetTransfer(tenantId, fixedAssetTransferId);
      setNotification({
        open: true,
        message: 'Fixed Asset Transfer record deleted successfully.',
        severity: 'success',
      });
      // Close dialog and navigate back after a short delay for Snackbar to be seen
      setTimeout(() => {
        setOpen(false);
        navigate(-1);
      }, 2000);
    } catch (error) {
      console.error('Error deleting fixed asset transfer record:', error);
      setNotification({
        open: true,
        message: 'Failed to delete fixed asset transfer record.',
        severity: 'error',
      });
    } finally {
      setLoading(false); // Set loading to false when deletion finishes (success or error)
    }
  };

  // If fixedAssetTransferId is not provided in the state, display NotPageHandle
  if (!fixedAssetTransferId) {
    return <NotPageHandle message="No Fixed Asset Transfer selected to Delete" navigateTo="/fixed-asset-transfer/list" />;
  }

  return (
    <>
      {/* Confirmation Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Fixed Asset Transfer record? This action cannot be undone.
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
            disabled={loading} // Disable button while loading
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DeleteFixedAssetTransfer;
