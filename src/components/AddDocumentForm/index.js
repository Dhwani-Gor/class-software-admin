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
import IconButton from "@mui/material/IconButton";
import { toast } from "react-toastify";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import { createDocument, getDocumentDetails, updateDocument } from "@/api";

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
    validity: "",
    document: null,
  });
  const [errors, setErrors] = useState({
    name: false,
    type: false,
    validity: "",
    document: false,
    fields: false,

  });
  const [additionalFields, setAdditionalFields] = useState([]);
  const [removedFields, setRemovedFields] = useState([]);

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
        setFormValues({
          name: mode === "duplicate" ? `${documentData.name} (Copy)` : documentData.name || "",
          type: documentData.type || "",
          validity: mode === "duplicate" ? "" : documentData.validity,
          document: mode === "duplicate" ? "" : documentData.filePath,
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

  const validateForm = () => {
    const newErrors = {
      name: !formValues.name.trim(),
      type: !formValues.type.trim(),
      validity: !formValues.validity.trim(),
      document: !formValues.document,
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
        formData.append("validity", formValues.validity);
  
        if (formValues.document instanceof File) {
          formData.append("document", formValues.document);
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
        const hasFile = formValues.document instanceof File;
  
        if (hasFile) {
          const formData = new FormData();
          formData.append("name", formValues.name);
          formData.append("type", formValues.type);
          formData.append("validity", formValues.validity);
          formData.append("document", formValues.document);
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
            ...formValues,
            ...(editReason && { reason: editReason }),
          };
  
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
    if (additionalFields[index]) {
      setRemovedFields(prev => [...prev, additionalFields[index]]);
    }

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

  return (
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

          <FormControl fullWidth error={errors.type}>
            <Select
              name="type"
              value={formValues.type}
              onChange={handleSelectChange}
              displayEmpty
            >
              <MenuItem value="" disabled>
                <Typography variant="body1" color="gray" fontWeight={400}>Select Document Type <span style={{ color: "red" }}>*</span></Typography>              </MenuItem>
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

          <FormControl fullWidth error={errors.validity}>
            <Select
              name="validity"
              value={formValues.validity}
              onChange={handleSelectChange}
              displayEmpty
            >
              <MenuItem value="" disabled>
                <Typography variant="body1" color="gray" fontWeight={400}>Select Document Validity Type <span style={{ color: "red" }}>*</span></Typography>
              </MenuItem>
              {documentValidityType.map((document) => (
                <MenuItem key={document.value} value={document.value}>
                  {document.label}
                </MenuItem>
              ))}
            </Select>
            {errors.validity && (
              <Typography
                variant="caption"
                color="error"
                mt={"3px"}
                marginInline={"14px"}
              >
                Document Validity Type is required
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth error={errors.document}>
            <Box
              component="label"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid",
                borderColor: errors.document ? "error.main" : "grey.700",
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
                  setFormValues((prev) => ({
                    ...prev,
                    document: file,
                  }));
                  if (errors.document) {
                    setErrors((prev) => ({
                      ...prev,
                      document: false,
                    }));
                  }
                }
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CloudUploadIcon />
                <Typography variant="body2">
                  {formValues.document
                    ? formValues.document.name || formValues.document
                    : "Drag files or browse to upload"}
                </Typography>
              </Box>

              <CommonButton
                text="Upload"
                component="span"
                variant="contained"
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
                accept=".doc,.docx"
                onChange={(e) => {
                  const document = e.target.files[0];
                  setFormValues((prev) => ({
                    ...prev,
                    document,
                  }));
                  if (errors.document) {
                    setErrors((prev) => ({
                      ...prev,
                      document: false,
                    }));
                  }
                }}
              />
            </Box>

            {errors.document && (
              <Typography variant="caption" color="error" mt={1}>
                Document is required
              </Typography>
            )}
          </FormControl>

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
  );
};

export default DocumentForm;