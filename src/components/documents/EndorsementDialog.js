import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Radio, FormControlLabel, Box, Typography, RadioGroup as MuiRadioGroup, TextField, FormControl, InputLabel, Select, MenuItem, Stack, Divider } from "@mui/material";
import { getSelectedReportDetails } from "@/api";
import CommonButton from "../CommonButton";

const EndorsementDialog = ({ open, onClose, onSubmit, endorsementList = [], reportDetailsId, surveyorOptions = [] }) => {
  const [selectedEndorsement, setSelectedEndorsement] = useState(null);
  const [reportDetails, setReportDetails] = useState({});
  console.log(reportDetails.data, "reportDetails.data");
  const [radioValues, setRadioValues] = useState({});
  const [endorsementInputs, setEndorsementInputs] = useState({});
  const [issuedBy, setIssuedBy] = useState("");

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
      setEndorsementInputs({});
      setIssuedBy("");
    }
  }, [open, reportDetailsId]);

  // Disable endorsement if any of its related fields (endorsed_by_X, issuance_place_X, issuance_date_X)
  // have values filled in reportDetails.data
  const isEndorsementDisabled = (item) => {
    if (!reportDetails || Object.keys(reportDetails).length === 0 || !item?.title) return false;

    // Extract number from endorsement title, e.g. "Endorsement 1" → 1
    const numberMatch = item.title.match(/\d+/);
    if (!numberMatch) return false;

    const num = numberMatch[0];

    // These are the fields we check for filled values
    const fieldsToCheck = [`endorsed_by_${num}`, `issuance_place_${num}`, `issuance_date_${num}`];

    // The correct structure is reportDetails.data.<field>
    const reportData = reportDetails?.data || reportDetails;

    return fieldsToCheck.some((field) => {
      const val = reportData?.[field];
      return val !== undefined && val !== null && val !== "" && val !== "-";
    });
  };

  const handleRadioChange = (fieldValue, selectedOption) => {
    setRadioValues((prev) => ({
      ...prev,
      [fieldValue]: selectedOption,
    }));
  };

  const applyStrikethrough = (text) =>
    text
      ?.split("")
      .map((c) => c + "\u0336")
      .join("");

  // Render text/date input fields in one row
  const renderDynamicInputs = (endorsement) => {
    const fieldKeys = Object.keys(endorsement).filter((key) => key.match(/endorsed_place|issuance_place|issuance_date|validity_date/i) && endorsement[key] && endorsement[key] !== "-" && endorsement[key].trim() !== "");

    if (fieldKeys.length === 0) return null;

    return (
      <Stack direction="row" spacing={2} mt={2} alignItems="center" flexWrap="nowrap" sx={{ overflowX: "auto" }}>
        {fieldKeys.map((key) => {
          const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
          const isDateField = key.toLowerCase().includes("date");

          return (
            <TextField
              key={key}
              label={label}
              type={isDateField ? "date" : "text"}
              variant="outlined"
              size="small"
              InputLabelProps={isDateField ? { shrink: true } : {}}
              value={endorsementInputs[key] || ""}
              onChange={(e) =>
                setEndorsementInputs((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }))
              }
              sx={{ flex: 1, minWidth: 200 }}
            />
          );
        })}

        {/* Issued By Dropdown (also in the same row) */}
        <FormControl size="small" sx={{ flex: 1, minWidth: 200 }}>
          <InputLabel>Issued By</InputLabel>
          <Select value={issuedBy} label="Issued By" onChange={(e) => setIssuedBy(e.target.value)}>
            {surveyorOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    );
  };

  const renderEndorsementFields = (item) => {
    const radioFields = [];

    Object.entries(item).forEach(([key, value]) => {
      if (typeof value === "string" && value.startsWith("_st_") && key !== "title") {
        const [, raw] = value.split("_st_");
        const optionsRaw = raw.split("_");
        const options = optionsRaw.map((opt) => opt.replace(/-/g, " "));

        radioFields.push({
          key,
          value,
          label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          options,
        });
      }
    });

    if (radioFields.length === 0) return null;

    return (
      <Box sx={{ mt: 2 }}>
        {radioFields.map((field) => (
          <Box key={field.key} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
              {field.label}
            </Typography>
            <MuiRadioGroup row value={radioValues[field.value] || ""} onChange={(e) => handleRadioChange(field.value, e.target.value)}>
              {field.options.map((opt) => (
                <FormControlLabel key={opt} value={opt} control={<Radio size="small" />} label={opt} />
              ))}
            </MuiRadioGroup>
          </Box>
        ))}
      </Box>
    );
  };

  const handleSubmit = () => {
    if (!selectedEndorsement) return;

    const flattenedData = {};
    const numberMatch = selectedEndorsement.title.match(/\d+/);
    const num = numberMatch ? numberMatch[0] : "";

    Object.entries(selectedEndorsement).forEach(([key, value]) => {
      if (key === "title") return;

      let finalValue = endorsementInputs[key] ?? value ?? "";

      if (typeof value === "string" && value.startsWith("_st_")) {
        const [, raw] = value.split("_st_");
        const optionsRaw = raw.split("_");
        const options = optionsRaw.map((opt) => opt.replace(/-/g, " "));

        const selectedOption = radioValues[value];
        const formattedValue = options.map((opt) => (selectedOption === opt ? opt : applyStrikethrough(opt))).join(" / ");

        flattenedData[value] = formattedValue;
        return;
      }

      let newKey = key;
      if (key === "endorsed_place") newKey = `issuance_place_${num}`;
      else if (key === "issuance_date") newKey = `issuance_date_${num}`;
      else if (key === "endorsed_by") newKey = `endorsed_by_${num}`;
      else if (key === "validity_date") newKey = `validity_date_${num}`;

      flattenedData[newKey] = finalValue;
    });

    flattenedData.isEndorsement = true;

    if (issuedBy) {
      const selectedSurveyor = surveyorOptions.find((s) => s.value === issuedBy);
      flattenedData[`endorsed_by_${num}`] = selectedSurveyor?.label || "";
    }

    onSubmit(flattenedData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Choose Endorsement / Extension</DialogTitle>
      <DialogContent dividers>
        {endorsementList?.length > 0 ? (
          endorsementList?.map((group, gIdx) => (
            <Box key={gIdx} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: "primary.main" }}>
                {group.groupTitle}
              </Typography>

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
                    <Box
                      key={idx}
                      sx={{
                        mb: 2,
                        p: 1.5,
                        borderColor: disabled ? "grey.300" : "grey.400",
                        borderRadius: 1,
                        opacity: disabled ? 0.6 : 1,
                      }}
                    >
                      <FormControlLabel value={item.title} control={<Radio disabled={disabled} />} label={<Typography fontWeight={500}>{item.title}</Typography>} />

                      {selectedEndorsement?.title === item.title && !disabled && (
                        <>
                          {renderEndorsementFields(item)}
                          {renderDynamicInputs(item)}
                        </>
                      )}
                    </Box>
                  );
                })}
              </MuiRadioGroup>
              {gIdx < endorsementList.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))
        ) : (
          <Typography color="text.secondary">No endorsement options available.</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <CommonButton onClick={onClose} text="Cancel" variant="outlined" />
        <CommonButton onClick={handleSubmit} text="Submit" variant="contained" disabled={!selectedEndorsement || !issuedBy} />
      </DialogActions>
    </Dialog>
  );
};

export default EndorsementDialog;
