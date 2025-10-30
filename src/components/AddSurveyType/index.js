import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { createSurveyType, updateSurveyType, getSurveyTypeDetails, getReports } from "@/api";
import { CircularProgress, FormControl, FormLabel, Grid2, Paper, Stack, Typography, Chip, TextField, Autocomplete, FormControlLabel, Checkbox } from "@mui/material";
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
  reportId: yup.number().nullable(),
  surveyCategory: yup.string().required("Please select a survey category"),
});

const SurveyTypeForm = ({ mode = "create", surveyTypeId = null, defaultValues = {} }) => {
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
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      abbreviation: "",
      reportId: null,
      surveyCategory: "", // Changed from individual boolean fields to single category
      ...defaultValues,
    },
  });

  const watchedReportIds = watch("reportId");

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await getReports();
      if (res?.data?.data) {
        setReports(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

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

      setValue("name", data.name || "");
      setValue("abbreviation", data.abbreviation || "");
      setValue("reportId", data.reportId || null);

      // Convert boolean fields to single category selection
      let category = "";
      if (data.statutorySurvey) category = "statutory";
      else if (data.classificationSurvey) category = "classification";
      else if (data.audit) category = "audit";

      setValue("surveyCategory", category);
    } catch (error) {
      console.error("Error fetching survey type details:", error);
      toast.error("Failed to fetch survey type details");
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (isUpdate && surveyTypeId && reports.length > 0) {
      fetchSurveyTypeDetails();
    }
  }, [isUpdate, surveyTypeId, reports.length]);

  const cancelBtn = () => {
    router.push("/survey-types");
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // Convert single category back to boolean fields for API
      const payload = {
        name: data.name,
        abbreviation: data.abbreviation,
        reportId: data.reportId,
        statutorySurvey: data.surveyCategory === "statutory",
        classificationSurvey: data.surveyCategory === "classification",
        audit: data.surveyCategory === "audit",
      };

      let res;
      if (isUpdate) {
        res = await updateSurveyType(surveyTypeId, payload);
        if (res?.data?.status === "success") {
          toast.success("Survey type updated successfully");
          setTimeout(() => router.push("/survey-types"), 2000);
        } else throw new Error(res?.data?.message || "Failed to update survey type");
      } else {
        res = await createSurveyType(payload);
        if (res?.data?.status === "success") {
          toast.success("Survey type created successfully");
          router.push("/survey-types");
        } else throw new Error(res?.data?.message || "Failed to create survey type");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReportById = (id) => {
    if (!id) return null;
    return reports.find((report) => report.id === id) || null;
  };

  return (
    <Box>
      {isDataLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: 300 }}>
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
                  <Grid2 size={{ xs: 12 }}>
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

                  <Grid2 size={{ xs: 12 }}>
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

                  <Grid2 size={{ xs: 12 }}>
                    <FormControl fullWidth variant="standard" error={Boolean(errors.reportId)}>
                      <FormLabel component="legend" sx={{ mb: 1 }}>
                        <Typography color="#000000DE" fontWeight={"500"}>
                          Reports
                        </Typography>
                      </FormLabel>
                      <Controller
                        name="reportId"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            id="report-autocomplete"
                            options={reports}
                            loading={loadingReports}
                            getOptionLabel={(option) => (typeof option === "object" ? option.name : getReportById(option)?.name || "")}
                            isOptionEqualToValue={(option, value) => option.id === (typeof value === "object" ? value.id : value)}
                            value={getReportById(field.value)}
                            onChange={(event, newValue) => {
                              field.onChange(newValue?.id || null);
                            }}
                            filterOptions={(options, { inputValue }) => options.filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()))}
                            renderTags={(tagValue, getTagProps) => tagValue.map((option, index) => <Chip key={option.id} label={option.name} {...getTagProps({ index })} />)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                placeholder="Search and Select Report"
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
                          />
                        )}
                      />
                    </FormControl>
                  </Grid2>

                  <Grid2 size={{ xs: 12 }}>
                    <FormControl component="fieldset" error={Boolean(errors.surveyCategory)}>
                      {/* <FormLabel component="legend" sx={{ mb: 1 }}>
                        <Typography color="#000000DE" fontWeight={"500"}>
                          Survey Category{" "}
                          <span style={{ color: "red" }}>*</span>
                        </Typography>
                      </FormLabel> */}
                      <Box sx={{ display: "flex", marginTop: "6px" }}>
                        <Controller
                          name="surveyCategory"
                          control={control}
                          render={({ field }) => (
                            <>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={field.value === "statutory"}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.onChange("statutory");
                                      } else {
                                        field.onChange("");
                                      }
                                    }}
                                  />
                                }
                                label="Statutory Survey"
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={field.value === "classification"}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.onChange("classification");
                                      } else {
                                        field.onChange("");
                                      }
                                    }}
                                  />
                                }
                                label="Classification Survey"
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={field.value === "audit"}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.onChange("audit");
                                      } else {
                                        field.onChange("");
                                      }
                                    }}
                                  />
                                }
                                label="Audit"
                              />
                            </>
                          )}
                        />
                      </Box>
                      {errors.surveyCategory && (
                        <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                          {errors.surveyCategory.message}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid2>
                </Grid2>

                <Stack mt={4} spacing={2} direction="row" justifyContent="flex-start">
                  <CommonButton type="submit" variant="contained" text={isUpdate ? "UPDATE" : "SAVE"} disabled={isSubmitting} />
                  <CommonButton onClick={cancelBtn} variant="contained" text="Cancel" disabled={isSubmitting} />
                </Stack>
              </form>
            </Paper>
          </Stack>
        </>
      )}
    </Box>
  );
};

export default SurveyTypeForm;
