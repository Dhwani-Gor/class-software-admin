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
  typeOfSurvey: yup
    .array()
    .of(yup.string())
    .min(1, "At least one survey type is required"),
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
    defaultValues: { typeOfSurvey: [] },
  });

  useEffect(() => {
    reset(defaultValues || { typeOfSurvey: [] });
  
    if (defaultValues?.surveyTypes && surveyTypes?.length) {
      const surveyTypeList = Array.isArray(defaultValues.surveyTypes)
        ? defaultValues.surveyTypes
        : [defaultValues.surveyTypes]; // wrap single object as array
    
        const ids = surveyTypeList.map((s) => Number(s.id));
        setValue("typeOfSurvey", ids);
        setSurveyInputValue("");
    }
  }, [defaultValues, reset, surveyTypes, setValue]);

  const onSubmit = (data) => {
    onSave({
      ...data,
      typeOfSurvey: JSON.stringify(data.typeOfSurvey),
    });
    reset();
    onClose();
  };
  

  // Transform surveyTypes for Autocomplete
  const surveyOptions = surveyTypes?.map(survey => ({
    label: survey.name,
    value: Number(survey.id),
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
                  multiple
                  options={surveyOptions}
                  value={surveyOptions.filter(option => field.value.includes(option.value))}
                  onChange={(event, newValue) => {
                    field.onChange(newValue.map(v => v.value));
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