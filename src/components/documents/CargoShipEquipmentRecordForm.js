"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogActions,
  TextField, Box, Typography, IconButton, Grid2, Divider, Button, Accordion, AccordionSummary, AccordionDetails,
  TextareaAutosize,
} from "@mui/material";
import {
  Close as CloseIcon, ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon, Report as ReportIcon
} from "@mui/icons-material";

const CSSForm = ({ open, onClose, onSubmit, fields }) => {
  const [formValues, setFormValues] = useState({});
  const [expandedSection, setExpandedSection] = useState("lifeSaving");

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

  const strikeThrough = (text) => text.split("").map(char => char + "̶").join("");

  const handleSubmit = () => {
    const filledValues = Object.entries(formValues).reduce((acc, [key, value]) => {
      if (typeof value === "boolean") {
        acc[key] = value === true ? "☑" : "☐";
      } else if (key.startsWith("_st_")) {
        const [, raw] = key.split("_st_");
        const [opt1Raw, opt2Raw] = raw.split("_");
        const opt1 = opt1Raw.replace(/-/g, " ");
        const opt2 = opt2Raw.replace(/-/g, " ");

        if (value === opt1) {
          acc[key] = `${opt1} / ${strikeThrough(opt2)}`;
        } else if (value === opt2) {
          acc[key] = `${strikeThrough(opt1)} / ${opt2}`;
        } else {
          acc[key] = `{{${key}}}`;
        }
      } else if (typeof value === "string" && value.trim()) {
        acc[key] = value;
      }
      return acc;
    }, {});
    onSubmit(filledValues);
  };

  const formatLabel = (attribute) =>
    attribute.replace(/^_CSS_/, "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const categorizeFields = (fields) => {
    const categories = {
      lifeSaving: [],
      navigation: [],
      uncategorized: [], // <-- add uncategorized fallback
    };
  
    fields.forEach((field) => {
      const attr = field.attribute;
      if (attr.startsWith("_CSS_nav_")) {
        categories.navigation.push(field);
      } else if (attr.startsWith("_CSS_")) {
        categories.lifeSaving.push(field);
      } else {
        categories.uncategorized.push(field); // catch remaining ones
      }
    });
  
    return categories;
  };
  

  const { lifeSaving, navigation, uncategorized } = categorizeFields(fields);

  const renderFields = (fieldList) => (
    <Grid2 container spacing={2}>
      {fieldList?.map(field => {
        const attr = field.attribute;
        const isCheckbox = attr.startsWith("_checkbox");
        const isDate = attr.includes("date");
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
          const [, raw] = attr.split("_st_");
          const [opt1Raw, opt2Raw] = raw.split("_");
          const label1 = opt1Raw.replace(/-/g, " ");
          const label2 = opt2Raw.replace(/-/g, " ");
          const value = formValues[attr];

          return (
            <Grid2 size={{ xs: 12, sm: 12, md: 6 }} key={attr}>
              <Typography variant="body2" sx={{ mb: 1 }}>{field.label || formatLabel(attr)}</Typography>
              <Box display="flex" alignItems="center" gap={2}>
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
                label={field.label || formatLabel(attr)}
                value={formValues[attr] || ""}
                onChange={(e) => handleInputChange(attr, e.target.value)}
                placeholder={formatLabel(attr).toLowerCase()}
              />
            </Grid2>
          );
        }

      return (
      <Grid2 size={{ xs: 12, sm: 12, md: 3 }} key={attr}>
        <TextField
          fullWidth
          size="small"
          label={field.label || formatLabel(attr)}
          value={formValues[attr] || ""}
          onChange={(e) => handleInputChange(attr, e.target.value)}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          type={isDate ? "date" : "text"}
          InputLabelProps={isDate ? { shrink: true } : undefined}
        />
      </Grid2>
      );
      })}
    </Grid2>
  );

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
              ({fieldList.filter(f => formValues[f.attribute]?.trim()).length}/{fieldList.length})
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
              <ReportIcon sx={{ color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>CSS Equipment Details</Typography>
              <Typography variant="body2">Fill out cargo ship safety and equipment details including construction info, oil filtering systems, manuals, waivers, and monitoring systems.</Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent dividers sx={{ p: 3 }}>
        {renderCategoryAccordion("Life-Saving Appliances", "lifeSaving", lifeSaving)}
        {renderCategoryAccordion("Navigational Systems", "navigation", navigation)}
        {renderCategoryAccordion("Other Fields", "uncategorized", uncategorized)}

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

export default CSSForm;