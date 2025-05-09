"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import { toast } from "react-toastify";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import { createDocument, getDocumentDetails, updateDocument } from "@/api";

const DocumentForm = ({ mode = "create", documentId, editReason = "" }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    type: "",
  });
  const [errors, setErrors] = useState({
    name: false,
    type: false,
  });

  useEffect(() => {
    if (mode === "update" && documentId) {
      fetchDocumentDetails();
    }
  }, [mode, documentId]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const result = await getDocumentDetails(documentId);
      if (result?.status === 200) {
        const documentData = result.data.data;
        setFormValues({
          name: documentData.name || "",
          type: documentData.type || "",
        });
      } else {
        toast.error("Error fetching document details");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Something went wrong while fetching document details");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when typing
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

      if (mode === "create") {
        response = await createDocument(formValues);
      } else {
        // Include edit reason in the payload for update
        const payload = {
          ...formValues,
          ...(editReason && { reason: editReason }),
        };
        response = await updateDocument(documentId, payload);
      }

      if (response?.status === 200 || response?.status === 201) {
        toast.success(
          mode === "create"
            ? "Document created successfully"
            : "Document updated successfully"
        );
        router.push("/documents");
      } else {
        toast.error(
          response?.response?.data?.message ||
            "Something went wrong! Please try again."
        );
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("An error occurred. Please try again.");
    }
  };

  if (mode === "update" && loading) {
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

  return (
    <CommonCard>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Document Name"
            name="name"
            value={formValues.name}
            onChange={handleInputChange}
            error={errors.name}
            helperText={errors.name ? "Document name is required" : ""}
            required
          />

          <TextField
            fullWidth
            label="Document Type"
            name="type"
            value={formValues.type}
            onChange={handleInputChange}
            error={errors.type}
            helperText={errors.type ? "Document type is required" : ""}
            required
          />

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
              text={loading ? "Saving..." : mode === "create" ? "Create" : "Update"}
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