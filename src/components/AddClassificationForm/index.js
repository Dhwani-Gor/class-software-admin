"use client";

import { addClassificationSurvey, deleteClassificationSurvey, getAllClassificationSurveys, getAllClassificationSurveyType, getAllClients, getSingleClassificationSurveyDetails, getSurveyReportData, updateClassificationSurvey } from "@/api";
import { Box, DialogActions, FormControl, Grid, Grid2, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { addYears, subMonths, format } from "date-fns";
import { useEffect, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";
import CommonButton from "../CommonButton";
import { toast } from "react-toastify";

const ClassificationForm = ({ mode = "create", variableId = null, selectedShip, onSuccess }) => {
  const [classificationRows, setClassificationRows] = useState([]);
  console.log(classificationRows, "classificationRows");

  const [clientsList, setClientsList] = useState([]);
  const [cancelled, setCancelled] = useState(false);
  const [surveyTypes, setSurveyTypes] = useState([]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [existingSurveys, setExistingSurveys] = useState([]);
  console.log(existingSurveys, "existingSurveys");

  const createEmptyRow = () => ({
    surveyName: "",
    surveyDate: "",
    issuanceDate: "",
    dueDate: "",
    rangeFrom: "",
    rangeTo: "",
    postponed: "",
  });

  const getAllClassification = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllClassification();
  }, [selectedShip?.id]);

  // Fetch survey types dynamically from API
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
      const result = new Date(date);
      result.setFullYear(result.getFullYear() + years);
      return result;
    };

    const addMonths = (date, months) => {
      const result = new Date(date);
      result.setMonth(result.getMonth() + months);
      return result;
    };

    const formatDate = (date) => {
      return date.toISOString().split("T")[0];
    };

    const findSpecialSurveyHull = () => existingSurveys.find((survey) => survey.surveyName?.trim().toLowerCase() === "special survey hull" && survey.surveyDate);

    const findDockingSurvey = () => existingSurveys.find((survey) => survey.surveyName?.trim().toLowerCase() === "docking survey" && survey.surveyDate);

    switch (surveyName) {
      case "Special Survey Hull":
      case "Special Survey Machinery":
      case "Continuous survey Hull":
      case "Continuous survey Machinery":
      case "Special Survey IG system":
      case "Special Survey (Fi-Fi)":
        dueDate = addYears(issuanceDateObj, 5);
        rangeFrom = addMonths(dueDate, -3);
        rangeTo = addMonths(dueDate, 3);
        break;

      case "Annual Survey": {
        // Find the last annual survey (latest dueDate)
        const lastAnnualSurvey = existingSurveys.filter((s) => s.surveyName?.trim().toLowerCase() === "annual survey" && s.dueDate).sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0]; // sort descending // take latest

        if (lastAnnualSurvey) {
          // Base next due date on last Annual Survey
          const lastDue = new Date(lastAnnualSurvey.dueDate);
          dueDate = addYears(lastDue, 1);
        } else {
          // If no previous annual survey, fall back to SSH or issuance date
          const specialSurveyHull = findSpecialSurveyHull();
          if (specialSurveyHull?.surveyDate) {
            const sshDate = new Date(specialSurveyHull.surveyDate);
            dueDate = addYears(sshDate, 1);
          } else {
            dueDate = addYears(issuanceDateObj, 1);
          }
        }

        rangeFrom = addMonths(dueDate, -3);
        rangeTo = addMonths(dueDate, 3);
        break;
      }

      case "Annual Survey (UMS)": {
        const specialSurveyUMS = existingSurveys.find((s) => s.surveyName?.trim().toLowerCase() === "special survey (ums)" && s.surveyDate);

        if (specialSurveyUMS && specialSurveyUMS.surveyDate) {
          const sshDate = new Date(specialSurveyUMS.surveyDate);
          const currentYear = new Date().getFullYear();

          let nextAnniversary = new Date(currentYear, sshDate.getMonth(), sshDate.getDate());

          if (new Date() > nextAnniversary) {
            nextAnniversary.setFullYear(currentYear + 1);
          }

          dueDate = nextAnniversary;
        } else {
          dueDate = addYears(issuanceDateObj, 1);
        }

        rangeFrom = addMonths(dueDate, -3);
        rangeTo = addMonths(dueDate, 3);
        break;
      }

      case "Annual Survey IG System": {
        const specialSurveyIG = existingSurveys.find((s) => s.surveyName?.trim().toLowerCase() === "special survey ig system" && s.surveyDate);

        if (specialSurveyIG && specialSurveyIG.surveyDate) {
          const sshDate = new Date(specialSurveyIG.surveyDate);
          const currentYear = new Date().getFullYear();

          let nextAnniversary = new Date(currentYear, sshDate.getMonth(), sshDate.getDate());

          if (new Date() > nextAnniversary) {
            nextAnniversary.setFullYear(currentYear + 1);
          }

          dueDate = nextAnniversary;
        } else {
          dueDate = addYears(issuanceDateObj, 1);
        }

        rangeFrom = addMonths(dueDate, -3);
        rangeTo = addMonths(dueDate, 3);
        break;
      }

      case "Annual Survey (Fi-Fi)": {
        const specialSurveyFiFi = existingSurveys.find((s) => s.surveyName?.trim().toLowerCase() === "special survey (fi-fi)" && s.surveyDate);

        if (specialSurveyFiFi && specialSurveyFiFi.surveyDate) {
          const sshDate = new Date(specialSurveyFiFi.surveyDate);
          const currentYear = new Date().getFullYear();

          let nextAnniversary = new Date(currentYear, sshDate.getMonth(), sshDate.getDate());

          if (new Date() > nextAnniversary) {
            nextAnniversary.setFullYear(currentYear + 1);
          }

          dueDate = nextAnniversary;
        } else {
          dueDate = addYears(issuanceDateObj, 1);
        }

        rangeFrom = addMonths(dueDate, -3);
        rangeTo = addMonths(dueDate, 3);
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

            let secondDockingDue = addMonths(firstDockingDue, 30);

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
          dueDate = addYears(issuanceDateObj, 3);
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
        } else {
          dueDate = "";
          rangeFrom = "";
          rangeTo = "";
        }
        break;
      }
      case "Telshaft condition monitoring annual survey": {
        const specialSurveyHull = findSpecialSurveyHull();
        if (specialSurveyHull && specialSurveyHull.surveyDate) {
          const sshDate = new Date(specialSurveyHull.surveyDate);
          dueDate = addYears(sshDate, 1);

          rangeFrom = addMonths(dueDate, -3);
          rangeTo = addMonths(dueDate, 3);
        } else {
          dueDate = "";
          rangeFrom = "";
          rangeTo = "";
        }
        break;
      }
      case "Tailshaft initial survey":
      case "Telshaft periodical survey":
        dueDate = addYears(issuanceDateObj, 5);
        rangeFrom = "";
        rangeTo = "";
        break;

      default:
        dueDate = "";
        rangeFrom = "";
        rangeTo = "";
        break;
    }

    return {
      dueDate: formatDate(dueDate),
      rangeFrom: rangeFrom ? formatDate(rangeFrom) : "",
      rangeTo: rangeTo ? formatDate(rangeTo) : "",
    };
  };

  const calculateDockingSurveySequence = (firstDockingDate, sshData) => {
    const firstDate = new Date(firstDockingDate);
    const surveys = [];

    // Calculate for 5 years span (2 docking surveys in 5 years)
    for (let i = 1; i <= 2; i++) {
      const nextSurveyDate = new Date(firstDate);
      nextSurveyDate.setFullYear(firstDate.getFullYear() + i * 2.5); // Every 2.5 years approximately

      // Ensure it falls within SSH range if available
      if (sshData && sshData.dueDate) {
        const sshDueDate = new Date(sshData.dueDate);
        if (nextSurveyDate > sshDueDate) {
          nextSurveyDate.setTime(sshDueDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days before SSH due
        }
      }

      surveys.push({
        surveyNumber: i + 1,
        dueDate: nextSurveyDate.toISOString().split("T")[0],
        description: `Docking Survey ${i + 1}`,
      });
    }

    return surveys;
  };

  const handleChange = (section, index, field, value) => {
    const updatedRows = [...classificationRows];
    updatedRows[index][field] = value;

    if (field === "surveyName" || field === "issuanceDate") {
      const issuance = updatedRows[index].issuanceDate || new Date().toISOString().split("T")[0];
      const { dueDate, rangeFrom, rangeTo } = calculateDates(issuance, updatedRows[index].surveyName, existingSurveys);
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

  const fetchClients = async () => {
    try {
      setLoading(true);
      const result = await getAllClients();
      if (result?.status === 200) {
        setClientsList(result.data.data);
      } else {
        toast.error(result?.message);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  const getClassification = async () => {
    try {
      setLoading(true);
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

  const handleClientChange = (event) => {
    const selectedId = event.target.value;
    const selectedClient = clientsList.find((client) => client.id === selectedId);
    setSelectedShip({
      id: selectedId,
      shipName: selectedClient ? selectedClient.shipName : "",
    });
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

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <Box spacing={2} sx={{ marginTop: "2rem", width: "100%" }}>
      <Box sx={{ borderRadius: "15px" }}>
        <Box>
          {mode === "create" && (
            <Box>
              {/* <FormControl fullWidth sx={{ maxWidth: 300 }}>
                  <Typography variant="h6" mb={1}>
                    Select Client
                  </Typography>
                  <Select
                    value={selectedShip.id}
                    onChange={handleClientChange}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select Client
                    </MenuItem>
                    {clientsList.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.shipName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl> */}
            </Box>
          )}
        </Box>

        {selectedShip?.id && (
          <Box sx={{ m: 0, p: 0 }}>
            <Typography variant="h6">Classification Surveys</Typography>

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
                  {mode !== "update" && (
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
