"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  IconButton,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { addYears, subMonths, format } from "date-fns";
import { useRouter } from "next/navigation";
import moment from "moment";
import CommonButton from "../CommonButton";
import DeleteIcon from "@mui/icons-material/Delete";

const surveyTypes = [
  { "label": "Special Survey Hull", "value": "special_survey_hull" },
  { "label": "Special Survey Machinery", "value": "special_survey_machinery" },
  { "label": "Continuous survey Hull", "value": "continuous_survey_hull" },
  { "label": "Continuous survey Machinery", "value": "continuous_survey_machinery" },
  { "label": "Annual Survey", "value": "annual_survey" },
  { "label": "Docking Survey", "value": "docking_survey" },
  { "label": "In Water Survey", "value": "in_water_survey" },
  { "label": "Special Survey (UMS)", "value": "special_survey_ums" },
  { "label": "Annual Survey (UMS)", "value": "annual_survey_ums" },
  { "label": "Special Survey IG system", "value": "special_survey_ig_system" },
  { "label": "Annual Survey IG System", "value": "annual_survey_ig_system" },
  { "label": "Special Survey (Fi-Fi)", "value": "special_survey_fi_fi" },
  { "label": "Annual Survey (Fi-Fi)", "value": "annual_survey_fi_fi" },
  { "label": "Intermediate survey", "value": "intermediate_survey" },
  { "label": "Telshaft initial survey", "value": "telshaft_initial_survey" },
  { "label": "Telshaft renewal survey", "value": "telshaft_renewal_survey" },
  { "label": "Telshaft periodical survey", "value": "telshaft_periodical_survey" },
  { "label": "Telshaft condition monitoring annual survey", "value": "telshaft_condition_monitoring_annual_survey" },
  { "label": "Main Boiler survey", "value": "main_boiler_survey" },
  { "label": "Auxiliary Boiler survey", "value": "auxiliary_boiler_survey" },
  { "label": "Thermal Oil Heating Systems Survey", "value": "thermal_oil_heating_systems_survey" },
  { "label": "Exhaust Gas steam generators and economisers survey", "value": "exhaust_gas_steam_generators_and_economisers_survey" }
]

