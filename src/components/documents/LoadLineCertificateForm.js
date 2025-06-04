"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogActions, TextField, Box, Typography, IconButton,
  Grid, Divider, Button, Accordion, AccordionSummary, AccordionDetails,
  Grid2
} from "@mui/material";
import {
  Close as CloseIcon, ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon, Waves as WavesIcon
} from "@mui/icons-material";

const LoadLineCertificateForm = ({ open, onClose, onSubmit, fields }) => {
  const [formValues, setFormValues] = useState({});
  const [expandedSection, setExpandedSection] = useState("freeboard");

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

  const handleSubmit = () => {
    const filledValues = Object.entries(formValues).reduce((acc, [key, value]) => {
      if (typeof value === "boolean") {
        acc[key] = value === true ? "\u2611" : "\u2610";
      } else if (typeof value === "string" && value.trim()) {
        acc[key] = value;
      }
      return acc;
    }, {});
    onSubmit(filledValues);
  };

  const formatLabel = (attribute) =>
    attribute.replace(/^_/, "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const categorizeFields = (fields) => {
    const categories = {
      freeboard: [],
      timberFreeboard: [],
      allowance: []
    };
    fields.forEach(field => {
      const attr = field.attribute.toLowerCase();
      if (/_tropical_|_summer_|_winter_|_wna/.test(attr)) {
        categories.freeboard.push(field);
      } else if (/timber/.test(attr) || /_lwna/.test(attr)) {
        categories.timberFreeboard.push(field);
      } else if (/fw|upper_edge/.test(attr)) {
        categories.allowance.push(field);
      }
    });
    return categories;
  };

  const { freeboard, timberFreeboard, allowance } = categorizeFields(fields);

  const renderFields = (fieldList) => (
    <Grid2 container spacing={2}>
      {fieldList.map(field => {
        const attr = field.attribute;
        const isDate = attr.includes("date");
        const isCheckbox = attr.startsWith("_checkbox");
        return (
          <Grid2 size={{ xs: 12, sm: 12, md: 3 }} key={field.attribute}>
            {isCheckbox ? (
              <Box display="flex" alignItems="center" sx={{ height: '100%' }}>
                <input
                  type="checkbox"
                  checked={!!formValues[field.attribute]}
                  onChange={(e) => handleInputChange(field.attribute, e.target.checked)}
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {field.label}
                </Typography>
              </Box>
            ) : (
              <TextField
                fullWidth
                size="small"
                label={field.label}
                value={formValues[field.attribute] || ""}
                onChange={(e) => handleInputChange(field.attribute, e.target.value)}
                type={isDate ? "date" : "text"}
                InputLabelProps={isDate ? { shrink: true } : undefined}
              />
            )}
          </Grid2>
        )
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
