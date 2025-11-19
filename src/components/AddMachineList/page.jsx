// Machinery List Accordion Component
'use client';

import { useEffect, useState } from "react";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Checkbox,
    FormControlLabel,
    Select,
    MenuItem,
    TextField,
    Card,
    CardContent,
    RadioGroup,
    FormControl,
    Radio,
    Box,
    Button,
    Grid2
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CommonInput from "../CommonInput";
import { getAllClients } from "@/api";

const POSITION_OPTIONS = [
    { code: "P", name: "Port" },
    { code: "C", name: "Centre" },
    { code: "S", name: "Starboard" },
    { code: "F", name: "Forward" },
    { code: "A", name: "Aft" },
    { code: "U", name: "Upper" },
    { code: "L", name: "Lower" },
    { code: "PI", name: "Port Inner" },
    { code: "PO", name: "Port Outer" },
    { code: "PF", name: "Port Ford" },
    { code: "PA", name: "Port Aft" },
    { code: "SI", name: "Starboard Inner" },
    { code: "SO", name: "Starboard Outer" },
    { code: "SF", name: "Starboard Ford" },
    { code: "SA", name: "Starboard Aft" },
    { code: "SU", name: "Starboard Upper" },
    { code: "SL", name: "Starboard Lower" },
    { code: "PU", name: "Port Upper" },
    { code: "PL", name: "Port Lower" },
];

const ROWS = [
    { id: 1, label: "Main journal and bearing", hasFromTo: true },
    { id: 2, label: "O.F. injection pump, h.p o.f. pipes & shielding", hasFromTo: true },
    { id: 3, label: "O.F. injection pump and complete o.f. system for common rail system", hasFromTo: true },
    { id: 4, label: "Insulation exhaust manifold and piping", hasPosition: true },
    { id: 5, label: "Hydraulic pump for exhaust valves", hasPosition: true },
    { id: 6, label: "Crankcase doors and relief devices", hasPosition: true },
    { id: 7, label: "Scavenge relief devices", hasPosition: false },
    { id: 8, label: "Crankshaft alignment", hasPosition: false },
    { id: 9, label: "Vibration damper/de-tuner", hasPosition: false },
    { id: 10, label: "Oil mist detector", hasPosition: false },
    { id: 11, label: "Camshaft/s and camshaft/s drive", hasPosition: false },
    { id: 12, label: "Bed plates, frames, tie rods, holding down bolts and chocks", hasPosition: false },
    { id: 13, label: "Starting and reversing gear", hasPosition: false },
    { id: 14, label: "Super charger/Turbocharger", hasPosition: true },
    { id: 15, label: "Electric scavenge blower/ scavenge pump", hasPosition: true },
    { id: 16, label: "Piston cooling water air compressor", hasPosition: true },
    { id: 17, label: "Main engine air cooler", hasPosition: true },
    { id: 18, label: "Engine under piston scavenge air cooler", hasPosition: true },
    { id: 19, label: "Main engine attached bilge pump", hasPosition: true },
    { id: 20, label: "Main engine attached sea water cooling pump", hasPosition: true },
    { id: 21, label: "Main engine attached fresh water cooling pump", hasPosition: true },
    { id: 22, label: "Main engine attached lub. oil circulating pump", hasPosition: true },
    { id: 23, label: "Main engine attached O.F. booster pump", hasPosition: true },
    { id: 24, label: "Main engine attached air compressor", hasPosition: true },
    { id: 25, label: "Main engine attached rocker arm lub. oil pump", hasPosition: true },
    { id: 26, label: "Coupling", hasPosition: false },
    { id: 27, label: "Thrust Bearing", hasPosition: false },
    { id: 28, label: "Engine trial", hasPosition: false },
];

