"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Snackbar,
  CircularProgress,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import CommonInput from "@/components/CommonInput";
import {
  createSystemVariable,
  updateSystemVariable,
  getSystemVariableDetails
} from "@/api";

const SystemVariableForm = ({ mode, variableId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [formData, setFormData] = useState({
    type: "",
    information: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [errors, setErrors] = useState({});

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  // Fetch system variable details for update mode
  useEffect(() => {
    if (mode === "update" && variableId) {
      fetchSystemVariableDetails();
    }
  }, [mode, variableId]);

  const fetchSystemVariableDetails = async () => {
    setLoading(true);
    try {
      const res = await getSystemVariableDetails(variableId);
      if (res?.data?.data) {
        setFormData({
          type: res.data.data.type || "",
          information: res.data.data.information || "",
        });
      }
    } catch (e) {
      console.error("Error fetching system variable details:", e);
      setSnackBar({
        open: true,
        message: "Failed to fetch system variable details."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }

    // Clear file when type changes from image to text
    if (field === "type" && event.target.value === "text") {
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setSnackBar({
          open: true,
          message: "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
        });
        return;
      }

      // Validate file size (e.g., max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setSnackBar({
          open: true,
          message: "File size should be less than 5MB"
        });
        return;
      }

      setSelectedFile(file);

      // Create preview for image
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Clear error
      if (errors.information) {
        setErrors(prev => ({
          ...prev,
          information: ""
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type.trim()) {
      newErrors.type = "Type is required";
    }

    if (formData.type === "text") {
      if (!formData.information.trim()) {
        newErrors.information = "Information is required";
      }
    } else if (formData.type === "image") {
      if (mode === "create" && !selectedFile) {
        newErrors.information = "Please select an image file";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let res;

      if (formData.type === "image") {
        // Handle FormData for image upload
        const formDataPayload = new FormData();
        formDataPayload.append("type", formData.type);

        if (selectedFile) {
          formDataPayload.append("information", selectedFile);
        } else if (mode === "update") {
          // Keep existing image information if no new file selected
          formDataPayload.append("information", formData.information);
        }

        if (mode === "create") {
          res = await createSystemVariable(formDataPayload);
        } else {
          res = await updateSystemVariable(variableId, formDataPayload);
        }
      } else {
        // Handle regular JSON payload for text
        const payload = {
          type: formData.type.trim(),
          information: formData.information.trim(),
        };

        if (mode === "create") {
          res = await createSystemVariable(payload);
        } else {
          res = await updateSystemVariable(variableId, payload);
        }
      }

      if (res?.data?.message) {
        setSnackBar({
          open: true,
          message: res.data.message
        });

        // Redirect after successful operation
        setTimeout(() => {
          router.push("/system-variables");
        }, 1500);
      }
    } catch (e) {
      console.error("Error saving system variable:", e);
      setSnackBar({
        open: true,
        message: `Failed to ${mode} system variable.`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/system-variables");
  };

  if (loading && mode === "update") {
    return (
      <Layout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="300px"
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <CommonCard>
      <Typography variant="h5" fontWeight={600} mb={3}>
        {mode === "create" ? "Add System Variable" : "Update System Variable"}
      </Typography>


      <FormControl fullWidth error={!!errors.type}>
        <InputLabel>Type *</InputLabel>
        <Select
          value={formData.type}
          onChange={handleInputChange("type")}
          label="Type *"
        >
          <MenuItem value="text">Text</MenuItem>
          <MenuItem value="image">Image</MenuItem>
        </Select>
        {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
      </FormControl>

      <Box mt={3}>
        {formData.type === "text" ? (
          <CommonInput
            label="Information"
            placeholder="Enter information"
            fullWidth
            multiline
            value={formData.information}
            onChange={handleInputChange("information")}
            error={!!errors.information}
            helperText={errors.information}
            required
          />
        ) : formData.type === "image" ? (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Image Upload *
            </Typography>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="image-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{
                  p: 2,
                  borderStyle: 'dashed',
                  borderColor: errors.information ? 'error.main' : 'divider'
                }}
              >
                {selectedFile ? selectedFile.name : "Choose Image File"}
              </Button>
            </label>
            {errors.information && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {errors.information}
              </Typography>
            )}

            {filePreview && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Preview:
                </Typography>
                <Box
                  component="img"
                  src={filePreview}
                  alt="Preview"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    objectFit: 'contain',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                />
              </Box>
            )}

            {mode === "update" && !selectedFile && formData.information && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Current Image:
                </Typography>
                <Box
                  component="img"
                  src={formData.information}
                  alt="Current"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    objectFit: 'contain',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                />
              </Box>
            )}
          </Box>
        ) : null}
      </Box>



      <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
        <CommonButton
          text={mode === "create" ? "Create" : "Update"}
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ minWidth: 120 }}
        />
        <CommonButton
          text="Cancel"
          variant="outlined"
          onClick={handleCancel}
          disabled={loading}
          sx={{ minWidth: 120 }}
        />
      </Stack>

      <Snackbar
        open={snackBar.open}
        autoHideDuration={3000}
        message={snackBar.message}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        onClose={snackbarClose}
        className="snackBarColor"
        key="snackbar"
      />
    </CommonCard>
  );
};

export default SystemVariableForm;