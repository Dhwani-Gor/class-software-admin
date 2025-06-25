import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Paper,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import CommonCard from "@/components/CommonCard";
import CommonInput from "@/components/CommonInput";
import CommonButton from "@/components/CommonButton";
import { 
  createSystemVariable, 
  updateSystemVariable, 
  getSystemVariableDetails 
} from "@/api";

const SystemVariableForm = ({ mode = "create", variableId = null }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [snackBar, setSnackBar] = useState({ open: false, message: "", severity: "success" });
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    information: "",
    file: null
  });
  
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState("");

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "", severity: "success" });
  };

  // Fetch existing data for edit mode
  useEffect(() => {
    if (mode === "update" && variableId) {
      fetchSystemVariable();
    }
  }, [mode, variableId]);

  const fetchSystemVariable = async () => {
    console.log(variableId)
    setFetchLoading(true);
    try {
      const response = await getSystemVariableDetails(variableId);
      console.log("API Response:", response); // Debug log
      
      if (response?.data) {
        const data = response.data.data[0];
        console.log("Fetched data:", data); // Debug log
        
        setFormData({
          name: data.name || "",
          type: data.type || "",
          information: data.information || "", 
          file: data.information || ""
        });
      ``
      }
    } catch (error) {
      console.error("Error fetching system variable:", error);
      setSnackBar({
        open: true,
        message: "Failed to fetch system variable data",
        severity: "error"
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const handleTypeChange = (event) => {
    const newType = event.target.value;
    setFormData(prev => ({
      ...prev,
      type: newType,
      information: "", // Clear information when type changes
      file: null // Clear file when type changes
    }));
    setFileName("");
    
    // Clear errors
    setErrors({});
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (images only)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setSnackBar({
          open: true,
          message: "Please select a valid image file (JPEG, PNG, GIF, WebP)",
          severity: "error"
        });
        return;
      }
      
      // Validate file size (e.g., max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setSnackBar({
          open: true,
          message: "File size should not exceed 5MB",
          severity: "error"
        });
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        file: file
      }));
      setFileName(file.name);
      
      // Clear file error
      if (errors.file) {
        setErrors(prev => ({
          ...prev,
          file: ""
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.type) {
      newErrors.type = "Type is required";
    }
    
    if (formData.type === "text" && !formData.information.trim()) {
      newErrors.information = "Information is required for text type";
    }
    
    if (formData.type === "image") {
      // For create mode, file is required
      if (mode === "create" && !formData.file) {
        newErrors.file = "File is required for image type";
      }
      // For update mode, file is optional (can keep existing file)
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare form data for API
      const apiData = new FormData();
      apiData.append("name", formData.name.trim());
      apiData.append("type", formData.type);
      
      if (formData.type === "text") {
        apiData.append("information", formData.information.trim());
      } else if (formData.type === "image") {
        if (formData.file) {
          apiData.append("file", formData.file);
        }
      }
      
      let response;
      if (mode === "create") {
        response = await createSystemVariable(apiData);
      } else {
        apiData.append("id", variableId);
        response = await updateSystemVariable(variableId, apiData);
      }
      
      if (response?.data) {
        setSnackBar({
          open: true,
          message: response.data.message || `System Variable ${mode === "create" ? "created" : "updated"} successfully`,
          severity: "success"
        });
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push("/system-variables");
        }, 1500);
      }
    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} system variable:`, error);
      setSnackBar({
        open: true,
        message: error.response?.data?.message || `Failed to ${mode === "create" ? "create" : "update"} system variable`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/system-variables");
  };

  if (fetchLoading) {
    return (
      <CommonCard>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="300px"
        >
          <CircularProgress />
        </Box>
      </CommonCard>
    );
  }

  return (
    <CommonCard>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        {mode === "create" ? "Create" : "Update"} System Variable
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Name Field */}
          <Box>
            <CommonInput
              label="Name"
              placeholder="Enter system variable name"
              fullWidth
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Box>

          {/* Type Field */}
          <Box>
            <FormControl fullWidth error={!!errors.type} required>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={handleTypeChange}
                label="Type"
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="image">Image</MenuItem>
              </Select>
              {errors.type && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                  {errors.type}
                </Typography>
              )}
            </FormControl>
          </Box>

          {/* Conditional Field - Information or File */}
          {formData.type === "text" && (
            <Box>
              <CommonInput
                label="Information"
                placeholder="Enter information"
                fullWidth
                multiline
                value={formData.information}
                onChange={(e) => handleInputChange("information", e.target.value)}
                error={!!errors.information}
                helperText={errors.information}
                required
              />
            </Box>
          )}

          {formData.type === "image" && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                File {mode === "create" ? "*" : "(Optional - leave empty to keep existing file)"}
              </Typography>
              
              {/* Show existing file name in edit mode */}
              {mode === "update" && fileName && !formData.file && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Current file: {fileName}
                  {formData.information && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      File URL: {formData.information}
                    </Typography>
                  )}
                </Alert>
              )}
              
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  border: errors.file ? "1px solid #d32f2f" : "1px dashed #ccc",
                  backgroundColor: "#fafafa",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "#f5f5f5"
                  }
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" style={{ cursor: "pointer", width: "100%" }}>
                  <Box textAlign="center">
                    {formData.file ? (
                      <Typography color="primary">
                        Selected: {formData.file}
                      </Typography>
                    ) : fileName ? (
                      <Typography color="text.secondary">
                        Current: {fileName} - Click to change
                      </Typography>
                    ) : (
                      <Typography color="text.secondary">
                        Click to select an image file
                      </Typography>
                    )}
                  </Box>
                </label>
              </Paper>
              
              {errors.file && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.file}
                </Typography>
              )}
            </Box>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
            <CommonButton
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                mode === "create" ? "Create" : "Update"
              )}
            </CommonButton>
            
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Snackbar
        open={snackBar.open}
        autoHideDuration={4000}
        onClose={snackbarClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Alert onClose={snackbarClose} severity={snackBar.severity} sx={{ width: '100%' }}>
          {snackBar.message}
        </Alert>
      </Snackbar>
    </CommonCard>
  );
};

export default SystemVariableForm;