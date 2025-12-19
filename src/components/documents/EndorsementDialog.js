import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Radio, FormControlLabel, Box, Typography, RadioGroup as MuiRadioGroup, TextField, FormControl, Select, MenuItem, Stack, Checkbox } from "@mui/material";
import { getSelectedReportDetails } from "@/api";
import CommonButton from "../CommonButton";
import CommonInput from "../CommonInput";

const EndorsementDialog = ({ open, onClose, onSubmit, endorsementStamp, endorsementList = [], reportDetailsId, surveyorOptions = [] }) => {
  // Changed from single selection to array for multiple selections
  const [selectedEndorsements, setSelectedEndorsements] = useState([]);
  const [reportDetails, setReportDetails] = useState({});
  const [radioValues, setRadioValues] = useState({});
  const [endorsementInputs, setEndorsementInputs] = useState({});
  // Changed to store values per endorsement
  const [issuedByValues, setIssuedByValues] = useState({});
  const [remarksValues, setRemarksValues] = useState({});

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
      setSelectedEndorsements([]);
      setRadioValues({});
      setEndorsementInputs({});
      setIssuedByValues({});
      setRemarksValues({});
    }
  }, [open, reportDetailsId]);

  // Check if an endorsement is already done (has data filled in reportDetails)
  const isEndorsementDone = (item) => {
    if (!reportDetails?.data || !item?.title) return false;

    const numberMatch = item.title.match(/\d+/);
    if (!numberMatch) return false;
    const num = numberMatch[0];

    const fieldsToCheck = [`endorsed_by_${num}`, `issuance_place_${num}`, `issuance_date_${num}`, `validity_date_${num}`, `endorsement_remarks_${num}`, `endorsement_stamp_${num}`];

    return fieldsToCheck.some((field) => {
      const val = reportDetails.data[field];
      return val !== undefined && val !== null && val !== "" && val !== "-";
    });
  };

  // NEW: Auto-select endorsements that are already done and pre-fill their values
  useEffect(() => {
    if (open && reportDetails?.data && endorsementList?.length > 0) {
      const doneEndorsements = [];
      const newInputs = {};
      const newRadioValues = {};
      const newIssuedBy = {};
      const newRemarks = {};

      endorsementList.forEach((group) => {
        group.endorsements.forEach((endorsement) => {
          if (isEndorsementDone(endorsement)) {
            doneEndorsements.push(endorsement);

            const numberMatch = endorsement.title.match(/\d+/);
            if (!numberMatch) return;
            const num = numberMatch[0];

            // Pre-fill input fields
            const fieldsToCheck = {
              endorsed_place: `issuance_place_${num}`,
              issuance_place: `issuance_place_${num}`,
              issuance_date: `issuance_date_${num}`,
              validity_date: `validity_date_${num}`,
            };

            Object.entries(fieldsToCheck).forEach(([key, rdKey]) => {
              const value = reportDetails.data[rdKey];
              if (value && value !== "-" && value !== "") {
                const inputKey = `${endorsement.title}_${key}`;
                // Convert DD/MM/YYYY to YYYY-MM-DD for date inputs
                if (key.includes("date") && value) {
                  const parts = value.split("/");
                  if (parts.length === 3) {
                    newInputs[inputKey] = `${parts[2]}-${parts[1]}-${parts[0]}`;
                  } else {
                    newInputs[inputKey] = value;
                  }
                } else {
                  newInputs[inputKey] = value;
                }
              }
            });

            // Pre-fill issued by
            const issuedByKey = `endorsed_by_${num}`;
            const issuedByValue = reportDetails.data[issuedByKey];
            if (issuedByValue) {
              const matchingSurveyor = surveyorOptions.find((s) => s.label === issuedByValue);
              if (matchingSurveyor) {
                newIssuedBy[endorsement.title] = matchingSurveyor.value;
              }
            }

            // Pre-fill remarks
            const remarksKey = `endorsement_remarks_${num}`;
            const remarksValue = reportDetails.data[remarksKey];
            if (remarksValue) {
              newRemarks[endorsement.title] = remarksValue;
            }

            // Pre-fill radio values for strikethrough fields
            Object.entries(endorsement).forEach(([key, value]) => {
              if (typeof value === "string" && value.startsWith("_st_")) {
                const rdValue = reportDetails.data[value];
                if (rdValue) {
                  // Parse the strikethrough text to find selected option
                  const [, raw] = value.split("_st_");
                  const optionsRaw = raw.split("_");

                  // Find which option is NOT struck through in the saved value
                  const selectedOpt = optionsRaw.find((opt) => {
                    const displayLabel = opt.replace(/-/g, " ").replace(/\d+$/, "");
                    // Check if this option appears without strikethrough
                    const hasStrikethrough = rdValue.includes(displayLabel + "̶") || rdValue.includes("̶" + displayLabel) || rdValue.match(new RegExp(displayLabel.split("").join("̶"), "i"));
                    return rdValue.includes(displayLabel) && !hasStrikethrough;
                  });

                  if (selectedOpt) {
                    newRadioValues[`${endorsement.title}_${value}`] = selectedOpt;
                  }
                }
              }
            });
          }
        });
      });

      if (doneEndorsements.length > 0) {
        setSelectedEndorsements(doneEndorsements);
        setEndorsementInputs(newInputs);
        setRadioValues(newRadioValues);
        setIssuedByValues(newIssuedBy);
        setRemarksValues(newRemarks);
      }
    }
  }, [open, reportDetails, endorsementList, surveyorOptions]);

  // CHANGED: Handle checkbox selection (multiple selections)
  const handleCheckboxChange = (item) => {
    setSelectedEndorsements((prev) => {
      const isSelected = prev.some((e) => e.title === item.title);
      if (isSelected) {
        return prev.filter((e) => e.title !== item.title);
      } else {
        return [...prev, item];
      }
    });
  };

  // CHANGED: Store radio values with endorsement title prefix
  const handleRadioChange = (endorsementTitle, fieldValue, selectedOption) => {
    setRadioValues((prev) => ({
      ...prev,
      [`${endorsementTitle}_${fieldValue}`]: selectedOption,
    }));
  };

  const applyStrikethrough = (text) =>
    text
      ?.split("")
      .map((c) => c + "\u0336")
      .join("");

  const renderDynamicInputs = (endorsement) => {
    const fieldKeys = Object.keys(endorsement).filter((key) => key.match(/endorsed_place|issuance_place|issuance_date|validity_date/i) && endorsement[key] && endorsement[key] !== "-" && endorsement[key].trim() !== "");

    if (fieldKeys.length === 0) return null;

    return (
      <Stack direction="row" spacing={2} mt={2} alignItems="center" flexWrap="wrap">
        {fieldKeys.map((key) => {
          const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
          const isDateField = key.toLowerCase().includes("date");
          // Add endorsement title to key for unique identification
          const inputKey = `${endorsement.title}_${key}`;

          return (
            <CommonInput
              key={key}
              label={label}
              type={isDateField ? "date" : "text"}
              variant="outlined"
              size="small"
              InputLabelProps={isDateField ? { shrink: true } : {}}
              value={endorsementInputs[inputKey] || ""}
              onChange={(e) =>
                setEndorsementInputs((prev) => ({
                  ...prev,
                  [inputKey]: e.target.value,
                }))
              }
              sx={{ flex: 1, minWidth: 150 }}
            />
          );
        })}

        {/* Issued By Dropdown - now per endorsement */}
        <FormControl size="small" sx={{ flex: 1, minWidth: 150 }}>
          <Typography variant="body2" fontWeight={500} sx={{ mb: 2 }}>
            Issued By
          </Typography>
          <Select
            value={issuedByValues[endorsement.title] || ""}
            onChange={(e) =>
              setIssuedByValues((prev) => ({
                ...prev,
                [endorsement.title]: e.target.value,
              }))
            }
            sx={{ width: "100%" }}
          >
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
        const options = optionsRaw.map((opt) => {
          const displayLabel = opt.replace(/-/g, " ").replace(/\d+$/, "");
          return { raw: opt, label: displayLabel };
        });

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
            <MuiRadioGroup row value={radioValues[`${item.title}_${field.value}`] || ""} onChange={(e) => handleRadioChange(item.title, field.value, e.target.value)}>
              {field.options.map((opt) => (
                <FormControlLabel key={opt.raw} value={opt.raw} control={<Radio size="small" />} label={opt.label} />
              ))}
            </MuiRadioGroup>
          </Box>
        ))}
      </Box>
    );
  };

  const handleSubmit = () => {
    if (selectedEndorsements.length === 0) return;

    const allData = {};

    selectedEndorsements.forEach((selectedEndorsement) => {
      const flattenedData = {};
      const numberMatch = selectedEndorsement.title.match(/\d+/);
      const num = numberMatch ? numberMatch[0] : "";

      // Only process actual input fields, not placeholder values
      const inputFields = ["endorsed_place", "issuance_place", "issuance_date", "validity_date"];
      inputFields.forEach((key) => {
        const inputKey = `${selectedEndorsement.title}_${key}`;
        let finalValue = endorsementInputs[inputKey] ?? "";

        // Format dates if entered
        if (key.toLowerCase().includes("date") && finalValue) {
          const date = new Date(finalValue);
          if (!isNaN(date)) {
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            finalValue = `${day}/${month}/${year}`;
          } else {
            finalValue = "";
          }
        }

        // Map keys to numbered keys
        let newKey = key;
        if (key === "endorsed_place") newKey = `issuance_place_${num}`;
        else if (key === "issuance_date") newKey = `issuance_date_${num}`;
        else if (key === "validity_date") newKey = `validity_date_${num}`;

        flattenedData[newKey] = finalValue;
      });

      // Handle strikethrough radio fields
      Object.entries(selectedEndorsement).forEach(([key, value]) => {
        if (typeof value === "string" && value.startsWith("_st_")) {
          const [, raw] = value.split("_st_");
          const optionsRaw = raw.split("_");
          const options = optionsRaw.map((opt) => opt.replace(/-/g, " ").replace(/\d+$/, ""));
          const selectedOption = radioValues[`${selectedEndorsement.title}_${value}`];

          let formattedValue = "";
          if (!selectedOption) {
            formattedValue = options.join(" / ");
          } else {
            const selectedClean = selectedOption.replace(/\d+$/, "");
            formattedValue = options.map((opt) => (opt === selectedClean ? opt : applyStrikethrough(opt))).join(" / ");
          }

          flattenedData[value] = formattedValue;
        }
      });

      // Issued By dropdown
      const issuedBy = issuedByValues[selectedEndorsement.title];
      if (issuedBy) {
        const selectedSurveyor = surveyorOptions.find((s) => s.value === issuedBy);
        flattenedData[`endorsed_by_${num}`] = selectedSurveyor?.label || "";
      } else {
        flattenedData[`endorsed_by_${num}`] = ""; // send empty string if not selected
      }

      // Remarks
      const remarks = remarksValues[selectedEndorsement.title];
      flattenedData[`endorsement_remarks_${num}`] = remarks?.trim() ?? "";

      // Endorsement stamp
      if (endorsementStamp) {
        flattenedData[`endorsement_stamp_${num}`] = endorsementStamp;
      }

      Object.assign(allData, flattenedData);
    });

    allData.isEndorsement = true;
    onSubmit(allData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Choose Endorsement / Extension</DialogTitle>
      <DialogContent dividers>
        {endorsementList?.length > 0 ? (
          endorsementList.map((group, gIdx) => (
            <Box key={gIdx} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: "primary.main" }}>
                {group.groupTitle}
              </Typography>

              {/* REMOVED: RadioGroup wrapper - now using individual checkboxes */}
              {group.endorsements.map((item, idx) => {
                const isSelected = selectedEndorsements.some((e) => e.title === item.title);

                return (
                  <Box
                    key={idx}
                    sx={{
                      mb: 2,
                      p: 1.5,
                      borderRadius: 1,
                    }}
                  >
                    {/* CHANGED: Radio to Checkbox */}
                    <FormControlLabel control={<Checkbox checked={isSelected} onChange={() => handleCheckboxChange(item)} />} label={<Typography fontWeight={500}>{item.title}</Typography>} />

                    {/* Show fields only when selected */}
                    {isSelected && (
                      <>
                        {renderEndorsementFields(item)}
                        {renderDynamicInputs(item)}
                        {/* Remarks per endorsement - handles endorsement_remarks_1/2/3/4 */}
                        <TextField
                          label="Remarks"
                          multiline
                          rows={2}
                          fullWidth
                          sx={{ mt: 2 }}
                          value={remarksValues[item.title] || ""}
                          onChange={(e) =>
                            setRemarksValues((prev) => ({
                              ...prev,
                              [item.title]: e.target.value,
                            }))
                          }
                        />
                      </>
                    )}
                  </Box>
                );
              })}

              {gIdx < endorsementList.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))
        ) : (
          <Typography color="text.secondary">No endorsement options available.</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <CommonButton onClick={onClose} text="Cancel" variant="outlined" />
        <CommonButton onClick={handleSubmit} text="Submit" variant="contained" />
      </DialogActions>
    </Dialog>
  );
};

export default EndorsementDialog;
