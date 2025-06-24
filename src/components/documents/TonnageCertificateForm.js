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
  TextareaAutosize
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
import { formattedDate, formatDate } from "@/utils/date";

const InternationalTonnage = ({ open, onClose, onSubmit, fields, reportDetails }) => {
  const [formValues, setFormValues] = useState({});
  const [expandedSection, setExpandedSection] = useState("basicInfo");

  const isDateField = (attribute) => {
    return attribute?.includes("date") || attribute?.endsWith("_date");
  };

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
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value
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
      } 
      else if (attribute.includes("date") && value) {
        finalPayload[attribute] = formattedDate(value);
      } else {
        finalPayload[attribute] = value || "";
      }
    });

    onSubmit(finalPayload);
  };

  const formatLabel = (label) => {
    return label

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

  const getLabelFromFields = (attribute) => {
    return fields?.find(f => f.attribute === attribute)?.label || attribute;
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
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                {gtSpaces[index] && (
                  <TextField
                    fullWidth
                    label={getLabelFromFields(gtSpaces[index].spaceAttr)}
                    size="small"
                    type={isDateField(gtSpaces[index].spaceAttr) ? "date" : "text"}
                    value={isDateField(gtSpaces[index].spaceAttr) ? formatDate(formValues[gtSpaces[index].spaceAttr]) : formValues[gtSpaces[index].spaceAttr] || ""}
                    onChange={(e) => handleInputChange(gtSpaces[index].spaceAttr, e.target.value)}

                  />
                )}
              </TableCell>
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                {gtSpaces[index] && (
                  <TextField
                    fullWidth
                    label={getLabelFromFields(gtSpaces[index].locAttr)}
                    size="small"
                    type={isDateField(gtSpaces[index].locAttr) ? "date" : "text"}
                    value={isDateField(gtSpaces[index].locAttr) ? formatDate(formValues[gtSpaces[index].locAttr]) : formValues[gtSpaces[index].locAttr] || ""}
                    onChange={(e) => handleInputChange(gtSpaces[index].locAttr, e.target.value)}

                  />
                )}
              </TableCell>
              <TableCell sx={{ borderRight: '2px solid #dee2e6' }}>
                {gtSpaces[index] && (
                  <TextField
                    fullWidth
                    label={getLabelFromFields(gtSpaces[index].lengthAttr)}
                    size="small"
                    value={isDateField(gtSpaces[index].lengthAttr) ? formatDate(formValues[gtSpaces[index].lengthAttr]) : formValues[gtSpaces[index].lengthAttr] || ""}
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
                    label={getLabelFromFields(ntSpaces[index].spaceAttr)}
                    size="small"
                    type={isDateField(ntSpaces[index].spaceAttr) ? "date" : "text"}
                    value={isDateField(ntSpaces[index].spaceAttr) ? formatDate(formValues[ntSpaces[index].spaceAttr]) : formValues[ntSpaces[index].spaceAttr] || ""}
                    onChange={(e) => handleInputChange(ntSpaces[index].spaceAttr, e.target.value)}
                    placeholder="Space name"

                  />
                )}
              </TableCell>
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                {ntSpaces[index] && (
                  <TextField
                    fullWidth
                    label={getLabelFromFields(ntSpaces[index].locAttr)}
                    size="small"
                    type={isDateField(ntSpaces[index].locAttr) ? "date" : "text"}
                    value={isDateField(ntSpaces[index].locAttr) ? formatDate(formValues[ntSpaces[index].locAttr]) : formValues[ntSpaces[index].locAttr] || ""}
                    onChange={(e) => handleInputChange(ntSpaces[index].locAttr, e.target.value)}
                    placeholder="Location"
                  />
                )}
              </TableCell>
              <TableCell>
                {ntSpaces[index] && (
                  <TextField
                    fullWidth
                    label={getLabelFromFields(ntSpaces[index].lengthAttr)}
                    size="small"
                    type={isDateField(ntSpaces[index].lengthAttr) ? "date" : "text"}
                    value={isDateField(ntSpaces[index].lengthAttr) ? formatDate(formValues[ntSpaces[index].lengthAttr]) : formValues[ntSpaces[index].lengthAttr] || ""}
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

  const renderFieldCategory = (categoryFields) => {
    return (
      <Grid2 container spacing={2}>
        {categoryFields.map((field) => {
          const attr = field.attribute;
          const value = formValues[attr];
          const isTextarea = attr?.startsWith("_ta_");
          const isStrikethroughRadio = attr?.startsWith("_st_");
          const isCheckbox = attr?.includes("checkbox") || attr?.startsWith("_checkbox");
          const isDate = attr?.includes("date") || attr?.endsWith("_date");

          if (isCheckbox) {
            return (
              <Grid2 item xs={12} key={attr}>
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
                    />{" "}{opt1}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={attr}
                      value={opt2}
                      checked={value === opt2}
                      onChange={() => handleInputChange(attr, opt2)}
                    />{" "}{opt2}
                  </label>
                </Box>
              </Grid2>
            );
          }

          if (isTextarea) {
            return (
              <Box sx={{ width: '100%' }} key={attr}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {field.label}
                </Typography>
                <TextareaAutosize
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', borderColor: '#ccc', fontFamily: 'inherit' }}
                  minRows={4}
                  value={value || ""}
                  onChange={(e) => handleInputChange(attr, e.target.value)}
                  placeholder={field.label}
                />
              </Box>
            );
          }

          return (
            <Grid2 item xs={12} sm={6} md={3} key={attr}>
              <TextField
                fullWidth
                type={isDateField(attr) ? "date" : "text"}
                label={formatLabel(field.label)}
                size="small"
                value={isDateField(attr) ? formatDate(value) : value || ""}
                onChange={(e) => handleInputChange(attr, e.target.value)}
                placeholder={`Enter ${formatLabel(field.label)?.toLowerCase()}`}
                InputLabelProps={isDateField(attr) ? { shrink: true } : undefined}
              />
            </Grid2>
          );
        })}
      </Grid2>
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