import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, FormControlLabel, Box, Typography } from "@mui/material";
import { getSelectedReportDetails } from "@/api";
import CommonButton from "../CommonButton";

const EndorsementDialog = ({ open, onClose, onSubmit, endorsementList = [], reportDetailsId }) => {
  const [checkedItems, setCheckedItems] = useState({});
  const [reportDetails, setReportDetails] = useState({});

  const fetchReportDetails = async () => {
    try {
      if (!reportDetailsId) return;
      const response = await getSelectedReportDetails(reportDetailsId);
      setReportDetails(response?.data?.data || {});
    } catch (error) {
      console.error("Failed to fetch report details:", error);
    }
  };

  useEffect(() => {
    if (open) fetchReportDetails();
  }, [open, reportDetailsId]);

  const handleCheck = (item) => (event) => {
    setCheckedItems((prev) => {
      const updated = { ...prev };
      if (event.target.checked) {
        updated[item.title] = item;
      } else {
        delete updated[item.title];
      }
      return updated;
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date)) return "-";
    return date.toLocaleDateString("en-GB");
  };

  const handleSubmit = () => {
    const result = {};
    Object.values(checkedItems).forEach((endorsement) => {
      Object.entries(endorsement).forEach(([key, value]) => {
        if (!key || key === "title" || !value?.trim()) return;

        if (key.includes("endorsedby") || key.includes("endorsed_by")) {
          result[value] = `${reportDetails?.issuedBy || reportDetails?.issuer?.name || "-"}`;
        } else if (key.includes("issuance_place") || key.includes("endorsed_place")) {
          result[value] = `${reportDetails?.place || "-"}`;
        } else if (key.includes("issuance_date")) {
          result[value] = reportDetails?.issuanceDate ? formatDate(reportDetails?.issuanceDate) : "-";
        } else if (key.includes("validity_date")) {
          result[value] = reportDetails?.validityDate ? formatDate(reportDetails?.validityDate) : "-";
        }
      });
    });

    onSubmit(result);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Choose Endorsements / Extensions</DialogTitle>
      <DialogContent dividers>
        {endorsementList.length > 0 ? (
          endorsementList.map((item, idx) => (
            <Box key={idx} sx={{ mb: 1 }}>
              <FormControlLabel control={<Checkbox checked={!!checkedItems[item.title]} onChange={handleCheck(item)} />} label={item.title} />
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No endorsement options available.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <CommonButton onClick={onClose} text="Cancel" variant="outlined" />
        <CommonButton onClick={handleSubmit} text="Submit" variant="contained" disabled={Object.keys(checkedItems).length === 0} />
      </DialogActions>
    </Dialog>
  );
};

export default EndorsementDialog;
