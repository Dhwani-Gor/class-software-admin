import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogActions,
  Button, TextField, Grid2, Box, Typography, IconButton,
  Fade, Slide, Divider, InputAdornment
} from "@mui/material";
import {
  Close as CloseIcon,
  Description as ReportIcon,
  CheckCircle as CheckIcon
} from "@mui/icons-material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const DialogForm = ({ open, onClose, onSubmit, fields }) => {
  const [formData, setFormData] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  console.log(fields,"fields")
  const handleChange = (key) => (e) => {
    const value = e.target.value;
    if (typeof value === "boolean") {
      setFormData((prev) => ({
        ...prev,
        [key]: value === true ? "\u2611" : "\u2610",
      }));
    } else if (typeof value === "string" && value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  useEffect(() => {
    if (fields && fields.length > 0) {
      const initialValues = {};
      fields.forEach(field => {
        initialValues[field.attribute] = "";
      });
      setFormData(initialValues);
    }
  }, [fields, open]);

  const handleSave = () => {
    onSubmit(formData);
    onClose();
    setFormData({});
  };

  const handleClose = () => {
    onClose();
    setFormData({});
  };

  const getFieldIcon = (field) => {
    const fieldLower = field?.toLowerCase();
    if (fieldLower.includes('report') || fieldLower.includes('title')) {
      return <ReportIcon sx={{ color: 'primary.main' }} />;
    }
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
      {/* Custom Header with Gradient Background */}
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
                Report Details
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Provide additional information to generate your report
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

      {/* Content Area */}
      <DialogContent
        sx={{
          p: 4,
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          minHeight: '300px',
        }}
      >

        <Fade in={open} timeout={600}>
          <Grid2 container spacing={2}>
            {fields.map((field, index) => {
              const attr = field?.attribute;
              const isCheckbox = attr?.startsWith("_checkbox");
              const isDate = attr?.includes("date");
              return (
              <Grid2 size={{ xs: 12, sm: 12, md: 3 }} key={field.attribute}>
                <Fade in={open} timeout={800 + (index * 100)}>
                  <Box>
                    {isCheckbox ? (
                      <Box display="flex" alignItems="center" sx={{ height: '100%' }}>
                        <input
                          type="checkbox"
                          checked={!!formData[field.attribute]}
                          onChange={(e) => handleChange(field.attribute)(e)}
                        />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {field.label}
                        </Typography>
                      </Box>
                    ) : (
                      <TextField
                      fullWidth
                      label={field.label}
                      variant="outlined"
                      value={formData[field.attribute] || ""}
                      onChange={handleChange(field.attribute)}
                      onFocus={() => setFocusedField(field)}
                      onBlur={() => setFocusedField(null)}
                      placeholder={isDate ? "Select Date" : `Enter ${field.label.toLowerCase()}`}
                      type={isDate ? "date" : "text"}
                      InputLabelProps={isDate ? { shrink: true } : undefined}
                    />
                  )}
                </Box>
                </Fade>
              </Grid2>
            )})}
          </Grid2>
        </Fade>
      </DialogContent>

      <Divider sx={{ borderColor: 'rgba(102, 126, 234, 0.1)' }} />

      {/* Enhanced Action Buttons */}
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
          onClick={handleSave}
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