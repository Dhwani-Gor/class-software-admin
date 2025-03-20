import React, { useEffect } from "react";
import { Stack, Typography, MenuItem, Grid2, FormControlLabel, Checkbox } from "@mui/material";
import Select from "@mui/material/Select";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import CommonInput from "@/components/CommonInput";
import { isEqual } from "lodash";

const validationSchema = yup.object().shape({
  visaEntry: yup.string().required("Visa Entry is required"),
  visaType: yup.string().required("Visa Type is required"),
  validityPeriod: yup.string().required("Validity Period is required"),
  lengthOfStay: yup.string().required("Length of stay is required"),
  visaFee: yup
    .number()
    .typeError("Must be a number")
    .required("Visa Fee is required")
    .positive("Must be a positive number")
    .integer("Must be an integer")
    .default(0),
  vizayardFee: yup
    .number()
    .typeError("Must be a number")
    .required("Vizayard Fee is required")
    .positive("Must be a positive number")
    .integer("Must be an integer")
    .default(0),
  govtVisaFee: yup
    .number()
    .typeError("Must be a number")
    .required("Government Visa Fee is required")
    .positive("Must be a positive number")
    .integer("Must be an integer")
    .default(0),
});

const visaEntryOptions = [
  { value: "", label: "Select Visa Entry", disabled: true },
  { value: "Single", label: "Single Entry" },
  { value: "Multiple", label: "Multiple Entry" },
  { value: "Transit", label: "Transit Entry" },
];

const visaTypeOptions = [
  { value: "", label: "Select Visa Type", disabled: true },
  { value: "Tourist", label: "Tourist" },
  { value: "Business", label: "Business" },
  { value: "Student", label: "Student" },
  { value: "Transit", label: "Transit" },
];

const validityPeriodOptions = [
  { value: "", label: "Select Validity Period", disabled: true },
  { value: "15 Days", label: "15 Days" },
  { value: "30 Days", label: "30 Days" },
  { value: "45 Days", label: "45 Days" },
  { value: "60 Days", label: "60 Days" },
  { value: "75 Days", label: "75 Days" },
  { value: "90 Days", label: "90 Days" },
];

const lengthOfStayOptions = [
  { value: "", label: "Select Length Of Stay", disabled: true },
  { value: "15 Days", label: "15 Days" },
  { value: "30 Days", label: "30 Days" },
  { value: "45 Days", label: "45 Days" },
  { value: "60 Days", label: "60 Days" },
  { value: "75 Days", label: "75 Days" },
  { value: "90 Days", label: "90 Days" },
]

