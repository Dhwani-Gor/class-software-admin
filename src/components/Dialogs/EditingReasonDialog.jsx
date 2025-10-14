import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextareaAutosize,
} from "@mui/material";
import CommonButton from "../CommonButton";

const EditingReasonDialog = ({ open, title, onCancel, onConfirm }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open && typeof open === 'object') {
      setValue(open.remarks || "");
    }
  }, [open]);

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onCancel}
    >
      <DialogTitle fontWeight={'600'}>{title}</DialogTitle>
      <DialogContent>
        <TextareaAutosize
          value={value}
          minRows={10}
          placeholder="Enter Remarks"
          style={{
            width: "100%",
            minWidth: '50vw',
            padding: "8px",
            fontFamily: "inherit",
            fontSize: "inherit",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
          onChange={(e) => setValue(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <CommonButton text="Cancel" variant="outlined" onClick={onCancel} />
        <CommonButton text="Save" disabled={!value} onClick={() => onConfirm(value)} />
      </DialogActions>
    </Dialog>
  );
};

export default EditingReasonDialog;