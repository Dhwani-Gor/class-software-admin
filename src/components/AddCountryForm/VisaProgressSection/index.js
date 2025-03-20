"use client";
import React, { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Box,
  Grid2,
  Button,
  Typography,
  InputLabel,
  AccordionDetails,
  AccordionActions,
} from "@mui/material";
import CommonInput from "@/components/CommonInput";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CommonButton from "@/components/CommonButton";

const VisaProgressSection = ({ control, errors, setValue, isSubmitting, trigger, getValues }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "visaProgressSteps",
  });

  const handleSubmit = async () => {
    const valid = await trigger("visaProgressSteps");
    if (valid) {
      console.log("Pricing Data:", getValues("visaProgressSteps"));
    }
  };

  return (
    <>
      <AccordionDetails sx={{ padding: "15px" }}>
        <Box>
          {fields.map((item, index) => (
            <Grid2
              container
              spacing={2}
              paddingBottom={2}
              key={item.id}
              alignItems={"flex-end"}
              width={"100%"}
              sx={{
                border: "1px solid black",
                padding: "15px",
                borderRadius: "10px",
                marginBlock: "20px",
              }}
            >
              <Grid2
                item
                xs={12}
                size={{ xs: 12 }}
                display={"flex"}
                borderBottom={"1px solid black"}
                paddingBottom={1}
                flexDirection={"row"}
                justifyContent={"space-between"}
              >
                <Typography variant="h6" fontWeight="700">
                  Step {index + 1}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </Grid2>
              <Grid2 item size={{ xs: 12, md: 4 }}>
                <Controller
                  name={`visaProgressSteps.${index}.startDate`}
                  control={control}
                  render={({ field }) => (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <InputLabel
                        sx={{
                          mb: 1.5,
                          fontWeight: "500",
                          color: errors?.visaProgressSteps?.[index]?.startDate
                            ? "error.main"
                            : "text.primary",
                        }}
                        htmlFor="common-input"
                      >
                        Start Date
                      </InputLabel>
                      <DatePicker
                        {...field}
                        sx={{ width: "100%" }}
                        label=""
                        format="DD/MM/YYYY"
                        onChange={(date) =>
                          setValue(
                            `visaProgressSteps.${index}.startDate`,
                            date,
                            {
                              shouldValidate: true,
                            }
                          )
                        }
                        slotProps={{
                          textField: {
                            error: Boolean(
                              errors?.visaProgressSteps?.[index]?.startDate
                            ),
                            helperText:
                              errors?.visaProgressSteps?.[index]?.startDate
                                ?.message,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  )}
                />
              </Grid2>
              <Grid2 item size={{ xs: 12, md: 4 }}>
                <Controller
                  name={`visaProgressSteps.${index}.expectedVisaDate`}
                  control={control}
                  render={({ field }) => (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <InputLabel
                        sx={{
                          mb: 1.5,
                          fontWeight: "500",
                          color: errors?.visaProgressSteps?.[index]
                            ?.expectedVisaDate
                            ? "error.main"
                            : "text.primary",
                        }}
                        htmlFor="common-input"
                      >
                        Expected Visa Date
                      </InputLabel>
                      <DatePicker
                        {...field}
                        sx={{ width: "100%" }}
                        label=""
                        format="DD/MM/YYYY"
                        onChange={(date) =>
                          setValue(
                            `visaProgressSteps.${index}.expectedVisaDate`,
                            date,
                            {
                              shouldValidate: true,
                            }
                          )
                        }
                        slotProps={{
                          textField: {
                            error: Boolean(
                              errors?.visaProgressSteps?.[index]
                                ?.expectedVisaDate
                            ),
                            helperText:
                              errors?.visaProgressSteps?.[index]
                                ?.expectedVisaDate?.message,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  )}
                />
              </Grid2>
              <Grid2 item size={{ xs: 12, md: 4 }} spacing={2}>
                <Controller
                  name={`visaProgressSteps.${index}.description`}
                  control={control}
                  defaultValue={item.description || ""}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      fullWidth
                      label="Description"
                      placeholder="Enter description"
                      error={Boolean(
                        errors?.visaProgressSteps?.[index]?.description
                      )}
                      helperText={
                        errors?.visaProgressSteps?.[index]?.description?.message
                      }
                    />
                  )}
                />
              </Grid2>
            </Grid2>
          ))}
          <Button
            variant="contained"
            color="primary"
            onClick={() => append({ step: "" })}
            sx={{ mt: 2 }}
          >
            Add Step
          </Button>
        </Box>
      </AccordionDetails>
      <AccordionActions sx={{ padding: "15px" }}>
        <CommonButton
          text="Cancel"
          variant="outlined"
          color="primary"
          onClick={() => router.push("/countries")}
        />
        <CommonButton
          text="Submit"
          isLoading={isSubmitting}
          onClick={handleSubmit}
          variant="contained"
          // type="submit"
        />
      </AccordionActions>
    </>
  );
};

export default VisaProgressSection;
