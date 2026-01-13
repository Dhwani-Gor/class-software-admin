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

const OTHER_THAN_TANK = [
    "Examination",
    "Test"
]

const getRowKey = (row) => {
    return row.label?.trim() || `__id__${row.id}`;
};

const TANK_SECTION_IDS = [
    "slop_tanks",
    "dry_tanks_void_spaces",
    "peak_tanks",
    "W.B & Storage tank/s",
    "cargo_tank_for_tankers_only"
];


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
    const [originalBlocks, setOriginalBlocks] = useState([]);
    const [engineUnitsCountedFrom, setEngineUnitsCountedFrom] = useState("flywheel_end");
    const [expandedAccordions, setExpandedAccordions] = useState({});
    const [renderedSections, setRenderedSections] = useState({});
    const router = useRouter();

    const STATIC_ROWS_SECTION_01 = [
        { id: "01", content: "No {cyl} Cyl, Cvr, Pstn, Rod, Vlvs & gears", hasPosition: true, hasFromTo: false },
        { id: "02", content: "No {cyl}, Con Rod, Top end & Guides", hasPosition: true, hasFromTo: false },
        { id: "03", content: "No {cyl} Crankpin, Bearing & webs", hasPosition: true, hasFromTo: false },
        { id: "04", label: "Main journal and bearing", hasFromTo: true, isDue: true, isFrom: false, repeatPerCylinder: false },
        { id: "05", label: "O.F. injection pump, h.p .o.f. pipes & shielding", hasFromTo: true, isDue: true, isFrom: false, repeatPerCylinder: false },
    ];


    const SPECIAL_TANK_ROWS = [
        { id: "01", label: "Examination", hasPosition: false, isDue: true, isFrom: false },
        { id: "02", label: "Test", hasPosition: false, isDue: true, isFrom: false },

    ];

    const OTHER_TANK_ROWS = [
        { id: "01", label: "Examination", hasPosition: false, isDue: true, isFrom: false },
        { id: "02", label: "Test", hasPosition: false, isDue: true, isFrom: false },
    ];

    const extractTankNumbers = (sectionName = "") => {
        const matches = sectionName.match(/No\.(\d+)/gi) || [];
        return matches.map((m) => parseInt(m.replace(/\D/g, ""), 10));
    };

    const detectTankType = (section) => {
        if (!section?.sectionName) return null;

        const name = section.sectionName.toLowerCase();

        const hasTankNumber = /no\.?\s*\d+/.test(name);
        if (!hasTankNumber) return null;

        if (name.includes("cargo tank")) return "cargo";
        if (name.includes("ballast tank")) return "ballast";
        if (name.includes("forepeak tank")) return "forepeak";
        if (name.includes("aftpeak tank")) return "aftpeak";
        if (name.includes("slop tank")) return "slop";

        return "other";
    };

    const rebuildUserAddedRowsFromMachineData = (machineData = []) => {
        const rebuilt = { machinery: {}, hull: {} };

        machineData.forEach((block) => {
            const type = block.sectionType;
            const sectionNum = String(block.sectionNumber);

            const staticRows =
                type === "machinery"
                    ? MACHINERY_SECTIONS[sectionNum]?.rows || []
                    : HULL_SECTIONS[sectionNum]?.rows || [];

            block.items.forEach((item) => {
                const label = item.label?.trim();
                if (!label) return;

                const existsInStatic = staticRows.some(
                    (r) => r.label === label
                );

                if (existsInStatic) return;

                rebuilt[type][sectionNum] ||= [];

                if (!rebuilt[type][sectionNum].some((r) => r.label === label)) {
                    rebuilt[type][sectionNum].push({
                        id: item.generatedCode, // stable UI key
                        label,
                        hasPosition: true,
                        isDue: true,
                        isFrom: false,
                        isUserAdded: true,
                    });
                }
            });
        });

        return rebuilt;
    };

    const getTankRowsForSection = (section, sectionType) => {
        if (sectionType !== "hull") return [];

        const tankType = detectTankType(section);

        if (!tankType) return [];

        if (["cargo", "ballast", "forepeak", "aftpeak", "slop"].includes(tankType)) {
            return SPECIAL_TANK_ROWS;
        }

        return OTHER_TANK_ROWS;
    };


    const generateRowInstances = (
        sectionNum,
        row,
        data,
        isMachineryList = false
    ) => {
        const instances = [];
        if (isMachineryList) {
            const positions =
                data.position?.length
                    ? data.position
                    : position?.length
                        ? position
                        : ["-"];
            let repetitions = 1;

            if (row.hasFromTo) {
                repetitions = Math.max(
                    1,
                    (parseInt(data.to) || 1) - (parseInt(data.from) || 1) + 1
                );
            }
            else if (["01", "02", "03"].includes(String(row.id).padStart(2, "0"))) {
                repetitions = Number(noOfCylinders || 1);
            }

            positions.forEach((pos) => {
                for (let i = 1; i <= repetitions; i++) {
                    const occ = row.hasFromTo
                        ? (parseInt(data.from) || 1) + i - 1
                        : i;

                    let contentText = "";

                    if (["01", "02", "03"].includes(String(row.id).padStart(2, "0"))) {
                        contentText = row.content.replace("{cyl}", occ);
                    }
                    else if (row.hasFromTo) {
                        contentText = `No ${occ} ${row.label}`;
                    }
                    else {
                        contentText = row.label;
                    }

                    instances.push({
                        generatedCode: isMachineryList
                            ? `${String(sectionNum).padStart(2, "0")}` +
                            pos +
                            `${String(row.id).padStart(2, "0")}` +
                            `${String(occ).padStart(2, "0")}`
                            : `${String(sectionNum).padStart(2, "0")}` +
                            `${String(row.id).padStart(2, "0")}` +
                            `${String(occ).padStart(2, "0")}` +
                            pos,
                        occurrence: occ,
                        positionCode: pos,
                        content: contentText,
                        label: row.label,
                        assignmentDate: data.assignmentDate || "",
                        dueDate: data.dueDate || "",
                        postponeDate: data.postponeDate || "",
                        status: data.status || "",
                        from: row.hasFromTo ? data.from : "",
                        to: row.hasFromTo ? data.to : "",
                        fromFrameNo: row.hasFromTo ? data.fromFrameNo : "",
                        toFrameNo: row.hasFromTo ? data.toFrameNo : "",
                        isTank: false,
                    });
                }
            });

            return instances;
        }

        /* =========================
           NORMAL HULL ROWS (FIXED)
        ========================== */
        const positions = data.position?.length ? data.position : ["-"];
        const repetitions = row.hasFromTo
            ? Math.max(1, (parseInt(data.to) || 1) - (parseInt(data.from) || 1) + 1)
            : 1;

        positions.forEach((pos) => {
            for (let i = 1; i <= repetitions; i++) {
                const occ = row.hasFromTo ? (parseInt(data.from) || 1) + i - 1 : i;

                const baseCode =
                    `${String(sectionNum).padStart(2, "0")}` +
                    `${String(row.id).padStart(2, "0")}` +
                    `${String(occ).padStart(2, "0")}` +
                    pos;

                const finalLabel = data?.label?.trim() || row.label?.trim();

                instances.push({
                    generatedCode: baseCode,
                    label: finalLabel,
                    content: row.hasFromTo
                        ? `No ${occ} ${finalLabel}`
                        : finalLabel,
                    occurrence: occ,
                    positionCode: pos,
                    assignmentDate: data.assignmentDate || "",
                    dueDate: data.dueDate || "",
                    postponeDate: data.postponeDate || "",
                    status: data.status || "",
                    from: data.from,
                    to: data.to,
                    fromFrameNo: data.fromFrameNo,
                    toFrameNo: data.toFrameNo,
                    isTank: row.isTankRow === true,
                });



                if (row.isTankRow === true) {
                    OTHER_THAN_TANK.forEach((label, index) => {
                        instances.push({
                            generatedCode: `${baseCode}${index + 1}`,
                            occurrence: index + 1,
                            positionCode: "-",
                            content: label,
                            label: label,
                            postponeDate: data.postponeDate || "",
                            status: data.status || "",
                            assignmentDate: data.assignmentDate || "",
                            dueDate: data.dueDate || "",
                            from: data.from,
                            to: data.to,
                            isTank: true,
                        });
                    });
                }
            }
        });

        return instances;
    };


    const hydrateFormDataFromMachineData = (blocks = []) => {
        const hydrated = {};

        const normalizeRowKey = (item, sectionType) => {
            if (item.label?.trim()) return item.label.trim();

            if (sectionType === "machinery" && item.content) {
                return item.content.replace(/^No\s+\d+\s*/i, "").trim();
            }

            return item.content?.trim();
        };

        blocks.forEach((block) => {
            const sectionType = block.sectionType;
            const sectionNum = String(block.sectionNumber);

            block.items.forEach((item) => {
                const rowKey = normalizeRowKey(item, sectionType);
                if (!rowKey) return;

                const fieldKey = `${sectionType}-${sectionNum}-${rowKey}`;

                if (!hydrated[fieldKey]) {
                    hydrated[fieldKey] = {
                        xMark: "X",
                        label: item.label || rowKey,
                        content: item.content || "",
                        status: item.status || "",
                        assignmentDate: item.assignmentDate || "",
                        dueDate: item.dueDate || "",
                        postponeDate: item.postponeDate || "",
                        position:
                            item.globalPositionCode
                                ? [item.globalPositionCode]
                                : item.positionCode && item.positionCode !== "-"
                                    ? [item.positionCode]
                                    : [],
                        from: item.from || "",
                        to: item.to || "",
                        fromFrameNo: item.fromFrameNo || "",
                        toFrameNo: item.toFrameNo || "",
                    };
                }
            });
        });

        return hydrated;
    };

    const isTankSectionFromData = (sectionType, sectionNum) => {
        if (sectionType !== "hull") return false;

        const originalSection = originalBlocks.find(
            (b) => String(b.sectionNumber) === String(sectionNum)
        );

        return (
            originalSection?.items?.some((i) => i.isTank === true) ||
            getTankRowsForSection(
                HULL_SECTIONS[sectionNum],
                "hull"
            ).length > 0
        );
    };


    const mergeBlocks = (oldBlocks = [], newBlocks = []) => {
        const merged = [];

        oldBlocks.forEach((oldBlock) => {
            const updatedBlock = newBlocks.find(
                (b) => b.sectionId === oldBlock.sectionId
            );

            if (!updatedBlock) {
                merged.push(oldBlock);
            } else {
                const itemMap = new Map();

                oldBlock.items.forEach((item) => {
                    itemMap.set(item.generatedCode, item);
                });

                updatedBlock.items.forEach((item) => {
                    itemMap.set(item.generatedCode, item);
                });

                merged.push({
                    ...updatedBlock,
                    items: Array.from(itemMap.values()),
                });
            }
        });

        newBlocks.forEach((block) => {
            if (!merged.some((b) => b.sectionId === block.sectionId)) {
                merged.push(block);
            }
        });

        return merged;
    };

    const generatePayload = () => {
        const payload = {
            shipId: selectedShip.id,
            shipName: selectedShip.shipName,
            engineType: shipType,
            numberOfCylinders: noOfCylinders,
            globalPosition: position,
            engineUnitsCountedFrom,
            blocks: [],
        };

        const sectionGroups = [
            { type: "machinery", sections: MACHINERY_SECTIONS },
            { type: "hull", sections: HULL_SECTIONS },
        ];

        sectionGroups.forEach(({ type, sections }) => {
            Object.keys(sections).forEach((sectionNum) => {
                const section = sections[sectionNum];
                const dynamicRowsForSection = dynamicRows[type][sectionNum] || [];

                const tankRows = getTankRowsForSection(section, type);
                const isTankSection = tankRows.length > 0;
                const tankNumbers = isTankSection ? extractTankNumbers(section.sectionName) : [];

                const allRows = isTankSection
                    ? [...section.rows, ...tankRows, ...dynamicRowsForSection]
                    : [...section.rows, ...dynamicRowsForSection];

                // if (editingId && originalBlocks.length) {
                //     payload.blocks = originalBlocks;
                //     return payload;
                // }

                let finalItems = [];
                const isMachineryList = section.sectionId === "machinery_list";

                if (sectionNum === "01" && isMachineryList) {
                    STATIC_ROWS_SECTION_01.forEach((staticRow) => {
                        finalItems.push(
                            ...generateRowInstances(sectionNum, staticRow, {}, true, false, [], '')
                        );
                    });
                }

                allRows.forEach((row, rowIndex) => {
                    const rowKey = getRowKey(row);
                    const fieldKey = `${type}-${sectionNum}-${rowKey}`;
                    const data = formData[fieldKey];
                    const isTankRow =
                        isTankSection &&
                        SPECIAL_TANK_ROWS.some((r) => r.id === row.id);

                    if (data?.xMark === "X" || isTankRow) {
                        const repeated = generateRowInstances(
                            sectionNum,
                            row,
                            data,
                            isMachineryList,
                            isTankSection,
                            tankNumbers,
                            section.sectionName
                        ).map((item, itemIndex) => {
                            const baseItem = {
                                ...item,
                                sequence: `${sectionNum}-${rowIndex}-${itemIndex}`,
                            };

                            // HULL → only frame numbers
                            if (type === "hull") {
                                delete baseItem.dueDate;
                                delete baseItem.postponeDate;
                            }

                            // MACHINERY → only due & postponed
                            if (type === "machinery") {
                                delete baseItem.fromFrameNo;
                                delete baseItem.toFrameNo;
                            }

                            return baseItem;
                        });

                        finalItems.push(...repeated);
                    }
                });

                if (finalItems.length > 0) {
                    payload.blocks.push({
                        sectionType: type,
                        isHull: type === "hull",
                        isTank: isTankSection,
                        tankType: isTankSection ? detectTankType(section.sectionName) : null,
                        sectionNumber: Number(sectionNum),
                        sectionName: section.sectionName,
                        sectionId: section.sectionId,
                        items: finalItems,
                    });
                }
            });
        });

        const checkedRowPrefixes = new Set();

        Object.entries(formData).forEach(([key, value]) => {
            if (value?.xMark === "X") {
                const [, sectionNum, rowKey] = key.split("-");
                const rowIdMatch = rowKey.match(/\d+/); // extracts row id
                if (rowIdMatch) {
                    const rowId = rowIdMatch[0].padStart(2, "0");
                    checkedRowPrefixes.add(`${sectionNum.padStart(2, "0")}${rowId}`);
                }
            }
        });

        if (editingId) {
            const cleanedOldBlocks = originalBlocks.map((oldBlock) => {
                const sectionNum = String(oldBlock.sectionNumber).padStart(2, "0");

                const cleanedItems = oldBlock.items.filter((item) => {
                    if (!item.generatedCode) return false;

                    // ✅ Keep ONLY if its parent row is still checked
                    return Array.from(checkedRowPrefixes).some((prefix) =>
                        item.generatedCode.startsWith(prefix)
                    );
                });

                return {
                    ...oldBlock,
                    items: cleanedItems,
                };
            });

            return {
                ...payload,
                blocks: mergeBlocks(cleanedOldBlocks, payload.blocks),
            };
        }


        return payload;
    };

    const calculateDueDate = (assignmentDate) => {
        if (!assignmentDate) return "";
        const date = new Date(assignmentDate);
        date.setFullYear(date.getFullYear() + 5);
        return date.toISOString().split("T")[0];
    };

    const updateField = (sectionType, sectionNum, rowId, key, value) => {
        const rowKey =
            typeof rowId === "string" ? rowId : `__id__${rowId}`;

        const fieldKey = `${sectionType}-${sectionNum}-${rowKey}`;

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
            const currentSections =
                sectionType === "machinery" ? MACHINERY_SECTIONS : HULL_SECTIONS;

            const section = currentSections[sectionNum];
            const currentDynamicRows = prev[sectionType][sectionNum] || [];

            const tankRows = getTankRowsForSection(section, sectionType);
            const isTankSection =
                sectionType === "hull" &&
                TANK_SECTION_IDS.includes(section.sectionId);

            const existingIds = [
                ...section.rows.map((r) => r.id),
                ...tankRows.map((r) => r.id),
                ...currentDynamicRows.map((r) => r.id),
            ];

            const nextId = Math.max(...existingIds, 0) + 1;

            const newRow =
                sectionType === "hull"
                    ? {
                        id: nextId,
                        label: "",
                        hasPosition: true,
                        isFrom: true,
                        isDue: false,
                        isUserAdded: true,
                        isTankRow: isTankSection,


                    }
                    : {
                        id: nextId,
                        label: "",
                        hasPosition: true,
                        isDue: true,
                        isFrom: false,
                        isUserAdded: true,
                    };

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

                    setShipType(data.engineType);
                    setNoOfCylinders(data.numberOfCylinders);
                    setPosition(data.globalPosition || []);
                    setEngineUnitsCountedFrom(data.engineUnitsCountedFrom || "flywheel_end");
                    setFormData(hydrateFormDataFromMachineData(data.machineData));
                    setDynamicRows(rebuildUserAddedRowsFromMachineData(data.machineData));
                    setOriginalBlocks(data.machineData);

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
        console.log("sectionType", sectionType);
        console.log("sectionNum", sectionNum);
        const isTankHull = isTankSectionFromData(sectionType, sectionNum);
        const hullFrameSections = [40, 41, 42, 43, 44];

        const isHullFrameSection =
            sectionType === "hull" && hullFrameSections.includes(Number(sectionNum));
        const rowKey = getRowKey(row);
        const fieldKey = `${sectionType}-${sectionNum}-${rowKey}`;

        const isChecked = formData[fieldKey]?.xMark === "X";

        return (
            <Grid2 key={`${fieldKey}`} xs={12} mt={2}>
                <Grid2 container spacing={2} alignItems="center">
                    <Grid2 size={{ xs: 12, md: 0.6 }}>
                        <Checkbox
                            checked={isChecked}
                            onChange={(e) =>
                                updateField(
                                    sectionType,
                                    sectionNum,
                                    getRowKey(row),
                                    "xMark",
                                    e.target.checked ? "X" : "-"
                                )
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
                                onChange={(e) => updateField(sectionType, sectionNum, getRowKey(row), "label", e.target.value)}
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
                                onChange={(e) => updateField(sectionType, sectionNum, getRowKey(row), "position", e.target.value)}
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
                                        onChange={(e) => updateField(sectionType, sectionNum, getRowKey(row), "from", e.target.value)}
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
                                        onChange={(e) => updateField(sectionType, sectionNum, getRowKey(row), "to", e.target.value)}
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
                            onChange={(e) => updateField(sectionType, sectionNum, getRowKey(row), "assignmentDate", e.target.value)}
                        />
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 2 }}>
                        {isHullFrameSection ? (
                            <TextField
                                type="text"
                                variant="standard"
                                fullWidth
                                label="From"
                                disabled={!isChecked}
                                InputLabelProps={{ shrink: true }}
                                value={formData[fieldKey]?.fromFrameNo || ""}
                                onChange={(e) =>
                                    updateField(sectionType, sectionNum, rowKey, "fromFrameNo", e.target.value)
                                }
                            />
                        ) : row.isDue && !row.isFrom ? (
                            <TextField
                                type="date"
                                variant="standard"
                                fullWidth
                                label="Due Date"
                                disabled={!isChecked}
                                InputLabelProps={{ shrink: true }}
                                value={formData[fieldKey]?.dueDate || ""}
                                onChange={(e) =>
                                    updateField(sectionType, sectionNum, rowKey, "dueDate", e.target.value)
                                }
                            />
                        ) : (
                            <Box sx={{ height: "40px" }} />
                        )}
                    </Grid2>


                    <Grid2 size={{ xs: 12, md: 2 }}>
                        {isHullFrameSection ? (
                            <TextField
                                type="text"
                                variant="standard"
                                fullWidth
                                label="Upto"
                                disabled={!isChecked}
                                InputLabelProps={{ shrink: true }}
                                value={formData[fieldKey]?.toFrameNo || ""}
                                onChange={(e) =>
                                    updateField(sectionType, sectionNum, rowKey, "toFrameNo", e.target.value)
                                }
                            />
                        ) : row.isDue && !row.isFrom ? (
                            <TextField
                                type="date"
                                variant="standard"
                                fullWidth
                                label="Postponed Date"
                                disabled={!isChecked}
                                InputLabelProps={{ shrink: true }}
                                value={formData[fieldKey]?.postponeDate || ""}
                                onChange={(e) =>
                                    updateField(sectionType, sectionNum, rowKey, "postponeDate", e.target.value)
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
        const tankRows =
            sectionType === "hull"
                ? getTankRowsForSection(section, sectionType)
                : [];

        const allRows = [...section.rows, ...tankRows, ...dynamicRowsForSection];

        const showDueDate = allRows.some((r) => r.isDue);
        const showFrom = allRows.some((r) => r.isFrom);
        const isTankHull = isTankSectionFromData(sectionType, sectionNum);
        const hullFrameSections = [40, 41, 42, 43, 44];


        const isHullFrameSection =
            sectionType === "hull" && hullFrameSections.includes(Number(sectionNum));
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
                                {!isTankHull && showDueDate && (
                                    <Grid2 size={{ xs: 12, md: 2 }}>Due Date</Grid2>
                                )}

                                {isHullFrameSection && (
                                    <Grid2 size={{ xs: 12, md: 2 }}>From Frame No.</Grid2>
                                )}

                                {!isHullFrameSection && showDueDate && (
                                    <Grid2 size={{ xs: 12, md: 2 }}>Postponed Date</Grid2>
                                )}

                                {isHullFrameSection && (
                                    <Grid2 size={{ xs: 12, md: 2 }}>Upto Frame No.</Grid2>
                                )}

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