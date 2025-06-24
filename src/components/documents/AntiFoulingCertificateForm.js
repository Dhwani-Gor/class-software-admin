"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogActions, TextField, Box, Typography, IconButton,
  Divider, Button, Accordion, AccordionSummary, AccordionDetails,
  TextareaAutosize
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import {
  Close as CloseIcon, ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon, Science as ScienceIcon
} from "@mui/icons-material";
import { formattedDate } from "@/utils/date";

const AntiFoulingCertificateForm = ({ open, onClose, onSubmit, fields, reportDetails }) => {
  const [formValues, setFormValues] = useState({});
  const [expandedSection, setExpandedSection] = useState("systemInfo");

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

  const handleInputChange = (fieldName, value) => {
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const applyStrikethrough = (text) =>
    text?.split("").map(c => c + "\u0336").join("");


  const handleSubmit = () => {
    const filledValues = Object.entries(formValues).reduce((acc, [key, value]) => {
      if (key.startsWith("_st_")) {
        const [, raw] = key.split("_st_");
        const [opt1Raw, opt2Raw] = raw.split("_");
        const opt1 = opt1Raw.replace(/-/g, " ");
        const opt2 = opt2Raw.replace(/-/g, " ");

        if (!value) {
          acc[key] = `{{${key}}}`;
        } else {
          const finalLine =
            value === opt1
              ? `${opt1} / ${applyStrikethrough(opt2)}*`
              : `${applyStrikethrough(opt1)} / ${opt2}*`;

          acc[key] = finalLine;
        }
      } else if (typeof value === "boolean") {
        acc[key] = value ? "☑" : "☒";
      }else if (key.includes("date") && value) {
        acc[key] = formattedDate(value);
      } else if (typeof value === "string" && value.trim()) {
        acc[key] = value;
      }

      return acc;
    }, {});

    onSubmit(filledValues);
  };

  const formatLabel = (attribute) =>
    attribute.replace(/^_/, "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const cleanFields = fields

  const categorizeFields = (fields) => {
    const categories = {
      systemInfo: [],
      facilityInfo: [],
      sealerInfo: [],
    };
    fields.forEach(field => {
      const attr = field.attribute.toLowerCase();
      if (/_types|_cas_no|_manufacturer|_name_and_color/.test(attr)) {
        categories.systemInfo.push(field);
      } else if (/_removed_|_sealercoat_facility/.test(attr)) {
        categories.facilityInfo.push(field);
      } else if (/_sealercoat_type|_sealercoat(_date)?$/.test(attr)) {
        categories.sealerInfo.push(field);
      } else {
        categories.systemInfo.push(field);
      }
    });
    return categories;
  };

  const { systemInfo, facilityInfo, sealerInfo } = categorizeFields(cleanFields);

  const renderFields = (fieldList) => {
    const checkboxes = [];
    const others = [];

    fieldList.forEach(field => {
      const attr = field.attribute;
      const isCheckbox = attr.startsWith("_checkbox");
      if (isCheckbox) checkboxes.push(field);
      else others.push(field);
    });

    return (
      <>
        {/* Group all checkboxes in one row */}
        {checkboxes.length > 0 && (
          <Grid2 container spacing={2} sx={{ mb: 5 }}>
            {checkboxes.map(field => {
              const attr = field.attribute;
              return (
                <Grid2 key={attr} xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" sx={{ height: '100%' }}>
                    <input
                      type="checkbox"
                      checked={!!formValues[attr]}
                      onChange={(e) => handleInputChange(attr, e.target.checked)}
                    />
                    <Typography sx={{ ml: 1 }}>{field.label || formatLabel(attr)}</Typography>
                  </Box>
                </Grid2>
              );
            })}
          </Grid2>
        )}

        {/* Render the remaining fields in a separate group */}
        <Grid2 container spacing={2}>
          {others.map(field => {
            const attr = field.attribute;
            const isDate = attr.includes("date");
            const isStrikethroughRadio = attr.startsWith("_st_");
            const isTextarea = attr.startsWith("_ta_");

            if (isStrikethroughRadio) {
              const [, raw] = attr.split("_st_");
              const [opt1Raw, opt2Raw] = raw.split("_");
              const label1 = opt1Raw.replace(/-/g, " ");
              const label2 = opt2Raw.replace(/-/g, " ");
              const value = formValues[attr];

              return (
                <Grid2 size={{ xs: 12, sm: 6, md: 6 }} key={attr}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {field.label || formatLabel(attr)}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <label>
                      <input
                        type="radio"
                        name={attr}
                        value={label1}
                        checked={value === label1}
                        onChange={() => handleInputChange(attr, label1)}
                      />{" "}
                      {label1}
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={attr}
                        value={label2}
                        checked={value === label2}
                        onChange={() => handleInputChange(attr, label2)}
                      />{" "}
                      {label2}
                    </label>
                  </Box>
                </Grid2>
              );
            }

            if (isTextarea) {
              return (
                <Box sx={{ minWidth: '100%' }} key={attr}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {field.label || formatLabel(attr)}
                  </Typography>
                  <TextareaAutosize
                    style={{ minWidth: '100%' }}
                    minRows={4}
                    multiline
                    label={field.label || formatLabel(attr)}
                    value={formValues[attr] || ""}
                    onChange={(e) => handleInputChange(attr, e.target.value)}
                    placeholder={formatLabel(attr).toLowerCase()}
                  />
                </Box>
              );
            }

            return (
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={attr}>
                <TextField
                  fullWidth
                  size="small"
                  title={field.label || formatLabel(attr)}
                  label={field.label || formatLabel(attr)}
                  value={formValues[attr] || ""}
                  onChange={(e) => handleInputChange(attr, e.target.value)}
                  placeholder={formatLabel(attr).toLowerCase()}
                  type={isDate ? "date" : "text"}
                  InputLabelProps={isDate ? { shrink: true } : undefined}
                />
              </Grid2>
            );
          })}
        </Grid2>
      </>
    );
  };

  const renderCategoryAccordion = (title, key, fieldList) => {
    if (!fieldList?.length) return null;
    return (
      <Accordion
        expanded={expandedSection === key}
        onChange={() => setExpandedSection(expandedSection === key ? null : key)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            {title}
            <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
              ({fieldList?.filter(f => formValues[f.attribute])?.length}/{fieldList?.length})
            </Typography>
          </Typography>
        </AccordionSummary>
        <AccordionDetails>{renderFields(fieldList)}</AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth PaperProps={{ sx: { height: '95vh', maxHeight: '1000px' } }}>
      <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScienceIcon sx={{ color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>Anti-Fouling System Details</Typography>
              <Typography variant="body2">Fill in the anti-fouling system and treatment data</Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent dividers sx={{ p: 3 }}>
        {renderCategoryAccordion("System Details", "systemInfo", systemInfo)}
        {renderCategoryAccordion("Facility & Treatment Info", "facilityInfo", facilityInfo)}
        {renderCategoryAccordion("Sealer Coat Info", "sealerInfo", sealerInfo)}
      </DialogContent>
      <Divider />

      <DialogActions sx={{ p: 3, background: 'white', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          onClick={handleClose}
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

export default AntiFoulingCertificateForm;
