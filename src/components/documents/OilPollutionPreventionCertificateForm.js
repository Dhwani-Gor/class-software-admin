"use client";
import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    Typography,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Divider,
    Button,
    Grid2,
    TextareaAutosize,
} from "@mui/material";
import {
    Close as CloseIcon,
    Description as ReportIcon,
    CheckCircle as CheckIcon,
    ExpandMore as ExpandMoreIcon
} from "@mui/icons-material";

const SuppForm = ({ open, onClose, onSubmit, fields }) => {
    const [formValues, setFormValues] = useState({});
    const [expandedSection, setExpandedSection] = useState("basicInfo");

    useEffect(() => {
        if (fields?.length) {
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

    const handleInputChange = (fieldName, value) => {
        setFormValues(prev => ({ ...prev, [fieldName]: value }));
    };
    const applyStrikethrough = (text) =>
        text.split("").map(c => c + "\u0336").join("");

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
            } else {
                finalPayload[attribute] = value || "";
            }
        });

        onSubmit(finalPayload);
    };


    const extractCheckboxFields = (fields = []) => {
        return fields?.filter(f => f.attribute?.startsWith("_checkbox"));
    };

    const checkboxFields = extractCheckboxFields(fields);

    const categorizeByCustomGroups = (fields = []) => {
        const categories = {
            shipConstruction: [],
            oilFiltering: [],
            manuals: [],
            slopTanks: [],
            waivers: [],
            odmcs: [],
            others: []
        };

        fields.forEach(field => {
            const attr = field.attribute?.toLowerCase();
            if (/conversion|trade_engagement|drg_no|approve_by_5_7|approve_on_5_7|reg_28|input_5_8|admin_verification/.test(attr)) {
                categories.shipConstruction.push(field);
            } else if (/iopp_manufacturer_14|iopp_type_model_14|iopp_meter_|max_throughput|special_voyage_area|acceptable_means/.test(attr)) {
                categories.oilFiltering.push(field);
            } else if (/manual_approve|approve_by_8|approve_on_8|approve_(by|on)_6_1_6/.test(attr)) {
                categories.manuals.push(field);
            } else if (/slop_tank|category_6_1/.test(attr)) {
                categories.slopTanks.push(field);
            } else if (/exemption|equivalent|input_6_5/.test(attr)) {
                categories.waivers.push(field);
            } else if (/iopp_manufacturer_6_1_a|iopp_type_model_6_1_b/.test(attr)) {
                categories.odmcs.push(field);
            }
            else {
                if (!field.attribute?.startsWith("_checkbox")) {
                    categories.others.push(field);
                }
            }
        });
        return categories;
    };

    const customCategories = categorizeByCustomGroups(fields);


    const renderFieldCategory = (categoryFields) => (
        <Grid2 container spacing={2}>
            {categoryFields?.map((field) => {
                const attr = field.attribute;
                const isCheckbox = attr.startsWith("_checkbox");
                const isDate = attr.includes("date");
                const isTextarea = attr.startsWith("_ta_");
                const isStrikethroughRadio = attr.startsWith("_st_");

                if (isCheckbox) {
                    return (
                        <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={attr}>
                            <Box display="flex" alignItems="center" sx={{ height: '100%' }}>
                                <input
                                    type="checkbox"
                                    checked={!!formValues[attr]}
                                    onChange={(e) => handleInputChange(attr, e.target.checked)}
                                />
                                <Typography sx={{ ml: 1 }}>{field.label}</Typography>
                            </Box>
                        </Grid2>
                    );
                }

                if (isStrikethroughRadio) {
                    const [, raw] = attr.split("_st_");
                    const [opt1Raw, opt2Raw] = raw.split("_");
                    const opt1 = opt1Raw.replace(/-/g, " ");
                    const opt2 = opt2Raw.replace(/-/g, " ");
                    const value = formValues[attr];

                    return (
                        <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={attr}>
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
                    console.log(isTextarea, "is textarea")
                    return (
                        <Grid2 size={{ xs: 12 }} key={attr}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                {field.label || formatLabel(attr)}
                            </Typography>
                            <TextareaAutosize
                                style={{ width: '100%' }}
                                minRows={4}
                                multiline
                                label={field.label}
                                value={formValues[attr] || ""}
                                onChange={(e) => handleInputChange(attr, e.target.value)}
                                placeholder={field.label.toLowerCase()}
                            />
                        </Grid2>
                    );
                }
                return (
                    <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={attr}>
                        <TextField
                            variant="outlined"
                            fullWidth
                            title={field.label}
                            size="small"
                            label={field.label}
                            value={formValues[attr] || ""}
                            onChange={(e) => handleInputChange(attr, e.target.value)}
                            placeholder={field.label}
                            type={isDate ? "date" : "text"}
                            InputLabelProps={isDate ? { shrink: true } : undefined}
                        />
                    </Grid2>
                );
            })}
        </Grid2>
    );

    const renderCategoryAccordion = (title, key, icon, categoryFields) => {
        if (categoryFields?.length === 0) return null;
        return (
            <Accordion
                expanded={expandedSection === key}
                onChange={() => setExpandedSection(expandedSection === key ? null : key)}
                sx={{ mb: 2 }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {title}
                        <Typography
                            component="span"
                            variant="body2"
                            color="primary"
                            sx={{ ml: 1, fontWeight: 'medium' }}
                        >
                            ({categoryFields?.filter(f => {
                                const value = formValues[f.attribute];
                                return typeof value === "boolean" ? value : value?.trim();
                            })?.length}/{categoryFields?.length})

                        </Typography>
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {renderFieldCategory(categoryFields)}
                </AccordionDetails>
            </Accordion>
        );
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth PaperProps={{ sx: { height: '95vh', maxHeight: '1000px' } }}>
            <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', p: 3, position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                            <ReportIcon sx={{ fontSize: 24, color: 'white' }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                                International Oil Pollution Prevention Certificate
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Provide additional information to generate your report
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={handleClose} sx={{ color: 'white', background: 'rgba(255,255,255,0.1)', '&:hover': { background: 'rgba(255,255,255,0.2)', transform: 'scale(1.05)' }, transition: 'all 0.2s ease' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            <DialogContent dividers sx={{ p: 3 }}>
                {renderCategoryAccordion("Ship Construction & General Info", "shipConstruction", "🚢", customCategories.shipConstruction)}
                {renderCategoryAccordion("Oil Filtering & Equipment", "oilFiltering", "⚙️", customCategories.oilFiltering)}
                {renderCategoryAccordion("Manuals & Approvals", "manuals", "📘", customCategories.manuals)}
                {renderCategoryAccordion("Slop Tanks & Oil Management", "slopTanks", "🛢️", customCategories.slopTanks)}
                {renderCategoryAccordion("Regulation Waivers / Exemptions", "waivers", "🌍", customCategories.waivers)}
                {renderCategoryAccordion("ODMCS System Info", "odmcs", "🖥️", customCategories.odmcs)}
                {renderCategoryAccordion("Ship Classification & Delivery Status", "shipClassification", "🖥️", checkboxFields)}
                {renderCategoryAccordion("Others", "others", "🖥️", customCategories.others)}
            </DialogContent>

            <Divider sx={{ borderColor: 'rgba(102, 126, 234, 0.1)' }} />

            <DialogActions sx={{ p: 3, background: 'white', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={handleClose} variant="outlined" size="large" sx={{ borderRadius: 2, px: 3, py: 1.5, textTransform: 'none', fontWeight: 600, borderColor: 'rgba(102, 126, 234, 0.3)', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', background: 'rgba(102, 126, 234, 0.04)', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)' }, transition: 'all 0.2s ease' }}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" size="large" startIcon={<CheckIcon />} sx={{ borderRadius: 2, px: 4, py: 1.5, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)', '&:hover': { background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(102, 126, 234, 0.6)' }, transition: 'all 0.2s ease' }}>
                    Generate Report
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SuppForm;