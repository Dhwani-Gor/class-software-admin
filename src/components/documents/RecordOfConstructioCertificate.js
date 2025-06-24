import React, { useEffect, useState } from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Divider,
    Card,
    CardContent,
    DialogActions,
    Dialog,
    Button,
    Grid2,
    IconButton,
    DialogContent,
    FormControlLabel,
    Checkbox,
    TextareaAutosize
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Science as ScienceIcon, Close as CloseIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { formattedDate, formatDate } from "@/utils/date";

const IAPPForm = ({ open, onClose, onSubmit, fields, reportDetails }) => {
    const [expandedSection, setExpandedSection] = useState("systemInfo");

    const [formValues, setFormValues] = useState({});

    const isStrikethroughText = (text) => text?.split('').some(c => c === '\u0336');

    useEffect(() => {
        if (fields && fields.length > 0) {
            const initialValues = {};
            fields.forEach(field => {
                if (field.attribute.startsWith("_checkbox")) {
                    if (reportDetails && reportDetails[field.attribute] === "\u2611") {
                        initialValues[field.attribute] = true;
                    } else {
                        initialValues[field.attribute] = false;
                    }
                } else if (field.attribute.startsWith("_st")) {
                    if (reportDetails && reportDetails[field.attribute]) {

                        const parts = reportDetails[field.attribute]?.split('/').map(s => s.trim());
                        const [option1, option2] = parts;
                        if (isStrikethroughText(option1)) {
                            initialValues[field.attribute] = option2;
                        } else if (isStrikethroughText(option2)) {
                            initialValues[field.attribute] = option1;
                        } else {
                            initialValues[field.attribute] = "";
                        }
                    } else {
                        initialValues[field.attribute] = "";
                    }
                }
                else {
                    if (reportDetails && reportDetails[field.attribute]) {
                        initialValues[field.attribute] = reportDetails[field.attribute];
                    } else {
                        initialValues[field.attribute] = "";
                    }
                }
            });
            setFormValues(initialValues);
        }
    }, [fields, open]);

    const handleClose = () => {
        onClose();
        setFormValues({});
    };

    const handleInputChange = (field, value) => {
        setFormValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const applyStrikethrough = (text) =>
        text?.split("").map(c => c + "\u0336").join("");

    const handleSubmit = () => {
        const finalPayload = {};

        fields.forEach(({ attribute }) => {
            const value = formValues[attribute];

            if (attribute.startsWith("_st_")) {
                const [, raw] = attribute.split("_st_");
                const [opt1Raw, opt2Raw] = raw.split("_");
                const opt1 = opt1Raw.replace(/-/g, " ");
                const opt2 = opt2Raw.replace(/-/g, " ");

                if (!value) {
                    finalPayload[attribute] = `{{${attribute}}}`;
                } else {
                    finalPayload[attribute] =
                        value === opt1
                            ? `${opt1} / ${applyStrikethrough(opt2)}`
                            : `${applyStrikethrough(opt1)} / ${opt2}`;
                }
            } else if (attribute.startsWith("_checkbox")) {
                finalPayload[attribute] = value === true ? "\u2611" : "\u2612";
            } else if (attribute.includes("date") && value) {
                finalPayload[attribute] = formattedDate(value);
            } else {
                finalPayload[attribute] = value || "";
            }
        });

        onSubmit(finalPayload);
    };

    const engineFields = [];

    for (let i = 1; i <= 6; i++) {
        fields.forEach(field => {
            const fixedAttr = field.attribute?.replace("_engine__", `_engine_${i}_`);
            engineFields.push({
                label: `Engine ${i} ${field.label?.replace('Engine ', '')}`,
                attribute: fixedAttr
            });
        });
    }

    const vocFields = fields.filter(field =>
        field.attribute && field.attribute.includes('_IAPP_VOC_')
    );

    // Filter checkbox fields for VOC section
    const checkboxFields = fields.filter(field =>
        field.attribute && (
            field.attribute.includes('checkbox') ||
            field.attribute.startsWith('_checkbox')
        )
    );

    const radioFields = fields.filter(field =>
        field.attribute && field.attribute.startsWith('_st_')
    );

    const remarksFields = fields.filter(field =>
        field.attribute && field.attribute.startsWith('_ta_')
    );

    const groupedOzoneFields = [];
    for (let i = 1; i <= 5; i++) {
        const eqField = fields.find(f => f.attribute === `_IAPP_oz_eq_${i}`);
        const locField = fields.find(f => f.attribute === `_IAPP_oz_loc_${i}`);
        const subField = fields.find(f => f.attribute === `_IAPP_oz_sub_${i}`);
        if (eqField || locField || subField) {
            groupedOzoneFields.push({
                equipment: eqField,
                location: locField,
                substance: subField
            });
        }
    }

    // Group HCFC fields similarly
    const groupedHcfcFields = [];
    for (let i = 1; i <= 5; i++) {
        const eqField = fields.find(f => f.attribute === `_IAPP_HCFC_eq_${i}`);
        const locField = fields.find(f => f.attribute === `_IAPP_HCFC_loc_${i}`);
        const subField = fields.find(f => f.attribute === `_IAPP_HCFC_sub_${i}`);
        if (eqField || locField || subField) {
            groupedHcfcFields.push({
                equipment: eqField,
                location: locField,
                substance: subField
            });
        }
    }

    const groupedEngineFields = {};

    engineFields.forEach(field => {
        const match = field.attribute.match(/^_(?:date_|checkbox_)?engine_(\d+)_(.+)$/);
        if (match) {
            const engineNum = match[1];
            const key = match[2];
            if (!groupedEngineFields[engineNum]) groupedEngineFields[engineNum] = {};
            groupedEngineFields[engineNum][key] = field.attribute;
        }
    });

    const groupedEquivalentFields = [];
    for (let i = 1; i <= 5; i++) {
        const eqField = fields.find(f => f.attribute === `_IAPP_reg4_eq_${i}`);
        const locField = fields.find(f => f.attribute === `_IAPP_reg4_loc_${i}`);
        const refField = fields.find(f => f.attribute === `_IAPP_reg4_ref_${i}`);
        if (eqField || locField || refField) {
            groupedEquivalentFields.push({
                equipment: eqField,
                location: locField,
                reference: refField
            });
        }
    }

    const fieldLabels = {
        ship_name: 'Ship Name',
        IMO_no: 'IMO Number',
        keel_laid_date: 'Keel Laid Date',
        length: 'Length (L) metres',
        _IAPP_VOC_ref: 'VOC Management Plan Approval Reference',
        issuance_place: 'Issuance Place',
        issuance_date: 'Issuance Date',
        issued_by: 'Issued By',
        company_stamp: 'Company Stamp'
    }

    const renderBasicFields = (fieldList, title) => {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                    {title}
                </Typography>
                <Grid2 container spacing={2}>
                    {fieldList.map(field => {
                        const attr = field.attribute;
                        const isCheckbox = attr?.includes("checkbox") || attr?.startsWith("_checkbox");
                        const isDate = attr?.includes("date") || attr?.endsWith("_date");
                        const isTextarea = attr.startsWith("_ta_");
                        const isStrikethroughRadio = attr.startsWith("_st_");
                        const value = formValues[attr];

                        if (isCheckbox) {
                            return (
                                <Grid2 item xs={12} sm={6} md={4} key={attr}>
                                    <Box display="flex" alignItems="center" sx={{ height: '100%' }}>
                                        <input
                                            type="checkbox"
                                            checked={!!value}
                                            onChange={(e) => handleInputChange(attr, e.target.checked)}
                                        />
                                        <Typography sx={{ ml: 1 }}>{field.label || formatLabel(attr)}</Typography>
                                    </Box>
                                </Grid2>
                            );
                        }

                        if (isStrikethroughRadio) {
                            const [, raw] = attr.split("_st_");
                            const [opt1Raw, opt2Raw] = raw.split("_");
                            const opt1 = opt1Raw.replace(/-/g, " ");
                            const opt2 = opt2Raw.replace(/-/g, " ");

                            return (
                                <Grid2 item xs={12} sm={6} md={4} key={attr}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>{field.label}</Typography>
                                    <Box display="flex" flexDirection="column" gap={1}>
                                        <label>
                                            <input
                                                type="radio"
                                                name={attr}
                                                value={opt1}
                                                checked={value === opt1}
                                                onChange={() => handleInputChange(attr, opt1)}
                                            /> {opt1}
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name={attr}
                                                value={opt2}
                                                checked={value === opt2}
                                                onChange={() => handleInputChange(attr, opt2)}
                                            /> {opt2}
                                        </label>
                                    </Box>
                                </Grid2>
                            );
                        }

                        if (isTextarea) {
                            return (
                                <>
                                    <Typography variant="body2">
                                        {field.label}
                                    </Typography>
                                    <Box sx={{ width: '100%' }}>
                                        <TextareaAutosize
                                            style={{ width: '100%' }}
                                            minRows={4}
                                            value={value || ""}
                                            onChange={(e) => handleInputChange(attr, e.target.value)}
                                            placeholder={field.label}
                                        />
                                    </Box>
                                </>
                            );
                        }

                        return (
                            <Grid2 item xs={12} sm={6} md={4} key={attr}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label={field.label}
                                    title={field.label}
                                    value={isDate ? formatDate(value) : value || ""}
                                    onChange={(e) => handleInputChange(attr, e.target.value)}
                                    placeholder={field.label}
                                    type={isDate ? "date" : "text"}
                                    InputLabelProps={isDate ? { shrink: true } : undefined}
                                />
                            </Grid2>
                        );
                    })}
                </Grid2>
            </Box>
        );
    };


    const renderTableWithGroups = (groups, title, columns) => (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                    {title}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                {columns.map(col => (
                                    <TableCell key={col.key} sx={{ fontWeight: 'bold' }}>
                                        {col.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groups.map((group, index) => {
                                return (
                                    <TableRow key={index} sx={{
                                        '&:nth-of-type(odd)': { bgcolor: '#fafafa' },
                                        '&:hover': { bgcolor: '#f0f7ff' }
                                    }}>
                                        {columns.map(col => {
                                            const fieldObj = group[col.key];
                                            const attr = fieldObj?.attribute;
                                            const isCheckbox = attr?.includes("checkbox") || attr?.startsWith("_checkbox");
                                            const isDate = attr?.includes("date");

                                            return (
                                                <TableCell key={col.key}>
                                                    {isCheckbox ? (
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={!!formValues[fieldObj?.attribute]}
                                                                    onChange={(e) => handleInputChange(fieldObj?.attribute, e.target.checked)}
                                                                    color="primary"
                                                                    size="small"
                                                                />
                                                            }
                                                            label={fieldObj?.label}
                                                        />
                                                    ) : (
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label={fieldObj?.label}
                                                            value={isDate ? formatDate(formValues[fieldObj?.attribute]) : formValues[fieldObj?.attribute] || ""}
                                                            onChange={(e) => handleInputChange(fieldObj?.attribute, e.target.value)}
                                                            placeholder={fieldObj?.label}
                                                            type={isDate ? "date" : "text"}
                                                            InputLabelProps={isDate ? { shrink: true } : undefined}
                                                        />
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );

    const renderEngineTable = () => {
        const engineNumbers = Object.keys(groupedEngineFields)
            .filter(key => key !== 'undefined' && !!groupedEngineFields[key])
            .sort();
        if (engineNumbers.length === 0) {
            return (
                <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                            Engine Information (NOx Regulation 13)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            No engine fields found in the document.
                        </Typography>
                    </CardContent>
                </Card>
            );
        }

        const engineAttributes = [
            { key: 'MM', label: 'Manufacturer & Model' },
            { key: 'SL', label: 'Serial Number' },
            { key: 'app_cycle', label: 'Application Cycle' },
            { key: 'power', label: 'Rated Power (kW)' },
            { key: 'speed', label: 'Rated Speed (RPM)' },
            { key: '6', label: 'Identical Engine Exempted' },
            { key: '7', label: 'Installation Date' }
        ];

        const tierAttributes = [
            { key: '8a', label: 'Major Conversion 13.2.1.1 & 13.2.2' },
            { key: '8b', label: 'Major Conversion 13.2.1.2 & 13.2.3' },
            { key: '8c', label: 'Major Conversion 13.2.1.3 & 13.2.3' },
            { key: '9a', label: 'Tier I - 13.3' },
            { key: '9b', label: 'Tier I - 13.2.2' },
            { key: '9c', label: 'Tier I - 13.2.3.1' },
            { key: '9d', label: 'Tier I - 13.2.3.2' },
            { key: '9e', label: 'Tier I - 13.7.1.2' },
            { key: '10a', label: 'Tier II - 13.4' },
            { key: '10b', label: 'Tier II - 13.2.2' },
            { key: '10c', label: 'Tier II - 13.2.2 (Tier III not possible)' },
            { key: '10d', label: 'Tier II - 13.2.3.2' },
            { key: '10e', label: 'Tier II - 13.5.2 (Exemptions)' },
            { key: '10f', label: 'Tier II - 13.7.1.2' },
            { key: '11a', label: 'Tier III (ECA-NOx) - 13.5.1.1' },
            { key: '11b', label: 'Tier III (ECA-NOx) - 13.2.2' },
            { key: '11c', label: 'Tier III (ECA-NOx) - 13.2.3.2' },
            { key: '11d', label: 'Tier III (ECA-NOx) - 13.7.1.2' },
            { key: '12', label: 'AM Installed' },
            { key: '13', label: 'AM Not Commercially Available' },
            { key: '14', label: 'AM Not Applicable' }
        ];

        return (
            <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                        Engine Information (NOx Regulation 13)
                    </Typography>

                    {/* Basic Engine Information */}
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                        Basic Engine Details
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Attribute</TableCell>
                                    {engineNumbers.map(num => (
                                        <TableCell key={num} sx={{ fontWeight: 'bold' }}>
                                            Engine #{num}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {engineAttributes.map(attr => (
                                    <TableRow key={attr.key} sx={{
                                        '&:nth-of-type(odd)': { bgcolor: '#fafafa' },
                                        '&:hover': { bgcolor: '#f0f7ff' }
                                    }}>
                                        <TableCell sx={{ fontWeight: 'medium' }}>{attr.label}</TableCell>
                                        {engineNumbers.map(num => {
                                            const fieldKey = groupedEngineFields[num]?.[attr.key];
                                            console.log(fieldKey, "field key")
                                            const isCheckbox = fieldKey?.includes("checkbox") || fieldKey?.startsWith("_checkbox");
                                            const isDate = fieldKey?.includes("date") || fieldKey?.endsWith("_date");
                                            return (
                                                <TableCell key={num}>
                                                    {isCheckbox ? (
                                                        <Box display="flex" alignItems="center" sx={{ height: '100%' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={!!formValues[fieldKey]}
                                                                onChange={(e) => handleInputChange(fieldKey, e.target.checked)}
                                                            />
                                                            <Typography sx={{ ml: 1 }}>{attr.label}</Typography>
                                                        </Box>
                                                    ) : (
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label={attr.label}
                                                            value={isDate ? formatDate(formValues[fieldKey]) : formValues[fieldKey] || ""}
                                                            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                            disabled={!fieldKey}
                                                            placeholder={!fieldKey ? "N/A" : ""}
                                                            type={isDate ? "date" : "text"}
                                                            InputLabelProps={isDate ? { shrink: true } : undefined}
                                                        />
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Tier Compliance Information */}
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                        Tier Compliance & Regulations
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Regulation</TableCell>
                                    {engineNumbers.map(num => (
                                        <TableCell key={num} sx={{ fontWeight: 'bold' }}>
                                            Engine #{num}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tierAttributes.map(attr => (
                                    <TableRow key={attr.key} sx={{
                                        '&:nth-of-type(odd)': { bgcolor: '#fafafa' },
                                        '&:hover': { bgcolor: '#f0f7ff' }
                                    }}>
                                        <TableCell sx={{ fontWeight: 'medium', fontSize: '0.85rem' }}>
                                            {attr.label}
                                        </TableCell>
                                        {engineNumbers.map(num => {
                                            const fieldKey = groupedEngineFields[num]?.[attr.key];
                                            const isDate = fieldKey?.includes("date");
                                            const isCheckbox = fieldKey?.includes("checkbox") || fieldKey?.startsWith("_checkbox");
                                            return (
                                                <TableCell key={num}>
                                                    {isCheckbox ? (
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={!!formValues[fieldKey]}
                                                                    onChange={(e) => handleInputChange(fieldKey, e.target.checked)}
                                                                    color="primary"
                                                                    size="small"
                                                                />
                                                            }
                                                            label=""
                                                        />
                                                    ) : (
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label={attr.label}
                                                            value={isDate ? formatDate(formValues[fieldKey]) : formValues[fieldKey] || ""}
                                                            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                            disabled={!fieldKey}
                                                            placeholder={!fieldKey ? "N/A" : ""}
                                                            type={isDate ? "date" : "text"}
                                                            InputLabelProps={isDate ? { shrink: true } : undefined}
                                                        />
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        );
    };

    const getEngineFieldStats = () => {
        let total = 0;
        let filled = 0;

        Object.values(groupedEngineFields).forEach(engineFieldGroup => {
            Object.values(engineFieldGroup || {}).forEach(fieldKey => {
                total += 1;
                const value = formValues[fieldKey];

                if (
                    (typeof value === "boolean") ||
                    (typeof value === "string" && value.trim())
                ) {
                    filled += 1;
                }
            });
        });

        return { filled, total };
    };


    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: { height: '95vh', maxHeight: '1000px' }
            }}
        >
            <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ScienceIcon sx={{ color: 'white' }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>IAPP Certificate - Record of Construction and Equipment</Typography>
                            <Typography variant="body2">International Air Pollution Prevention Certificate Supplement</Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={handleClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>
            <DialogContent dividers sx={{ p: 3 }}>

                <Accordion
                    expanded={expandedSection === "ozone"}
                    onChange={() => setExpandedSection(expandedSection === "ozone" ? null : "ozone")}
                    sx={{ mb: 2 }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">
                            Ozone-Depleting Substances (Regulation 12)
                            <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
                                <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
                                    ({
                                        groupedOzoneFields?.filter(group =>
                                            (group.equipment && formValues[group.equipment.attribute]) ||
                                            (group.location && formValues[group.location.attribute]) ||
                                            (group.substance && formValues[group.substance.attribute])
                                        ).length
                                    }/{groupedOzoneFields?.length})
                                </Typography>
                            </Typography>
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {renderTableWithGroups(
                            groupedOzoneFields,
                            "Fire-extinguishing systems and equipment containing ozone depleting substances",
                            [
                                { key: 'equipment', label: 'System Equipment' },
                                { key: 'location', label: 'Location on Board' },
                                { key: 'substance', label: 'Substance' }
                            ]
                        )}
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    expanded={expandedSection === "hcfc"}
                    onChange={() => setExpandedSection(expandedSection === "hcfc" ? null : "hcfc")}
                    sx={{ mb: 2 }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">
                            HCFC Systems (Regulation 12)
                            <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
                                ({
                                    groupedHcfcFields?.filter(group =>
                                        (group.equipment && formValues[group.equipment.attribute]) ||
                                        (group.location && formValues[group.location.attribute]) ||
                                        (group.substance && formValues[group.substance.attribute])
                                    ).length
                                }/{groupedHcfcFields?.length})
                            </Typography>

                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {renderTableWithGroups(
                            groupedHcfcFields,
                            "Systems containing hydro-chlorofluorocarbons (HCFCs)",
                            [
                                { key: 'equipment', label: 'System Equipment' },
                                { key: 'location', label: 'Location on Board' },
                                { key: 'substance', label: 'Substance' }
                            ]
                        )}
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    expanded={expandedSection === "engine"}
                    onChange={() => setExpandedSection(expandedSection === "engine" ? null : "engine")}
                    sx={{ mb: 2 }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">
                            Nitrogen Oxides (NOx) - Engine Information
                            <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
                                ({getEngineFieldStats().filled}/{getEngineFieldStats().total})
                            </Typography>
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {renderEngineTable()}
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    expanded={expandedSection === "voc"}
                    onChange={() => setExpandedSection(expandedSection === "voc" ? null : "voc")}
                    sx={{ mb: 2 }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Volatile Organic Compounds (VOCs)
                            <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
                                ({vocFields?.filter(f => formValues[f.attribute])?.length}/{vocFields?.length})
                            </Typography>
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {renderBasicFields(vocFields)}
                    </AccordionDetails>
                </Accordion>
                <Accordion
                    expanded={expandedSection === "shipboard"}
                    onChange={() => setExpandedSection(expandedSection === "shipboard" ? null : "shipboard")}
                    sx={{ mb: 2 }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Shipboard incineration (Regulation 12)
                            <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
                                ({checkboxFields?.filter(f => formValues[f.attribute])?.length}/{checkboxFields?.length + radioFields?.length + remarksFields?.length})
                            </Typography>
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {renderBasicFields([...checkboxFields])}
                        {renderBasicFields([...radioFields])}
                        {renderBasicFields([...remarksFields])}
                    </AccordionDetails>
                </Accordion>
                <Accordion
                    expanded={expandedSection === "equivalent"}
                    onChange={() => setExpandedSection(expandedSection === "equivalent" ? null : "equivalent")}
                    sx={{ mb: 2 }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Equivalent Arrangements (Regulation 4)
                            <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
                                ({
                                    groupedEquivalentFields?.filter(group =>
                                        (group.equipment && formValues[group.equipment.attribute]) ||
                                        (group.location && formValues[group.location.attribute]) ||
                                        (group.reference && formValues[group.reference.attribute])
                                    ).length
                                }/{groupedEquivalentFields?.length})
                            </Typography>

                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {renderTableWithGroups(
                            groupedEquivalentFields,
                            "Alternative fittings, materials, appliances or procedures",
                            [
                                { key: 'equipment', label: 'System Equipment' },
                                { key: 'location', label: 'Location on Board' },
                                { key: 'reference', label: 'Approval Reference' }
                            ]
                        )}
                    </AccordionDetails>
                </Accordion>
            </DialogContent>
            <Divider sx={{ borderColor: 'rgba(102, 126, 234, 0.1)' }} />
            <DialogActions
                sx={{
                    p: 3,
                    background: 'white',
                    gap: 2,
                    justifyContent: 'flex-end'
                }}
            >
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="large"
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: 'rgba(102, 126, 234, 0.3)',
                        color: 'text.secondary',
                        '&:hover': {
                            borderColor: 'primary.main',
                            background: 'rgba(102, 126, 234, 0.04)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                        },
                        transition: 'all 0.2s ease'
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    size="large"
                    startIcon={<CheckIcon />}
                    sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.6)'
                        },
                        transition: 'all 0.2s ease'
                    }}
                >
                    Generate Report
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default IAPPForm;