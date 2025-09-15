"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogActions, TextField, Box, Typography, IconButton, Divider, Button, Accordion, AccordionSummary, AccordionDetails, TextareaAutosize } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, CheckCircle as CheckIcon, Science as ScienceIcon } from "@mui/icons-material";
import { formattedDate, formatDate } from "@/utils/date";
import { useCommonSubmit, useFormInitialization } from "./useSubmit";
import CommonConfirmationDialog from "../Dialogs/CommonConfirmationDialog";

const AntiFoulingCertificateForm = ({ open, onClose, onSubmit, fields, reportDetails }) => {
  const [expandedSection, setExpandedSection] = useState("systemInfo");
  const [saveData, setSaveData] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoadingVariable, setIsLoadingVariable] = useState(false);

  const { formData, setFormData } = useFormInitialization(fields, reportDetails, open);
  const { handleSubmit } = useCommonSubmit(onSubmit, onClose, setFormData, save);

  const isStrikethroughText = (text) => text?.split("").some((c) => c === "\u0336");

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

  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  useEffect(() => {
    if (saveData) {
      handleSubmit(formData, false);
      setSaveData(false);
    }
  }, [formData, handleSubmit, saveData]);

  const handleGenerateClick = () => {
    setOpenDialog(true);
  };

  const formatLabel = (attribute) =>
    attribute
      .replace(/^_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

  const cleanFields = fields;

  const categorizeFields = (fields) => {
    const categories = {
      systemInfo: [],
      facilityInfo: [],
      sealerInfo: [],
    };
    fields.forEach((field) => {
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

  const { systemInfo, facilityInfo, sealerInfo } = categorizeFields(cleanFields);

  const renderFields = (fieldList) => {
    const checkboxes = [];
    const others = [];

    fieldList.forEach((field) => {
      const attr = field.attribute;
      const isCheckbox = attr.startsWith("_checkbox");
      if (isCheckbox) checkboxes.push(field);
      else others.push(field);
    });

    return (
      <>
        {checkboxes.length > 0 && (
          <Grid2 container spacing={2} sx={{ mb: 5 }}>
            {checkboxes.map((field) => {
              const attr = field.attribute;
              return (
                <Grid2 key={attr} size={{ xs: 12 }}>
                  <Box display="flex" alignItems="center">
                    <input type="checkbox" checked={!!formData[attr]} onChange={(e) => handleInputChange(attr, e.target.checked)} />
                    <Typography sx={{ ml: 1 }}>{field.label || formatLabel(attr)}</Typography>
                  </Box>
                </Grid2>
              );
            })}
          </Grid2>
        )}

        <Grid2 container spacing={2}>
          {others.map((field) => {
            const attr = field.attribute;
            const isDate = attr?.includes("date");
            const isStrikethroughRadio = attr.startsWith("_st_");
            const isTextarea = attr.startsWith("_ta_");

            if (isStrikethroughRadio) {
              const [, raw] = attr?.split("_st_");
              const optionsRaw = raw.split("_");
              const options = optionsRaw.map((opt) => opt.replace(/-/g, " "));
              const selected = formData[attr] || "";

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
                      />{" "}
                      {opt}
                    </label>
                  ))}
                </Box>
              );
            }

            if (isTextarea) {
              return (
                <Box sx={{ minWidth: "100%" }} key={attr}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {field.label || formatLabel(attr)}
                  </Typography>
                  <TextareaAutosize style={{ minWidth: "100%" }} minRows={4} multiline label={field.label || formatLabel(attr)} value={formData[attr] || ""} onChange={(e) => handleInputChange(attr, e.target.value)} placeholder={formatLabel(attr).toLowerCase()} />
                </Box>
              );
            }

            return (
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={attr}>
                <TextField fullWidth size="small" title={field.label || formatLabel(attr)} label={field.label || formatLabel(attr)} value={isDate ? formatDate(formData[attr]) : formData[attr] || ""} onChange={(e) => handleInputChange(attr, e.target.value)} placeholder={formatLabel(attr).toLowerCase()} type={isDate ? "date" : "text"} InputLabelProps={isDate ? { shrink: true } : undefined} />
              </Grid2>
            );
          })}
        </Grid2>
      </>
    );
  };

  const renderCategoryAccordion = (title, key, fieldList) => {
    if (!fieldList?.length) return null;
    return (
      <Accordion expanded={expandedSection === key} onChange={() => setExpandedSection(expandedSection === key ? null : key)} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            {title}
            <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
              ({fieldList?.filter((f) => formData[f.attribute])?.length}/{fieldList?.length})
            </Typography>
          </Typography>
        </AccordionSummary>
        <AccordionDetails>{renderFields(fieldList)}</AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth PaperProps={{ sx: { height: "95vh", maxHeight: "1000px" } }}>
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          p: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
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
              }}
            >
              <ScienceIcon sx={{ color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Anti-Fouling System Details
              </Typography>
              <Typography variant="body2">Fill in the anti-fouling system and treatment data</Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: "white" }}>
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

      <DialogActions sx={{ p: 3, background: "white", gap: 2, justifyContent: "flex-end" }}>
        <Button
          onClick={() => setSaveData(true)}
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
          Generate Certificate
        </Button>
      </DialogActions>

      <CommonConfirmationDialog open={openDialog} onCancel={handleCancel} onConfirm={handleConfirm} title="Are you sure the form data is complete and you want to generate cvertificate?" />
    </Dialog>
  );
};

export default AntiFoulingCertificateForm;
