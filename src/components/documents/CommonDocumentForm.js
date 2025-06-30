import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogActions,
  Button, TextField, Grid2, Box, Typography, IconButton,
  Fade, Slide, Divider,
  TextareaAutosize
} from "@mui/material";
import {
  Close as CloseIcon,
  Description as ReportIcon,
  CheckCircle as CheckIcon
} from "@mui/icons-material";
import { formattedDate, formatDate } from "@/utils/date";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const strikeText = (text) => text?.split('').map(c => c + '\u0336').join('');

const isStrikethroughText = (text) => text?.split('').some(c => c === '\u0336');


export const DialogForm = ({ open, onClose, onSubmit, fields, reportDetails }) => {
  const [formData, setFormData] = useState({});

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  // useEffect(() => {
  //   console.log(reportDetails,"report details in common component")
  //   if (reportDetails) {
  //     setFormData(prev => ({
  //       ...prev,
  //       parseReportDetails(reportDetails)
  //     }));
  //   }
  // }, [reportDetails]);

  const handleSubmit = () => {
    const filledValues = Object.entries(formData).reduce((acc, [key, value]) => {
      if (key.startsWith('_st_')) {
        const parts = key.replace('_st_', '')?.split('_');
        const [option1, option2] = parts;
        if (value === option1) {
          acc[key] = `${option1} / ${strikeText(option2)}`;
        } else if (value === option2) {
          acc[key] = `${strikeText(option1)} / ${option2}`;
        } else {
          acc[key] = `{{${key}}}`;
        }
      } else if (typeof value === "boolean") {
        acc[key] = value === true ? "\u2611" : "\u2612";
      } else if (key.includes("date") && value) {
        acc[key] = formattedDate(value);
      } else if (typeof value === "string" && value.trim()) {
        acc[key] = value;
      } else {
        acc[key] = "N/A";
      }
      return acc;
    }, {});
    onSubmit(filledValues);
    onClose();
    setFormData({});
  };

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

            const parts = reportDetails[field.attribute]?.split(' / ').map(s => s.trim());
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
      setFormData(initialValues);
    }
  }, [fields, open]);

  const handleClose = () => {
    onClose();
    setFormData({});
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 0
        }
      }}
    >
      <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', p: 3, position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
              <ReportIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Report Details</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Provide additional information to generate your report</Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'white', background: 'rgba(255,255,255,0.1)', '&:hover': { background: 'rgba(255,255,255,0.2)', transform: 'scale(1.05)' }, transition: 'all 0.2s ease' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 4, background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', minHeight: '300px' }}>
        <Fade in={open} timeout={600}>
          <Grid2 container spacing={2}>
            {fields.map((field, index) => {
              const attr = field.attribute;
              const isCheckbox = attr.startsWith("_checkbox");
              const isDate = attr.includes("date");
              const isTextArea = attr.startsWith("_ta_");
              const isRadioWithStrike = attr.startsWith("_st_");

              return (
                <Grid2 size={{ xs: 12, sm: 12, md: 6 }} key={attr}>
                  <Fade in={open} timeout={800 + (index * 100)}>
                    <Box>
                      {isCheckbox ? (
                        <Grid2 size={{ xs: 12 }}>
                          <Box display="flex" alignItems="center">
                            <input
                              type="checkbox"
                              checked={!!formData[attr]}
                              onChange={(e) => handleInputChange(attr, e.target.checked)}
                            />
                            <Typography variant="body2" sx={{ ml: 1 }}>{field.label}</Typography>
                          </Box>
                        </Grid2>

                      ) : isTextArea ? (
                        <Grid2 size={{ xs: 12 }} key={attr}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {field.label || formatLabel(attr)}
                          </Typography>
                          <TextareaAutosize
                            style={{ width: '100%' }}
                            minRows={4}
                            multiline
                            label={field.label || formatLabel(attr)}
                            value={formData[attr] || ""}
                            onChange={(e) => handleInputChange(attr, e.target.value)}
                            placeholder={field.label}
                          />
                        </Grid2>
                      ) : isRadioWithStrike ?
                        (
                          (() => {
                            const [label1, label2] = attr.replace('_st_', '')?.split('_');
                            const selected = formData[attr];
                            return (

                              <Box display="flex" flexDirection="column" gap={1}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  {field.label || formatLabel(attr)}
                                </Typography>
                                <label>
                                  <input
                                    type="radio"
                                    name={attr}
                                    value={label1}
                                    checked={selected === label1}
                                    onChange={() => handleInputChange(attr, label1)}
                                  /> {label1}
                                </label>
                                <label>
                                  <input
                                    type="radio"
                                    name={attr}
                                    value={label2}
                                    checked={selected === label2}
                                    onChange={() => handleInputChange(attr, label2)}
                                  /> {label2}
                                </label>
                              </Box>
                            );
                          })()
                        ) : (
                          <TextField
                            fullWidth
                            label={field.label}
                            title={field.label}
                            variant="outlined"
                            value={isDate ? formatDate(formData[attr]) : formData[attr] || ""}
                            onChange={(e) => {
                              handleInputChange(attr, e.target.value);
                            }}
                            type={isDate ? "date" : "text"}
                            InputLabelProps={isDate ? { shrink: true } : undefined}
                          />
                        )}
                    </Box>
                  </Fade>
                </Grid2>
              );
            })}
          </Grid2>
        </Fade>
      </DialogContent>

      <Divider sx={{ borderColor: 'rgba(102, 126, 234, 0.1)' }} />

      <DialogActions sx={{ p: 3, background: 'white', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          size="large"
          sx={{ borderRadius: 2, px: 3, py: 1.5, textTransform: 'none', fontWeight: 600, borderColor: 'rgba(102, 126, 234, 0.3)', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', background: 'rgba(102, 126, 234, 0.04)', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)' }, transition: 'all 0.2s ease' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="large"
          startIcon={<CheckIcon />}
          sx={{ borderRadius: 2, px: 4, py: 1.5, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)', '&:hover': { background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(102, 126, 234, 0.6)' }, transition: 'all 0.2s ease' }}
        >
          Generate Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};