const REDUCTION_GEARING_ROWS = [
    { id: 101, label: "Pinion/s and wheel/s", hasPosition: true },
    { id: 102, label: "Shaft/s couplings, clutch(es) and bearing/s", hasPosition: true },
    { id: 103, label: "Thrust Bearing", hasPosition: false },
    { id: 104, label: "Coupling/clutch for shaft generator", hasPosition: false },
    { id: 105, label: "Attached lub. oil pump", hasPosition: false },
    { id: 106, label: "Attached lub. oil cooler", hasPosition: false },
    { id: 107, label: "Elastic coupling", hasPosition: false },
    { id: 108, label: "Foundation bolts and chocks", hasPosition: false },
];

const ELECTRIC_PROP = [
    { id: 109, label: "Generator complete", hasPosition: false },
    { id: 110, label: "Control gear, cables, etc. connected with propulsion equipment", hasPosition: false },
    { id: 111, label: "Insulation resistance of propulsion equipment", hasPosition: false },
    { id: 112, label: "Governing", hasPosition: false },
    { id: 113, label: "Propulsion motor", hasPosition: false },
    { id: 114, label: "Cooling arrangement for propulsion unit", hasPosition: false },
    { id: 115, label: "Air Gap", hasPosition: false },
    { id: 116, label: "Holding down bolts and chocks of propulsion motor", hasPosition: false },
    { id: 117, label: "Propulsion motor trial", hasPosition: false },
];

const MAIN_STEAM_TURBINE = [
    { id: 118, label: "Turbine rotor, casing, diaphragm, nozzle, blade and shroud", hasPosition: false },
    { id: 119, label: "Turbine Shaft Bearings", hasPosition: false },
    { id: 120, label: "Turbine Thrust Bearings", hasPosition: false },
    { id: 121, label: "Governing system", hasPosition: false },
    { id: 122, label: "Holding Down Bolts and Chocks", hasPosition: false },
    { id: 123, label: "Propulsion equipment trial", hasPosition: false },
];

