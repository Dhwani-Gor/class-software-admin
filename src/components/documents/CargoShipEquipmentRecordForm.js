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
import { formattedDate, formatDate } from "@/utils/date";
import CommonButton from "../CommonButton";

const CSSForm = ({ open, onClose, onSubmit, fields, reportDetails }) => {
  const [formValues, setFormValues] = useState({});
  const [expandedSection, setExpandedSection] = useState("lifeSaving");

  const handleClose = () => {
    onClose();
    setFormValues({});
  };

  const handleInputChange = (fieldName, value) => {
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const groupByBaseLabel = (fieldList) => {
    const grouped = {};

    fieldList.forEach(field => {
      const attr = field.attribute;
      const baseKey = attr.replace(/_P$|_S$/, "");

      if (!grouped[baseKey]) {
        grouped[baseKey] = { label: field.label || formatLabel(baseKey) };
      }

      if (attr.endsWith("_P")) {
        grouped[baseKey].port = field;
      } else if (attr.endsWith("_S")) {
        grouped[baseKey].starboard = field;
      } else {
        grouped[baseKey].other = field;
      }
    });

    return Object.entries(grouped);
  };

  const renderInputField = (field) => {
    const attr = field.attribute;
    const isDate = attr.includes("date");
    const value = formValues[attr] || "";

    return (
      <TextField
        fullWidth
        size="small"
        value={value}
        label={field.label || formatLabel(attr)}
        title={field.label || formatLabel(attr)}
        onChange={(e) => handleInputChange(attr, e.target.value)}
        placeholder={formatLabel(attr).toLowerCase()}
        type={isDate ? "date" : "text"}
        InputLabelProps={isDate ? { shrink: true } : undefined}
      />
    );
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
        } 
        else if (field.attribute.startsWith("_st")) {
          if (reportDetails && reportDetails[field.attribute]) {
            const parts = reportDetails[field.attribute]
              .split(' / ')
              .map(s => s.trim());

            const hasStrikethrough = parts.some(part => isStrikethroughText(part));

            if (!hasStrikethrough) {
              initialValues[field.attribute] = "";
            } else {
              const selectedOption = parts.find(part => !isStrikethroughText(part));
              initialValues[field.attribute] = selectedOption || "";
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


  const renderGroupedFields = (fieldList) => {
    const grouped = groupByBaseLabel(fieldList);

    return (
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '12px' }}>Description</th>
              <th style={{ padding: '12px' }}>Port</th>
              <th style={{ padding: '12px' }}>Starboard</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(([baseKey, { label, port, starboard }], index) => (
              <tr key={baseKey} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : 'white' }}>
                <td style={{ padding: '12px', fontWeight: 500 }}>{label}</td>

                {port || starboard ? (
                  <>
                    <td style={{ padding: '12px' }}>
                      {port ? renderInputField(port) : ""}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {starboard ? renderInputField(starboard) : ""}
                    </td>
                  </>
                ) : (
                  <>
                    {/* <td colSpan={2} style={{ padding: '12px' }}>
                      {other ? renderInputField(other) : ""}
                    </td> */}
                  </>
                )}
              </tr>
            ))}
          </tbody>

        </table>
      </Box>
    );
  };

  const applyStrikethrough = (text) =>
    text?.split("").map(c => c + "\u0336").join("");

  const handleSubmit = () => {
    const filledValues = Object.entries(formValues).reduce((acc, [key, value]) => {
      if (typeof value === "string" && (value.includes("undefined") || value.trim() === "")) {
        value = undefined;
      }
      if (key.startsWith("_st_")) {
        const [, raw] = key?.split("_st_");
        const optionsRaw = raw.split("_");
        const options = optionsRaw.map(opt => opt.replace(/-/g, " "));

        if (!value) {
          acc[key] = options.join(" / ");
        } else {
          acc[key] = options
            .map(opt => (opt === value ? opt : applyStrikethrough(opt)))
            .join(" / ");
        }
      } else if (typeof value === "boolean") {
        acc[key] = value ? "☑" : "☒";
      } else if (key.includes("date") && value) {
        acc[key] = formattedDate(value);
      } else if (typeof value === "string" && value.trim()) {
        acc[key] = value;
      } else {
        acc[key] = "-";
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
      portStarboard: [],
      navigation: [],
      uncategorized: [],
    };

    fields.forEach((field) => {
      const attr = field.attribute;
      if (attr.startsWith("_CSS_nav_")) {
        categories.navigation.push(field);
      } else if (attr.startsWith("_CSS_")) {
        if (attr.endsWith("_P") || attr.endsWith("_S")) {
          categories.portStarboard.push(field);
        } else {
          categories.lifeSaving.push(field);
        }
      } else {
        categories.uncategorized.push(field);
      }
    });

    return categories;
  };

  const { lifeSaving, portStarboard, navigation, uncategorized } = categorizeFields(fields);

  const renderFields = (fieldList) => (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
        <tbody>
          {fieldList?.map((field, index) => {
            const attr = field.attribute;
            const isCheckbox = attr.startsWith("_checkbox");
            const isDate = attr.includes("date");
            const isStrikethroughRadio = attr.startsWith("_st_");
            const isTextarea = attr.startsWith("_ta_");

            return (
              <tr
                key={attr}
                style={{
                  backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                  borderBottom: '1px solid #eee'
                }}
              >
                <td style={{
                  padding: '12px',
                  verticalAlign: 'top',
                  fontWeight: 500
                }}>
                  {field.label || formatLabel(attr)}
                </td>
                <td style={{ padding: '12px', verticalAlign: 'top' }}>
                  {isCheckbox ? (
                    <Grid2 size={{ xs: 12 }}>
                      <Box display="flex" alignItems="center">
                        <input
                          type="checkbox"
                          checked={!!formValues[attr]}
                          onChange={(e) => handleInputChange(attr, e.target.checked)}
                          style={{ marginRight: '8px' }}
                        />
                      </Box>
                    </Grid2>

                  ) : isStrikethroughRadio ? (
                    (() => {
                      const [, raw] = attr.split("_st_");
                      const optionsRaw = raw.split("_");
                      const options = optionsRaw.map(opt => opt.replace(/-/g, " "));
                      const value = formValues[attr];
                      return (
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {field.label}
                          </Typography>
                          {options.map(opt => (
                            <label key={opt}>
                              <input
                                type="radio"
                                name={attr}
                                value={opt}
                                checked={value === opt}
                                onChange={() => handleInputChange(attr, opt)}
                              /> {opt}
                            </label>
                          ))}
                          {value && (
                            <CommonButton
                              variant="outlined"
                              text="Clear selection"
                              onClick={() => handleInputChange(attr, "")}
                              sx={{ width: "30%" }}
                            />
                          )}
                        </Box>
                      );
                    })()
                  ) : isTextarea ? (
                    <Grid2 size={{ xs: 12, sm: 6, md: 12 }} key={attr}>
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
                  ) : (
                    <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={attr}>
                      <TextField
                        fullWidth
                        size="small"
                        title={field.label || formatLabel(attr)}
                        label={field.label || formatLabel(attr)}
                        value={isDate ? formatDate(formValues[attr]) : formValues[attr] || ""}
                        onChange={(e) => handleInputChange(attr, e.target.value)}
                        placeholder={formatLabel(attr).toLowerCase()}
                        type={isDate ? "date" : "text"}
                        InputLabelProps={isDate ? { shrink: true } : undefined}
                      />
                    </Grid2>
                  )}
                </td>
                <td style={{
                  padding: '12px',
                  textAlign: 'center',
                  verticalAlign: 'middle'
                }}>

                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Box >
  );

  const renderCategoryAccordion = (title, key, fieldList, useGroupedTable = false) => {
    if (!fieldList?.length) return null;

    return (
      <Accordion
        expanded={expandedSection === key}
        onChange={() => setExpandedSection(expandedSection === key ? null : key)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">{title}</Typography>
          <Typography component="span" variant="body2" color="primary" sx={{ ml: 1, mt: 1 }}>
            ({fieldList?.filter(f => formValues[f.attribute])?.length}/{fieldList?.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {useGroupedTable ? renderGroupedFields(fieldList) : renderFields(fieldList)}
        </AccordionDetails>

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
        {renderCategoryAccordion("Port & Starboard Equipment", "portStarboard", portStarboard, true)}
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