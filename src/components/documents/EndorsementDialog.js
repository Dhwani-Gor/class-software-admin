import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Radio, FormControlLabel, Box, Typography, RadioGroup as MuiRadioGroup } from "@mui/material";
import { getSelectedReportDetails } from "@/api";
import CommonButton from "../CommonButton";

const EndorsementDialog = ({ open, onClose, onSubmit, endorsementList = [], reportDetailsId, endorsedIssuedBy = [] }) => {
  const [selectedEndorsement, setSelectedEndorsement] = useState(null);
  const [reportDetails, setReportDetails] = useState({});
  const [radioValues, setRadioValues] = useState({});

  // Fetch report details
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

  // Determine if an endorsement should be disabled (already filled)
  const isEndorsementDisabled = (item) => {
    if (!reportDetails || Object.keys(reportDetails).length === 0 || !item?.title) return false;
    const numberMatch = item.title.match(/\d+/);
    if (!numberMatch) return false;

    const num = numberMatch[0];
    const fieldsToCheck = [`endorsed_by_${num}`, `issuance_place_${num}`, `issuance_date_${num}`];

    return fieldsToCheck.some((field) => {
      const val = reportDetails?.[field];
      return val !== undefined && val !== null && val !== "" && val !== "-";
    });
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return isNaN(date) ? "" : date.toLocaleDateString("en-GB");
  };

  // Handle sub-option radio change
  const handleRadioChange = (fieldValue, selectedOption) => {
    setRadioValues((prev) => ({
      ...prev,
      [fieldValue]: selectedOption,
    }));
  };

  // Apply strikethrough for non-selected values
  const applyStrikethrough = (text) =>
    text
      ?.split("")
      .map((c) => c + "\u0336")
      .join("");

  // Submit data
  const handleSubmit = () => {
    if (!selectedEndorsement) return;

    const flattenedData = {};

    Object.entries(selectedEndorsement).forEach(([key, value]) => {
      if (key === "title") return;

      if (typeof value === "string" && value.startsWith("st_")) {
        const [, raw] = value.split("st_");
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
        flattenedData[newKey] = reportDetails?.endorsementDate ? formatDate(reportDetails.endorsementDate) : "";
      } else if (key.includes("validity_date")) {
        flattenedData[newKey] = reportDetails?.validityDate ? formatDate(reportDetails.validityDate) : "";
      } else {
        flattenedData[newKey] = "";
      }
    });
    flattenedData.isEndorsement = true;

    onSubmit(flattenedData);
    onClose();
  };

  // Render sub-option radio fields
  const renderEndorsementFields = (item) => {
    const radioFields = [];

    Object.entries(item).forEach(([key, value]) => {
      if (typeof value === "string" && value.startsWith("st_") && key !== "title") {
        const [, raw] = value.split("st_");
        const optionsRaw = raw.split("_");
        const options = optionsRaw.map((opt) => opt.replace(/-/g, " "));

        radioFields.push({
          key,
          value, // Keep original _st_ key
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
          endorsementList.map((group, gIdx) => (
            <Box key={gIdx} sx={{ mb: 2 }}>
              {/* Group Title */}
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                {group.groupTitle}
              </Typography>

              {/* Endorsements under group */}
              <MuiRadioGroup
                value={selectedEndorsement?.title || ""}
                onChange={(e) => {
                  const item = group.endorsements.find((endorsement) => endorsement.title === e.target.value);
                  if (item) {
                    setSelectedEndorsement(item);
                    setRadioValues({});
                  }
                }}
              >
                {group.endorsements.map((item, idx) => {
                  const disabled = isEndorsementDisabled(item);
                  return (
                    <Box key={idx} sx={{ mb: 2, opacity: disabled ? 0.6 : 1 }}>
                      <FormControlLabel
                        value={item.title}
                        control={<Radio disabled={disabled} />}
                        label={
                          <Typography variant="body1" fontWeight={500}>
                            {item.title}
                          </Typography>
                        }
                      />
                      {/* Sub-fields (radio options) */}
                      {selectedEndorsement?.title === item.title && !disabled && renderEndorsementFields(item)}
                    </Box>
                  );
                })}
              </MuiRadioGroup>
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
        <CommonButton onClick={handleSubmit} text="Submit" variant="contained" disabled={!selectedEndorsement} />
      </DialogActions>
    </Dialog>
  );
};

export default EndorsementDialog;
