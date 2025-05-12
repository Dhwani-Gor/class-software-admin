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
import CommonButton from "@/components/CommonButton";

// Validation Schema
const activitySchema = yup.object().shape({
  typeOfSurvey: yup.string().required("Required"),
});

const ActivitiesModal = ({ open, onClose, onSave, defaultValues, surveyTypes }) => {
  const [surveyInputValue, setSurveyInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(activitySchema),
    defaultValues: { typeOfSurvey: "" },
  });

  // console.log(defaultValues?.surveyTypes , "defaultValues ==>" , surveyTypes)

  useEffect(() => {
    reset(defaultValues || { typeOfSurvey: "" });

    if (defaultValues?.surveyTypes && surveyTypes?.length) {
      const surveyOption = surveyTypes.find(
        (option) => option.id === defaultValues.surveyTypes.id
      );

      if (surveyOption) {
        setSurveyInputValue(surveyOption.name);
        
        setValue("typeOfSurvey", surveyOption.id);
      }
    }
  }, [defaultValues, reset, surveyTypes, setValue]);


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
                  value={surveyOptions.find(option => option.value === field.value) || null}
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