'use client';

import { useEffect, useRef, useState } from "react";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Checkbox,
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
    Grid2,
    Tabs,
    Tab,
    FormControlLabel,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { toast } from "react-toastify";
import { addMachineList, getAllClients, getMachineById, updateMachineryItem } from "@/api";
import CommonButton from "../CommonButton";
import { MACHINERY_SECTIONS, HULL_SECTIONS, POSITION_OPTIONS } from "@/utils/MachineList";
import { useRouter } from "next/navigation";

const MachineryHullManager = ({ mode, shipId }) => {
    const [tabValue, setTabValue] = useState(0);
    const [formData, setFormData] = useState({});
    const [shipType, setShipType] = useState();
    const [noOfCylinders, setNoOfCylinders] = useState();
    const [selectedShip, setSelectedShip] = useState({ id: "", shipName: "" });
    const [position, setPosition] = useState([]);
    const [clientsList, setClientsList] = useState([]);
    const [dynamicRows, setDynamicRows] = useState({ machinery: {}, hull: {} });
    const [editingId, setEditingId] = useState(null);
    const [engineUnitsCountedFrom, setEngineUnitsCountedFrom] = useState("flywheel_end");
    const router = useRouter();

    const [expandedAccordions, setExpandedAccordions] = useState({});
    const [renderedSections, setRenderedSections] = useState({});

    const STATIC_ROWS_SECTION_01 = [
        { id: "01", content: "No {cyl} Cyl, Cvr, Pstn, Rod, Vlvs & gears", hasPosition: true, hasFromTo: false },
        { id: "02", content: "No {cyl}, Con Rod, Top end & Guides", hasPosition: true, hasFromTo: false },
        { id: "03", content: "No {cyl} Crankpin, Bearing & webs", hasPosition: true, hasFromTo: false },
        { id: "04", label: "Main journal and bearing", hasFromTo: true, isDue: true, isFrom: false, repeatPerCylinder: false },
        { id: "05", label: "O.F. injection pump, h.p .o.f. pipes & shielding", hasFromTo: true, isDue: true, isFrom: false, repeatPerCylinder: false },
    ];

    // const generateRowInstances = (sectionNum, row, data, isMachineryList = false) => {
    //     const instances = [];
    //     const numCyl = Number(noOfCylinders || 1);

    //     let positionsToUse = [];

    //     if (isMachineryList) {
    //         // ✔ Machinery_list MUST always use global position
    //         positionsToUse = position.length ? position : ["-"];
    //     } else {
    //         // ❗ Other sections use ONLY row-level position OR "-"
    //         if (data.position && data.position.length > 0) {
    //             positionsToUse = data.position;
    //         } else {
    //             positionsToUse = ["-"];   // <- NOT global position
    //         }
    //     }

    //     console.log(
    //         "GEN ROW",
    //         "sectionNum:", sectionNum,
    //         "rowId:", row.id,
    //         "isMachineryList:", isMachineryList,
    //         "positionsToUse:", positionsToUse
    //     );

    //     const labelToUse = data.label || row.label || "";

    //     positionsToUse.forEach((pos) => {
    //         for (let cyl = 1; cyl <= numCyl; cyl++) {
    //             const code = `${String(sectionNum).padStart(2, "0")}${pos}${row.id}${String(cyl).padStart(2, "0")}`;

    //             instances.push({
    //                 xMark: "X",
    //                 assignmentDate: data.assignmentDate || new Date().toISOString().split("T")[0],
    //                 dueDate: data.dueDate || calculateDueDate(data.assignmentDate || new Date()),
    //                 generatedCode: code,
    //                 occurrence: cyl,
    //                 positionCode: pos,
    //                 content: row.content?.replace("{cyl}", cyl),
    //                 label: labelToUse
    //             });
    //         }
    //     });

    //     return instances;
    // };

    const generateRowInstances = (sectionNum, row, data, isMachineryList = false) => {
        const instances = [];
        const numCyl = Number(noOfCylinders || 1);

        const globalPositions = position.length ? position : ["-"];

        // Determine row-level positions
        let rowPositions = [];

        if (isMachineryList) {
            // machinery_list uses global positions as row positions
            rowPositions = data.position?.length ? data.position : ["-"];
        } else {
            // other sections use only row-level position data
            rowPositions = data.position?.length ? data.position : ["-"];
        }

        const labelToUse = data.label || row.label || "";

        // Check if this row uses from/to instead of cylinders
        const hasFromTo = row.hasFromTo;
        const fromValue = parseInt(data.from) || 1;
        const toValue = parseInt(data.to) || 1;

        // Determine repetition count
        let repetitions = 1;
        if (hasFromTo) {
            // For from/to rows, repeat based on range
            repetitions = Math.max(1, toValue - fromValue + 1);
        } else if (row.repeatPerCylinder !== false && isMachineryList && ["01", "02", "03"].includes(String(row.id).padStart(2, "0"))) {
            // Only first 3 rows in machinery_list repeat per cylinder
            repetitions = numCyl;
        }

        // Loop based on section type
        if (isMachineryList) {
            // ✔ Include global position
            globalPositions.forEach((globalPos) => {
                rowPositions.forEach((rowPos) => {
                    for (let i = 1; i <= repetitions; i++) {
                        const occurrence = hasFromTo ? (fromValue + i - 1) : i;

                        const code =
                            `${String(sectionNum).padStart(2, "0")}` +
                            `${globalPos}` +
                            `${String(row.id).padStart(2, "0")}` +
                            `${String(occurrence).padStart(2, "0")}` +
                            `${rowPos}`;

                        // Generate content based on row type
                        let contentText;
                        if (hasFromTo) {
                            // For from/to rows: "No 1 Main journal...", "No 2 Main journal..."
                            contentText = `No ${occurrence} ${labelToUse}`;
                        } else {
                            // For cylinder rows: "No 1, Con Rod..."
                            contentText = row.content?.replace("{cyl}", occurrence) || labelToUse;
                        }

                        instances.push({
                            xMark: "X",
                            assignmentDate: data.assignmentDate || new Date().toISOString().split("T")[0],
                            dueDate: data.dueDate || calculateDueDate(data.assignmentDate || new Date()),
                            generatedCode: code,
                            occurrence: occurrence,
                            positionCode: rowPos,
                            globalPositionCode: globalPos,
                            postponedDate: data.postponedDate || null,
                            content: contentText,
                            label: labelToUse,
                            from: hasFromTo ? fromValue : null,
                            to: hasFromTo ? toValue : null,
                            fromFrameNo: data.fromFrameNo || null,
                            uptoFrameNo: data.uptoFrameNo || null
                        });
                    }
                });
            });
        } else {
            // ❗ No global position for other sections
            rowPositions.forEach((rowPos) => {
                for (let i = 1; i <= repetitions; i++) {
                    const occurrence = hasFromTo ? (fromValue + i - 1) : i;

                    const code =
                        `${String(sectionNum).padStart(2, "0")}` +
                        `${String(row.id).padStart(2, "0")}` +
                        `${String(occurrence).padStart(2, "0")}` +
                        `${rowPos}`;

                    // Generate content based on row type
                    let contentText;
                    if (hasFromTo) {
                        contentText = `No ${occurrence} ${labelToUse}`;
                    } else {
                        contentText = row.content?.replace("{cyl}", occurrence) || labelToUse;
                    }

                    instances.push({
                        xMark: "X",
                        assignmentDate: data.assignmentDate || new Date().toISOString().split("T")[0],
                        dueDate: data.dueDate || calculateDueDate(data.assignmentDate || new Date()),
                        generatedCode: code,
                        occurrence: occurrence,
                        positionCode: rowPos,
                        postponedDate: data.postponedDate,
                        content: contentText,
                        label: labelToUse,
                        from: hasFromTo ? fromValue : null,
                        to: hasFromTo ? toValue : null,
                        fromFrameNo: data.fromFrameNo || null,
                        uptoFrameNo: data.uptoFrameNo || null
                    });
                }
            });
        }

        return instances;
    };

    const generatePayload = () => {
        const payload = {
            shipId: selectedShip.id,
            shipName: selectedShip.shipName,
            engineType: shipType,
            numberOfCylinders: noOfCylinders,
            globalPosition: position,
            engineUnitsCountedFrom,
            blocks: {},
        };

        const sectionGroups = { machinery: MACHINERY_SECTIONS, hull: HULL_SECTIONS };

        Object.entries(sectionGroups).forEach(([sectionType, sections]) => {
            Object.keys(sections).forEach((sectionNum) => {

                const section = sections[sectionNum];
                const dynamicRowsForSection = dynamicRows[sectionType][sectionNum] || [];
                const allRows = [...section.rows, ...dynamicRowsForSection];

                let finalItems = [];

                const isMachineryList = section.sectionId === "machinery_list";

                if (sectionNum === "01" && isMachineryList) {
                    STATIC_ROWS_SECTION_01.forEach((staticRow) => {
                        const repeatedRows = generateRowInstances(sectionNum, staticRow, {}, true);
                        finalItems.push(...repeatedRows);
                    });
                }


                // --- DYNAMIC ROWS ---
                allRows.forEach((row) => {
                    const fieldKey = `${sectionType}-${sectionNum}-${row.id}`;
                    const data = formData[fieldKey];
                    if (data?.xMark === "X") {
                        const isMachineryList = section.sectionId === "machinery_list";
                        const repeated = generateRowInstances(sectionNum, row, data, isMachineryList);
                        finalItems.push(...repeated);
                    }

                });

                if (finalItems.length > 0) {
                    payload.blocks[section.sectionId] = {
                        sectionNumber: parseInt(sectionNum),
                        sectionName: section.sectionName,
                        items: finalItems,
                    };
                }
            });
        });

        return payload;
    };
    const calculateDueDate = (assignmentDate) => {
        if (!assignmentDate) return "";
        const date = new Date(assignmentDate);
        date.setFullYear(date.getFullYear() + 5);
        return date.toISOString().split("T")[0];
    };

    const updateField = (sectionType, sectionNum, rowId, key, value) => {
        const fieldKey = `${sectionType}-${sectionNum}-${rowId}`;
        setFormData((prev) => {
            const updated = {
                ...prev,
                [fieldKey]: {
                    ...prev[fieldKey],
                    [key]: value,
                },
            };
            if (key === "assignmentDate" && value) {
                updated[fieldKey].dueDate = calculateDueDate(value);
            }
            return updated;
        });
    };

    const handleAddRow = (sectionType, sectionNum) => {
        setDynamicRows((prev) => {
            const currentSections = sectionType === "machinery" ? MACHINERY_SECTIONS : HULL_SECTIONS;
            const section = currentSections[sectionNum];
            const currentDynamicRows = prev[sectionType][sectionNum] || [];

            const existingIds = [
                ...section.rows.map((r) => r.id),
                ...currentDynamicRows.map((r) => r.id),
            ];
            const nextId = Math.max(...existingIds, 0) + 1;

            const newRow = { id: nextId, label: "", hasPosition: true, isDue: true, isFrom: false };
            return {
                ...prev,
                [sectionType]: {
                    ...prev[sectionType],
                    [sectionNum]: [...currentDynamicRows, newRow],
                },
            };
        });
    };

    const fetchClients = async () => {
        try {
            const result = await getAllClients();

            if (result?.data?.status === "success") {
                setClientsList(result.data.data);
            } else {
                toast.error(result?.data?.message);
            }
        } catch (error) {
            toast.error(error?.message || "Failed to fetch clients");
        }
    };



    useEffect(() => {
        fetchClients();

    }, []);

    const handleClientChange = (event) => {
        const selectedId = event.target.value;
        const selectedClient = clientsList.find((client) => client.id === selectedId);
        setSelectedShip({
            id: selectedId,
            shipName: selectedClient ? selectedClient.shipName : "",
        });
    };

    useEffect(() => {
        if (shipId && clientsList.length > 0) {
            setEditingId(shipId);

            const selectedClient = clientsList.find((client) => client.id === shipId);
            setSelectedShip({
                id: shipId,
                shipName: selectedClient ? selectedClient.shipName : "",
            });

            (async () => {
                const res = await getMachineById(shipId);
                if (res?.data?.status === "success") {
                    const data = res.data.data;

                    // ✅ FIX: set engine type so RadioGroup reflects selection
                    setShipType(data.engineType);

                    setNoOfCylinders(data.numberOfCylinders);
                    setPosition(data.globalPosition || []);
                    setEngineUnitsCountedFrom(data.engineUnitsCountedFrom || "flywheel_end");
                }
            })();
        }
    }, [shipId, clientsList]);


    const handleAccordionChange = (sectionNum) => (event, isExpanded) => {
        setExpandedAccordions((prev) => ({
            ...prev,
            [sectionNum]: isExpanded,
        }));

        if (isExpanded && !renderedSections[sectionNum]) {
            setRenderedSections((prev) => ({
                ...prev,
                [sectionNum]: true,
            }));
        }
    };

    const handleSubmit = async () => {
        const payload = generatePayload();
        const response = editingId
            ? await updateMachineryItem(editingId, payload)
            : await addMachineList(payload);
        if (response?.data?.status === "success") {
            toast.success(response?.data?.message);
            router.push("/machine-list");
            setEditingId(null);

            resetForm();
        } else {
            toast.error(response?.response?.data?.message);
        }
    };

    const resetForm = () => {
        setFormData({});
        setShipType(undefined);
        setNoOfCylinders(undefined);
        setPosition([]);
        setSelectedShip({ id: "", shipName: "" });
        setDynamicRows({ machinery: {}, hull: {} });
        setExpandedAccordions({});
        setRenderedSections({});
    };

    const handleEngineUnitsCountedFromChange = (e) => {
        setEngineUnitsCountedFrom(e.target.value);
    };

    const renderRow = (row, sectionType, sectionNum) => {
        const fieldKey = `${sectionType}-${sectionNum}-${row.id}`;
        const isChecked = formData[fieldKey]?.xMark === "X";

        return (
            <Grid2 key={`${fieldKey}`} xs={12} mt={2}>
                <Grid2 container spacing={2} alignItems="center">
                    <Grid2 size={{ xs: 12, md: 0.6 }}>
                        <Checkbox
                            checked={isChecked}
                            onChange={(e) =>
                                updateField(sectionType, sectionNum, row.id, "xMark", e.target.checked ? "X" : "-")
                            }
                        />
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 3.3 }}>
                        {row.label ? (
                            <Typography fontWeight={600}>{row.label}</Typography>
                        ) : (
                            <TextField
                                variant="standard"
                                size="small"
                                fullWidth
                                disabled={!isChecked}
                                value={formData[fieldKey]?.label || ""}
                                onChange={(e) => updateField(sectionType, sectionNum, row.id, "label", e.target.value)}
                                placeholder="Enter label"
                            />
                        )}
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 2 }}>
                        {row.hasPosition ? (
                            <Select
                                multiple
                                variant="standard"
                                fullWidth
                                size="small"
                                displayEmpty
                                disabled={!isChecked}
                                value={formData[fieldKey]?.position || []}
                                onChange={(e) => updateField(sectionType, sectionNum, row.id, "position", e.target.value)}
                                renderValue={(selected) => selected?.join("")}
                            >
                                {POSITION_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.code} value={opt.code}>
                                        <Checkbox checked={(formData[fieldKey]?.position || [])?.includes(opt.code)} />
                                        <Typography>{opt.name} ({opt.code})</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        ) : row.hasFromTo ? (
                            <Grid2 container spacing={1} alignItems="center">
                                <Grid2 size={{ xs: 12, md: 5 }}>
                                    <TextField
                                        variant="standard"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        disabled={!isChecked}
                                        value={formData[fieldKey]?.from || ""}
                                        onChange={(e) => updateField(sectionType, sectionNum, row.id, "from", e.target.value)}
                                    />
                                </Grid2>
                                <Grid2 size={{ xs: 12, md: 2 }}>
                                    <Typography>To</Typography>
                                </Grid2>
                                <Grid2 size={{ xs: 12, md: 5 }}>
                                    <TextField
                                        variant="standard"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        disabled={!isChecked}
                                        value={formData[fieldKey]?.to || ""}
                                        onChange={(e) => updateField(sectionType, sectionNum, row.id, "to", e.target.value)}
                                    />
                                </Grid2>
                            </Grid2>
                        ) : (
                            <Box sx={{ height: "40px" }} />
                        )}
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 2 }}>
                        <TextField
                            type="date"
                            size="small"
                            fullWidth
                            variant="standard"
                            label="Assignment Date"
                            disabled={!isChecked}
                            InputLabelProps={{ shrink: true }}
                            value={formData[fieldKey]?.assignmentDate || ""}
                            onChange={(e) => updateField(sectionType, sectionNum, row.id, "assignmentDate", e.target.value)}
                        />
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 2 }}>
                        {row.isDue && !row.isFrom ? (
                            <TextField
                                type="date"
                                size="small"
                                variant="standard"
                                fullWidth
                                label="Due Date"
                                disabled={!isChecked}
                                InputLabelProps={{ shrink: true }}
                                value={formData[fieldKey]?.dueDate || ""}
                                onChange={(e) => updateField(sectionType, sectionNum, row.id, "dueDate", e.target.value)}
                            />
                        ) : row.isFrom ? (
                            <TextField
                                type="date"
                                size="small"
                                variant="standard"
                                fullWidth
                                label="From"
                                disabled={!isChecked}
                                InputLabelProps={{ shrink: true }}
                                value={formData[fieldKey]?.fromFrameNo || ""}
                                onChange={(e) => updateField(sectionType, sectionNum, row.id, "fromFrameNo", e.target.value)}
                            />
                        ) : (
                            <Box sx={{ height: "40px" }} />
                        )}
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 2 }}>
                        {row.isDue && !row.isFrom ? (
                            <TextField
                                variant="standard"
                                type="date"
                                size="small"
                                fullWidth
                                label="Postponed Date"
                                disabled={!isChecked}
                                InputLabelProps={{ shrink: true }}
                                value={formData[fieldKey]?.postponedDate || ""}
                                onChange={(e) =>
                                    updateField(sectionType, sectionNum, row.id, "postponedDate", e.target.value)
                                }
                            />
                        ) : row.isFrom ? (
                            <TextField
                                variant="standard"
                                type="date"
                                size="small"
                                fullWidth
                                label="Upto"
                                disabled={!isChecked}
                                InputLabelProps={{ shrink: true }}
                                value={formData[fieldKey]?.uptoFrameNo || ""}
                                onChange={(e) =>
                                    updateField(sectionType, sectionNum, row.id, "uptoFrameNo", e.target.value)
                                }
                            />
                        ) : (
                            <Box sx={{ height: "40px" }} />
                        )}
                    </Grid2>
                </Grid2>
            </Grid2>
        );
    };

    const renderSection = (sectionNum, section, sectionType) => {
        const isExpanded = expandedAccordions[sectionNum];
        const isRendered = renderedSections[sectionNum];
        const dynamicRowsForSection = dynamicRows[sectionType][sectionNum] || [];
        const allRows = [...section.rows, ...dynamicRowsForSection];

        const showDueDate = allRows.some((r) => r.isDue);
        const showFrom = allRows.some((r) => r.isFrom);

        return (
            <Accordion
                key={sectionNum}
                sx={{ mt: 2 }}
                expanded={!!isExpanded}
                onChange={handleAccordionChange(sectionNum)}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontSize={18} fontWeight={600}>
                        {sectionNum}. {section.sectionName}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {!isRendered && isExpanded && (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography>Loading...</Typography>
                        </Box>
                    )}

                    {isRendered && (
                        <>
                            {section.sectionId === "machinery_list" && (
                                <>
                                    <FormControl sx={{ pl: 2 }}>
                                        <Typography fontWeight={700} mb={1}>Engine Type</Typography>
                                        <RadioGroup row value={shipType} onChange={(e) => setShipType(e.target.value)}>
                                            <FormControlLabel value="crosshead_type_engine" control={<Radio />} label="Crosshead Type Engine" />
                                            <FormControlLabel value="inline_trunk_piston_engine" control={<Radio />} label="Inline Trunk Piston Engine" />
                                            <FormControlLabel value="vee_type_trunk_piston_engine" control={<Radio />} label="Vee-Type Trunk Piston Engine" />
                                        </RadioGroup>
                                    </FormControl>

                                    <Grid2 container spacing={2} sx={{ mb: 3, mt: 2 }}>
                                        <Grid2 size={{ xs: 12, md: 4 }}>
                                            <Typography fontWeight={700} mb={1} sx={{ ml: 2 }}>No. of cylinders</Typography>
                                            <TextField
                                                sx={{ ml: 2 }}
                                                placeholder="Enter no of cylinders"
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                value={noOfCylinders}
                                                onChange={(e) => setNoOfCylinders(e.target.value)}
                                            />
                                        </Grid2>

                                        <Grid2 size={{ xs: 12, md: 4, ml: 2 }}>
                                            <Typography fontWeight={700} mb={1} sx={{ ml: 2 }}>Global Position</Typography>
                                            <Select
                                                sx={{ ml: 2 }}
                                                multiple
                                                variant="outlined"
                                                fullWidth
                                                size="small"
                                                displayEmpty
                                                value={position}
                                                onChange={(e) => setPosition(e.target.value)}
                                                renderValue={(selected) => selected?.join("")}
                                            >
                                                {POSITION_OPTIONS.map((opt) => (
                                                    <MenuItem key={opt.code} value={opt.code}>
                                                        <Checkbox checked={position?.includes(opt.code)} />
                                                        <Typography>{opt.name} ({opt.code})</Typography>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </Grid2>
                                    </Grid2>


                                    <Grid2 size={{ xs: 12, md: 4 }} sx={{ display: { xs: "none", md: "flex" }, flexDirection: "row" }}>
                                        <Typography fontWeight={700} mt={1} sx={{ ml: 2 }}>Main engine units counted from :</Typography>
                                        <RadioGroup row value={engineUnitsCountedFrom} onChange={(e) => setEngineUnitsCountedFrom(e.target.value)} sx={{ ml: 3 }}   >
                                            <FormControlLabel value="flywheel_end" control={<Radio />} label="Flywheel end" />
                                            <FormControlLabel value="free_end" control={<Radio />} label="Free end" />
                                        </RadioGroup>
                                    </Grid2>
                                </>
                            )}

                            <Grid2 container spacing={2} alignItems="center" sx={{ mb: 2, mt: 2, fontWeight: 700 }}>
                                <Grid2 size={{ xs: 12, md: 0.6 }}></Grid2>
                                <Grid2 size={{ xs: 12, md: 3.3 }}>Description</Grid2>
                                <Grid2 size={{ xs: 12, md: 2 }}>Position / No.</Grid2>
                                <Grid2 size={{ xs: 12, md: 2 }}>Assignment Date</Grid2>
                                {showDueDate && <Grid2 size={{ xs: 12, md: 2 }}>Due Date</Grid2>}
                                {showFrom && !showDueDate && <Grid2 size={{ xs: 12, md: 2 }}>From Frame No.</Grid2>}
                                {showDueDate && <Grid2 size={{ xs: 12, md: 2 }}>Postponed Date</Grid2>}
                                {showFrom && !showDueDate && <Grid2 size={{ xs: 12, md: 2 }}>Upto Frame No.</Grid2>}
                            </Grid2>

                            {allRows.map((row) => renderRow(row, sectionType, sectionNum))}

                            <Box mt={3} textAlign="right">
                                <CommonButton variant="outlined" size="small" text="Add Row" onClick={() => handleAddRow(sectionType, sectionNum)} />
                            </Box>
                        </>
                    )}
                </AccordionDetails>
            </Accordion>
        );
    };

    const renderFormView = () => {
        const currentSections = tabValue === 0 ? MACHINERY_SECTIONS : HULL_SECTIONS;
        const sectionType = tabValue === 0 ? "machinery" : "hull";

        return (
            <Card sx={{ p: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" fontWeight={600}>
                        {editingId ? 'Edit Machine' : 'Add Machine'}
                    </Typography>
                    {/* <Button variant="outlined" onClick={() => {
                        setView('list');
                        resetForm();
                    }}>
                        Back to List
                    </Button> */}
                </Box>

                <FormControl fullWidth sx={{ maxWidth: 300, mb: 3 }}>
                    <Typography sx={{ fontWeight: 700, mb: 2 }}>Select Ship</Typography>
                    <Select
                        value={selectedShip.id || ""}
                        onChange={handleClientChange}
                        disabled={!!editingId}
                    >
                        <MenuItem value="">&nbsp;</MenuItem>
                        {clientsList.map((client) => (
                            <MenuItem key={client.id} value={client.id}>
                                {client.shipName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <CardContent>
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                            <Tab label="Machinery" />
                            <Tab label="Hull" />
                        </Tabs>
                    </Box>

                    {Object.keys(currentSections).map((sectionNum) =>
                        renderSection(sectionNum, currentSections[sectionNum], sectionType)
                    )}

                    <Box mt={4} textAlign="end">
                        <CommonButton
                            variant="outlined"
                            sx={{ mr: 2 }}
                            onClick={() => {
                                resetForm();
                                router.push('/machine-list');
                            }}
                            text="cancel"
                        >
                            Cancel
                        </CommonButton>
                        <CommonButton
                            variant="contained"
                            size="large"
                            onClick={handleSubmit}
                            text={editingId ? 'Update' : 'Submit'}
                        />
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <>
            {renderFormView()}
        </>
    );
};

export default MachineryHullManager;