const VisaDetails = ({ onBack, onSubmit, defaultValues, visaId, isLoading, nextStep }) => {
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    // reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "onTouched",
    defaultValues: defaultValues || {
      visaType: "",
      visaEntry: "",
      validityPeriod: "",
      lengthOfStay: "",
      visaFee: "",
      vizayardFee: "",
      onTimeGuarantee: true,
      govtVisaFee: "",
    },
  });

  useEffect(() => {
    if (visaId && defaultValues) {
      setValue("govtVisaFee", defaultValues?.govtVisaFee || "")
      setValue("lengthOfStay", defaultValues?.lengthOfStay || "")
      setValue("onTimeGuarantee", defaultValues?.onTimeGuarantee || true)
      setValue("validityPeriod", defaultValues?.validityPeriod || "")
      setValue("visaFee", defaultValues?.visaFee || "")
      setValue("visaType", defaultValues?.visaType || "")
      setValue("vizayardFee", defaultValues?.vizayardFee || "")
      setValue("visaEntry", defaultValues?.visaEntry || "")
      // trigger()
    } 
   /*  else {
      reset()
    } */
  }, [visaId, defaultValues])

  return (
    <Stack mt={4} spacing={4}>
      <CommonCard>
        <Grid2 container spacing={3}>
          <Grid2 item size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" fontWeight="600" mb={1}>
              Visa Type <span style={{ color: 'red' }}>*</span>
            </Typography>
            <Controller
              name="visaType"
              control={control}
              render={({ field }) => (
                <Select
                  variant="standard"
                  {...field}
                  fullWidth
                  displayEmpty
                  error={Boolean(errors.visaType)}
                >
                  {visaTypeOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.visaType && (
              <Typography color="error" variant="caption">
                {errors.visaType.message}
              </Typography>
            )}
          </Grid2>

          <Grid2 item size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" fontWeight="600" mb={1}>
              Visa Entry <span style={{ color: 'red' }}>*</span>
            </Typography>
            <Controller
              name="visaEntry"
              control={control}
              render={({ field }) => (
                <Select
                  variant="standard"
                  {...field}
                  fullWidth
                  displayEmpty
                  error={Boolean(errors.visaEntry)}
                >
                  {visaEntryOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.visaEntry && (
              <Typography color="error" variant="caption">
                {errors.visaEntry.message}
              </Typography>
            )}
          </Grid2>

          <Grid2 item size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" fontWeight="600" mb={1}>
              Validity Period <span style={{ color: 'red' }}>*</span>
            </Typography>
            <Controller
              name="validityPeriod"
              control={control}
              render={({ field }) => (
                <Select
                  variant="standard"
                  {...field}
                  fullWidth
                  displayEmpty
                  error={Boolean(errors.validityPeriod)}
                >
                  {validityPeriodOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.validityPeriod && (
              <Typography color="error" variant="caption">
                {errors.validityPeriod.message}
              </Typography>
            )}
          </Grid2>

          <Grid2 item size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" fontWeight="600" mb={1}>
              Length Of Stay <span style={{ color: 'red' }}>*</span>
            </Typography>
            <Controller
              name="lengthOfStay"
              control={control}
              render={({ field }) => (
                <Select
                  variant="standard"
                  {...field}
                  fullWidth
                  displayEmpty
                  error={Boolean(errors.lengthOfStay)}
                >
                  {lengthOfStayOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.lengthOfStay && (
              <Typography color="error" variant="caption">
                {errors.lengthOfStay.message}
              </Typography>
            )}
          </Grid2>

          <Grid2 size={{ xs: 12 }}>
            <Controller
              name="onTimeGuarantee"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="On Time Guarantee"
                />
              )}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 4 }}>
            <Controller
              name="visaFee"
              control={control}
              render={({ field }) => (
                <CommonInput
                  variant="standard"
                  {...field}
                  fullWidth
                  type="number"
                  label={
                    <span>
                      Visa Fees <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  placeholder="Enter Visa Fees"
                  error={Boolean(errors.visaFee)}
                  helperText={errors.visaFee?.message}
                />
              )}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 4 }}>
            <Controller
              name="vizayardFee"
              control={control}
              render={({ field }) => (
                <CommonInput
                  variant="standard"
                  {...field}
                  fullWidth
                  type="number"
                  label={
                    <span>
                      Vizayard Fees <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  placeholder="Enter Vizayard Fees"
                  error={Boolean(errors.vizayardFee)}
                  helperText={errors.vizayardFee?.message}
                />
              )}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 4 }}>
            <Controller
              name="govtVisaFee"
              control={control}
              render={({ field }) => (
                <CommonInput
                  variant="standard"
                  {...field}
                  fullWidth
                  type="number"
                  label={
                    <span>
                      Government Visa Fees <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  placeholder="Enter Government Visa Fees"
                  error={Boolean(errors.govtVisaFee)}
                  helperText={errors.govtVisaFee?.message}
                />
              )}
            />
          </Grid2>
        </Grid2>
      </CommonCard>

      <CommonCard>
        <Stack direction={"row"} spacing={2} justifyContent={"space-between"}>
          <CommonButton
            onClick={onBack}
            variant="outlined"
            text="Back"
            sx={{ width: "10%" }}
          />

          <CommonButton
            onClick={() => {
              if (!isEqual(defaultValues, getValues())) {
                handleSubmit(onSubmit)();
              } else {
                nextStep()
              }
            }}
            variant="contained"
            text="Next"
            sx={{ width: "10%" }}
            isLoading={isLoading}
          />
        </Stack>
      </CommonCard>
    </Stack>
  );
};

export default VisaDetails;
