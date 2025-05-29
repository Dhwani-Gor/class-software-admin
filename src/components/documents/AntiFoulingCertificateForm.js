"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogActions, TextField, Box, Typography, IconButton,
  Divider, Button, Accordion, AccordionSummary, AccordionDetails,Grid2
} from "@mui/material";
import {
  Close as CloseIcon, ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon, Science as ScienceIcon
} from "@mui/icons-material";

const AntiFoulingCertificateForm = ({ open, onClose, onSubmit, fields }) => {
  const [formValues, setFormValues] = useState({});
  const [expandedSection, setExpandedSection] = useState("systemInfo");

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
      if (value?.trim()) acc[key] = value;
      return acc;
    }, {});
    onSubmit(filledValues);
  };

  const formatLabel = (attribute) =>
    attribute.replace(/^_/, "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const categorizeFields = (fields) => {
    const categories = {
      systemInfo: [],
      facilityInfo: [],
      sealerInfo: []
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

  const { systemInfo, facilityInfo, sealerInfo } = categorizeFields(fields);

  const renderFields = (fieldList) => (
    <Grid2 container spacing={2}>
      {fieldList.map(field => (
        <Grid2 size={{ xs: 12, sm: 6, md: 3 }} key={field.attribute}>
          <TextField
            fullWidth
            size="small"
            label={formatLabel(field.attribute)}
            value={formValues[field.attribute] || ""}
            onChange={(e) => handleInputChange(field.attribute, e.target.value)}
            placeholder={`Enter ${formatLabel(field.attribute).toLowerCase()}`}
          />
        </Grid2>
      ))}
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
              ({fieldList?.filter(f => formValues[f.attribute]?.trim())?.length}/{fieldList?.length})
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

export default AntiFoulingCertificateForm;
