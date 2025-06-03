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
    DialogContent
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Science as ScienceIcon, Close as CloseIcon } from '@mui/icons-material';

const IAPPForm = ({ open, onClose, onSubmit, fields }) => {
    const [formValues, setFormValues] = useState({});

    useEffect(() => {
        if (fields && fields?.length > 0) {
            const initialValues = {};
            fields.forEach(field => {
                initialValues[field?.attribute] = "";
            });
            setFormValues(initialValues);
        }
    }, [fields]);

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

    const handleSubmit = () => {
        const filledValues = Object?.entries(formValues).reduce((acc, [key, value]) => {
            if (value && value.trim() !== "") {
                acc[key] = value;
            }
            return acc;
        }, {});

        onSubmit(filledValues);
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
        const match = field.attribute.match(/^_engine_(\d+)_(.+)$/);
        if (match) {
            const engineNum = match[1];
            const fieldKey = match[2];
            if (!groupedEngineFields[engineNum]) groupedEngineFields[engineNum] = {};
            groupedEngineFields[engineNum][fieldKey] = field.attribute;
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

    const renderBasicFields = (fieldList, title) => (
        <Grid2 container spacing={2}>
            <Typography variant="h6" gutterBottom color="primary">
                {title}
            </Typography>
            <Grid2 container spacing={2}>
                {fieldList.map(field => (
                    <Grid2 item xs={12} sm={6} md={4} key={field.attribute}>
                        <TextField
                            fullWidth
                            size="small"
                            label={field.label}
                            value={formValues[field.attribute] || ""}
                            onChange={(e) => handleInputChange(field.attribute, e.target.value)}
                        />
                    </Grid2>
                ))}
            </Grid2>
        </Grid2>
    );

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
                            {groups.map((group, index) => (
                                <TableRow key={index} sx={{
                                    '&:nth-of-type(odd)': { bgcolor: '#fafafa' },
                                    '&:hover': { bgcolor: '#f0f7ff' }
                                }}>
                                    {columns.map(col => (
                                        <TableCell key={col.key}>
                                            <TextField
                                                fullWidth
                                                label={group[col.key]?.label}
                                                size="small"
                                                value={formValues[group[col.key]?.attribute] || ""}
                                                onChange={(e) => handleInputChange(group[col.key]?.attribute, e.target.value)}
                                                placeholder={group[col.key]?.attribute}
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );

    const renderEngineTable = () => {
        const engineNumbers = Object.keys(groupedEngineFields).sort();

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
                                            return (
                                                <TableCell key={num}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label={fieldKey}
                                                        value={formValues[fieldKey] || ""}
                                                        onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                        disabled={!fieldKey}
                                                        placeholder={!fieldKey ? "N/A" : ""}
                                                    />
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
                                            return (
                                                <TableCell key={num}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label={fieldKey}
                                                        value={formValues[fieldKey] || ""}
                                                        onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                                                        disabled={!fieldKey}
                                                        placeholder={!fieldKey ? "N/A" : ""}
                                                    />
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

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            Ozone-Depleting Substances (Regulation 12)
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

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">HCFC Systems (Regulation 12)</Typography>
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

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Nitrogen Oxides (NOx) - Engine Information</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {renderEngineTable()}
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Volatile Organic Compounds (VOCs)</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {renderBasicFields(vocFields, "VOC Management Plan")}
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Equivalent Arrangements (Regulation 4)</Typography>
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

                {/* <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6">Certificate Issuance Information</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {renderBasicFields(issuanceFields, "Issuance Details")}
                    </AccordionDetails>
                </Accordion> */}
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