"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogActions, TextField, Box, Typography, IconButton, Divider, Button, Accordion, AccordionSummary, AccordionDetails, TextareaAutosize } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, CheckCircle as CheckIcon, Waves as WavesIcon } from "@mui/icons-material";
import { formattedDate, formatDate } from "@/utils/date";
import { getAllSystemVariables } from "@/api";
import CommonConfirmationDialog from "../Dialogs/CommonConfirmationDialog";
import { useCommonSubmit, useFormInitialization } from "./useSubmit";

const LoadLineCertificateForm = ({ open, onClose, onSubmit, fields, reportDetails }) => {
  const [expandedSection, setExpandedSection] = useState("freeboard");
  const [systemVariables, setSystemVariables] = useState();
  const [isLoadingVariables, setIsLoadingVariables] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [saveData, setSaveData] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const { formData, setFormData } = useFormInitialization(fields, reportDetails, open);
  const { handleSubmit } = useCommonSubmit(onSubmit, onClose, setFormData, saveData);

  const timberImages = systemVariables?.data?.filter((item) => item.name.startsWith("timber_image")) || [];
  console.log(timberImages, "timberImages");

  const handleImageSelect = (id) => {
    setSelectedImage(id);
  };

  const handleCancel = () => {
    setOpenDialog(false);
  };

  const handleConfirm = () => {
    setOpenDialog(false);
    handleSubmit({
      ...formData,
      image: selectedImage,
    });
  };

  const handleGenerateClick = () => {
    setOpenDialog(true);
  };

  const getSystemVariables = async () => {
    try {
      setIsLoadingVariables(true);

      const response = await getAllSystemVariables();

      if (response?.status === 200) {
        setSystemVariables(response?.data);
      } else {
        console.warn("API call returned status:", response?.status);
      }
    } catch (error) {
      console.error("Error fetching system variables:", error);
    } finally {
      setIsLoadingVariables(false);
    }
  };

  useEffect(() => {
    if (open) {
      getSystemVariables();
    }
  }, [open]);

  const handleClose = () => {
    onClose();
    setFormData({});
  };

  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  useEffect(() => {
    if (open && reportDetails?.image) {
      setSelectedImage(reportDetails.image);
    }
  }, [open, reportDetails]);

  useEffect(() => {
    if (saveData) {
      handleSubmit(
        {
          ...formData,
          image: selectedImage,
        },
        false
      );
      setSaveData(false);
    }
  }, [formData, saveData, selectedImage]);

  const categorizeFields = (fields) => {
    const categories = {
      freeboard: [],
      timberFreeboard: [],
      allowance: [],
      others: [],
    };

    fields.forEach((field) => {
      const attr = field.attribute.toLowerCase();
      if (/_tropical_|_summer_|_winter_|_wna/.test(attr)) {
        categories.freeboard.push(field);
      } else if (/timber/.test(attr) || /_lwna/.test(attr)) {
        categories.timberFreeboard.push(field);
      } else if (/fw|upper_edge/.test(attr)) {
        categories.allowance.push(field);
      } else {
        categories.others.push(field);
      }
    });

    return categories;
  };

  const { freeboard, timberFreeboard, allowance, others } = categorizeFields(fields);

  const renderFields = (fieldList) => (
    <Grid2 container spacing={2}>
      {fieldList.map((field) => {
        const attr = field.attribute;
        const isDate = attr?.includes("date");
        const isCheckbox = attr.startsWith("_checkbox");
        const isStrikethroughRadio = attr.startsWith("_st_");
        const isTextarea = attr.startsWith("_ta_");

        if (isCheckbox) {
          return (
            <Grid2 size={{ xs: 12, sm: 12, md: 3 }} key={attr}>
              <Grid2 size={{ xs: 12 }}>
                <Box display="flex" alignItems="center">
                  <input type="checkbox" checked={!!formData[attr]} onChange={(e) => handleInputChange(attr, e.target.checked)} />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {field.label}
                  </Typography>
                </Box>
              </Grid2>
            </Grid2>
          );
        }

        if (isStrikethroughRadio) {
          const [, raw] = attr?.split("_st_");
          const optionsRaw = raw.split("_");
          const options = optionsRaw.map((opt) => opt.replace(/-/g, " "));
          const selected = formData[attr];
          return (
            // eslint-disable-next-line react/jsx-key
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
                          selected.filter((item) => item !== opt)
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
            <Grid2 size={{ xs: 12 }} key={attr}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {field.label}
              </Typography>
              <TextareaAutosize style={{ width: "100%" }} minRows={4} multiline label={field.label} value={formData[attr] || ""} onChange={(e) => handleInputChange(attr, e.target.value)} placeholder={field.label} />
            </Grid2>
          );
        }

        return (
          <Grid2 size={{ xs: 12, sm: 12, md: 3 }} key={attr}>
            <TextField fullWidth size="small" label={field.label} title={field.label} value={isDate ? formatDate(formData[attr]) : formData[attr] || ""} onChange={(e) => handleInputChange(attr, e.target.value)} type={isDate ? "date" : "text"} InputLabelProps={isDate ? { shrink: true } : undefined} />
          </Grid2>
        );
      })}
    </Grid2>
  );

  const renderCategoryAccordion = (title, key, icon, fieldList) => {
    if (!fieldList.length) return null;
    return (
      <Accordion expanded={expandedSection === key} onChange={() => setExpandedSection(expandedSection === key ? null : key)} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            {title}
            <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
              ({fieldList.filter((f) => formData[f.attribute]?.toString().trim()).length}/{fieldList.length})
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
              <WavesIcon sx={{ color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Load Line Certificate Details
              </Typography>
              <Typography variant="body2">
                Provide measurements and allowance details
                {isLoadingVariables && " (Loading system variables...)"}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent dividers sx={{ p: 3 }}>
        {renderCategoryAccordion("Freeboard & Load Line", "freeboard", "📏", freeboard)}
        {renderCategoryAccordion("Timber Load Lines", "timberFreeboard", "🌲", timberFreeboard)}
        {renderCategoryAccordion("Fresh Water Allowance", "allowance", "💧", allowance)}
        {renderCategoryAccordion("Others", "others", "", others)}
        {timberImages.length > 0 && (
          <Accordion expanded={expandedSection === "images"} onChange={() => setExpandedSection(expandedSection === "images" ? null : "images")} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Timber Images
                <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
                  ({selectedImage ? 1 : 0}/{timberImages.length})
                </Typography>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid2 container spacing={2}>
                {timberImages.map((img) => (
                  <Grid2 key={img.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box
                      sx={{
                        border: selectedImage === img.id ? "2px solid #667eea" : "1px solid #ddd",
                        borderRadius: 2,
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <img
                        src={img.information}
                        alt={img.name}
                        style={{
                          width: "100%",
                          height: "150px",
                          objectFit: "contain",
                          borderRadius: 8,
                        }}
                      />
                      <Box display="flex" alignItems="center">
                        <input type="radio" style={{ cursor: "pointer" }} name="timberImage" checked={selectedImage === img.id} onChange={() => handleImageSelect(img.id)} />
                        <Typography sx={{ ml: 1 }}>{img.name}</Typography>
                      </Box>
                    </Box>
                  </Grid2>
                ))}
              </Grid2>
            </AccordionDetails>
          </Accordion>
        )}
      </DialogContent>

      <Divider />

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
          disabled={isLoadingVariables}
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
          {isLoadingVariables ? "Loading..." : "Generate Certificate"}
        </Button>
      </DialogActions>
      <CommonConfirmationDialog open={openDialog} onCancel={handleCancel} onConfirm={handleConfirm} title="Are you sure the form data is complete and you want to generate certificate?" />
    </Dialog>
  );
};

export default LoadLineCertificateForm;
