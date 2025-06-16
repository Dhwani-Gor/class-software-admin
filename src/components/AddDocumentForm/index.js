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
import { Chip } from "@mui/material";

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
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewState, setPreviewState] = useState({
    open: false,
    loading: false,
    fileUrl: null,
    title: ''
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
  }, [documentId]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const result = await getDocumentDetails(documentId);
      if (result?.status === 200) {
        const documentData = result.data.data;
        console.log(documentData, "document data")
        setLoadingPreview(true);
        setPreviewState({
          open: false,
          loading: false,
          fileUrl: documentData.fullTermFilePath || documentData.interimFilePath || documentData.shortTermFilePath,
          title: documentData.name || ""
        });
        setFormValues({
          name: mode === "duplicate" ? `${documentData.name} (Copy)` : documentData.name || "",
          type: documentData.type || "",
          abbreviation: mode === "duplicate" ? "" : documentData.abbreviation,
          fullTermDocument: mode === "duplicate" ? null : documentData.fullTermFilePath || null,
          shortTermDocument: mode === "duplicate" ? null : documentData.shortTermFilePath || null,
          interimDocument: mode === "duplicate" ? null : documentData.interimFilePath || null,
        });

        if (documentData.fields) {
          try {
            let parsed = documentData.fields;

            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }

            if (!Array.isArray(parsed)) {
              parsed = [parsed];
            }

            const validFields = parsed.filter(f => f.attribute && f.label);
            setAdditionalFields(validFields);
          } catch (err) {
            console.error("Failed to parse fields:", err);
            setAdditionalFields([]);
          }
        }

      } else {
        toast.error("Error fetching document details");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Something went wrong while fetching document details");
      console.error(error);
    }
  }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      let response;

      if (mode === "create" || mode === "duplicate") {
        const formData = new FormData();
        formData.append("name", formValues.name);
        formData.append("type", formValues.type);
        formData.append("abbreviation", formValues.abbreviation);

        // Add all document types that have files
        if (formValues.fullTermDocument instanceof File) {
          formData.append("fullTermDocument", formValues.fullTermDocument);
        }
        if (formValues.shortTermDocument instanceof File) {
          formData.append("shortTermDocument", formValues.shortTermDocument);
        }
        if (formValues.interimDocument instanceof File) {
          formData.append("interimDocument", formValues.interimDocument);
        }

        if (additionalFields?.length > 0) {
          const validFields = additionalFields.filter(
            (field) => field.attribute.trim() && field.label.trim()
          );
          if (validFields.length > 0) {
            formData.append("fields", JSON.stringify(validFields));
          }
        }

        response = await createDocument(formData);
      } else {
        const hasFiles =
          formValues.fullTermDocument instanceof File ||
          formValues.shortTermDocument instanceof File ||
          formValues.interimDocument instanceof File;

        if (hasFiles) {
          const formData = new FormData();
          formData.append("name", formValues.name);
          formData.append("type", formValues.type);
          formData.append("abbreviation", formValues.abbreviation);

          if (formValues.fullTermDocument instanceof File) {
            formData.append("fullTermDocument", formValues.fullTermDocument);
          }
          if (formValues.shortTermDocument instanceof File) {
            formData.append("shortTermDocument", formValues.shortTermDocument);
          }
          if (formValues.interimDocument instanceof File) {
            formData.append("interimDocument", formValues.interimDocument);
          }

          if (editReason) formData.append("reason", editReason);

          if (additionalFields?.length > 0) {
            const validFields = additionalFields.filter(
              (field) => field.attribute.trim() && field.label.trim()
            );
            if (validFields.length > 0) {
              formData.append("fields", JSON.stringify(validFields));
            }
          }

          response = await updateDocument(documentId, formData);
        } else {
          const payload = {
            name: formValues.name,
            type: formValues.type,
            abbreviation: formValues.abbreviation,
            ...(editReason && { reason: editReason }),
          };

          // Add existing document paths if they exist
          if (formValues.fullTermDocument && typeof formValues.fullTermDocument === 'string') {
            payload.fullTermDocument = formValues.fullTermDocument;
          }
          if (formValues.shortTermDocument && typeof formValues.shortTermDocument === 'string') {
            payload.shortTermDocument = formValues.shortTermDocument;
          }
          if (formValues.interimDocument && typeof formValues.interimDocument === 'string') {
            payload.interimDocument = formValues.interimDocument;
          }

          if (additionalFields?.length > 0) {
            const validFields = additionalFields.filter(
              (field) => field.attribute.trim() && field.label.trim()
            );
            if (validFields.length > 0) {
              payload.fields = JSON.stringify(validFields);
            }
          }

          response = await updateDocument(documentId, payload);
        }
      }

      // ✅ Common success handling
      if (response?.status === 200 || response?.status === 201) {
        toast.success(
          mode === "duplicate"
            ? "Document duplicated successfully"
            : mode === "update"
              ? "Document updated successfully"
              : "Document created successfully"
        );
        router.push("/documents");
      } else {
        toast.error(
          response?.response?.data?.message ||
          "Something went wrong! Please try again."
        );
      }
    } catch (error) {
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
      [field]: value
    };
    setAdditionalFields(updatedFields);
  };

  const handleAddField = () => {
    const lastField = additionalFields[additionalFields.length - 1];
    if (!additionalFields.length ||
      (lastField?.attribute?.trim() !== "" && lastField?.label?.trim() !== "")) {
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

  const getSubmitButtonText = () => {
    if (mode === "duplicate") {
      return "Create Duplicate";
    }
    return mode === "update" ? "Update Document" : "Create Document";
  };

  const renderFileUpload = (documentType, label) => {
    const document = formValues[documentType];
    const hasDocument = document instanceof File || (typeof document === 'string' && document);

    return (
      <Box key={documentType}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
          {label}
        </Typography>
        <FormControl fullWidth>
          <Box
            component="label"
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
                handleFileChange(documentType, file);
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CloudUploadIcon />
              <Typography variant="body2">
                {hasDocument
                  ? (document instanceof File ? document.name : `Existing: ${document.split('/').pop()}`)
                  : "Drag files or browse to upload"}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {hasDocument && (
                <IconButton
                  color="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    setLoadingPreview(true);

                    // ✅ Fixed: Get the correct file URL
                    let fileUrl = null;
                    if (typeof document === 'string') {
                      // If it's a string, it's an existing file path from server
                      fileUrl = document;
                    } else if (document instanceof File) {
                      // If it's a File object, create a URL for preview
                      fileUrl = URL.createObjectURL(document);
                    }

                    setPreviewState({
                      open: true,
                      loading: true,
                      fileUrl: fileUrl,
                      title: formValues.name || label
                    });
                  }}
                  aria-label="preview document"
                  size="small"
                >
                  <VisibilityIcon />
                </IconButton>
              )}
              <label htmlFor={`upload-input-${documentType}`}>
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
                  id={`upload-input-${documentType}`}
                  accept=".doc,.docx,.pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileChange(documentType, file);
                    }
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
              label={<Typography variant="body1" color="gray" fontWeight={400}>Document Name <span style={{ color: "red" }}>*</span></Typography>}
              name="name"
              value={formValues.name}
              onChange={handleInputChange}
              error={errors.name}
              helperText={errors.name ? "Document name is required" : ""}
            />

            <TextField
              fullWidth
              label={<Typography variant="body1" color="gray" fontWeight={400}>Abbreviation <span style={{ color: "red" }}>*</span></Typography>}
              name="abbreviation"
              value={formValues.abbreviation}
              onChange={handleInputChange}
              error={errors.abbreviation}
              helperText={errors.abbreviation ? "Abbreviation is required" : ""}
            />

            <FormControl fullWidth error={errors.type}>
              <Select
                name="type"
                value={formValues.type}
                onChange={handleSelectChange}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  <Typography variant="body1" color="gray" fontWeight={400}>Select Document Type <span style={{ color: "red" }}>*</span></Typography>
                </MenuItem>
                {documentType.map((document) => (
                  <MenuItem key={document.value} value={document.value}>
                    {document.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.type && (
                <Typography
                  variant="caption"
                  color="error"
                  mt={"3px"}
                  marginInline={"14px"}
                >
                  Document type is required
                </Typography>
              )}
            </FormControl>

            {/* Document Upload Sections */}
            <Typography variant="h6" sx={{ mt: 2 }}>Document Uploads</Typography>
            <Stack spacing={3}>
              {renderFileUpload("fullTermDocument", "Full Term Document")}
              {renderFileUpload("shortTermDocument", "Short Term Document")}
              {renderFileUpload("interimDocument", "Interim Document")}
            </Stack>

            <Typography variant="h6">Additional Fields</Typography>
            <Stack spacing={2}>
              {Array.isArray(additionalFields) && additionalFields.length > 0 &&
                additionalFields.map((field, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      label="Attribute"
                      value={field.attribute || ""}
                      onChange={(e) => handleFieldChange(index, "attribute", e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Label"
                      value={field.label || ""}
                      onChange={(e) => handleFieldChange(index, "label", e.target.value)}
                      fullWidth
                    />
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteField(index)}
                      aria-label="delete field"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}

              <CommonButton
                text="Add Attribute"
                variant="outlined"
                onClick={handleAddField}
                sx={{ alignSelf: "flex-start" }}
              />
            </Stack>

            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={2}
              sx={{ mt: 3 }}
            >
              <CommonButton
                text="Cancel"
                variant="outlined"
                onClick={() => router.push("/documents")}
              />
              <CommonButton
                text={getSubmitButtonText()}
                type="submit"
                variant="contained"
                disabled={loading}
              />
            </Stack>
          </Stack>
        </Box>
      </CommonCard>
      <Dialog
        open={previewState.open}
        onClose={() => setPreviewState({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          <div style={{ position: 'relative', width: '100%', height: '80vh' }}>
            {!loadingPreview ? (
              <a
                href={previewState.fileUrl}
                download
                rel="noopener noreferrer"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  zIndex: 1,
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                Download
              </a>) : (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
                position="absolute"
                top={0}
                left={0}
                width="100%"
                zIndex={0}
                sx={{ backgroundColor: "rgba(255,255,255,0.8)" }}
              >
                <CircularProgress />
              </Box>
            )}
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(previewState.fileUrl)}&embedded=true`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="File Preview"
              onLoad={() => setLoadingPreview(false)}

            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewState({ open: false })} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DocumentForm;