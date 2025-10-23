import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Radio, FormControlLabel, Box, Typography, RadioGroup as MuiRadioGroup } from "@mui/material";
import { getSelectedReportDetails } from "@/api";
import CommonButton from "../CommonButton";

const EndorsementDialog = ({ open, onClose, onSubmit, endorsementList = [], reportDetailsId, endorsedIssuedBy }) => {
  const [selectedEndorsement, setSelectedEndorsement] = useState(null);
  const [reportDetails, setReportDetails] = useState({});
  const [radioValues, setRadioValues] = useState({});

  const fetchReportDetails = async () => {
    if (!reportDetailsId) return;
    try {
      const response = await getSelectedReportDetails(reportDetailsId);
      setReportDetails(response?.data?.data || {});
    } catch (error) {
      console.error("Failed to fetch report details:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchReportDetails();
      setSelectedEndorsement(null);
      setRadioValues({});
    }
  }, [open, reportDetailsId]);

  const handleEndorsementSelect = (item) => {
    setSelectedEndorsement(item);
    setRadioValues({});
  };

  const handleRadioChange = (fieldValue, selectedOption) => {
    setRadioValues((prev) => ({
      ...prev,
      [fieldValue]: selectedOption,
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return isNaN(date) ? "" : date.toLocaleDateString("en-GB");
  };

  const applyStrikethrough = (text) =>
    text
      ?.split("")
      .map((c) => c + "\u0336")
      .join("");

  const handleSubmit = () => {
    if (!selectedEndorsement) return;

    const flattenedData = {};

    Object.entries(selectedEndorsement).forEach(([key, value]) => {
      if (key === "title") return;

      if (typeof value === "string" && value.startsWith("_st_")) {
        const [, raw] = value.split("_st_");
        const optionsRaw = raw.split("_");
        const options = optionsRaw.map((opt) => opt.replace(/-/g, " "));

        const selectedOption = radioValues[value];

        const formattedValue = options.map((opt) => (selectedOption === opt ? opt : applyStrikethrough(opt))).join(" / ");

        flattenedData[value] = formattedValue;
        return;
      }

      const newKey = value || key;

      if (key.includes("endorsedby") || key.includes("endorsed_by")) {
        const issuedById = reportDetails?.issuedBy;
        const matchedSurveyor = endorsedIssuedBy.find((s) => String(s.value) === String(issuedById));

        flattenedData[newKey] = matchedSurveyor?.label || reportDetails?.issuer?.name || "";
      } else if (key.includes("place") || key.includes("endorsed_place")) {
        flattenedData[newKey] = reportDetails?.place || "";
      } else if (key.includes("issuance_date")) {
        flattenedData[newKey] = reportDetails?.issuanceDate ? formatDate(reportDetails.endorsementDate) : "";
      } else if (key.includes("validity_date")) {
        flattenedData[newKey] = reportDetails?.validityDate ? formatDate(reportDetails.validityDate) : "";
      } else {
        flattenedData[newKey] = "";
      }
    });

    onSubmit(flattenedData);
    onClose();
  };

  const renderEndorsementFields = (item) => {
    const radioFields = [];

    // Find all fields where VALUE starts with _st_
    Object.entries(item).forEach(([key, value]) => {
      if (typeof value === "string" && value.startsWith("_st_") && key !== "title") {
        const [, raw] = value.split("_st_");
        const optionsRaw = raw.split("_");
        const options = optionsRaw.map((opt) => opt.replace(/-/g, " "));

        radioFields.push({
          key,
          value, // Store the original _st_ pattern
          label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          options,
        });
      }
    });

    if (radioFields.length === 0) return null;

    return (
      <Box sx={{ ml: 4, mt: 1, p: 2, display: "flex", borderRadius: 1 }}>
        {radioFields.map((field) => (
          <Box key={field.key}>
            <MuiRadioGroup sx={{ display: "flex", flexDirection: "row" }} value={radioValues[field.value] || ""} onChange={(e) => handleRadioChange(field.value, e.target.value)}>
              {field.options.map((opt) => (
                <FormControlLabel key={opt} value={opt} control={<Radio size="small" />} label={opt} sx={{ ml: 1 }} />
              ))}
            </MuiRadioGroup>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Choose Endorsements / Extensions</DialogTitle>
      <DialogContent dividers>
        {endorsementList.length > 0 ? (
          <MuiRadioGroup
            value={selectedEndorsement?.title || ""}
            onChange={(e) => {
              const item = endorsementList.find((endorsement) => endorsement.title === e.target.value);
              if (item) handleEndorsementSelect(item);
            }}
          >
            {endorsementList.map((item, idx) => (
              <Box key={idx} sx={{ mb: 2 }}>
                <FormControlLabel
                  value={item.title}
                  control={<Radio />}
                  label={
                    <Typography variant="body1" fontWeight={500}>
                      {item.title}
                    </Typography>
                  }
                />
                {selectedEndorsement?.title === item.title && renderEndorsementFields(item)}
              </Box>
            ))}
          </MuiRadioGroup>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No endorsement options available.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <CommonButton onClick={onClose} text="Cancel" variant="outlined" />
        <CommonButton onClick={handleSubmit} text="Submit" variant="contained" disabled={!selectedEndorsement} />
      </DialogActions>
    </Dialog>
  );
};

export default EndorsementDialog;
