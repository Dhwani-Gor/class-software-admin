"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  Button,
  Grid2,
} from "@mui/material";
// import {
//   Close as CloseIcon,
//   ExpandMore as ExpandMoreIcon,
// } from "@mui/icons-material";
import {
  Close as CloseIcon,
  Description as ReportIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon
} from "@mui/icons-material";

const InternationalTonnage = ({ open, onClose, onSubmit, fields }) => {
  const [formValues, setFormValues] = useState({});
  const [expandedSection, setExpandedSection] = useState("basicInfo");
  // Initialize form values
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

  const handleInputChange = (fieldName, value) => {
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value
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

  const formatLabel = (attribute) => {
    return attribute
      ?.replace(/^_/, '')
      ?.replace(/_/g, ' ')
      ?.replace(/\b\w/g, l => l.toUpperCase());
  };
  const organizeSpacesData = () => {
    const gtSpaces = [];
    const ntSpaces = [];

    for (let i = 1; i <= 20; i++) {
      const spaceAttr = `_GT_space_${i}`;
      const locAttr = `_GT_loc_${i}`;
      const lengthAttr = `_GT_length_${i}`;

      if (fields?.some(f => f.attribute === spaceAttr)) {
        gtSpaces.push({
          index: i,
          spaceAttr,
          locAttr,
          lengthAttr
        });
      }
    }
    
    for (let i = 1; i <= 20; i++) {
      const spaceAttr = `_NT_space_${i}`;
      const locAttr = `_NT_loc_${i}`;
      const lengthAttr = `_NT_length_${i}`;

      if (fields?.some(f => f.attribute === spaceAttr)) {
        ntSpaces.push({
          index: i,
          spaceAttr,
          locAttr,
          lengthAttr
        });
      }
    }

    return { gtSpaces, ntSpaces };
  };

  const { gtSpaces, ntSpaces } = organizeSpacesData();

  const organizeFields = () => {
    const categories = {
      basic: [],
      measurements: [],
      passengers: [],
      dates: [],
      construction: [],
      other: []
    };

    fields?.forEach(field => {
      const attr = field.attribute?.toLowerCase();
      if (attr?.includes('_gt_space_') || attr?.includes('_gt_loc_') || attr?.includes('_gt_length_') ||
        attr?.includes('_nt_space_') || attr?.includes('_nt_loc_') || attr?.includes('_nt_length_')) {
        return;
      }

      if (attr?.includes('breadth') || attr?.includes('depth') || attr?.includes('draught')) {
        categories.measurements.push(field);
      } else if (attr?.includes('passenger')) {
        categories.passengers.push(field);
      } else if (attr?.includes('date') || attr?.includes('ms_')) {
        categories.dates.push(field);
      } else if (attr?.includes('built') || attr?.includes('mast') || attr?.includes('deck') ||
        attr?.includes('material') || attr?.includes('stem') || attr?.includes('stern')) {
        categories.construction.push(field);
      } else if (attr?.includes('original') || attr?.includes('last') || attr?.includes('remark')) {
        categories.other.push(field);
      } else {
        categories.basic.push(field);
      }
    });

    return categories;
  };

  const fieldCategories = organizeFields();

  const renderSpacesTable = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f8f9fa' }}>
            <TableCell colSpan={3} align="center" sx={{ fontWeight: 'bold', borderRight: '2px solid #dee2e6' }}>
              GROSS TONNAGE
            </TableCell>
            <TableCell colSpan={3} align="center" sx={{ fontWeight: 'bold' }}>
              NET TONNAGE
            </TableCell>
          </TableRow>
          <TableRow sx={{ bgcolor: '#f1f3f4' }}>
            <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Name of Space</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Location (Frames)</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '8%', borderRight: '2px solid #dee2e6' }}>Length (m)</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Name of Space</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Location (Frames)</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '8%' }}>Length (m)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: Math.max(gtSpaces.length, ntSpaces.length) }, (_, index) => (
            <TableRow key={index} sx={{
              '&:nth-of-type(odd)': { bgcolor: '#fafafa' },
              '&:hover': { bgcolor: '#f0f7ff' }
            }}>
              {/* GT Fields */}
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                {gtSpaces[index] && (
                  <TextField
                    fullWidth
                    size="small"
                    value={formValues[gtSpaces[index].spaceAttr] || ""}
                    onChange={(e) => handleInputChange(gtSpaces[index].spaceAttr, e.target.value)}
                    placeholder="Space name"
                  />
                )}
              </TableCell>
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                {gtSpaces[index] && (
                  <TextField
                    fullWidth
                    size="small"
                    value={formValues[gtSpaces[index].locAttr] || ""}
                    onChange={(e) => handleInputChange(gtSpaces[index].locAttr, e.target.value)}
                    placeholder="Location"
                  />
                )}
              </TableCell>
              <TableCell sx={{ borderRight: '2px solid #dee2e6' }}>
                {gtSpaces[index] && (
                  <TextField
                    fullWidth
                    size="small"
                    value={formValues[gtSpaces[index].lengthAttr] || ""}
                    onChange={(e) => handleInputChange(gtSpaces[index].lengthAttr, e.target.value)}
                    placeholder="Length"
                  />
                )}
              </TableCell>

              {/* NT Fields */}
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                {ntSpaces[index] && (
                  <TextField
                    fullWidth
                    size="small"
                    value={formValues[ntSpaces[index].spaceAttr] || ""}
                    onChange={(e) => handleInputChange(ntSpaces[index].spaceAttr, e.target.value)}
                    placeholder="Space name"
                  />
                )}
              </TableCell>
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                {ntSpaces[index] && (
                  <TextField
                    fullWidth
                    size="small"
                    value={formValues[ntSpaces[index].locAttr] || ""}
                    onChange={(e) => handleInputChange(ntSpaces[index].locAttr, e.target.value)}
                    placeholder="Location"
                  />
                )}
              </TableCell>
              <TableCell>
                {ntSpaces[index] && (
                  <TextField
                    fullWidth
                    size="small"
                    value={formValues[ntSpaces[index].lengthAttr] || ""}
                    onChange={(e) => handleInputChange(ntSpaces[index].lengthAttr, e.target.value)}
                    placeholder="Length"
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderFieldCategory = (categoryFields) => (
    <Grid2 container spacing={2}>
      {categoryFields.map((field) => (
        <Grid2 size={{ xs: 12, sm: 12, md: 3 }} key={field.attribute}>
          <TextField
            fullWidth
            label={formatLabel(field.attribute)}
            size="small"
            value={formValues[field.attribute] || ""}
            onChange={(e) => handleInputChange(field.attribute, e.target.value)}
            placeholder={`Enter ${formatLabel(field.attribute)?.toLowerCase()}`}
          />
        </Grid2>
      ))}
    </Grid2>
  );

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

      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 3,
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}
            >
              <ReportIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
              International Tonnage Certificate
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Fill out ship-related details including identification, measurements, capacities, key dates, construction specifications, and additional information.
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{
              color: 'white',
              background: 'rgba(255,255,255,0.1)',
              '&:hover': {
                background: 'rgba(255,255,255,0.2)',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent dividers sx={{ p: 3 }}>
        {/* Basic Information Section */}
        {fieldCategories.basic.length > 0 && (
          <Accordion
            expanded={expandedSection === "basic"}
            onChange={() => setExpandedSection(expandedSection === "basic" ? null : "basic")}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Basic Information
                <Typography
                  component="span"
                  variant="body2"
                  color="primary"
                  sx={{ ml: 1, fontWeight: 'medium' }}
                >
                  ({fieldCategories.basic.filter(f => formValues[f.attribute]?.trim()).length}/{fieldCategories.basic.length})
                </Typography>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderFieldCategory(fieldCategories.basic)}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Measurements Section */}
        {fieldCategories.measurements.length > 0 && (
          <Accordion
            expanded={expandedSection === "measurements"}
            onChange={() => setExpandedSection(expandedSection === "measurements" ? null : "measurements")}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Measurements & Dimensions
                <Typography
                  component="span"
                  variant="body2"
                  color="primary"
                  sx={{ ml: 1, fontWeight: 'medium' }}
                >
                  ({fieldCategories.measurements.filter(f => formValues[f.attribute]?.trim()).length}/{fieldCategories.measurements.length})
                </Typography>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderFieldCategory(fieldCategories.measurements)}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Spaces Information Section */}
        <Accordion
          expanded={expandedSection === "spaces"}
          onChange={() => setExpandedSection(expandedSection === "spaces" ? null : "spaces")}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Spaces Included in Tonnage
              <Typography
                component="span"
                variant="body2"
                color="primary"
                sx={{ ml: 1, fontWeight: 'medium' }}
              >
                ({[...gtSpaces, ...ntSpaces].filter(space =>
                  formValues[space.spaceAttr]?.trim() ||
                  formValues[space.locAttr]?.trim() ||
                  formValues[space.lengthAttr]?.trim()
                ).length}/{gtSpaces.length + ntSpaces.length})
              </Typography>
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {renderSpacesTable()}
          </AccordionDetails>
        </Accordion>

        {/* Passenger Information Section */}
        {fieldCategories.passengers.length > 0 && (
          <Accordion
            expanded={expandedSection === "passengers"}
            onChange={() => setExpandedSection(expandedSection === "passengers" ? null : "passengers")}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Passenger Information
                <Typography
                  component="span"
                  variant="body2"
                  color="primary"
                  sx={{ ml: 1, fontWeight: 'medium' }}
                >
                  ({fieldCategories.passengers.filter(f => formValues[f.attribute]?.trim()).length}/{fieldCategories.passengers.length})
                </Typography>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderFieldCategory(fieldCategories.passengers)}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Construction Details Section */}
        {fieldCategories.construction.length > 0 && (
          <Accordion
            expanded={expandedSection === "construction"}
            onChange={() => setExpandedSection(expandedSection === "construction" ? null : "construction")}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Construction Details
                <Typography
                  component="span"
                  variant="body2"
                  color="primary"
                  sx={{ ml: 1, fontWeight: 'medium' }}
                >
                  ({fieldCategories.construction.filter(f => formValues[f.attribute]?.trim()).length}/{fieldCategories.construction.length})
                </Typography>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderFieldCategory(fieldCategories.construction)}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Dates & Measurements Section */}
        {fieldCategories.dates.length > 0 && (
          <Accordion
            expanded={expandedSection === "dates"}
            onChange={() => setExpandedSection(expandedSection === "dates" ? null : "dates")}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Dates & Historical Data
                <Typography
                  component="span"
                  variant="body2"
                  color="primary"
                  sx={{ ml: 1, fontWeight: 'medium' }}
                >
                  ({fieldCategories.dates.filter(f => formValues[f.attribute]?.trim()).length}/{fieldCategories.dates.length})
                </Typography>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderFieldCategory(fieldCategories.dates)}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Other Information Section */}
        {fieldCategories.other.length > 0 && (
          <Accordion
            expanded={expandedSection === "other"}
            onChange={() => setExpandedSection(expandedSection === "other" ? null : "other")}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Other Information
                <Typography
                  component="span"
                  variant="body2"
                  color="primary"
                  sx={{ ml: 1, fontWeight: 'medium' }}
                >
                  ({fieldCategories.other.filter(f => formValues[f.attribute]?.trim()).length}/{fieldCategories.other.length})
                </Typography>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderFieldCategory(fieldCategories.other)}
            </AccordionDetails>
          </Accordion>
        )}
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

export default InternationalTonnage;