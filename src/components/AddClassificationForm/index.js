"use client";

import { addClassificationSurvey, deleteClassificationSurvey, getAllClassificationSurveys, getAllClassificationSurveyType, getAllClients, getSingleClassificationSurveyDetails, getSurveyReportData, updateClassificationSurvey } from "@/api";
import { Box, DialogActions, FormControl, Grid2, IconButton, InputLabel, MenuItem, Select, TextField, Typography, Alert } from "@mui/material";
import { useEffect, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";
import CommonButton from "../CommonButton";
import { toast } from "react-toastify";
import { calculateDates } from "@/utils/DateCalculation";

const ClassificationForm = ({ mode = "create", variableId = null, selectedShip, onSuccess }) => {
  const [classificationRows, setClassificationRows] = useState([]);
  const [cancelled, setCancelled] = useState(false);
  const [surveyTypes, setSurveyTypes] = useState([]);
  const [existingSurveys, setExistingSurveys] = useState([]);
  console.log(existingSurveys, "existingSurveys");
  const [showSSHWarning, setShowSSHWarning] = useState({
    show: false,
    surveyType: "",
    requiredSurvey: "",
  });

  const surveyTypesRequiringSSH = ["annual survey", "docking survey", "main boiler survey", "auxiliary boiler survey", "thermal oil heating systems survey", "exhaust gas steam generators and economisers survey", "tailshaft condition monitoring annual survey", "intermediate survey"];

  const surveyDependencies = {
    "annual survey (ums)": "special survey (ums)",
    "annual survey (fi-fi)": "special survey (fi-fi)",
    "annual survey ig system": "special survey ig system",
  };

  const createEmptyRow = () => ({
    surveyName: "",
    surveyDate: "",
    issuanceDate: "",
    dueDate: "",
    rangeFrom: "",
    rangeTo: "",
    postponed: "",
  });

  const checkAndShowSSHWarning = (surveyName) => {
    if (!surveyName) return;

    const surveyNameLower = surveyName.toLowerCase();

    const requiresSSH = surveyTypesRequiringSSH.includes(surveyNameLower);
    if (requiresSSH) {
      const hasSSH = existingSurveys.some((survey) => survey.surveyName?.trim().toLowerCase() === "special survey hull");

      if (!hasSSH) {
        setShowSSHWarning({
          show: true,
          surveyType: surveyName,
          requiredSurvey: "Special Survey Hull",
        });
        setTimeout(() => setShowSSHWarning({ show: false, surveyType: "", requiredSurvey: "" }), 5000);
        return;
      }
    }

    const requiredSpecialSurvey = surveyDependencies[surveyNameLower];
    if (requiredSpecialSurvey) {
      const hasRequiredSurvey = existingSurveys.some((survey) => survey.surveyName?.trim().toLowerCase() === requiredSpecialSurvey);

      if (!hasRequiredSurvey) {
        setShowSSHWarning({
          show: true,
          surveyType: surveyName,
          requiredSurvey: requiredSpecialSurvey,
        });
        setTimeout(() => setShowSSHWarning({ show: false, surveyType: "", requiredSurvey: "" }), 5000);
      }
    }
  };

  const getAllClassification = async () => {
    try {
      if (!selectedShip.id) return;

      const result = await getAllClassificationSurveys({
        clientId: selectedShip.id,
        page: 1,
        limit: 100,
      });

      if (result?.status === 200) {
        const data = result.data.data;
        setExistingSurveys(data);
      } else {
        toast.error("Something went wrong! Please try again later");
      }
    } catch (error) {
      console.error("Error fetching classification data:", error);
      toast.error(error.message || "Error fetching classification data");
    }
  };

  useEffect(() => {
    getAllClassification();
  }, [selectedShip?.id]);

  const fetchAllSurveyTypes = async () => {
    try {
      const response = await getAllClassificationSurveyType();
      if (response?.data?.status === "success") {
        let temp = [];
        response?.data?.data?.forEach((ele, index) => {
          temp.push({
            label: ele?.name,
            value: ele?.value,
          });
        });
        setSurveyTypes(temp);
      }
    } catch (e) {
      console.log(e);
    }
  };
  const handleChange = (section, index, field, value) => {
    const updatedRows = [...classificationRows];
    updatedRows[index][field] = value;

    if (field === "surveyName") {
      checkAndShowSSHWarning(value);
    }

    // When Survey Date changes, auto-fill Assignment Date with same value
    if (field === "surveyDate") {
      updatedRows[index].issuanceDate = value;

      // Recalculate dates if survey type is selected
      if (updatedRows[index].surveyName) {
        const { dueDate, rangeFrom, rangeTo } = calculateDates(value || new Date().toISOString().split("T")[0], updatedRows[index].surveyName, existingSurveys);
        updatedRows[index].dueDate = dueDate;
        updatedRows[index].rangeFrom = rangeFrom;
        updatedRows[index].rangeTo = rangeTo;
      }
    }

    // When Assignment Date changes manually, recalculate dates
    else if (field === "issuanceDate") {
      if (updatedRows[index].surveyName) {
        const { dueDate, rangeFrom, rangeTo } = calculateDates(value || new Date().toISOString().split("T")[0], updatedRows[index].surveyName, existingSurveys);
        updatedRows[index].dueDate = dueDate;
        updatedRows[index].rangeFrom = rangeFrom;
        updatedRows[index].rangeTo = rangeTo;
      }
    }

    // When Survey Type changes, recalculate dates
    else if (field === "surveyName") {
      const dateToUse = updatedRows[index].issuanceDate || updatedRows[index].surveyDate;
      if (dateToUse) {
        const { dueDate, rangeFrom, rangeTo } = calculateDates(dateToUse, value, existingSurveys);
        updatedRows[index].dueDate = dueDate;
        updatedRows[index].rangeFrom = rangeFrom;
        updatedRows[index].rangeTo = rangeTo;
      }
    }

    setClassificationRows(updatedRows);
  };

  const addRow = () => {
    setClassificationRows([...classificationRows, createEmptyRow()]);
  };

  const handleDeleteRow = async (id) => {
    try {
      const updated = [...classificationRows];
      updated.splice(id, 1);
      await deleteClassificationSurvey(id);
      getAllClassificationSurveys(selectedShip.id);
      setClassificationRows(updated.length ? updated : [createEmptyRow()]);
    } catch (error) {
      console.error("Error deleting row:", error);
    }
  };

  const handleSave = () => {
    handleAddClassification();
    setClassificationRows([createEmptyRow()]);
  };

  const getClassification = async () => {
    try {
      if (variableId == null) return;

      const result = await getSingleClassificationSurveyDetails(variableId);
      if (result?.status === 200) {
        const data = result.data.data;

        const { dueDate, rangeFrom, rangeTo } = calculateDates(data.issuanceDate, data.surveyName, existingSurveys);

        const formattedRow = {
          id: data.id,
          surveyName: data.surveyName,
          surveyDate: data.surveyDate ? data.surveyDate : "",
          issuanceDate: data.issuanceDate,
          dueDate: data.dueDate,
          rangeFrom: data.rangeFrom ? data.rangeFrom : "",
          rangeTo: data.rangeTo ? data.rangeTo : "",
          postponed: data.postponed ? data.postponed : "",
        };

        setClassificationRows([formattedRow]);
      }
    } catch (error) {
      toast.error(error.message || "Error fetching data");
    }
  };

  const handleAddClassification = async () => {
    try {
      if (mode === "update" && variableId) {
        const updatedData = {
          ...classificationRows[0],
          clientId: Number(selectedShip.id),
          surveyName: classificationRows[0].surveyName,
          surveyDate: classificationRows[0].surveyDate || "",
          issuanceDate: classificationRows[0].issuanceDate || "",
          dueDate: classificationRows[0].dueDate || "",
          rangeFrom: classificationRows[0].rangeFrom || "",
          rangeTo: classificationRows[0].rangeTo || "",
          postponed: classificationRows[0].postponed || "",
        };

        const response = await updateClassificationSurvey(variableId, updatedData);

        if (response?.data?.status === "success") {
          toast.success("Classification updated successfully");
          onSuccess?.();
        }
        if (response?.response?.data?.status == "error") {
          toast.error(response?.response?.data?.message || "Failed to update classification");
        }
        return;
      }

      const payload = classificationRows
        .filter((row) => row.surveyName)
        .map(({ id, ...rest }) => ({
          clientId: Number(selectedShip.id),
          surveyName: rest.surveyName,
          surveyDate: rest.surveyDate || "",
          issuanceDate: rest.issuanceDate || "",
          dueDate: rest.dueDate || "",
          rangeFrom: rest.rangeFrom || "",
          rangeTo: rest.rangeTo || "",
          postponed: rest.postponed || "",
        }));

      const response = await addClassificationSurvey(payload);
      if (response?.data?.status == "success") {
        toast.success("Classification added successfully");
        onSuccess?.();
        getAllClassification();
      }
      if (response?.response?.data?.status == "error") {
        toast.error(response?.response?.data?.message);
      }
    } catch (error) {
      if (error.response) {
        console.error("Error message:", error?.response?.data?.message);
      } else {
        console.error("Unexpected error:", error);
      }
      toast.error(error?.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  useEffect(() => {
    fetchAllSurveyTypes();
  }, []);

  useEffect(() => {
    if (mode === "update" && variableId) {
      getClassification();
    }
  }, [mode, variableId]);

  useEffect(() => {
    if (selectedShip?.id) {
      setClassificationRows([createEmptyRow()]);
    }
  }, [selectedShip, selectedShip?.id]);

  return (
    <Box spacing={2} sx={{ marginTop: "2rem", width: "100%" }}>
      <Box sx={{ borderRadius: "15px" }}>
        {selectedShip?.id && (
          <Box sx={{ m: 0, p: 0 }}>
            <Typography variant="h6">Classification Surveys</Typography>
            {showSSHWarning.show && (
              <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body2">
                  <strong>Warning:</strong> {showSSHWarning.surveyType} requires <strong>{showSSHWarning.requiredSurvey}</strong>. Please add {showSSHWarning.requiredSurvey} first for accurate date calculations.
                </Typography>
              </Alert>
            )}

            {classificationRows?.map((row, index) => (
              <Box
                key={index}
                sx={{
                  borderRadius: 2,
                }}
              >
                <Grid2 container spacing={0.5} marginTop={2.5} alignItems="center">
                  {/* Survey Type */}
                  <Grid2 size={{ xs: 12, md: 1.6 }}>
                    <FormControl fullWidth>
                      <InputLabel id={`survey-type-label-${index}`}>Survey Type</InputLabel>
                      <Select labelId={`survey-type-label-${index}`} id={`survey-type-${index}`} value={row.surveyName || ""} label="Survey Type" onChange={(e) => handleChange("classification", index, "surveyName", e.target.value)}>
                        {surveyTypes.map((type) => (
                          <MenuItem key={type.value} value={type.label}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid2>

                  {/* Survey Date */}
                  <Grid2 size={{ xs: 12, md: 1.7 }}>
                    <TextField label="Survey Date" type="date" fullWidth value={row.surveyDate ? moment(row.surveyDate).format("YYYY-MM-DD") : ""} onChange={(e) => handleChange("classification", index, "surveyDate", e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid2>

                  {/* Assignment Date */}
                  <Grid2 size={{ xs: 12, md: 1.7 }}>
                    <TextField label="Assignment Date" type="date" fullWidth value={row.issuanceDate ? moment(row.issuanceDate).format("YYYY-MM-DD") : ""} onChange={(e) => handleChange("classification", index, "issuanceDate", e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid2>

                  {/* Due Date */}
                  <Grid2 size={{ xs: 12, md: 1.7 }}>
                    <TextField label="Due Date" type="date" fullWidth value={row.dueDate ? moment(row.dueDate).format("YYYY-MM-DD") : ""} onChange={(e) => handleChange("classification", index, "dueDate", e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid2>

                  {/* Range From */}
                  <Grid2 size={{ xs: 12, md: 1.7 }}>
                    <TextField label="Range From" type="date" fullWidth value={row.rangeFrom ? moment(row.rangeFrom).format("YYYY-MM-DD") : ""} onChange={(e) => handleChange("classification", index, "rangeFrom", e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid2>

                  {/* Range To */}
                  <Grid2 size={{ xs: 12, md: 1.7 }}>
                    <TextField label="Range To" type="date" fullWidth value={row.rangeTo ? moment(row.rangeTo).format("YYYY-MM-DD") : ""} onChange={(e) => handleChange("classification", index, "rangeTo", e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid2>

                  {/* Postponed Date */}
                  <Grid2 size={{ xs: 12, md: 1.7 }}>
                    <TextField label="Postponed Date" type="date" fullWidth value={row.postponed ? moment(row.postponed).format("YYYY-MM-DD") : ""} onChange={(e) => handleChange("classification", index, "postponed", e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid2>

                  {/* Delete button */}
                  {mode !== "update" && row.length > 1 && (
                    <Grid2 size={{ xs: 12, md: 0.2 }} display="flex" justifyContent="center">
                      <IconButton onClick={() => handleDeleteRow(index)} color="error" size="small" sx={{ mr: -1 }}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid2>
                  )}
                </Grid2>
              </Box>
            ))}

            {(mode !== "update" || cancelled) && <CommonButton style={{ marginTop: "1.5rem" }} variant="contained" onClick={addRow} text="Add Classification Surveys" />}
          </Box>
        )}

        {selectedShip?.id && (
          <DialogActions>
            {mode == "update" && (
              <CommonButton
                variant="contained"
                onClick={() => {
                  setClassificationRows([createEmptyRow()]);
                  setCancelled(true);
                }}
                text="Clear"
              />
            )}
            <CommonButton variant="contained" onClick={handleSave} text="Save" />
          </DialogActions>
        )}
      </Box>
    </Box>
  );
};

export default ClassificationForm;
