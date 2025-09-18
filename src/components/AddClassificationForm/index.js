"use client";
import {
  addClassificationSurvey,
  deleteClassificationSurvey,
  getAllClassificationSurveys,
  getAllClassificationSurveyType,
  getAllClients,
  getSingleClassificationSurveyDetails,
  getSurveyReportData,
  updateClassificationSurvey,
} from "@/api";
import {
  Box,
  DialogActions,
  FormControl,
  Grid,
  Grid2,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { addYears, subMonths, format } from "date-fns";
import { useEffect, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";
import CommonButton from "../CommonButton";
import { toast } from "react-toastify";

// const surveyTypes = [
//   { label: "Special Survey Hull", value: "special_survey_hull" },
//   { label: "Special Survey Machinery", value: "special_survey_machinery" },
//   { label: "Continuous survey Hull", value: "continuous_survey_hull" },
//   {
//     label: "Continuous survey Machinery",
//     value: "continuous_survey_machinery",
//   },
//   { label: "Annual Survey", value: "annual_survey" },
//   { label: "Docking Survey", value: "docking_survey" },
//   { label: "In Water Survey", value: "in_water_survey" },
//   { label: "Special Survey (UMS)", value: "special_survey_ums" },
//   { label: "Annual Survey (UMS)", value: "annual_survey_ums" },
//   { label: "Special Survey IG system", value: "special_survey_ig_system" },
//   { label: "Annual Survey IG System", value: "annual_survey_ig_system" },
//   { label: "Special Survey (Fi-Fi)", value: "special_survey_fi_fi" },
//   { label: "Annual Survey (Fi-Fi)", value: "annual_survey_fi_fi" },
//   { label: "Intermediate survey", value: "intermediate_survey" },
//   {
//     label: "Tail Shaft condition monitoring annual survey",
//     value: "tailshaft_condition_monitoring_annual_survey",
//   },
//   { label: "Main Boiler survey", value: "main_boiler_survey" },
//   {
//     label: "Thermal Oil Heating Systems Survey",
//     value: "thermal_oil_heating_systems_survey",
//   },
//   {
//     label: "Exhaust Gas steam generators and economisers survey",
//     value: "exhaust_gas_steam_generators_and_economisers_survey",
//   },
//   { label: "Special Survey", value: "special_survey" },
//   { label: "Bottom Survey", value: "bottom_survey" },
//   { label: "Auxiliary Boiler Survey (OF)", value: "boiler_survey_of" },
//   { label: "Auxiliary Boiler Survey (EXH)", value: "boiler_survey_exh" },
//   { label: "Auxiliary Boiler Survey (OF) P", value: "boiler_survey_of_p" },
//   { label: "Auxiliary Boiler Survey (OF) S", value: "boiler_survey_of_s" },
//   { label: "Tail Shaft Survey", value: "tailshaft_survey" },
//   { label: "Cargo Gear Survey - annual", value: "cargo_gear_survey_annual" },
//   { label: "Cargo Gear Survey - renewal", value: "cargo_gear_survey_renewal" },
// ];

const ClassificationForm = ({
  mode = "create",
  variableId = null,
  selectedShip,
  onSuccess,
}) => {
  const [classificationRows, setClassificationRows] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [cancelled, setCancelled] = useState(false);
  const [surveyTypes,setSurveyTypes] = useState([])
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const createEmptyRow = () => ({
    surveyName: "",
    surveyDate: "",
    issuanceDate: "",
    dueDate: "",
    rangeFrom: "",
    rangeTo: "",
    postponed: "",
  });

  const fetchAllSurveyTypes = async() => {
    try{
      const response = await getAllClassificationSurveyType();
     if(response?.data?.status === "success"){
      let temp = [] 
      response?.data?.data?.forEach((ele,index) => {
        temp.push({
          label:ele?.name,
          value:ele?.value
        })
      })
      setSurveyTypes(temp)
     }
    }catch(e){
      console.log(e)
    }
  }

  useEffect(() => {
    fetchAllSurveyTypes()
  },[])

  const calculateDates = (issuanceDate) => {
    if (!issuanceDate) return { dueDate: "", rangeFrom: "", rangeTo: "" };

    const issuanceDateObj = new Date(issuanceDate);
    const dueDateObj = addYears(issuanceDateObj, 5);
    const rangeFromObj = subMonths(dueDateObj, 3);
    const rangeToPlus3 = addYears(subMonths(issuanceDateObj, -3), 5);

    return {
      dueDate: format(dueDateObj, "yyyy-MM-dd"),
      rangeFrom: format(rangeFromObj, "yyyy-MM-dd"),
      rangeTo: format(rangeToPlus3, "yyyy-MM-dd"),
    };
  };

  const handleChange = (section, index, field, value) => {
    const updatedRows = [...classificationRows];
    updatedRows[index][field] = value;

    if (field === "issuanceDate") {
      const { dueDate, rangeFrom, rangeTo } = calculateDates(value);
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

        const { dueDate, rangeFrom, rangeTo } = calculateDates(
          data.issuanceDate
        );

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
        // setSelectedShip({
        //   id: data.clientId,
        //   shipName: data.client?.shipName || "",
        // });
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

        const response = await updateClassificationSurvey(
          variableId,
          updatedData
        );
        if (response?.data?.status === "success") {
          toast.success("Classification updated successfully");
          onSuccess?.(); // ✅ trigger callback

          //   router.push(`/classification?id=${selectedShip.id}`);
        }
        if (response?.response?.data?.status == "error") {
          toast.error(
            response?.response?.data?.message ||
              "Failed to update classification"
          );
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
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  const handleClientChange = (event) => {
    const selectedId = event.target.value;
    const selectedClient = clientsList.find(
      (client) => client.id === selectedId
    );
    setSelectedShip({
      id: selectedId,
      shipName: selectedClient ? selectedClient.shipName : "",
    });
  };

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
                <Grid2
                  container
                  spacing={0.5}
                  marginTop={2.5}
                  alignItems="center"
                >
                  {/* Survey Type */}
                  <Grid2 size={{ xs: 12, md: 1.6 }}>
                    <FormControl fullWidth>
                      <InputLabel id={`survey-type-label-${index}`}>
                        Survey Type
                      </InputLabel>
                      <Select
                        labelId={`survey-type-label-${index}`}
                        id={`survey-type-${index}`}
                        value={row.surveyName || ""}
                        label="Survey Type"
                        onChange={(e) =>
                          handleChange(
                            "classification",
                            index,
                            "surveyName",
                            e.target.value
                          )
                        }
                      >
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
                    <TextField
                      label="Survey Date"
                      type="date"
                      // onBlur={(e) => {
                      //   const formatted = moment(e.target.value).format(
                      //     "DD/MM/YYYY"
                      //   );
                      //   console.log("Display format:", formatted);
                      // }}
                      fullWidth
                      value={
                        row.surveyDate
                          ? moment(row.surveyDate).format("YYYY-MM-DD")
                          : ""
                      }
                      onChange={(e) =>
                        handleChange(
                          "classification",
                          index,
                          "surveyDate",
                          e.target.value
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid2>

                  {/* Issuance Date */}
                  <Grid2 size={{ xs: 12, md: 1.7 }}>
                    <TextField
                      label="Assignment Date"
                      type="date"
                      fullWidth
                      value={
                        row.issuanceDate
                          ? moment(row.issuanceDate).format("YYYY-MM-DD")
                          : ""
                      }
                      onChange={(e) =>
                        handleChange(
                          "classification",
                          index,
                          "issuanceDate",
                          e.target.value
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid2>

                  {/* Due Date */}
                  <Grid2 size={{ xs: 12, md: 1.7 }}>
                    <TextField
                      label="Due Date"
                      type="date"
                      fullWidth
                      value={
                        row.dueDate
                          ? moment(row.dueDate).format("YYYY-MM-DD")
                          : ""
                      }
                      onChange={(e) =>
                        handleChange(
                          "classification",
                          index,
                          "dueDate",
                          e.target.value
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid2>

                  {/* Range From */}
                  <Grid2 size={{ xs: 12, md: 1.7 }}>
                    <TextField
                      label="Range From"
                      type="date"
                      fullWidth
                      value={
                        row.rangeFrom
                          ? moment(row.rangeFrom).format("YYYY-MM-DD")
                          : ""
                      }
                      onChange={(e) =>
                        handleChange(
                          "classification",
                          index,
                          "rangeFrom",
                          e.target.value
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid2>

                  {/* Range To */}
                  <Grid2 size={{ xs: 12, md: 1.7 }}>
                    <TextField
                      label="Range To"
                      type="date"
                      fullWidth
                      value={
                        row.rangeTo
                          ? moment(row.rangeTo).format("YYYY-MM-DD")
                          : ""
                      }
                      onChange={(e) =>
                        handleChange(
                          "classification",
                          index,
                          "rangeTo",
                          e.target.value
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid2>

                  {/* Postponed Date */}
                  <Grid2 size={{ xs: 12, md: 1.7 }}>
                    <TextField
                      label="Postponed Date"
                      type="date"
                      fullWidth
                      value={
                        row.postponed
                          ? moment(row.postponed).format("YYYY-MM-DD")
                          : ""
                      }
                      onChange={(e) =>
                        handleChange(
                          "classification",
                          index,
                          "postponed",
                          e.target.value
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid2>

                  {/* Delete button */}
                  {mode !== "update" && (
                    <Grid2
                      size={{ xs: 12, md: 0.2 }}
                      display="flex"
                      justifyContent="center"
                    >
                      <IconButton
                        onClick={() => handleDeleteRow(index)}
                        color="error"
                        size="small"
                        sx={{ mr: -1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid2>
                  )}
                </Grid2>
              </Box>
            ))}

            {(mode !== "update" || cancelled) && (
              <CommonButton
                style={{ marginTop: "1.5rem" }}
                variant="contained"
                onClick={addRow}
                text="Add Classification Surveys"
              />
            )}
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
            <CommonButton
              variant="contained"
              onClick={handleSave}
              text="Save"
            />
          </DialogActions>
        )}
      </Box>
    </Box>
  );
};

export default ClassificationForm;
