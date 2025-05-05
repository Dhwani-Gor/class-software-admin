"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid2,
  Autocomplete,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import CommonInput from "@/components/CommonInput";
import CommonButton from "@/components/CommonButton";

// Validation Schema
const activitySchema = yup.object().shape({
  typeOfSurvey: yup.string().required("Required"),
  initialOfSurveyors: yup.string().required("Required"),
});

const ActivitiesModal = ({ open, onClose, onSave, defaultValues, surveyTypes }) => {
  const [surveyInputValue, setSurveyInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(activitySchema),
    defaultValues: { typeOfSurvey: "", initialOfSurveyors: "" },
  });

  useEffect(() => {
    reset(defaultValues || { typeOfSurvey: "", initialOfSurveyors: "" });

    // Initialize the input value if defaultValues has typeOfSurvey
    if (defaultValues?.typeOfSurvey && surveyTypes?.length) {
      const surveyOption = surveyTypes.find(
        (option) => option.id === defaultValues.typeOfSurvey
      );
      setSurveyInputValue(surveyOption?.name || "");
    }
  }, [defaultValues, reset, surveyTypes]);

  const onSubmit = (data) => {
    onSave(data);
    reset();
    onClose();
  };

  // Transform surveyTypes for Autocomplete
  const surveyOptions = surveyTypes?.map(survey => ({
    label: survey.name,
    value: survey.id,
  })) || [];

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {defaultValues ? "Edit Activity" : "Add Activity"}
      </DialogTitle>
      <DialogContent sx={{ minWidth: "50vw" }}>
        <Grid2 container spacing={2} sx={{ mt: 1 }}>
          <Grid2 size={{ xs: 12 }}>
            <Controller
              name="typeOfSurvey"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  id="type-of-survey-autocomplete"
                  options={surveyOptions}
                  inputValue={surveyInputValue}
                  onInputChange={(event, newInputValue) => {
                    setSurveyInputValue(newInputValue);

                    // Directly update the form value when typing
                    if (newInputValue) {
                      setIsSearching(true);
                    } else {
                      setIsSearching(false);
                    }
                  }}
                  onChange={(event, newValue) => {
                    setIsSearching(false);
                    if (typeof newValue === "string") {
                      field.onChange(newValue);
                    } else if (newValue && newValue.value) {
                      field.onChange(newValue.value);
                    } else if (newValue === null) {
                      // Handle clearing the field
                      field.onChange("");
                    }
                  }}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.label || "";
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Type of Survey"
                      error={!!errors.typeOfSurvey}
                      helperText={errors.typeOfSurvey?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {isSearching ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            <Controller
              name="initialOfSurveyors"
              control={control}
              render={({ field }) => (
                <CommonInput
                  id="initial-of-surveyors"
                  label="Initial of Surveyors"
                  error={!!errors.initialOfSurveyors}
                  helperText={errors.initialOfSurveyors?.message}
                  {...field}
                />
              )}
            />
          </Grid2>
        </Grid2>
      </DialogContent>
      <DialogActions>
        <CommonButton
          onClick={onClose}
          color="secondary"
          text="Cancel"
          variant="outlined"
        />
        <CommonButton
          onClick={handleSubmit(onSubmit)}
          color="primary"
          text={defaultValues ? "Update" : "Add"}
        />
      </DialogActions>
    </Dialog>
  );
};

export default ActivitiesModal;