import { Button, CircularProgress, Dialog, DialogActions, DialogTitle } from "@mui/material";
import React from "react";

const ConfirmationPopup = ({ open, onClose, onConfirm,isLoading=false,text }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{`Are you sure ${text} document`}</DialogTitle>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          No
        </Button>
        <Button onClick={onConfirm} variant="contained">
           {isLoading ? <CircularProgress size={18} color="#ffffff"/> :"Yes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationPopup;
