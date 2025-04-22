import React from "react";
import { Dialog, DialogActions, DialogTitle, Button } from "@mui/material";
import CommonButton from "../CommonButton";

const CommonConfirmationDialog = ({
  open,
  onCancel,
  onConfirm,
  title = "Are you sure?",
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogActions>
        <CommonButton
          text="No"
          variant="outlined"
          onClick={onCancel}
        />
        <CommonButton
          text="Yes"
          onClick={onConfirm}
        >
          {confirmText}
        </CommonButton>
      </DialogActions>
    </Dialog>
  );
};

export default CommonConfirmationDialog;
