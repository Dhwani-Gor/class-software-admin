"use client";

import { addClassificationSurvey, deleteClassificationSurvey, getAllClassificationSurveys, getAllClassificationSurveyType, getAllClients, getSingleClassificationSurveyDetails, getSurveyReportData, updateClassificationSurvey } from "@/api";
import { Box, DialogActions, FormControl, Grid2, IconButton, InputLabel, MenuItem, Select, TextField, Typography, Alert } from "@mui/material";
import { useEffect, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";
import CommonButton from "../CommonButton";
import { toast } from "react-toastify";

const ClassificationForm = ({ mode = "create", variableId = null, selectedShip, onSuccess }) => {
  const [classificationRows, setClassificationRows] = useState([]);
  const [cancelled, setCancelled] = useState(false);
  const [surveyTypes, setSurveyTypes] = useState([]);
  const [existingSurveys, setExistingSurveys] = useState([]);
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

  const calculateDates = (issuanceDate, surveyName, existingSurveys = []) => {
    if (!issuanceDate) return { dueDate: "", rangeFrom: "", rangeTo: "" };

    const issuanceDateObj = new Date(issuanceDate);
    let dueDate, rangeFrom, rangeTo;

    const addYears = (date, years) => {
      if (!date) return null;
      try {
        const result = new Date(date);
        if (isNaN(result.getTime())) return null;
        result.setFullYear(result.getFullYear() + years);
        return result;
      } catch (error) {
        console.error("Error adding years:", error);
        return null;
      }
    };

    const addMonths = (date, months) => {
      if (!date) return null;
      try {
        const result = new Date(date);
        if (isNaN(result.getTime())) return null;
        result.setMonth(result.getMonth() + months);
        return result;
      } catch (error) {
        console.error("Error adding months:", error);
        return null;
      }
    };

    const formatDate = (date) => {
      if (!date) return "";

      try {
        let dateObj;

        if (date instanceof Date) {
          dateObj = date;
        } else if (typeof date === "string") {
          dateObj = new Date(date);
        } else if (typeof date === "number") {
          dateObj = new Date(date);
        } else {
          return "";
        }

        if (isNaN(dateObj.getTime())) {
          return "";
        }

        return dateObj.toISOString().split("T")[0];
      } catch (error) {
        console.error("Error formatting date:", error, "Input:", date);
        return "";
      }
    };

    const findSpecialSurveyHull = () => existingSurveys.find((survey) => survey.surveyName?.trim().toLowerCase() === "special survey hull" && survey.surveyDate);

    const findDockingSurvey = () => existingSurveys.find((survey) => survey.surveyName?.trim().toLowerCase() === "docking survey" && survey.surveyDate);

    switch (surveyName) {
      case "Special Survey Hull":
      case "Special Survey Machinery":
      case "Continuous survey Hull":
      case "Continuous survey Machinery":
      case "Special Survey IG system":
      case "Special Survey Machinery":
      case "Special Survey (Fi-Fi)":
        dueDate = addYears(issuanceDateObj, 5);
        rangeFrom = addMonths(dueDate, -3);
        rangeTo = addMonths(dueDate, 3);
        break;

      case "Annual Survey":
      case "Annual Survey IG System":
      case "Annual Survey (FIFI)":
      case "Annual Survey (UMS)": {
        const surveyNameLower = surveyName.toLowerCase();

        const lastAnnualSurvey = existingSurveys.filter((s) => s.surveyName?.toLowerCase().includes("annual survey") && s.surveyName?.toLowerCase() === surveyNameLower && s.dueDate).sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0];

        if (lastAnnualSurvey) {
          const lastDue = new Date(lastAnnualSurvey.dueDate);
          dueDate = addYears(lastDue, 1);
        } else {
          let relatedSpecialSurveyName = "";

          if (surveyNameLower.includes("ig system")) {
            relatedSpecialSurveyName = "special survey ig system";
          } else if (surveyNameLower.includes("fifi")) {
            relatedSpecialSurveyName = "special survey fifi";
          } else if (surveyNameLower.includes("ums")) {
            relatedSpecialSurveyName = "special survey ums";
          } else {
            relatedSpecialSurveyName = "special survey hull";
          }

          const relatedSpecialSurvey = existingSurveys.find((s) => s.surveyName?.trim().toLowerCase() === relatedSpecialSurveyName);

          if (relatedSpecialSurvey?.surveyDate) {
            const baseDate = new Date(relatedSpecialSurvey.surveyDate);
            dueDate = addYears(baseDate, 1);
          } else {
            dueDate = addYears(issuanceDateObj, 1);
          }
        }

        if (dueDate) {
          rangeFrom = addMonths(dueDate, -3);
          rangeTo = addMonths(dueDate, 3);
        }
        break;
      }

      case "Main Boiler Survey":
      case "Auxiliary Boiler Survey":
      case "Thermal Oil Heating Systems Survey":
      case "Exhaust Gas steam generators and economisers survey": {
        const specialSurveyHull = findSpecialSurveyHull();
        const currentSurveyType = surveyName.toLowerCase();
        const existingCurrentSurveys = existingSurveys.filter((s) => s.surveyName?.trim().toLowerCase() === currentSurveyType && s.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (specialSurveyHull && specialSurveyHull.surveyDate) {
          const sshDate = new Date(specialSurveyHull.surveyDate);
          const sshDueDate = addYears(sshDate, 5);

          if (existingCurrentSurveys.length === 0) {
            dueDate = addYears(sshDate, 3);
          } else if (existingCurrentSurveys.length === 1) {
            const firstSurveyDue = new Date(existingCurrentSurveys[0].dueDate);
            let secondSurveyDue = addYears(firstSurveyDue, 2);

            if (secondSurveyDue >= sshDueDate) {
              secondSurveyDue = addYears(firstSurveyDue, 1);
            }
            if (secondSurveyDue >= sshDueDate) {
              secondSurveyDue = addYears(firstSurveyDue, 1);
            }

            if (secondSurveyDue >= sshDueDate) {
              secondSurveyDue = addMonths(sshDueDate, -6);
            }

            dueDate = secondSurveyDue;
          } else {
            dueDate = addYears(issuanceDateObj, 2);
          }

          if (dueDate >= sshDueDate) {
            dueDate = addMonths(sshDueDate, -3);
          }
        } else {
          dueDate = addYears(issuanceDateObj, 1);
        }

        rangeFrom = dueDate;
        rangeTo = dueDate;
        break;
      }

      case "Docking Survey": {
        const specialSurveyHull = findSpecialSurveyHull();
        const existingDockingSurveys = existingSurveys.filter((s) => s.surveyName?.trim().toLowerCase() === "docking survey" && s.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (specialSurveyHull && specialSurveyHull.surveyDate) {
          const sshDate = new Date(specialSurveyHull.surveyDate);
          const sshDueDate = addYears(sshDate, 5);

          if (existingDockingSurveys.length === 0) {
            dueDate = addYears(sshDate, 3);
          } else if (existingDockingSurveys.length === 1) {
            const firstDockingDue = new Date(existingDockingSurveys[0].dueDate);
            let secondDockingDue = addYears(firstDockingDue, 2);

            if (secondDockingDue >= sshDueDate) {
              secondDockingDue = addYears(firstDockingDue, 1);
            }

            if (secondDockingDue >= sshDueDate) {
              secondDockingDue = addMonths(sshDueDate, -6);
            }

            dueDate = secondDockingDue;
          } else {
            dueDate = addYears(issuanceDateObj, 2);
          }

          if (dueDate >= sshDueDate) {
            dueDate = addMonths(sshDueDate, -3);
          }
        } else {
          dueDate = addYears(issuanceDateObj, 1);
        }

        rangeFrom = dueDate;
        rangeTo = dueDate;
        break;
      }

      case "In Water Survey":
        dueDate = addYears(issuanceDateObj, 3);
        rangeFrom = "";
        rangeTo = "";
        break;

      case "Special Survey (UMS)":
        dueDate = addYears(issuanceDateObj, 5);
        rangeFrom = addMonths(dueDate, -3);
        rangeTo = addMonths(dueDate, 3);
        break;

      case "Intermediate survey": {
        const specialSurveyHull = findSpecialSurveyHull();

        if (specialSurveyHull && specialSurveyHull.surveyDate) {
          const sshDate = new Date(specialSurveyHull.surveyDate);

          const intermediate2Years = addYears(sshDate, 2);
          const intermediate3Years = addYears(sshDate, 3);

          const targetDate = addMonths(sshDate, 30);
          const diff2 = Math.abs(intermediate2Years - targetDate);
          const diff3 = Math.abs(intermediate3Years - targetDate);

          dueDate = diff2 < diff3 ? intermediate2Years : intermediate3Years;

          rangeFrom = addMonths(dueDate, -3);
          rangeTo = addMonths(dueDate, 3);
        } else {
          dueDate = addYears(issuanceDateObj, 1);
          rangeFrom = addMonths(dueDate, -3);
          rangeTo = addMonths(dueDate, 3);
        }
        break;
      }

      case "Tailshaft condition monitoring annual survey": {
        const specialSurveyHull = findSpecialSurveyHull();
        if (specialSurveyHull && specialSurveyHull.surveyDate) {
          const sshDate = new Date(specialSurveyHull.surveyDate);
          dueDate = addYears(sshDate, 1);

          rangeFrom = addMonths(dueDate, -3);
          rangeTo = addMonths(dueDate, 3);
        } else {
          dueDate = addYears(issuanceDateObj, 1);
          rangeFrom = addMonths(dueDate, -3);
          rangeTo = addMonths(dueDate, 3);
        }
        break;
      }

      case "Tailshaft initial survey":
      case "Tailshaft periodical survey":
      case "Tailshaft renewal survey":
        if (issuanceDate) {
          dueDate = addYears(issuanceDateObj, 5);
        } else {
          const currentDate = new Date();
          dueDate = addYears(currentDate, 5);
        }
        rangeFrom = "";
        rangeTo = "";
        break;

      default:
        return { dueDate: "", rangeFrom: "", rangeTo: "" };
    }

    return {
      dueDate: dueDate ? formatDate(dueDate) : "",
      rangeFrom: rangeFrom ? formatDate(rangeFrom) : "",
      rangeTo: rangeTo ? formatDate(rangeTo) : "",
    };
  };

  const handleChange = (section, index, field, value) => {
    const updatedRows = [...classificationRows];
    updatedRows[index][field] = value;

    if (field === "surveyName") {
      checkAndShowSSHWarning(value);
    }

    if (field === "surveyName" || field === "issuanceDate") {
      const { dueDate, rangeFrom, rangeTo } = calculateDates(updatedRows[index].issuanceDate || new Date().toISOString().split("T")[0], updatedRows[index].surveyName, existingSurveys);
      updatedRows[index].dueDate = dueDate;
      updatedRows[index].rangeFrom = rangeFrom;
      updatedRows[index].rangeTo = rangeTo;
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
    } finally {
      setLoading(false);
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
