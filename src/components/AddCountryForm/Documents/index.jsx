import React, { useEffect } from "react";
import { Stack, Grid2, FormControlLabel, Checkbox } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import { isEqual } from "lodash";


const Documents = ({ onBack, onSubmit, defaultValues, visaId, isLoading, nextStep }) => {

  const {
    control,
    handleSubmit,
    // reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    // resolver: yupResolver(validationSchema),
    mode: "onTouched",
    defaultValues: defaultValues || {
      passport: true,
      photo: true,
      bankStatement: false,
      incomeTaxReturn: false,
    },
  });

  useEffect(() => {
    if (visaId && defaultValues) {
      setValue("bankStatement", defaultValues?.bankStatement || false)
      setValue("incomeTaxReturn", defaultValues?.incomeTaxReturn || false)
      setValue("passport", defaultValues?.passport || false)
      setValue("photo", defaultValues?.photo || false)
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

          <Grid2 size={{ xs: 12, md: 3 }}>
            <Controller
              name="passport"
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
                  label="Passport"
                />
              )}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 3 }}>
            <Controller
              name="photo"
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
                  label="Photo"
                />
              )}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 3 }}>
            <Controller
              name="bankStatement"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Bank Statement"
                />
              )}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 3 }}>
            <Controller
              name="incomeTaxReturn"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Income Tax Return"
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

export default Documents;
