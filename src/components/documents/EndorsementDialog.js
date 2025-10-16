import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, FormControlLabel, Box } from "@mui/material";
import { getSelectedReportDetails } from "@/api";
import CommonButton from "../CommonButton";

const EndorsementDialog = ({ open, onClose, onSubmit, endorsementList, reportDetailsId }) => {
  const [checkedItems, setCheckedItems] = useState({});
  const [reportDetails, setReportDetails] = useState({});
  console.log(endorsementList, "endorsementList");

  const fetchReportDetais = async () => {
    const response = await getSelectedReportDetails(reportDetailsId);
    setReportDetails(response?.data?.data);
  };

  useEffect(() => {
    fetchReportDetais();
  }, []);

  const handleCheck = (item) => (event) => {
    setCheckedItems(() => {
      if (event.target.checked) {
        return { [item.title]: item };
      } else {
        return {};
      }
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = () => {
    const selected = Object.values(checkedItems);
    let result = {};

    selected.forEach((endorsement) => {
      Object.entries(endorsement).forEach(([key, value]) => {
        if (key !== "title") {
          if (key.includes("endorsedby") || key.includes("endorsed_by")) result[value] = reportDetails?.issuedBy || reportDetails?.issuer?.name;
          else if (key.includes("endorsed_place") || key.includes("issuance_place")) result[value] = reportDetails?.place;
          else if (key.includes("issuance_date")) result[value] = reportDetails?.issuanceDate ? formatDate(reportDetails?.issuanceDate) : "-";
          else if (key.includes("validity_date")) result[value] = reportDetails?.validityDate ? formatDate(reportDetails?.validityDate) : "-";
        }
      });
    });

    console.log(result, "final endorsement object");

    onSubmit(result); // ✅ single object now
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Choose Endorsements / Extensions</DialogTitle>
      <DialogContent>
        {endorsementList.map((item, idx) => (
          <Box key={idx} sx={{ mb: 1 }}>
            <FormControlLabel control={<Checkbox checked={!!checkedItems[item.title]} onChange={handleCheck(item)} />} label={item.title} />
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <CommonButton onClick={onClose} text="cancel" variant="outlined" />
        <CommonButton onClick={handleSubmit} text="submit" variant="contained" />
      </DialogActions>
    </Dialog>
  );
};

export default EndorsementDialog;
