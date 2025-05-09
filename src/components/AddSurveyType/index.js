import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import {
  createSurveyType,
  updateSurveyType,
  getSurveyTypeDetails,
  getReports,
} from "@/api";
import {
  CircularProgress,
  FormControl,
  FormLabel,
  Grid2,
  Paper,
  Snackbar,
  Stack,
  Typography,
  Chip,
  TextField,
  Autocomplete,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import CommonInput from "../CommonInput";
import CommonButton from "../CommonButton";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

// Form validation schema
const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  abbreviation: yup.string().required("Abbreviation is required"),
  reportIds: yup
    .array()
    .min(1, "Select at least one report")
    .required("Report selection is required"),
});

const SurveyTypeForm = ({
  mode = "create",
  surveyTypeId = null,
  defaultValues = {},
}) => {
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const router = useRouter();
  const isUpdate = mode === "update";

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      abbreviation: "",
      reportIds: [],
      ...defaultValues
    },
  });
  
  // Watch reportIds to debug
  const watchedReportIds = watch("reportIds");
  
  useEffect(() => {
    console.log("Current reportIds in form:", watchedReportIds);
  }, [watchedReportIds]);

  // First fetch all reports so we have the data available
  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await getReports();
      if (res?.data?.data) {
        setReports(res.data.data);
        console.log("Fetched reports:", res.data.data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    // Load available reports
    fetchReports();
  }, []);

  // Only fetch survey type details after reports are loaded
  const fetchSurveyTypeDetails = async () => {
    if (!surveyTypeId) return;
    
    try {
      setIsDataLoading(true);
      const res = await getSurveyTypeDetails(surveyTypeId);
      const data = res?.data?.data;

      if (!data) {
        toast.error("Failed to load survey type details");
        return;
      }

      console.log("Survey type data received:", data);

      // Extract report IDs from the reports array objects
      let reportIdsArray = [];
      
      if (data.reports && Array.isArray(data.reports)) {
        // Extract IDs from the reports array of objects
        reportIdsArray = data.reports.map(report => {
          // Handle if report is an object with id property or just an id
          if (typeof report === 'object' && report !== null) {
            return typeof report.id === 'string' ? parseInt(report.id, 10) : report.id;
          } else {
            return typeof report === 'string' ? parseInt(report, 10) : report;
          }
        });
      }
      
      // Remove any NaN values that might have been created by parseInt
      reportIdsArray = reportIdsArray.filter(id => !isNaN(id));
      
      console.log("Extracted reportIds:", reportIdsArray);
      
      // Update form values
      setValue("name", data.name || "");
      setValue("abbreviation", data.abbreviation || "");
      setValue("reportIds", reportIdsArray);
      
    } catch (error) {
      console.error("Error fetching survey type details:", error);
      toast.error("Failed to fetch survey type details");
    } finally {
      setIsDataLoading(false);
    }
  };

  // Separate useEffect to fetch survey type details after reports are loaded
  useEffect(() => {
    // If update mode, fetch survey type details after reports are loaded
    if (isUpdate && surveyTypeId && reports.length > 0) {
      fetchSurveyTypeDetails();
    }
  }, [isUpdate, surveyTypeId, reports.length]);

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  const cancelBtn = () => {
    router.push("/survey-types");
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      let res;
      
      if (isUpdate) {
        res = await updateSurveyType(surveyTypeId, data);
        
        if (res?.data?.status === "success") {
          toast.success("Survey type updated successfully");
          setSnackBar({
            open: true,
            message: "Survey type updated successfully",
          });
          setTimeout(() => {
            router.push('/survey-types');
          }, 2000);
        } else {
          throw new Error(res?.data?.message || "Failed to update survey type");
        }
      } else {
        res = await createSurveyType(data);
        
        if (res?.data?.status === "success") {
          toast.success("Survey type created successfully");
          setSnackBar({
            open: true,
            message: "Survey type created successfully",
          });
          setTimeout(() => {
            router.push('/survey-types');
          }, 2000);
        } else {
          throw new Error(res?.data?.message || "Failed to create survey type");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "An error occurred");
      setSnackBar({
        open: true,
        message: error.message || "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get report object from ID
  const getReportById = (id) => {
    // Handle numeric or string IDs
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    console.log('216 ===>',reports)
    return reports.find(report => report.id == numericId) || { id: numericId, name: `Unknown (ID: ${numericId})` };
  };

  return (
    <Box>
      {isDataLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ height: 300 }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Stack mt={4} spacing={4}>
            <Paper sx={{ padding: "20px", borderRadius: "15px" }}>
              <Typography variant="h6" mb={3}>
                {isUpdate ? "Update Survey Type" : "Create New Survey Type"}
              </Typography>
              
              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid2 container spacing={3}>
                  <Grid2 size={{xs: 12}}>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <CommonInput
                          {...field}
                          fullWidth
                          variant="standard"
                          label={
                            <span>
                              Name <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          placeholder="Enter survey type name"
                          error={Boolean(errors.name)}
                          helperText={errors.name?.message}
                          InputProps={{
                            style: { color: "black" },
                          }}
                        />
                      )}
                    />
                  </Grid2>

                  <Grid2 size={{xs: 12}}>
                    <Controller
                      name="abbreviation"
                      control={control}
                      render={({ field }) => (
                        <CommonInput
                          {...field}
                          fullWidth
                          variant="standard"
                          label={
                            <span>
                              Abbreviation <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          placeholder="Enter abbreviation"
                          error={Boolean(errors.abbreviation)}
                          helperText={errors.abbreviation?.message}
                          InputProps={{
                            style: { color: "black" },
                          }}
                        />
                      )}
                    />
                  </Grid2>

                  <Grid2 size={{xs: 12}}>
                    <FormControl
                      fullWidth
                      variant="standard"
                      error={Boolean(errors.reportIds)}
                    >
                      <FormLabel component="legend" sx={{ mb: 1 }}>
                        <span>Reports <span style={{ color: "red" }}>*</span></span>
                      </FormLabel>
                      <Controller
                        name="reportIds"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            multiple
                            id="reports-autocomplete"
                            options={reports}
                            loading={loadingReports}
                            getOptionLabel={(option) => {
                              // For display in dropdown menu
                              return typeof option === 'object' ? option.name : getReportById(option).name;
                            }}
                            isOptionEqualToValue={(option, value) => {
                              // For comparing options
                              if (typeof value === 'object') {
                                return option.id === value.id;
                              }
                              return option.id === value || option.id === parseInt(value, 10);
                            }}
                            // Convert IDs to report objects for Autocomplete
                            value={field.value.map(id => getReportById(id))}
                            onChange={(event, newValue) => {
                              // Extract IDs from selected report objects
                              const reportIds = newValue.map(item => item.id);
                              field.onChange(reportIds);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                placeholder="Search and select reports"
                                error={Boolean(errors.reportIds)}
                                helperText={errors.reportIds?.message}
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {loadingReports ? <CircularProgress color="inherit" size={20} /> : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                              />
                            )}
                            renderTags={(tagValue, getTagProps) =>
                              tagValue.map((option, index) => (
                                <Chip
                                  key={option.id}
                                  variant="outlined"
                                  label={option.name}
                                  {...getTagProps({ index })}
                                />
                              ))
                            }
                            filterSelectedOptions
                          />
                        )}
                      />
                    </FormControl>
                  </Grid2>
                </Grid2>

                <Stack
                  mt={4}
                  spacing={2}
                  direction="row"
                  justifyContent="flex-start"
                >
                  <CommonButton
                    type="submit"
                    variant="contained"
                    text={isSubmitting ? "Saving..." : "Save"}
                    disabled={isSubmitting}
                  />
                  <CommonButton
                    onClick={cancelBtn}
                    variant="contained"
                    text="Cancel"
                    disabled={isSubmitting}
                  />
                </Stack>
              </form>

              <Snackbar
                open={snackBar.open}
                autoHideDuration={2000}
                message={snackBar.message}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "center",
                }}
                onClose={snackbarClose}
                className="snackBarColor"
                key="snackbar"
              />
            </Paper>
          </Stack>
        </>
      )}
    </Box>
  );
};

export default SurveyTypeForm;