"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { toast } from "react-toastify";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import { createDocument, getDocumentDetails, updateDocument } from "@/api";
import UploadIcon from "@mui/icons-material/Upload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Chip } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import * as XLSX from "xlsx";

const documentValidityType = [
  { value: "interim", label: "Interim" },
  { value: "short_term", label: "Short Term" },
  { value: "full_term", label: "Full Term" },
];

const documentType = [
  { value: "certificate", label: "certificate" },
  { value: "report", label: "report" },
];

const DocumentForm = ({ mode, documentId, editReason = "" }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    type: "",
    abbreviation: "",
    fullTermDocument: null,
    shortTermDocument: null,
    interimDocument: null,
  });
  const [errors, setErrors] = useState({
    name: false,
    type: false,
    abbreviation: false,
    fields: false,
  });
  const [additionalFields, setAdditionalFields] = useState([]);
  const [endorsements, setEndorsements] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [endorsementGroups, setEndorsementGroups] = useState([]);
  const [openTitleDialog, setOpenTitleDialog] = useState(false);
  const [newMainTitle, setNewMainTitle] = useState("");
  const [previewState, setPreviewState] = useState({
    open: false,
    loading: false,
    fileUrl: null,
    title: "",
  });

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchDocumentDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const result = await getDocumentDetails(documentId);
      if (result?.status === 200) {
        const documentData = result.data.data;

        // ✅ Set file preview and form values
        setPreviewState((prev) => ({
          ...prev,
          open: false,
          loading: false,
          fileUrl: documentData.fullTermFilePath || documentData.interimFilePath || documentData.shortTermFilePath || null,
          title: documentData.name || "",
        }));

        setFormValues({
          name: mode === "duplicate" ? `${documentData.name} (Copy)` : documentData.name || "",
          type: documentData.type || "",
          abbreviation: mode === "duplicate" ? "" : documentData.abbreviation || "",
          fullTermDocument: mode === "duplicate" ? null : documentData.fullTermFilePath || null,
          shortTermDocument: mode === "duplicate" ? null : documentData.shortTermFilePath || null,
          interimDocument: mode === "duplicate" ? null : documentData.interimFilePath || null,
        });

        // ✅ Handle additional fields
        let parsedFields = [];
        if (documentData.fields) {
          parsedFields = typeof documentData.fields === "string" ? JSON.parse(documentData.fields) : documentData.fields;
        }
        if (!Array.isArray(parsedFields)) parsedFields = [parsedFields];
        setAdditionalFields(parsedFields);

        // ✅ Handle endorsements (nested grouped format)
        let parsedEndorsements = [];
        if (documentData.endorsements) {
          parsedEndorsements = typeof documentData.endorsements === "string" ? JSON.parse(documentData.endorsements) : documentData.endorsements;
        }
        if (!Array.isArray(parsedEndorsements)) parsedEndorsements = [parsedEndorsements];

        // Convert nested structure into UI format
        const groups = parsedEndorsements.map((group) => ({
          mainTitle: group.groupTitle || "",
          items: Array.isArray(group.endorsements)
            ? group.endorsements.map((item) => ({
                title: item.title || "",
                endorsed_place: item.endorsed_place || "",
                issuance_date: item.issuance_date || "",
                validity_date: item.validity_date || "",
                endorsement_type: item.endorsement_type || "",
                endorsedby_1: item.endorsedby_1 || "",
              }))
            : [],
        }));

        // ✅ Update state for rendering
        setEndorsementGroups(groups);
      } else {
        toast.error("Error fetching document details");
      }
    } catch (error) {
      toast.error("Something went wrong while fetching document details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  const handleFileChange = (documentType, file) => {
    setFormValues((prev) => ({
      ...prev,
      [documentType]: file,
    }));
  };

  const validateForm = () => {
    const newErrors = {
      name: !formValues.name.trim(),
      type: !formValues.type.trim(),
      abbreviation: !formValues.abbreviation.trim(),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleExportCSV = () => {
    if (additionalFields.length === 0) {
      toast.warning("No additional fields to export");
      return;
    }

    const wsData = [["attribute", "label"], ...additionalFields.map((field) => [field.attribute || "", field.label || ""])];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    XLSX.utils.book_append_sheet(wb, ws, "Additional Fields");

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const filename = `additional_fields_${timestamp}.xlsx`;

    XLSX.writeFile(wb, filename);
    toast.success("Additional fields exported successfully");
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          toast.error("Invalid file format. File should contain at least headers and one data row.");
          return;
        }

        const headers = jsonData[0].map((header) => header.toLowerCase().trim());
        const attributeIndex = headers.indexOf("attribute");
        const labelIndex = headers.indexOf("label");

        if (attributeIndex === -1 || labelIndex === -1) {
          toast.error("Invalid file format. File should contain 'attribute' and 'label' columns.");
          return;
        }

        const importedFields = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const attribute = row[attributeIndex]?.toString().trim() || "";
          const label = row[labelIndex]?.toString().trim() || "";

          if (attribute || label) {
            importedFields.push({ attribute, label });
          }
        }

        if (importedFields.length === 0) {
          toast.warning("No valid data found in the file.");
          return;
        }

        // Check if there are actual changes (order-independent comparison)
        const hasChanges = () => {
          if (additionalFields.length !== importedFields.length) return true;

          // Create normalized versions for comparison (sorted by attribute+label)
          const normalizeFields = (fields) => {
            return fields
              .map((field) => ({
                attribute: field.attribute.trim().toLowerCase(),
                label: field.label.trim().toLowerCase(),
              }))
              .sort((a, b) => {
                const aKey = `${a.attribute}|${a.label}`;
                const bKey = `${b.attribute}|${b.label}`;
                return aKey.localeCompare(bKey);
              });
          };

          const normalizedExisting = normalizeFields(additionalFields);
          const normalizedImported = normalizeFields(importedFields);

          // Compare each field
          return !normalizedExisting.every((existingField, index) => {
            const importedField = normalizedImported[index];
            return existingField.attribute === importedField.attribute && existingField.label === importedField.label;
          });
        };

        if (additionalFields?.length > 0) {
          if (!hasChanges()) {
            toast.info("No changes detected - file contains the same fields.");
            return;
          }

          setAdditionalFields(importedFields);
          toast.success(`${importedFields.length} fields imported successfully`);
        } else {
          setAdditionalFields(importedFields);
          toast.success(`${importedFields.length} fields imported successfully`);
        }
      } catch (error) {
        console.error("Error importing file:", error);
        toast.error("Error reading file. Please make sure it's a valid CSV or Excel file.");
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      let response;

      // Filter out valid additional fields
      const validFields = (additionalFields || []).filter((field) => field.attribute?.toString().trim() && field.label?.toString().trim());

      // ✅ Convert grouped endorsements to nested structure
      const validEndorsements = endorsementGroups
        .filter((group) => group.mainTitle?.trim() || (group.items || []).some((item) => item.title?.trim() || item.endorsedby_1?.trim() || item.endorsed_place?.trim() || item.issuance_date?.trim() || item.validity_date?.trim()))
        .map((group) => ({
          groupTitle: group.mainTitle || "",
          endorsements: (group.items || []).map((item) => ({
            title: item.title || "",
            endorsed_place: item.endorsed_place || "",
            issuance_date: item.issuance_date || "",
            validity_date: item.validity_date || "",
            endorsement_type: item.endorsement_type || "",
            endorsedby_1: item.endorsedby_1 || "",
            endorsedby_2: item.endorsedby_2 || "",
            endorsedby_3: item.endorsedby_3 || "",
          })),
        }));

      // ---------- CREATE / DUPLICATE DOCUMENT ----------
      if (mode === "create" || mode === "duplicate") {
        const formData = new FormData();

        formData.append("name", formValues.name);
        formData.append("type", formValues.type);
        formData.append("abbreviation", formValues.abbreviation);

        // Append files
        if (formValues.fullTermDocument instanceof File) formData.append("fullTermDocument", formValues.fullTermDocument);
        if (formValues.shortTermDocument instanceof File) formData.append("shortTermDocument", formValues.shortTermDocument);
        if (formValues.interimDocument instanceof File) formData.append("interimDocument", formValues.interimDocument);

        // Append fields and endorsements
        if (validFields.length > 0) formData.append("fields", JSON.stringify(validFields));

        formData.append("endorsements", JSON.stringify(validEndorsements.length > 0 ? validEndorsements : []));

        response = await createDocument(formData);
      } else {
        // ---------- UPDATE DOCUMENT ----------
        const hasFiles = formValues.fullTermDocument instanceof File || formValues.shortTermDocument instanceof File || formValues.interimDocument instanceof File;

        if (hasFiles) {
          const formData = new FormData();
          formData.append("name", formValues.name);
          formData.append("type", formValues.type);
          formData.append("abbreviation", formValues.abbreviation);

          if (formValues.fullTermDocument instanceof File) formData.append("fullTermDocument", formValues.fullTermDocument);
          if (formValues.shortTermDocument instanceof File) formData.append("shortTermDocument", formValues.shortTermDocument);
          if (formValues.interimDocument instanceof File) formData.append("interimDocument", formValues.interimDocument);

          if (editReason) formData.append("reason", editReason);

          if (validFields.length > 0) formData.append("fields", JSON.stringify(validFields));

          formData.append("endorsements", JSON.stringify(validEndorsements.length > 0 ? validEndorsements : []));

          response = await updateDocument(documentId, formData);
        } else {
          // Update without file uploads
          const payload = {
            name: formValues.name,
            type: formValues.type,
            abbreviation: formValues.abbreviation,
            ...(editReason && { reason: editReason }),
          };

          if (formValues.fullTermDocument && typeof formValues.fullTermDocument === "string") payload.fullTermDocument = formValues.fullTermDocument;
          if (formValues.shortTermDocument && typeof formValues.shortTermDocument === "string") payload.shortTermDocument = formValues.shortTermDocument;
          if (formValues.interimDocument && typeof formValues.interimDocument === "string") payload.interimDocument = formValues.interimDocument;

          if (validFields.length > 0) payload.fields = JSON.stringify(validFields);
          payload.endorsements = JSON.stringify(validEndorsements);

          response = await updateDocument(documentId, payload);
        }
      }

      // ---------- HANDLE SUCCESS / ERROR ----------
      if (response?.status === 200 || response?.status === 201) {
        toast.success(mode === "duplicate" ? "Document duplicated successfully" : mode === "update" ? "Document updated successfully" : "Document created successfully");
        router.push("/documents");
      } else {
        toast.error(response?.response?.data?.message || "Something went wrong! Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "300px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleFieldChange = (index, field, value) => {
    const updatedFields = [...additionalFields];
    updatedFields[index] = {
      ...updatedFields[index],
      [field]: value,
    };
    setAdditionalFields(updatedFields);
  };

  const handleAddField = () => {
    const lastField = additionalFields[additionalFields.length - 1];
    if (!additionalFields.length || (lastField?.attribute?.trim() !== "" && lastField?.label?.trim() !== "")) {
      setAdditionalFields((prev) => [...prev, { attribute: "", label: "" }]);
    } else {
      toast.error("Please fill both attribute and label before adding another field.");
    }
  };

  const handleDeleteField = (index) => {
    const updatedFields = [...additionalFields];
    updatedFields.splice(index, 1);
    setAdditionalFields(updatedFields);
    toast.success("Field removed successfully");
  };

  // Drag and drop handlers for additional fields
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // store the index as string
    try {
      e.dataTransfer.setData("text/plain", String(index));
    } catch (err) {
      // ignore if not allowed
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    // If dataTransfer had index, it can be used; but we rely on draggedIndex state
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updatedFields = [...additionalFields];
    const draggedItem = updatedFields[draggedIndex];

    // Remove the dragged item
    updatedFields.splice(draggedIndex, 1);

    // Insert at new position
    const newIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    updatedFields.splice(newIndex, 0, draggedItem);

    setAdditionalFields(updatedFields);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Endorsement handlers
  const handleEndorsementChange = (index, field, value) => {
    const updatedEndorsements = [...endorsements];
    updatedEndorsements[index] = {
      ...updatedEndorsements[index],
      [field]: value,
    };
    setEndorsements(updatedEndorsements);
  };

  const handleAddEndorsement = () => {
    setNewMainTitle("");
    setOpenTitleDialog(true);
  };

  const handleAddEndorsementItem = (groupIndex) => {
    const updated = [...endorsementGroups];
    updated[groupIndex].items.push({
      title: "",
      endorsedby_1: "",
      endorsed_place: "",
      issuance_date: "",
      validity_date: "",
      endorsement_type: "",
    });
    setEndorsementGroups(updated);
  };
  const handleHeaderChange = (index, value) => {
    const updatedEndorsements = [...endorsements];
    updatedEndorsements[index].headerText = value;
    setEndorsements(updatedEndorsements);
  };

  const handleAddSectionHeader = () => {
    setEndorsements((prev) => [
      ...prev,
      {
        type: "header",
        headerText: "",
      },
    ]);
  };

  const handleDeleteEndorsement = (index) => {
    const updatedEndorsements = [...endorsements];
    updatedEndorsements.splice(index, 1);
    setEndorsements(updatedEndorsements);
    toast.success("Endorsement removed successfully");
  };

  const getSubmitButtonText = () => {
    if (mode === "duplicate") {
      return "Create Duplicate";
    }
    return mode === "update" ? "Update Document" : "Create Document";
  };

  const renderFileUpload = (documentTypeKey, label) => {
    const document = formValues[documentTypeKey];
    const hasDocument = document instanceof File || (typeof document === "string" && document);

    return (
      <Box key={documentTypeKey}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
          {label}
        </Typography>
        <FormControl fullWidth>
          {/* outer container is a div (Box) not a label to avoid nested label issues */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid",
              borderColor: "grey.700",
              borderRadius: "6px",
              p: 1.5,
              color: "text.secondary",
              cursor: "pointer",
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                handleFileChange(documentTypeKey, file);
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CloudUploadIcon />
              <Typography variant="body2">{hasDocument ? (document instanceof File ? document.name : `Existing: ${document.split("/").pop()}`) : "Drag files or browse to upload"}</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {hasDocument && (
                <IconButton
                  color="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    setPreviewState((prev) => ({
                      ...prev,
                      open: true,
                      loading: true,
                      fileUrl: typeof document === "string" ? document : URL.createObjectURL(document),
                      title: formValues.name || label,
                    }));
                  }}
                  aria-label="preview document"
                  size="small"
                >
                  <VisibilityIcon />
                </IconButton>
              )}
              <label htmlFor={`upload-input-${documentTypeKey}`}>
                <CommonButton
                  text="Upload"
                  variant="contained"
                  component="span"
                  sx={{
                    borderRadius: "20px",
                    padding: "10px 15px",
                    fontSize: "14px",
                  }}
                >
                  Choose document
                </CommonButton>
                <input
                  type="file"
                  hidden
                  id={`upload-input-${documentTypeKey}`}
                  accept=".doc,.docx,.pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileChange(documentTypeKey, file);
                    }
                    // clear input value so same file can be reselected if needed
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </Box>
          </Box>
        </FormControl>
      </Box>
    );
  };

  return (
    <>
      <CommonCard>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label={
                <Typography variant="body1" color="gray" fontWeight={400}>
                  Document Name <span style={{ color: "red" }}>*</span>
                </Typography>
              }
              name="name"
              value={formValues.name}
              onChange={handleInputChange}
              error={errors.name}
              helperText={errors.name ? "Document name is required" : ""}
            />

            <TextField
              fullWidth
              label={
                <Typography variant="body1" color="gray" fontWeight={400}>
                  Abbreviation <span style={{ color: "red" }}>*</span>
                </Typography>
              }
              name="abbreviation"
              value={formValues.abbreviation}
              onChange={handleInputChange}
              error={errors.abbreviation}
              helperText={errors.abbreviation ? "Abbreviation is required" : ""}
            />

            <FormControl fullWidth error={errors.type}>
              <Select name="type" value={formValues.type} onChange={handleSelectChange} displayEmpty>
                <MenuItem value="" disabled>
                  <Typography variant="body1" color="gray" fontWeight={400}>
                    Select Document Type <span style={{ color: "red" }}>*</span>
                  </Typography>
                </MenuItem>
                {documentType.map((document) => (
                  <MenuItem key={document.value} value={document.value}>
                    {document.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.type && (
                <Typography variant="caption" color="error" mt={"3px"} marginInline={"14px"}>
                  Document type is required
                </Typography>
              )}
            </FormControl>

            {/* Document Upload Sections */}
            <Typography variant="h6" sx={{ mt: 2 }}>
              Document Uploads
            </Typography>
            <Stack spacing={3}>
              {renderFileUpload("fullTermDocument", "Full Term Document")}
              {renderFileUpload("shortTermDocument", "Short Term Document")}
              {renderFileUpload("interimDocument", "Interim Document")}
            </Stack>

            <Typography variant="h6">Additional Fields</Typography>
            <Stack spacing={2}>
              {Array.isArray(additionalFields) &&
                additionalFields.length > 0 &&
                additionalFields.map((field, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1.5,
                      border: "1px solid",
                      borderColor: dragOverIndex === index ? "primary.main" : "grey.300",
                      borderRadius: 1,
                      backgroundColor: draggedIndex === index ? "grey.50" : "transparent",
                      opacity: draggedIndex === index ? 0.5 : 1,
                      transition: "all 0.2s ease",
                      cursor: "move",
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <DragIndicatorIcon
                      sx={{
                        color: "grey.500",
                        cursor: "grab",
                        "&:active": { cursor: "grabbing" },
                      }}
                    />
                    <TextField label="Attribute" value={field.attribute || ""} onChange={(e) => handleFieldChange(index, "attribute", e.target.value)} fullWidth size="small" />
                    <TextField label="Label" value={field.label || ""} onChange={(e) => handleFieldChange(index, "label", e.target.value)} fullWidth size="small" />
                    <IconButton color="error" onClick={() => handleDeleteField(index)} aria-label="delete field" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}

              <Stack direction={"row"} spacing={2}>
                <CommonButton text="Add Attribute" variant="outlined" onClick={handleAddField} sx={{ alignSelf: "flex-start" }} />
                <CommonButton text="Export XLSX" variant="contained" onClick={handleExportCSV} sx={{ alignSelf: "flex-start" }} startIcon={<FileDownloadIcon />} />
                <Box>
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImportCSV} style={{ display: "none" }} id="import-csv-input" />
                  <label htmlFor="import-csv-input">
                    <CommonButton text="Import CSV/XLSX" variant="contained" component="span" sx={{ alignSelf: "flex-start" }} startIcon={<UploadIcon />} />
                  </label>
                </Box>
              </Stack>
            </Stack>

            {/* Endorsements Section */}
            <Stack spacing={3}>
              <Box
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  p: 2,
                  backgroundColor: "#f9f9f9",
                }}
              >
                {/* Endorsements Section */}
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Endorsements
                </Typography>

                <Stack spacing={3}>
                  {endorsementGroups.map((group, gIndex) => (
                    <Box
                      key={gIndex}
                      sx={{
                        border: "2px solid #90caf9",
                        borderRadius: 2,
                        p: 2,
                        backgroundColor: "#f0f7ff",
                      }}
                    >
                      {/* Section Header with Main Title */}
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <TextField
                          label="Main Title"
                          value={group.mainTitle}
                          onChange={(e) => {
                            const updated = [...endorsementGroups];
                            updated[gIndex].mainTitle = e.target.value;
                            setEndorsementGroups(updated);
                          }}
                          size="small"
                          sx={{ flex: 1, mr: 2 }}
                        />
                        <IconButton
                          color="error"
                          onClick={() => {
                            const updated = [...endorsementGroups];
                            updated.splice(gIndex, 1);
                            setEndorsementGroups(updated);
                            toast.success("Section removed successfully");
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      {/* Inner Endorsement Items */}
                      {group.items.map((item, iIndex) => (
                        <Box
                          key={iIndex}
                          sx={{
                            border: "1px solid #e0e0e0",
                            borderRadius: 2,
                            p: 2,
                            mb: 2,
                            backgroundColor: "#fff",
                          }}
                        >
                          <Stack spacing={2}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Typography variant="subtitle2" color="primary">
                                Endorsement {iIndex + 1}
                              </Typography>
                              <IconButton
                                color="error"
                                onClick={() => {
                                  const updated = [...endorsementGroups];
                                  updated[gIndex].items.splice(iIndex, 1);
                                  setEndorsementGroups(updated);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>

                            <TextField
                              label="Title"
                              value={item.title}
                              onChange={(e) => {
                                const updated = [...endorsementGroups];
                                updated[gIndex].items[iIndex].title = e.target.value;
                                setEndorsementGroups(updated);
                              }}
                              size="small"
                              fullWidth
                            />

                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                              <TextField
                                label="Endorsed By"
                                value={item.endorsedby_1}
                                onChange={(e) => {
                                  const updated = [...endorsementGroups];
                                  updated[gIndex].items[iIndex].endorsedby_1 = e.target.value;
                                  setEndorsementGroups(updated);
                                }}
                                size="small"
                              />
                              <TextField
                                label="Endorsed Place"
                                value={item.endorsed_place}
                                onChange={(e) => {
                                  const updated = [...endorsementGroups];
                                  updated[gIndex].items[iIndex].endorsed_place = e.target.value;
                                  setEndorsementGroups(updated);
                                }}
                                size="small"
                              />
                              <TextField
                                label="Issuance Date"
                                value={item.issuance_date}
                                onChange={(e) => {
                                  const updated = [...endorsementGroups];
                                  updated[gIndex].items[iIndex].issuance_date = e.target.value;
                                  setEndorsementGroups(updated);
                                }}
                                size="small"
                              />
                              <TextField
                                label="Validity Date"
                                value={item.validity_date}
                                onChange={(e) => {
                                  const updated = [...endorsementGroups];
                                  updated[gIndex].items[iIndex].validity_date = e.target.value;
                                  setEndorsementGroups(updated);
                                }}
                                size="small"
                              />
                              <TextField
                                label="Endorsement Type"
                                value={item.endorsement_type}
                                onChange={(e) => {
                                  const updated = [...endorsementGroups];
                                  updated[gIndex].items[iIndex].endorsement_type = e.target.value;
                                  setEndorsementGroups(updated);
                                }}
                                size="small"
                              />
                            </Box>
                          </Stack>
                        </Box>
                      ))}

                      {/* Add Inner Endorsement Button */}
                      <CommonButton
                        text="Add Endorsement Entry"
                        variant="outlined"
                        onClick={() => {
                          const updated = [...endorsementGroups];
                          updated[gIndex].items.push({
                            title: "",
                            endorsed_place: "",
                            issuance_date: "",
                            validity_date: "",
                            endorsement_type: "",
                          });
                          setEndorsementGroups(updated);
                        }}
                      />
                    </Box>
                  ))}

                  {/* ✅ Add Main Section Button — shown once */}
                  <CommonButton text="Add Endorsement Section" variant="outlined" onClick={() => setEndorsementGroups((prev) => [...prev, { mainTitle: "", items: [] }])} />
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
              <CommonButton text="Cancel" variant="outlined" onClick={() => router.push("/documents")} />
              <CommonButton text={getSubmitButtonText()} type="submit" variant="contained" disabled={loading} />
            </Stack>
          </Stack>
        </Box>
      </CommonCard>

      <Dialog
        open={previewState.open}
        onClose={() =>
          setPreviewState((prev) => ({
            ...prev,
            open: false,
          }))
        }
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          <div style={{ position: "relative", width: "100%", height: "80vh" }}>
            {!previewState.loading ? (
              previewState.fileUrl && (
                <a
                  href={previewState.fileUrl}
                  download
                  rel="noopener noreferrer"
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    zIndex: 1,
                    backgroundColor: "#4CAF50",
                    color: "white",
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: "4px",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                >
                  Download
                </a>
              )
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%" position="absolute" top={0} left={0} width="100%" zIndex={0} sx={{ backgroundColor: "rgba(255,255,255,0.8)" }}>
                <CircularProgress />
              </Box>
            )}

            {/* only render iframe if fileUrl exists */}
            {previewState.fileUrl ? (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(previewState.fileUrl)}&embedded=true`}
                style={{ width: "100%", height: "100%", border: "none" }}
                title="File Preview"
                onLoad={() =>
                  setPreviewState((prev) => ({
                    ...prev,
                    loading: false,
                  }))
                }
              />
            ) : (
              !previewState.loading && <Box p={2}>No file to preview</Box>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setPreviewState((prev) => ({
                ...prev,
                open: false,
              }))
            }
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DocumentForm;
