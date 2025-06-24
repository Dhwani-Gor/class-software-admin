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
  CheckCircle as CheckIcon, Waves as WavesIcon
} from "@mui/icons-material";
import { formattedDate } from "@/utils/date";

const applyStrikethrough = (text) =>
  text?.split("").map((c) => c + "\u0336").join("");

const LoadLineCertificateForm = ({ open, onClose, onSubmit, fields, reportDetails }) => {
  const [formValues, setFormValues] = useState({});
  const [expandedSection, setExpandedSection] = useState("freeboard");

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
              ? `${opt1} / ${applyStrikethrough(opt2)}`
              : `${applyStrikethrough(opt1)} / ${opt2}`;

          acc[key] = finalLine;
        }
      } else if (typeof value === "boolean") {
        acc[key] = value ? "\u2611" : "\u2612";
      } else if (key.includes("date") && value) {
        acc[key] = formattedDate(value);
      } else if (typeof value === "string" && value.trim()) {
        acc[key] = value;
      }

      return acc;
    }, {});

    onSubmit(filledValues);
  };

  const categorizeFields = (fields) => {
    const categories = {
      freeboard: [],
      timberFreeboard: [],
      allowance: [],
      others: []
    };

    fields.forEach(field => {
      const attr = field.attribute.toLowerCase();
      if (/_tropical_|_summer_|_winter_|_wna/.test(attr)) {
        categories.freeboard.push(field);
      } else if (/timber/.test(attr) || /_lwna/.test(attr)) {
        categories.timberFreeboard.push(field);
      } else if (/fw|upper_edge/.test(attr)) {
        categories.allowance.push(field);
      } else {
        categories.others.push(field);
      }
    });

    return categories;
  };

  const { freeboard, timberFreeboard, allowance, others } = categorizeFields(fields);

  const renderFields = (fieldList) => (
    <Grid2 container spacing={2}>
      {fieldList.map(field => {
        const attr = field.attribute;
        const isDate = attr.includes("date");
        const isCheckbox = attr.startsWith("_checkbox");
        const isStrikethroughRadio = attr.startsWith("_st_");
        const isTextarea = attr.startsWith("_ta_");

        if (isCheckbox) {
          return (
            <Grid2 size={{ xs: 12, sm: 12, md: 3 }} key={attr}>
              <Box display="flex" alignItems="center" sx={{ height: '100%' }}>
                <input
                  type="checkbox"
                  checked={!!formValues[attr]}
                  onChange={(e) => handleInputChange(attr, e.target.checked)}
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {field.label}
                </Typography>
              </Box>
            </Grid2>
          );
        }

        if (isStrikethroughRadio) {
          const [, rawOptions] = attr.split("_st_");
          const [option1, option2] = rawOptions.split("_");
          const label1 = option1.replace(/-/g, " ");
          const label2 = option2.replace(/-/g, " ");
          const value = formValues[attr] || "";

          return (
            <Grid2 size={{ xs: 12, sm: 12, md: 6 }} key={attr}>
              <Typography variant="body2" sx={{ mb: 1 }}>{field.label}</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <label>
                  <input
                    type="radio"
                    name={attr}
                    value={label1}
                    checked={value === label1}
                    onChange={() => handleInputChange(attr, label1)}
                  /> {label1}
                </label>
                <label>
                  <input
                    type="radio"
                    name={attr}
                    value={label2}
                    checked={value === label2}
                    onChange={() => handleInputChange(attr, label2)}
                  /> {label2}
                </label>
              </Box>
            </Grid2>
          );
        }

        if (isTextarea) {
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
                placeholder={field.label}
              />
            </Grid2>
          );
        }

        return (
          <Grid2 size={{ xs: 12, sm: 12, md: 3 }} key={attr}>
            <TextField
              fullWidth
              size="small"
              label={field.label}
              title={field.label}
              value={formValues[attr] || ""}
              onChange={(e) => handleInputChange(attr, e.target.value)}
              type={isDate ? "date" : "text"}
              InputLabelProps={isDate ? { shrink: true } : undefined}
            />
          </Grid2>
        );
      })}
    </Grid2>
  );

  const renderCategoryAccordion = (title, key, icon, fieldList) => {
    if (!fieldList.length) return null;
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
              ({fieldList.filter(f => formValues[f.attribute]?.toString().trim()).length}/{fieldList.length})
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
              <WavesIcon sx={{ color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>Load Line Certificate Details</Typography>
              <Typography variant="body2">Provide measurements and allowance details</Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent dividers sx={{ p: 3 }}>
        {renderCategoryAccordion("Freeboard & Load Line", "freeboard", "📏", freeboard)}
        {renderCategoryAccordion("Timber Load Lines", "timberFreeboard", "🌲", timberFreeboard)}
        {renderCategoryAccordion("Fresh Water Allowance", "allowance", "💧", allowance)}
        {renderCategoryAccordion("Others", "others", "", others)}
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          p: 3,
          background: 'white',
          gap: 2,
          justifyContent: 'flex-end'
        }}
      >
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

export default LoadLineCertificateForm;