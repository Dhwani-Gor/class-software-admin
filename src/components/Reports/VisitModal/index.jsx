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
  Typography,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import CommonInput from "@/components/CommonInput";
import CommonButton from "@/components/CommonButton";
import { getAllUsers, searchUnloCodes } from "@/api";

/* ------------------ VALIDATION ------------------ */

const visitSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  timeFrom: yup.string().required("Start time is required"),
  timeTo: yup.string().required("End time is required"),
  location: yup.string().required("Location is required"),
  initialOfSurveyors: yup
    .array()
    .min(1, "Select at least one Surveyor")
    .required("Initial Of Surveyors is required"),
});

/* ------------------ COMPONENT ------------------ */

const VisitModal = ({ open, onClose, onSave, defaultValues }) => {
  const [surveyors, setSurveyors] = useState([]);
  const [loadingSurveyors, setLoadingSurveyors] = useState(false);

  const [locationOptions, setLocationOptions] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(visitSchema),
    defaultValues: {
      date: "",
      timeFrom: "",
      timeTo: "",
      location: "",
      initialOfSurveyors: [],
    },
  });

  /* ------------------ FETCH SURVEYORS ------------------ */

  const fetchSurveyors = async () => {
    try {
      setLoadingSurveyors(true);
      const res = await getAllUsers();

      if (res?.data?.data) {
        const inspectors = res.data.data
          .filter((u) => u?.role?.name === "inspector")
          .map((u) => ({
            ...u,
            id: Number(u.id), // 🔑 normalize ID
          }))
          .sort((a, b) => a.id - b.id);

        setSurveyors(inspectors);
      }
    } catch (err) {
      console.error("Surveyor fetch error:", err);
    } finally {
      setLoadingSurveyors(false);
    }
  };

  useEffect(() => {
    fetchSurveyors();
  }, []);

  /* ------------------ EDIT MODE PREFILL ------------------ */

  useEffect(() => {
    if (!defaultValues) return;

    reset({
      date: defaultValues.date || "",
      timeFrom: defaultValues.timeFrom || "",
      timeTo: defaultValues.timeTo || "",
      location: defaultValues.location || "",
      initialOfSurveyors: defaultValues.surveyors
        ? defaultValues.surveyors.map((s) => Number(s.id))
        : [],
    });

    setSelectedLocation(null);
  }, [defaultValues, reset]);

  /* ------------------ FETCH LOCATIONS ------------------ */

  const fetchLocations = async (query) => {
    if (!query) return;

    try {
      setLoadingLocations(true);
      const res = await searchUnloCodes(query);
      if (res?.data?.data?.unloCodes) {
        setLocationOptions(res.data.data.unloCodes);
      }
    } catch (err) {
      console.error("Location fetch error:", err);
    } finally {
      setLoadingLocations(false);
    }
  };

  /* ------------------ SUBMIT ------------------ */

  const onSubmit = (data) => {
    onSave({
      ...data,
      location: data.location,
    });

    handleClose();
  };

  /* ------------------ CLOSE ------------------ */

  useEffect(() => {
    if (!defaultValues) {
      reset({
        date: "",
        timeFrom: "",
        timeTo: "",
        location: "",
        initialOfSurveyors: [],
      });
      setSelectedLocation(null);
    }
  }, [defaultValues, reset]);

  const handleClose = () => {
    if (!defaultValues) {
      reset({
        date: "",
        timeFrom: "",
        timeTo: "",
        location: "",
        initialOfSurveyors: [],
      });
      setSelectedLocation(null);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{defaultValues ? "Edit Visit" : "Add Visit"}</DialogTitle>

      <DialogContent sx={{ minWidth: "50vw" }}>
        <Grid2 container spacing={2} sx={{ mt: 1 }}>

          {/* DATE */}
          <Grid2 size={{ xs: 12 }}>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <CommonInput
                  {...field}
                  type="date"
                  label={<>Date <span style={{ color: "red" }}>*</span></>}
                  error={!!errors.date}
                  helperText={errors.date?.message}
                />
              )}
            />
          </Grid2>

          {/* TIME FROM */}
          <Grid2 size={{ xs: 12 }}>
            <Controller
              name="timeFrom"
              control={control}
              render={({ field }) => (
                <CommonInput
                  {...field}
                  type="time"
                  label={<>Time From <span style={{ color: "red" }}>*</span></>}
                  error={!!errors.timeFrom}
                  helperText={errors.timeFrom?.message}
                />
              )}
            />
          </Grid2>

          {/* TIME TO */}
          <Grid2 size={{ xs: 12 }}>
            <Controller
              name="timeTo"
              control={control}
              render={({ field }) => (
                <CommonInput
                  {...field}
                  type="time"
                  label={<>Time To <span style={{ color: "red" }}>*</span></>}
                  error={!!errors.timeTo}
                  helperText={errors.timeTo?.message}
                />
              )}
            />
          </Grid2>

          {/* LOCATION */}
          <Grid2 size={{ xs: 12 }}>
            <FormControl fullWidth error={!!errors.location}>
              <FormLabel>
                <Typography fontWeight={500}>
                  Location <span style={{ color: "red" }}>*</span>
                </Typography>
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
                      typeof option === 'string' ? option :
                        `${option.nameOfDiacritics} (${option.name}, ${option.country})`
                    }
                    filterOptions={(x) => x}
                    freeSolo
                    onInputChange={(event, newInputValue) => {
                      if (newInputValue && typeof newInputValue === 'string') {
                        fetchLocations(newInputValue);
                        onChange(newInputValue);
                      }
                    }}
                    value={selectedLocation || value || ''}
                    onChange={(event, newValue) => {
                      if (typeof newValue === 'string') {
                        setSelectedLocation(null);
                        onChange(newValue);
                      } else if (newValue && typeof newValue === 'object') {
                        const locationString = `${newValue.nameOfDiacritics} (${newValue.name}, ${newValue.country})`;
                        setSelectedLocation(newValue);
                        onChange(locationString);
                      } else {
                        setSelectedLocation(null);
                        onChange('');
                      }
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
                      typeof option === 'string' && typeof value === 'string'
                        ? option === value
                        : option.id === value?.id
                    }
                  />
                )}
              />
            </FormControl>
          </Grid2>

          {/* SURVEYORS */}
          <Grid2 size={{ xs: 12 }}>
            <FormControl fullWidth error={!!errors.initialOfSurveyors}>
              <FormLabel>
                <Typography fontWeight={500}>
                  Initial Of Surveyors <span style={{ color: "red" }}>*</span>
                </Typography>
              </FormLabel>

              <Controller
                name="initialOfSurveyors"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={surveyors}
                    loading={loadingSurveyors}
                    disabled={loadingSurveyors}
                    getOptionLabel={(o) => o.name}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    value={
                      loadingSurveyors
                        ? []
                        : surveyors.filter((s) =>
                          field.value?.includes(s.id)
                        )
                    }
                    onChange={(_, newValue) =>
                      field.onChange(newValue.map((v) => v.id))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search and select Surveyors"
                        error={!!errors.initialOfSurveyors}
                        helperText={errors.initialOfSurveyors?.message}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          key={option.id}
                          label={option.name}
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                  />
                )}
              />
            </FormControl>
          </Grid2>

        </Grid2>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <CommonButton text="Cancel" variant="outlined" onClick={handleClose} />
        <CommonButton
          text={defaultValues ? "Update" : "Add"}
          onClick={handleSubmit(onSubmit)}
        />
      </DialogActions>
    </Dialog>
  );
};

export default VisitModal;
