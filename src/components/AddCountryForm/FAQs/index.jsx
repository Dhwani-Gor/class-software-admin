import React, { useEffect } from "react";
import { Box, Typography, Grid2 } from "@mui/material";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CommonInput from "@/components/CommonInput";
import { isEqual } from "lodash";

const validationSchema = yup.object().shape({
  faqs: yup.array().of(
    yup.object().shape({
      question: yup.string().required("Question is required"),
      answer: yup.string().required("Answer is required"),
    })
  ),
});

const FAQs = ({ onBack, onSubmit, defaultValues, visaId, isLoading, nextStep }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    // getValues,
    // reset
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "onTouched",
    defaultValues: defaultValues || {
      faqs: [{ question: "", answer: "" }],
    },
  });

  useEffect(() => {
    if (visaId && defaultValues) {
      setValue("faqs", defaultValues?.faqs || [{ question: "", answer: "" }]);

    }
    /*  else {
       reset()
     } */
  }, [visaId, defaultValues])

  const { fields, append, remove } = useFieldArray({
    control,
    name: "faqs",
  });

  const handleAddFAQ = () => {
    append({ question: "", answer: "" });
  };

  const handleRemoveFAQ = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Box mt={4}>
      <CommonCard>
        <Typography variant="h6" gutterBottom>
          FAQs
        </Typography>
        <Grid2 container spacing={2} mt={2}>
          {fields.map((field, index) => (
            <Grid2
              key={field.id}
              size={{ xs: 12, md: 12 }}
              container
              spacing={2}
              sx={{
                border: "1px solid black",
                padding: "20px 15px 20px 15px",
                borderRadius: "10px",
              }}
            >
              <Grid2 size={{ xs: 10, md: 10 }}>
                <Typography variant="h6">Question {index + 1}</Typography>
              </Grid2>
              {index !== 0 && (
                <Grid2 size={{ xs: 2, md: 2 }} textAlign="right">
                  <CommonButton
                    onClick={() => handleRemoveFAQ(index)}
                    variant="outlined"
                    color="error"
                    text="Delete"
                    startIcon={<DeleteIcon />}
                  />
                </Grid2>
              )}
              <Grid2 size={{ xs: 12, md: 12 }}>
                <Controller
                  name={`faqs.${index}.question`}
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      label="Question"
                      variant="standard"
                      fullWidth
                      error={!!errors.faqs?.[index]?.question}
                      helperText={errors.faqs?.[index]?.question?.message}
                    />
                  )}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 12 }}>
                <Controller
                  name={`faqs.${index}.answer`}
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      label="Answer"
                      variant="standard"
                      fullWidth
                      error={!!errors.faqs?.[index]?.answer}
                      helperText={errors.faqs?.[index]?.answer?.message}
                    />
                  )}
                />
              </Grid2>
            </Grid2>
          ))}
        </Grid2>
        <Box mt={2}>
          <CommonButton
            onClick={handleAddFAQ}
            variant="outlined"
            text="Add FAQ"
            startIcon={<AddIcon />}
          />
        </Box>
      </CommonCard>

      <CommonCard>
        <Box display="flex" justifyContent="space-between" mt={4}>
          <CommonButton
            onClick={onBack}
            variant="outlined"
            text="Back"
            sx={{ width: "10%" }}
          />
          <CommonButton
            onClick={() => {
              handleSubmit((data) => {
                if (!isEqual(defaultValues, data)) {
                  onSubmit(data);
                } else {
                  nextStep();
                }
              })();
            }}

            type="submit"
            variant="contained"
            text="Submit"
            sx={{ width: "10%" }}
            isLoading={isLoading}
          />
        </Box>
      </CommonCard>
    </Box>
  );
};

export default FAQs;
