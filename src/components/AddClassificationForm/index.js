"use client";
import {
    addClassificationSurvey,
    deleteClassificationSurvey,
    getAllClassificationSurveys,
    getAllClients,
    getSingleClassificationSurveyDetails,
    getSurveyReportData,
    updateClassificationSurvey
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
    Typography
} from "@mui/material";
import { useRouter } from "next/navigation";
import { addYears, subMonths, format } from "date-fns";
import { useEffect, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";
import CommonButton from "../CommonButton";

const surveyTypes = [
    { label: "Special Survey Hull", value: "special_survey_hull" },
    { label: "Special Survey Machinery", value: "special_survey_machinery" },
    { label: "Continuous survey Hull", value: "continuous_survey_hull" },
    { label: "Continuous survey Machinery", value: "continuous_survey_machinery" },
    { label: "Annual Survey", value: "annual_survey" },
    { label: "Docking Survey", value: "docking_survey" },
    { label: "In Water Survey", value: "in_water_survey" },
    { label: "Special Survey (UMS)", value: "special_survey_ums" },
    { label: "Annual Survey (UMS)", value: "annual_survey_ums" },
    { label: "Special Survey IG system", value: "special_survey_ig_system" },
    { label: "Annual Survey IG System", value: "annual_survey_ig_system" },
    { label: "Special Survey (Fi-Fi)", value: "special_survey_fi_fi" },
    { label: "Annual Survey (Fi-Fi)", value: "annual_survey_fi_fi" },
    { label: "Intermediate survey", value: "intermediate_survey" },
    { label: "Telshaft initial survey", value: "telshaft_initial_survey" },
    { label: "Telshaft renewal survey", value: "telshaft_renewal_survey" },
    { label: "Telshaft periodical survey", value: "telshaft_periodical_survey" },
    { label: "Telshaft condition monitoring annual survey", value: "telshaft_condition_monitoring_annual_survey" },
    { label: "Main Boiler survey", value: "main_boiler_survey" },
    { label: "Auxiliary Boiler survey", value: "auxiliary_boiler_survey" },
    { label: "Thermal Oil Heating Systems Survey", value: "thermal_oil_heating_systems_survey" },
    { label: "Exhaust Gas steam generators and economisers survey", value: "exhaust_gas_steam_generators_and_economisers_survey" }
];

const ClassificationForm = ({ mode = "create", variableId = null }) => {
    const [clientsList, setClientsList] = useState([]);
    const [selectedShip, setSelectedShip] = useState({ id: "", shipName: "" });
    const [classificationRows, setClassificationRows] = useState([]);

    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const createEmptyRow = () => ({
        surveyName: "",
        surveyDate: "",
        issuanceDate: "",
        dueDate: "",
        rangeFrom: "",
        rangeTo: "",
        postponed: ""
    });

    const calculateDates = (issuanceDate) => {
        if (!issuanceDate) return { dueDate: "", rangeFrom: "", rangeTo: "" };
    
        const issuanceDateObj = new Date(issuanceDate);
        const dueDateObj = addYears(issuanceDateObj, 5);
        const rangeFromObj = subMonths(dueDateObj, 3);
        const rangeToPlus3 = addYears(subMonths(issuanceDateObj, -3), 5);
    
        return {
            dueDate: format(dueDateObj, "yyyy-MM-dd"),
            rangeFrom: format(rangeFromObj, "yyyy-MM-dd"),
            rangeTo: format(rangeToPlus3, "yyyy-MM-dd")
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
        router.push(`/classification?id=${selectedShip.id}`);
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
            
            if(variableId == null) return;
            const result = await getSingleClassificationSurveyDetails(variableId);
            if (result?.status === 200) {
                const data = result.data.data;
    
                const { dueDate, rangeFrom, rangeTo } = calculateDates(data.issuanceDate);
    
                const formattedRow = {
                    id: data.id,
                    surveyName: data.surveyName,
                    surveyDate: data.surveyDate,
                    issuanceDate: data.issuanceDate,
                    dueDate: data.dueDate || dueDate, // fallback to calculated
                    rangeFrom: data.rangeFrom || rangeFrom,
                    rangeTo: data.rangeTo || rangeTo,
                    postponed: data.postponed || ""
                };
    
                setClassificationRows([formattedRow]);
                setSelectedShip({ id: data.clientId, shipName: data.client?.shipName || "" });
            }
        } catch (error) {
            toast.error(error.message || "Error fetching data");
        } finally {
            setLoading(false);
        }
    };
    

    const handleAddClassification = () => {
        if (mode === "update" && variableId) {
            const updatedData = {
                ...classificationRows[0],
                clientId: Number(selectedShip.id),
                dueDate: classificationRows[0].dueDate || calculateDates(classificationRows[0].issuanceDate).dueDate

            };
            updateClassificationSurvey(variableId, updatedData);
            router.push(`/classification?id=${selectedShip.id}`);
            return;
        }
    
        const payload = classificationRows
            .filter(row => row.surveyName)
            .map(({ id, ...rest }) => ({
                clientId: Number(selectedShip.id),
                surveyName: rest.surveyName,
                surveyDate: rest.surveyDate,
                issuanceDate: rest.issuanceDate,
                dueDate: rest.dueDate,
                rangeFrom: rest.rangeFrom,
                rangeTo: rest.rangeTo,
                postponed: rest.postponed
            }));
    
        addClassificationSurvey(payload);
        router.push(`/classification`);
    };
    
    const handleClientChange = (event) => {
        const selectedId = event.target.value;
        const selectedClient = clientsList.find(client => client.id === selectedId);
        setSelectedShip({
            id: selectedId,
            shipName: selectedClient ? selectedClient.shipName : ""
        });
    };

    useEffect(() => {
        if (mode === "update" && variableId) {
            getClassification();
        }
    }, [mode, variableId]);

    useEffect(() => {
        fetchClients();
    }, []);

    return (
        <Stack mt={4} spacing={4}>
            <Paper sx={{ padding: "20px", borderRadius: "15px" }}>
                <Box mt={3}>
                    {mode === "create" && (
                        <Box>
                            <FormControl fullWidth sx={{ maxWidth: 300 }}>
                                <Typography variant="h6" mb={1}>Select Client</Typography>
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
                            </FormControl>
                        </Box>
                    )}
                </Box>

                <Box mt={4}>
                    <Typography variant="h6">Classification Surveys</Typography>
                    {classificationRows.map((row, index) => (
                        <Box
                            key={index}
                            sx={{
                                border: "1px solid #e0e0e0",
                                borderRadius: 2,
                                p: 2,
                                mb: 3,
                            }}
                        >
                            <Grid2 container spacing={2}>
                                <Grid2 size={{ xs: 12, sm: 12, md: 12 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Survey Type</InputLabel>
                                        <Select
                                            value={row.surveyName}
                                            label="Survey Type"
                                            onChange={(e) => handleChange("classification", index, "surveyName", e.target.value)}
                                        >
                                            {surveyTypes.map((type) => (
                                                <MenuItem key={type.value} value={type.label}>
                                                    {type.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid2>

                                <Grid2 size={{ xs: 12, sm: 12, md: 12 }}>
                                    <TextField
                                        label="Survey Date"
                                        type="date"
                                        fullWidth
                                        value={row.surveyDate ? moment(row.surveyDate).format("YYYY-MM-DD") : ""}
                                        onChange={(e) => handleChange("classification", index, "surveyDate", e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid2>

                                <Grid2 size={{ xs: 12, sm: 12, md: 12 }}>
                                    <TextField
                                        label="Assignment Date"
                                        type="date"
                                        fullWidth
                                        value={row.issuanceDate ? moment(row.issuanceDate).format("YYYY-MM-DD") : ""}
                                        onChange={(e) => handleChange("classification", index, "issuanceDate", e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid2>

                                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                    <TextField
                                        type="date"
                                        label="Due Date"
                                        fullWidth
                                        value={row.dueDate ? moment(row.dueDate).format("YYYY-MM-DD") : moment(row.issuanceDate).add(5, "days").format("YYYY-MM-DD")}
                                        onChange={(e) => handleChange("classification", index, "dueDate", e.target.value)}
                                        disabled
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid2>

                                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                    <TextField
                                        label="Range From"
                                        fullWidth
                                        value={row.rangeFrom ? moment(row.rangeFrom).format("DD/MM/YYYY") : ""}
                                        InputProps={{ readOnly: true }}
                                        disabled
                                    />
                                </Grid2>

                                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                    <TextField
                                        label="Range To"
                                        fullWidth
                                        value={row.rangeTo ? moment(row.rangeTo).format("DD/MM/YYYY") : ""}
                                        InputLabelProps={{ shrink: true }}
                                        disabled
                                    />
                                </Grid2>

                                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                    <TextField
                                        label="Postponed Date"
                                        type="date"
                                        fullWidth
                                        value={row.postponed ? moment(row.postponed).format("YYYY-MM-DD") : ""}
                                        onChange={(e) => handleChange("classification", index, "postponed", e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid2>

                                {mode !== "update" && (
                                    <Grid2 item xs={12}>
                                        <IconButton onClick={() => handleDeleteRow(index)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid2>
                                )}
                            </Grid2>
                        </Box>
                    ))}

                    {mode !== "update" && (
                        <CommonButton
                            style={{ marginTop: "1rem" }}
                            disabled={selectedShip.id === ""}
                            variant="contained"
                            onClick={addRow}
                            text="Add Classification Surveys"
                        />
                    )}
                </Box>

                <DialogActions>
                    <CommonButton variant="contained" onClick={handleSave} text="Save" />
                </DialogActions>
            </Paper>
        </Stack>
    );
};

export default ClassificationForm;
