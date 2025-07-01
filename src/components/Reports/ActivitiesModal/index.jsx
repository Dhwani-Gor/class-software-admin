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
  Box,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import CommonButton from "@/components/CommonButton";

// Validation schema for dropdown (array of IDs)
const activitySchema = yup.object().shape({
  typeOfSurvey: yup
    .array()
    .of(yup.number())
    .min(1, "At least one survey type is required"),
});

const ActivitiesModal = ({ open, onClose, onSave, defaultValues, surveyTypes, activityList }) => {
  const [surveyInputValue, setSurveyInputValue] = useState("");
  const [isManualInput, setIsManualInput] = useState(false);

  const usedSurveyLabels = activityList
    ?.map((item) => item.surveyTypes?.name)
    .filter((name) => name);

  const surveyOptions = surveyTypes
    ?.filter((survey) => !usedSurveyLabels?.includes(survey?.name))
    .map((survey) => ({
      label: survey?.name,
      value: Number(survey?.id),
    })) || [];

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
      const surveyTypeList = Array.isArray(defaultValues?.surveyTypes)
        ? defaultValues.surveyTypes
        : [defaultValues.surveyTypes];

      const ids = surveyTypeList.map((s) => Number(s.id));
      setValue("typeOfSurvey", ids);
    }
    setSurveyInputValue("");
    setIsManualInput(false);
  }, [defaultValues, reset, surveyTypes, setValue]);

  const handleAdd = (data) => {
    onSave({ typeOfSurvey: data?.typeOfSurvey });
    reset();
    onClose();
  };
  

  const handleSaveManual = () => {
    if (!surveyInputValue.trim()) return;
    onSave({ name: surveyInputValue.trim() });
    setSurveyInputValue("");
    setIsManualInput(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{defaultValues ? "Edit Activity" : "Add Activity"}</DialogTitle>
      <DialogContent sx={{ minWidth: "600px", maxWidth: "500px",height: 'auto' }}>
        <Box container spacing={2} sx={{ mt: 2 }} display="flex" flexDirection="column">
          <Grid2 xs={12}>
            <Box display="flex" alignItems="center" gap={2}>
              <TextField
                label="Add Activity Name"
                fullWidth
                value={surveyInputValue}
                onChange={(e) => {
                  setSurveyInputValue(e.target.value);
                  setIsManualInput(!!e.target.value);
                }}
                placeholder="Enter activity name"
              />
              <CommonButton
                onClick={handleSaveManual}
                color="primary"
                text="Save"
                sx={{ whiteSpace: "nowrap", height: '50px' }}
              />
            </Box>
          </Grid2>

          {/* Dropdown */}
          <Grid2 xs={12} sx={{ mt: 2 }} >
            <Controller
              name="typeOfSurvey"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={surveyOptions}
                  value={surveyOptions.filter((option) =>
                    field.value?.includes(option.value)
                  )}
                  onChange={(event, newValue) => {
                    field.onChange(newValue.map((v) => v.value));
                  }}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.label
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Type of Activity"
                      error={!!errors.typeOfSurvey}
                      helperText={errors.typeOfSurvey?.message}
                      variant="standard"
                    />
                  )}
                />
              )}
            />
          </Grid2>
        </Box>
      </DialogContent>

      <DialogActions>
        <CommonButton
          onClick={onClose}
          color="secondary"
          text="Cancel"
          variant="outlined"
        />

        <CommonButton
          onClick={handleSubmit(handleAdd)}
          color="primary"
          text={defaultValues ? "Update" : "Add"}
        />
      </DialogActions>
    </Dialog>
  );
};

export default ActivitiesModal;
