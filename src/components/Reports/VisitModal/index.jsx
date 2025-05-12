"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid2,
  CircularProgress,
  FormControl,
  FormLabel,
  Autocomplete,
  TextField,
  Chip,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import CommonInput from "@/components/CommonInput";
import CommonButton from "@/components/CommonButton";
import { getAllUsers, searchUnloCodes } from "@/api";

// Validation Schema
const visitSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  timeFrom: yup.string().required("Start time is required"),
  timeTo: yup.string().required("End time is required"),
  location: yup.object().required("Location is required"), // Change to object validation
  initialOfSurveyors: yup
    .array()
    .min(1, "Select at least one Surveyor")
    .required("Initial Of Surveyors is required"),
});

const VisitModal = ({ open, onClose, onSave, defaultValues }) => {
  const [surveyors, setSurveyors] = useState([]);
  const [loadingSurveyors, setLoadingSurveyors] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(visitSchema),
    defaultValues: {
      date: "",
      timeFrom: "",
      timeTo: "",
      location: null,
      initialOfSurveyors: [],
    },
  });


useEffect(() => {
  if (defaultValues) {
    reset({
      ...defaultValues,
      location: null, 
      initialOfSurveyors: [], 
    });

    if (defaultValues.surveyors?.length && surveyors.length) {
      const surveyorIds = defaultValues.surveyors.map((s) => s.id);
      setValue("initialOfSurveyors", surveyorIds);
    }
  }
}, [defaultValues, locationOptions, surveyors, reset, setValue]);


  const onCloseModal = () => {
    reset();
    onClose();
  };

  const onSubmit = (data) => {
    onSave(data);
    reset();
    onCloseModal();
  };

  const fetchSurveyors = async () => {
    try {
      setLoadingSurveyors(true);
      const res = await getAllUsers();
      if (res?.data?.data) {
        const flattenedData = res?.data?.data?.filter(
          (item) => item?.roleId === "2"
        );
        const sortedData = flattenedData?.sort((a, b) => a?.id - b?.id);
        setSurveyors(sortedData);
      }
    } catch (error) {
      console.error("Error fetching Surveyors:", error);
      // Assuming you have a toast library
      // toast.error("Failed to load Surveyors");
    } finally {
      setLoadingSurveyors(false);
    }
  };

  const fetchLocations = async (query) => {
    if (!query) return;

    try {
      setLoadingLocations(true);
      const res = await searchUnloCodes(query);
      if (res?.data?.data?.unloCodes) {
        setLocationOptions(res.data.data.unloCodes);
      }
    } catch (error) {
      console.error("Error fetching Locations:", error);
      // Assuming you have a toast library
      // toast.error("Failed to load Locations");
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    fetchSurveyors();
  }, []);

  const getReportById = (id) => {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    return (
      surveyors.find((surveyor) => surveyor.id == numericId) || {
        id: numericId,
        name: `Unknown (ID: ${numericId})`,
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{defaultValues ? "Edit Visit" : "Add Visit"}</DialogTitle>
      <DialogContent sx={{ minWidth: "50vw" }}>
        <Grid2 container spacing={2} sx={{ mt: 1 }}>
          <Grid2 size={{ xs: 12 }}>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <CommonInput
                  {...field}
                  type="date"
                  label="Date"
                  error={!!errors.date}
                  helperText={errors.date?.message}
                />
              )}
            />
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            <Controller
              name="timeFrom"
              control={control}
              render={({ field }) => (
                <CommonInput
                  {...field}
                  type="time"
                  label="Time From"
                  error={!!errors.timeFrom}
                  helperText={errors.timeFrom?.message}
                />
              )}
            />
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            <Controller
              name="timeTo"
              control={control}
              render={({ field }) => (
                <CommonInput
                  {...field}
                  type="time"
                  label="Time To"
                  error={!!errors.timeTo}
                  helperText={errors.timeTo?.message}
                />
              )}
            />
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            <FormControl
              fullWidth
              variant="standard"
              error={Boolean(errors.location)}
            >
              <FormLabel component="legend" sx={{ mb: 1 }}>
                <span>
                  Location <span style={{ color: "red" }}>*</span>
                </span>
              </FormLabel>
              <Controller
                name="location"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    id="location-autocomplete"
                    options={locationOptions}
                    loading={loadingLocations}
                    getOptionLabel={(option) =>
                      `${option.nameOfDiacritics} (${option.name}, ${option.country})`
                    }
                    filterOptions={(x) => x}
                    onInputChange={(event, newInputValue) => {
                      fetchLocations(newInputValue);
                    }}
                    value={value}
                    onChange={(event, newValue) => {
                      onChange(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        placeholder="Search and select Location"
                        error={Boolean(errors.location)}
                        helperText={errors.location?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingLocations ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value?.id
                    }
                  />
                )}
              />
            </FormControl>
          </Grid2>

          <Grid2 size={{ xs: 12 }}>
            <FormControl
              fullWidth
              variant="standard"
              error={Boolean(errors.initialOfSurveyors)}
            >
              <FormLabel component="legend" sx={{ mb: 1 }}>
                <span>
                  Initial Of Surveyors <span style={{ color: "red" }}>*</span>
                </span>
              </FormLabel>
              <Controller
                name="initialOfSurveyors"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    id="surveyors-autocomplete"
                    options={surveyors}
                    loading={loadingSurveyors}
                    getOptionLabel={(option) => {
                      return typeof option === "object"
                        ? option.name
                        : getReportById(option).name;
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (typeof value === "object") {
                        return option.id === value.id;
                      }
                      return (
                        option.id === value || option.id === parseInt(value, 10)
                      );
                    }}
                    value={field?.value?.map((id) => getReportById(id))}
                    onChange={(event, newValue) => {
                      const initialOfSurveyors = newValue.map(
                        (item) => item.id
                      );
                      field.onChange(initialOfSurveyors);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        placeholder="Search and select Surveyors"
                        error={Boolean(errors.initialOfSurveyors)}
                        helperText={errors.initialOfSurveyors?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingSurveyors ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
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
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <CommonButton text="Cancel" onClick={onCloseModal} variant="outlined" />
        <CommonButton
          text={defaultValues ? "Update" : "Add"}
          onClick={handleSubmit(onSubmit)}
        />
      </DialogActions>
    </Dialog>
  );
};

export default VisitModal;
