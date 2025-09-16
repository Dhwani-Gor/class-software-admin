import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogActions, Button, TextField, Grid2, Box, Typography, IconButton, Fade, Slide, Divider, TextareaAutosize } from "@mui/material";
import { Close as CloseIcon, Description as ReportIcon, CheckCircle as CheckIcon } from "@mui/icons-material";
import { formatDate } from "@/utils/date";
import { useCommonSubmit, useFormInitialization } from "./useSubmit";
import CommonConfirmationDialog from "../Dialogs/CommonConfirmationDialog";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const DialogForm = ({ open, onClose, onSubmit, fields, reportDetails }) => {
  const { formData, setFormData } = useFormInitialization(fields, reportDetails, open);
  const [saveData, setSaveData] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoadingVariable, setIsLoadingVariable] = useState(false);
  const { handleSubmit } = useCommonSubmit(onSubmit, onClose, setFormData, saveData);

  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleCancel = () => {
    setOpenDialog(false);
  };

  const handleConfirm = () => {
    setOpenDialog(false);
    handleSubmit(formData);
  };

  const handleClose = () => {
    onClose();
    setFormData({});
  };

  const handleGenerateClick = () => {
    setOpenDialog(true);
  };

  useEffect(() => {
    if (saveData) {
      handleSubmit(formData, false);
      setSaveData(false);
    }
  }, [formData, handleSubmit, saveData]);

  return (
    <>
      {/* Main Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
            overflow: "hidden",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            p: 0,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            p: 3,
            position: "relative",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(10px)",
                }}
              >
                <ReportIcon sx={{ fontSize: 24, color: "white" }} />
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
                color: "white",
                background: "rgba(255,255,255,0.1)",
                "&:hover": { background: "rgba(255,255,255,0.2)", transform: "scale(1.05)" },
                transition: "all 0.2s ease",
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Form Fields */}
        <DialogContent
          sx={{
            p: 4,
            background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
            minHeight: "300px",
          }}
        >
          <Fade in={open} timeout={600}>
            <Grid2 container spacing={2}>
              {fields.map((field, index) => {
                const attr = field.attribute;
                const isCheckbox = attr.startsWith("_checkbox");
                const isDate = attr?.includes("date");
                const isTextArea = attr.startsWith("_ta_");
                const isRadioWithStrike = attr.startsWith("_st_");

                return (
                  <Grid2 size={{ xs: 12, sm: 12, md: 6 }} key={attr}>
                    <Fade in={open} timeout={800 + index * 100}>
                      <Box>
                        {isCheckbox ? (
                          <Box display="flex" alignItems="center">
                            <input type="checkbox" checked={!!formData[attr]} onChange={(e) => handleInputChange(attr, e.target.checked)} />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {field.label}
                            </Typography>
                          </Box>
                        ) : isTextArea ? (
                          <>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {field.label}
                            </Typography>
                            <TextareaAutosize style={{ width: "100%" }} minRows={4} value={formData[attr] || ""} onChange={(e) => handleInputChange(attr, e.target.value)} placeholder={field.label} />
                          </>
                        ) : isRadioWithStrike ? (
                          (() => {
                            const [, raw] = attr?.split("_st_");
                            const optionsRaw = raw.split("_");
                            const options = optionsRaw.map((opt) => opt.replace(/-/g, " "));
                            const selected = formData[attr] || [];
                            return (
                              <Box display="flex" flexDirection="column" gap={1}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  {field.label}
                                </Typography>
                                {options.map((opt) => (
                                  <label key={opt}>
                                    <input
                                      type="checkbox"
                                      name={attr}
                                      value={opt}
                                      checked={selected?.includes(opt)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          handleInputChange(attr, [...selected, opt]);
                                        } else {
                                          handleInputChange(
                                            attr,
                                            selected?.filter((item) => item !== opt)
                                          );
                                        }
                                      }}
                                    />
                                    {opt}
                                  </label>
                                ))}
                              </Box>
                            );
                          })()
                        ) : (
                          <TextField fullWidth label={field.label} variant="outlined" value={isDate ? formatDate(formData[attr]) : formData[attr] || ""} onChange={(e) => handleInputChange(attr, e.target.value)} type={isDate ? "date" : "text"} InputLabelProps={isDate ? { shrink: true } : undefined} />
                        )}
                      </Box>
                    </Fade>
                  </Grid2>
                );
              })}
            </Grid2>
          </Fade>
        </DialogContent>

        <Divider sx={{ borderColor: "rgba(102, 126, 234, 0.1)" }} />

        <DialogActions
          sx={{
            p: 3,
            background: "white",
            gap: 2,
            justifyContent: "flex-end",
          }}
        >
          <Button
            onClick={() => {
              setSaveData(true);
              handleSubmit();
            }}
            variant="outlined"
            size="large"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "rgba(102, 126, 234, 0.3)",
              color: "text.secondary",
              "&:hover": {
                borderColor: "primary.main",
                background: "rgba(102, 126, 234, 0.04)",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.15)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Save
          </Button>
          <Button
            onClick={handleClose}
            variant="outlined"
            size="large"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "rgba(102, 126, 234, 0.3)",
              color: "text.secondary",
              "&:hover": {
                borderColor: "primary.main",
                background: "rgba(102, 126, 234, 0.04)",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.15)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateClick}
            variant="contained"
            size="large"
            startIcon={<CheckIcon />}
            disabled={isLoadingVariable}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(102, 126, 234, 0.6)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {isLoadingVariable ? "Loading..." : "Generate Certificate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Confirmation Dialog */}
      <CommonConfirmationDialog open={openDialog} onCancel={handleCancel} onConfirm={handleConfirm} title="Are you sure the form data is complete and you want to generate certificate?" />
    </>
  );
};