export default function SurveyDialog({ open, onClose, update, surveyData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const populateClassificationRows = (surveyDataList) => {
    if (!surveyDataList || surveyDataList.length === 0) return [createEmptyRow()];
  
    return surveyDataList.map((survey) => {
      const surveyName = survey.activity?.surveyTypes?.name || "";
      const surveyDate = survey.surveyDate ? format(new Date(survey.surveyDate), "yyyy-MM-dd") : "";
      const issuanceDate = survey.issuanceDate ? format(new Date(survey.issuanceDate), "yyyy-MM-dd") : "";
  
      let dueDate = "";
      let rangeDate = "";
  
      if (issuanceDate) {
        const { dueDate: d, rangeDate: r } = calculateDates(issuanceDate);
        dueDate = d;
        rangeDate = r;
      }
  
      return {
        surveyName,
        surveyDate,
        issuanceDate,
        dueDate,
        rangeDate,
        postponedDate: "",
      };
    });
  };
  
  const populateStatutoryRows = (surveyDataList) => {
    if (!surveyDataList || surveyDataList.length === 0) return [createEmptyRow()];
  
    return surveyDataList.map((survey) => {
      const surveyName = survey.activity?.surveyTypes?.report?.name || "";
      const surveyDate = survey.surveyDate ? format(new Date(survey.surveyDate), "yyyy-MM-dd") : "";
      const issuanceDate = survey.issuanceDate ? format(new Date(survey.issuanceDate), "yyyy-MM-dd") : "";
  
      let dueDate = "";
      let rangeDate = "";
  
      if (issuanceDate) {
        const { dueDate: d, rangeDate: r } = calculateDates(issuanceDate);
        dueDate = d;
        rangeDate = r;
      }
  
      return {
        surveyName,
        surveyDate,
        issuanceDate,
        dueDate,
        rangeDate,
        postponedDate: "",
      };
    });
  };
 
  useEffect(() => {
    setLoading(true);
    if (surveyData && surveyData.length > 0) {
      const statutory = populateStatutoryRows(surveyData);
      setStatutoryRows(statutory);
    }
    setLoading(false);
  }, [surveyData]);


  const handleDeleteRow = (section, index) => {
    if (section === "classification") {
      const updated = [...classificationRows];
      updated.splice(index, 1);
      setClassificationRows(updated.length ? updated : [createEmptyRow()]);
    } else {
      const updated = [...statutoryRows];
      updated.splice(index, 1);
      setStatutoryRows(updated.length ? updated : [createEmptyRow()]);
    }
  };

  useEffect(() => {
    if (surveyData && surveyData.length > 0) {
      const classification = populateClassificationRows(surveyData);
      setClassificationRows(classification);
    }
  }, [surveyData]);

  const createEmptyRow = () => ({
    surveyName: "",
    surveyDate: "",
    issuanceDate: "",
    dueDate: "",
    rangeDate: "",
    postponedDate: "",
  });

  const [classificationRows, setClassificationRows] = useState([createEmptyRow()]);
  const [statutoryRows, setStatutoryRows] = useState([createEmptyRow()]);

  const calculateDates = (issuanceDate) => {
    if (!issuanceDate) return { dueDate: "", rangeDate: "" };
  
    const issuanceDateObj = new Date(issuanceDate);
    const dueDateObj = addYears(issuanceDateObj, 5);
    const rangeDateObj = surveyData?.typeOfCertificate === "full_term" ? subMonths(dueDateObj, 6) : subMonths(dueDateObj, 3);
  
    return {
      dueDate: format(dueDateObj, "yyyy-MM-dd"),
      rangeDate: format(rangeDateObj, "yyyy-MM-dd"),
    };
  };
  

  const handleChange = (section, index, field, value) => {
    const updatedRows = section === "classification" ? [...classificationRows] : [...statutoryRows];
    updatedRows[index][field] = value;
  
    if (field === "issuanceDate") {
      const { dueDate, rangeDate } = calculateDates(value);
      updatedRows[index].dueDate = dueDate;
      updatedRows[index].rangeDate = rangeDate;
    }
  
    if (section === "classification") {
      setClassificationRows(updatedRows);
    } else {
      setStatutoryRows(updatedRows);
    }
  };

  const addRow = (section) => {
    if (section === "classification") {
      setClassificationRows([...classificationRows, createEmptyRow()]);
    } else {
      setStatutoryRows([...statutoryRows, createEmptyRow()]);
    }
  };


  const handleSave = () => {
    router.push(`/survey-report/${update}`);
    onClose();
  };

  useEffect(() => {
    localStorage.setItem("classification", JSON.stringify(classificationRows));
  }, [classificationRows]);
  
  useEffect(() => {
    localStorage.setItem("statutory", JSON.stringify(statutoryRows));
  }, [statutoryRows]);
  
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Survey Details</DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="h6">Classification Surveys</Typography>
          <IconButton onClick={() => addRow("classification")} size="small">
            <AddIcon />
          </IconButton>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Survey Name</TableCell>
                  <TableCell>Survey Date</TableCell>
                  <TableCell>Assignment Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Range (Date)</TableCell>
                  <TableCell>Postponed (Date)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classificationRows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                    {row.surveyName}

                      <FormControl fullWidth size="small">
                        <InputLabel>Survey Type</InputLabel>
                        <Select
                          value={row.surveyName}
                          label="Survey Type"
                          onChange={(e) => handleChange("classification", index, "surveyName", e.target.value)}
                        >
                          {surveyTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        value={row.surveyDate}
                        onChange={(e) => handleChange("classification", index, "surveyDate", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        value={row.issuanceDate}
                        onChange={(e) => handleChange("classification", index, "issuanceDate", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.dueDate ? moment(row.dueDate).format("DD/MM/YYYY") : ""}
                        InputProps={{ readOnly: true }}
                        placeholder="Assignment Date + 5 years"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.rangeDate ? moment(row.rangeDate).format("DD/MM/YYYY") : ""}
                        InputProps={{ readOnly: true }}
                        placeholder="Due Date - 3 months"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        value={row.postponedDate}
                        onChange={(e) => handleChange("classification", index, "postponedDate", e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleDeleteRow("classification", index)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box mb={3}>
          <Typography variant="h6">Statutory Surveys</Typography>
          <IconButton onClick={() => addRow("statutory")} size="small">
            <AddIcon />
          </IconButton>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Survey Name</TableCell>
                  <TableCell>Survey Date</TableCell>
                  <TableCell>Assignment Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Range (Date)</TableCell>
                  <TableCell>Postponed (Date)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statutoryRows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        title={row.surveyName}
                        value={row.surveyName}
                        disabled
                        onChange={(e) => handleChange("statutory", index, "surveyName", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        value={row.surveyDate}
                        title={row.surveyDate}
                        disabled
                        onChange={(e) => handleChange("statutory", index, "surveyDate", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        value={row.issuanceDate}
                        title={row.issuanceDate}
                        disabled
                        onChange={(e) => handleChange("statutory", index, "issuanceDate", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={moment(row.dueDate).format("DD/MM/YYYY")}
                        InputProps={{ readOnly: true }}
                        placeholder="Assignment Date + 5 years"
                        title={row.dueDate}
                        disabled
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={moment(row.rangeDate).format("DD/MM/YYYY")}
                        InputProps={{ readOnly: true }}
                        placeholder="Due Date - 3 months"
                        title={row.rangeDate}
                        disabled
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        value={row.postponedDate}
                        title={row.postponedDate}
                        disabled
                        onChange={(e) => handleChange("statutory", index, "postponedDate", e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      <DialogActions>
        <CommonButton variant="outlined" onClick={onClose} text="Cancel" />
        <CommonButton variant="contained" onClick={handleSave} text="Save" />
      </DialogActions>
    </Dialog>
  );
}