const MachineryList = () => {
    const [formData, setFormData] = useState({});
    const [shipType, setShipType] = useState();
    const [noOfCylinders, setNoOfCylinders] = useState();
    const [dynamicRows, setDynamicRows] = useState([]);
    const [clientsList, setClientsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedShip, setSelectedShip] = useState({});
    const [position, setPosition] = useState([]);

    const handleAddRow = () => {
        const newRow = {
            id: ROWS.length + dynamicRows.length + 1,
            label: "",
            hasPosition: true,
        };
        setDynamicRows((prev) => [...prev, newRow]);
    };

    const updateField = (rowId, key, value) => {
        setFormData((prev) => ({
            ...prev,
            [rowId]: {
                ...prev[rowId],
                [key]: value,
            },
        }));
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
            setLoading(false);
        } catch (error) {
            setLoading(false);
            toast.error(error?.message || "Failed to fetch clients");
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);
    const handleClientChange = (event) => {
        const selectedId = event.target.value;
        const selectedClient = clientsList.find((client) => client.id === selectedId);
        // setEditRowId(null);
        setSelectedShip({
            id: selectedId,
            shipName: selectedClient ? selectedClient.shipName : "",
        });
    };

    const handlePositionChange = (event) => {
        setPosition(event.target.value);
    };
    return (
        <>
            {/* MAIN ACCORDIONS */}
            <Card sx={{ pl: 3, pt: 2, mt: 2 }}>
                <FormControl fullWidth sx={{ maxWidth: 300 }}>
                    <Typography sx={{ fontWeight: 700, mb: 1, ml: 2 }}>
                        Select Ship
                    </Typography>

                    <Select sx={{ ml: 2 }} value={selectedShip.id || ""} onChange={handleClientChange}>
                        <MenuItem value="">&nbsp;
                        </MenuItem>
                        {clientsList.map((client) => (
                            <MenuItem key={client.id} value={client.id}>
                                {client.shipName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <CardContent>
                    <FormControl>
                        <Typography fontWeight={700} mb={1}>Engine Type</Typography>
                        <RadioGroup
                            row
                            value={shipType}
                            onChange={(e) => setShipType(e.target.value)}
                            sx={{ mb: 2 }}
                        >
                            <FormControlLabel value="crosshead" control={<Radio />} label="Crosshead Type Engine" />
                            <FormControlLabel value="inline" control={<Radio />} label="Inline Trunk Piston Engine" />
                            <FormControlLabel value="vee" control={<Radio />} label="Vee-Type Trunk Piston Engine" />
                        </RadioGroup>
                    </FormControl>
                    <Grid2 container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Grid2 size={{ xs: 12, md: 4 }}>
                            <Typography fontWeight={700} mb={1}>
                                No. of cylinders in each engine/bank
                            </Typography>
                            <TextField
                                id="cylinders-input"
                                placeholder="Enter no of cylinders"
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={noOfCylinders}
                                onChange={(e) => setNoOfCylinders(e.target.value)}
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <Typography fontWeight={700} mb={1}>Position / No.</Typography>

                                <Select
                                    multiple
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={position}
                                    onChange={handlePositionChange}
                                    renderValue={(selected) => selected.join("")} // <-- shows only codes
                                >
                                    {POSITION_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.code} value={opt.code}>
                                            <Checkbox checked={position.includes(opt.code)} />
                                            <Typography>{opt.name} ({opt.code})</Typography>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid2>
                    </Grid2>

                    {/* ---------------- MACHINERY LIST ---------------- */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography fontSize={20} fontWeight={600}>Machinery List</Typography>
                        </AccordionSummary>

                        <AccordionDetails>
                            <Box mt={2}>
                                <Grid2 container spacing={2} alignItems="center" sx={{ mb: 2, fontWeight: 700 }}>
                                    <Grid2 size={{ xs: 12, md: 0.6 }}></Grid2>
                                    <Grid2 size={{ xs: 12, md: 3.3 }}>Description</Grid2>
                                    <Grid2 size={{ xs: 12, md: 2 }}>Position / No.</Grid2>
                                    <Grid2 size={{ xs: 12, md: 2 }}>Assigned Date</Grid2>
                                    <Grid2 size={{ xs: 12, md: 2 }}>Due Date</Grid2>
                                    <Grid2 size={{ xs: 12, md: 2 }}>Postponed Date</Grid2>
                                </Grid2>

                                {[...ROWS, ...dynamicRows].map((row) => (
                                    <Grid2 key={row.id} xs={12} mt={2}>
                                        <Grid2 container spacing={2} alignItems="center">

                                            {/* Checkbox */}
                                            <Grid2 size={{ xs: 12, md: 0.6 }}>
                                                <Checkbox
                                                    checked={formData[row.id]?.xMark === "X"}
                                                    onChange={(e) =>
                                                        updateField(row.id, "xMark", e.target.checked ? "X" : "-")
                                                    }
                                                />
                                            </Grid2>

                                            {/* LABEL */}
                                            <Grid2 size={{ xs: 12, md: 3.3 }}>
                                                {row.id <= 1000 ? (
                                                    <Typography fontWeight={600}>{row.label}</Typography>
                                                ) : (
                                                    <CommonInput
                                                        variant="standard"
                                                        size="small"
                                                        fullWidth
                                                        value={formData[row.id]?.label || ""}
                                                        onChange={(e) => updateField(row.id, "label", e.target.value)}
                                                        placeholder="Enter label"
                                                    />
                                                )}
                                            </Grid2>

                                            {/* POSITION */}
                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                {/* POSITION */}
                                                {(row.hasPosition || row.id > 1000) ? (
                                                    <Select
                                                        multiple
                                                        variant="standard"
                                                        fullWidth
                                                        size="small"
                                                        displayEmpty
                                                        value={formData[row.id]?.position || []}
                                                        onChange={(e) => updateField(row.id, "position", e.target.value)}
                                                        renderValue={(selected) => selected.join("")}
                                                    >
                                                        {POSITION_OPTIONS.map((opt) => (
                                                            <MenuItem key={opt.code} value={opt.code}>
                                                                <Checkbox checked={(formData[row.id]?.position || []).includes(opt.code)} />
                                                                <Typography>{opt.name} ({opt.code})</Typography>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                ) : row.hasFromTo ? (
                                                    /* FIXED: must be a container */
                                                    <Grid2 container spacing={1} alignItems="center">
                                                        <Grid2 size={{ xs: 12, md: 5 }}>
                                                            <CommonInput
                                                                variant="standard"
                                                                type="number"
                                                                size="small"
                                                                fullWidth
                                                                value={formData[row.id]?.from || ""}
                                                                onChange={(e) => updateField(row.id, "from", e.target.value)}
                                                            />
                                                        </Grid2>

                                                        <Grid2 size={{ xs: 12, md: 2 }}>
                                                            <Typography>To</Typography>
                                                        </Grid2>

                                                        <Grid2 size={{ xs: 12, md: 5 }}>
                                                            <CommonInput
                                                                variant="standard"
                                                                type="number"
                                                                size="small"
                                                                fullWidth
                                                                value={formData[row.id]?.to || ""}
                                                                onChange={(e) => updateField(row.id, "to", e.target.value)}
                                                            />
                                                        </Grid2>
                                                    </Grid2>
                                                ) : (
                                                    <Box sx={{ height: "40px" }} />
                                                )}
                                            </Grid2>


                                            {/* FROM–TO (only for rows 1–3) */}

                                            {/* DATE FIELDS */}
                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                <CommonInput
                                                    type="date"
                                                    size="small"
                                                    fullWidth
                                                    variant="standard"
                                                    value={formData[row.id]?.assignmentDate || ""}
                                                    onChange={(e) => updateField(row.id, "assignmentDate", e.target.value)}
                                                />
                                            </Grid2>

                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                <CommonInput
                                                    type="date"
                                                    size="small"
                                                    variant="standard"
                                                    fullWidth
                                                    value={formData[row.id]?.dueDate || ""}
                                                    onChange={(e) => updateField(row.id, "dueDate", e.target.value)}
                                                />
                                            </Grid2>

                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                <CommonInput
                                                    variant="standard"
                                                    type="date"
                                                    size="small"
                                                    fullWidth
                                                    value={formData[row.id]?.postponedDate || ""}
                                                    onChange={(e) =>
                                                        updateField(row.id, "postponedDate", e.target.value)
                                                    }
                                                />
                                            </Grid2>

                                        </Grid2>
                                    </Grid2>
                                ))}

                                {/* ADD ROW */}
                                <Box mt={3} textAlign="right">
                                    <Button variant="contained" onClick={handleAddRow}>
                                        + Add Row
                                    </Button>
                                </Box>

                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* ------------ BLOCK 1 ------------- */}
                    <Accordion sx={{ mt: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography fontSize={20} fontWeight={600}>Propulsion – Block 1</Typography>
                        </AccordionSummary>

                        <AccordionDetails>
                            <Box p={2}>

                                {/* REDUCTION GEARING */}
                                <Typography fontWeight={700} mb={1}>Main Reduction Gearing</Typography>
                                {REDUCTION_GEARING_ROWS.map((row) => (
                                    <Grid2 key={row.id} xs={12} mt={2}>
                                        <Grid2 container spacing={2} alignItems="center">

                                            {/* Checkbox */}
                                            <Grid2 size={{ xs: 12, md: 0.6 }}>
                                                <Checkbox
                                                    checked={formData[row.id]?.xMark === "X"}
                                                    onChange={(e) =>
                                                        updateField(row.id, "xMark", e.target.checked ? "X" : "-")
                                                    }
                                                />
                                            </Grid2>

                                            {/* LABEL */}
                                            <Grid2 size={{ xs: 12, md: 3.3 }}>
                                                {row.id <= 500 ? (
                                                    <Typography fontWeight={600}>{row.label}</Typography>
                                                ) : (
                                                    <CommonInput
                                                        variant="standard"
                                                        size="small"
                                                        fullWidth
                                                        value={formData[row.id]?.label || ""}
                                                        onChange={(e) => updateField(row.id, "label", e.target.value)}
                                                        placeholder="Enter label"
                                                    />
                                                )}
                                            </Grid2>

                                            {/* POSITION */}
                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                {/* POSITION */}
                                                {(row.hasPosition || row.id > 1000) ? (
                                                    <Select
                                                        multiple
                                                        variant="standard"
                                                        fullWidth
                                                        size="small"
                                                        displayEmpty
                                                        value={formData[row.id]?.position || []}
                                                        onChange={(e) => updateField(row.id, "position", e.target.value)}
                                                        renderValue={(selected) => selected.join("")}
                                                    >
                                                        {POSITION_OPTIONS.map((opt) => (
                                                            <MenuItem key={opt.code} value={opt.code}>
                                                                <Checkbox checked={(formData[row.id]?.position || []).includes(opt.code)} />
                                                                <Typography>{opt.name} ({opt.code})</Typography>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                ) : row.hasFromTo ? (
                                                    /* FIXED: must be a container */
                                                    <Grid2 container spacing={1} alignItems="center">
                                                        <Grid2 size={{ xs: 12, md: 5 }}>
                                                            <CommonInput
                                                                variant="standard"
                                                                type="number"
                                                                size="small"
                                                                fullWidth
                                                                value={formData[row.id]?.from || ""}
                                                                onChange={(e) => updateField(row.id, "from", e.target.value)}
                                                            />
                                                        </Grid2>

                                                        <Grid2 size={{ xs: 12, md: 2 }}>
                                                            <Typography>To</Typography>
                                                        </Grid2>

                                                        <Grid2 size={{ xs: 12, md: 5 }}>
                                                            <CommonInput
                                                                variant="standard"
                                                                type="number"
                                                                size="small"
                                                                fullWidth
                                                                value={formData[row.id]?.to || ""}
                                                                onChange={(e) => updateField(row.id, "to", e.target.value)}
                                                            />
                                                        </Grid2>
                                                    </Grid2>
                                                ) : (
                                                    <Box sx={{ height: "40px" }} />
                                                )}
                                            </Grid2>


                                            {/* FROM–TO (only for rows 1–3) */}

                                            {/* DATE FIELDS */}
                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                <CommonInput
                                                    type="date"
                                                    size="small"
                                                    fullWidth
                                                    variant="standard"
                                                    value={formData[row.id]?.assignmentDate || ""}
                                                    onChange={(e) => updateField(row.id, "assignmentDate", e.target.value)}
                                                />
                                            </Grid2>

                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                <CommonInput
                                                    type="date"
                                                    size="small"
                                                    variant="standard"
                                                    fullWidth
                                                    value={formData[row.id]?.dueDate || ""}
                                                    onChange={(e) => updateField(row.id, "dueDate", e.target.value)}
                                                />
                                            </Grid2>

                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                <CommonInput
                                                    variant="standard"
                                                    type="date"
                                                    size="small"
                                                    fullWidth
                                                    value={formData[row.id]?.postponedDate || ""}
                                                    onChange={(e) =>
                                                        updateField(row.id, "postponedDate", e.target.value)
                                                    }
                                                />
                                            </Grid2>

                                        </Grid2>
                                    </Grid2>
                                ))}

                                {/* ELECTRIC PROPULSION */}
                                <Typography fontWeight={700} mt={3} mb={1}>Electric Propulsion Equipment</Typography>
                                {ELECTRIC_PROP.map((row) => (
                                    <Grid2 key={row.id} xs={12} mt={2}>
                                        <Grid2 container spacing={2} alignItems="center">

                                            {/* Checkbox */}
                                            <Grid2 size={{ xs: 12, md: 0.6 }}>
                                                <Checkbox
                                                    checked={formData[row.id]?.xMark === "X"}
                                                    onChange={(e) =>
                                                        updateField(row.id, "xMark", e.target.checked ? "X" : "-")
                                                    }
                                                />
                                            </Grid2>

                                            {/* LABEL */}
                                            <Grid2 size={{ xs: 12, md: 3.3 }}>
                                                {row.id <= 500 ? (
                                                    <Typography fontWeight={600}>{row.label}</Typography>
                                                ) : (
                                                    <CommonInput
                                                        variant="standard"
                                                        size="small"
                                                        fullWidth
                                                        value={formData[row.id]?.label || ""}
                                                        onChange={(e) => updateField(row.id, "label", e.target.value)}
                                                        placeholder="Enter label"
                                                    />
                                                )}
                                            </Grid2>

                                            {/* POSITION */}
                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                {/* POSITION */}
                                                {(row.hasPosition || row.id > 1000) ? (
                                                    <Select
                                                        multiple
                                                        variant="standard"
                                                        fullWidth
                                                        size="small"
                                                        displayEmpty
                                                        value={formData[row.id]?.position || []}
                                                        onChange={(e) => updateField(row.id, "position", e.target.value)}
                                                        renderValue={(selected) => selected.join("")}
                                                    >
                                                        {POSITION_OPTIONS.map((opt) => (
                                                            <MenuItem key={opt.code} value={opt.code}>
                                                                <Checkbox checked={(formData[row.id]?.position || []).includes(opt.code)} />
                                                                <Typography>{opt.name} ({opt.code})</Typography>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                ) : row.hasFromTo ? (
                                                    /* FIXED: must be a container */
                                                    <Grid2 container spacing={1} alignItems="center">
                                                        <Grid2 size={{ xs: 12, md: 5 }}>
                                                            <CommonInput
                                                                variant="standard"
                                                                type="number"
                                                                size="small"
                                                                fullWidth
                                                                value={formData[row.id]?.from || ""}
                                                                onChange={(e) => updateField(row.id, "from", e.target.value)}
                                                            />
                                                        </Grid2>

                                                        <Grid2 size={{ xs: 12, md: 2 }}>
                                                            <Typography>To</Typography>
                                                        </Grid2>

                                                        <Grid2 size={{ xs: 12, md: 5 }}>
                                                            <CommonInput
                                                                variant="standard"
                                                                type="number"
                                                                size="small"
                                                                fullWidth
                                                                value={formData[row.id]?.to || ""}
                                                                onChange={(e) => updateField(row.id, "to", e.target.value)}
                                                            />
                                                        </Grid2>
                                                    </Grid2>
                                                ) : (
                                                    <Box sx={{ height: "40px" }} />
                                                )}
                                            </Grid2>


                                            {/* FROM–TO (only for rows 1–3) */}

                                            {/* DATE FIELDS */}
                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                <CommonInput
                                                    type="date"
                                                    size="small"
                                                    fullWidth
                                                    variant="standard"
                                                    value={formData[row.id]?.assignmentDate || ""}
                                                    onChange={(e) => updateField(row.id, "assignmentDate", e.target.value)}
                                                />
                                            </Grid2>

                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                <CommonInput
                                                    type="date"
                                                    size="small"
                                                    variant="standard"
                                                    fullWidth
                                                    value={formData[row.id]?.dueDate || ""}
                                                    onChange={(e) => updateField(row.id, "dueDate", e.target.value)}
                                                />
                                            </Grid2>

                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                <CommonInput
                                                    variant="standard"
                                                    type="date"
                                                    size="small"
                                                    fullWidth
                                                    value={formData[row.id]?.postponedDate || ""}
                                                    onChange={(e) =>
                                                        updateField(row.id, "postponedDate", e.target.value)
                                                    }
                                                />
                                            </Grid2>

                                        </Grid2>
                                    </Grid2>
                                ))}

                                {/* STEAM TURBINE */}
                                <Typography fontWeight={700} mt={3} mb={1}>Main Steam Turbine Propulsion Equipment</Typography>
                                {MAIN_STEAM_TURBINE.map((row) => (
                                    <Grid2 key={row.id} xs={12} mt={2}>
                                        <Grid2 container spacing={2} alignItems="center">

                                            {/* Checkbox */}
                                            <Grid2 size={{ xs: 12, md: 0.6 }}>
                                                <Checkbox
                                                    checked={formData[row.id]?.xMark === "X"}
                                                    onChange={(e) =>
                                                        updateField(row.id, "xMark", e.target.checked ? "X" : "-")
                                                    }
                                                />
                                            </Grid2>

                                            {/* LABEL */}
                                            <Grid2 size={{ xs: 12, md: 3.3 }}>
                                                {row.id <= 500 ? (
                                                    <Typography fontWeight={600}>{row.label}</Typography>
                                                ) : (
                                                    <CommonInput
                                                        variant="standard"
                                                        size="small"
                                                        fullWidth
                                                        value={formData[row.id]?.label || ""}
                                                        onChange={(e) => updateField(row.id, "label", e.target.value)}
                                                        placeholder="Enter label"
                                                    />
                                                )}
                                            </Grid2>

                                            {/* POSITION */}
                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                {/* POSITION */}
                                                {(row.hasPosition || row.id > 1000) ? (
                                                    <Select
                                                        multiple
                                                        variant="standard"
                                                        fullWidth
                                                        size="small"
                                                        displayEmpty
                                                        value={formData[row.id]?.position || []}
                                                        onChange={(e) => updateField(row.id, "position", e.target.value)}
                                                        renderValue={(selected) => selected.join("")}
                                                    >
                                                        {POSITION_OPTIONS.map((opt) => (
                                                            <MenuItem key={opt.code} value={opt.code}>
                                                                <Checkbox checked={(formData[row.id]?.position || []).includes(opt.code)} />
                                                                <Typography>{opt.name} ({opt.code})</Typography>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                ) : row.hasFromTo ? (
                                                    /* FIXED: must be a container */
                                                    <Grid2 container spacing={1} alignItems="center">
                                                        <Grid2 size={{ xs: 12, md: 5 }}>
                                                            <CommonInput
                                                                variant="standard"
                                                                type="number"
                                                                size="small"
                                                                fullWidth
                                                                value={formData[row.id]?.from || ""}
                                                                onChange={(e) => updateField(row.id, "from", e.target.value)}
                                                            />
                                                        </Grid2>

                                                        <Grid2 size={{ xs: 12, md: 2 }}>
                                                            <Typography>To</Typography>
                                                        </Grid2>

                                                        <Grid2 size={{ xs: 12, md: 5 }}>
                                                            <CommonInput
                                                                variant="standard"
                                                                type="number"
                                                                size="small"
                                                                fullWidth
                                                                value={formData[row.id]?.to || ""}
                                                                onChange={(e) => updateField(row.id, "to", e.target.value)}
                                                            />
                                                        </Grid2>
                                                    </Grid2>
                                                ) : (
                                                    <Box sx={{ height: "40px" }} />
                                                )}
                                            </Grid2>


                                            {/* FROM–TO (only for rows 1–3) */}

                                            {/* DATE FIELDS */}
                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                <CommonInput
                                                    type="date"
                                                    size="small"
                                                    fullWidth
                                                    variant="standard"
                                                    value={formData[row.id]?.assignmentDate || ""}
                                                    onChange={(e) => updateField(row.id, "assignmentDate", e.target.value)}
                                                />
                                            </Grid2>

                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                <CommonInput
                                                    type="date"
                                                    size="small"
                                                    variant="standard"
                                                    fullWidth
                                                    value={formData[row.id]?.dueDate || ""}
                                                    onChange={(e) => updateField(row.id, "dueDate", e.target.value)}
                                                />
                                            </Grid2>

                                            <Grid2 size={{ xs: 12, md: 2 }}>
                                                <CommonInput
                                                    variant="standard"
                                                    type="date"
                                                    size="small"
                                                    fullWidth
                                                    value={formData[row.id]?.postponedDate || ""}
                                                    onChange={(e) =>
                                                        updateField(row.id, "postponedDate", e.target.value)
                                                    }
                                                />
                                            </Grid2>

                                        </Grid2>
                                    </Grid2>
                                ))}

                            </Box>
                        </AccordionDetails>
                    </Accordion>

                </CardContent>
            </Card>
        </>
    );
};

export default MachineryList;
