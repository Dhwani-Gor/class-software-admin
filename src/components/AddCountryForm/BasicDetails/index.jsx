import React, { useState, useEffect } from "react";
import { Box, Stack, Typography, Grid2, Paper } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
// Relative path imports
import CommonButton from "@/components/CommonButton";
import CommonInput from "@/components/CommonInput";
import Button from "@mui/material/Button";
import { isEqual } from "lodash";

const getBase64Size = (base64String) => {
  const base64Content = base64String.split(",")[1] || base64String; // Strip off the prefix if present
  const length = base64Content.length;
  const padding = (base64Content.match(/=+$/) || [""])[0].length;
  return length * (3 / 4) - padding; // Return size in bytes
};

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const validationSchema = yup.object().shape({
  countryName: yup
    .string()
    .required("Country Name is required")
    .min(3, "Country Name should be at least 3 characters"),
  expectedTime: yup
    .number()
    .typeError("Must be a number")
    .required("Total Visa Completed is required")
    .positive("Must be a positive number")
    .integer("Must be an integer")
    .default(0),
  totalVisaCompleted: yup
    .number()
    .typeError("Must be a number")
    .required("Total Visa Completed is required")
    .positive("Must be a positive number")
    .integer("Must be an integer")
    .default(0),
  coverImage: yup
    .mixed()
    .required("Cover image is required")
    .test("fileSize", "File too large", (value) => {
      if (!value) return true;
      let sizeInBytes;
      if (value instanceof File) {
        sizeInBytes = value.size; // Direct size for File
      } else if (typeof value === "string") {
        if (isValidUrl(value)) {
          return true; // Skip size check for URLs
        }
        sizeInBytes = getBase64Size(value); // Calculate size for base64
      }else if(typeof value === "object"){
        return true;
      }
      return sizeInBytes <= 5 * 1024 * 1024; // 5 MB size limit
    })
    .test("fileType", "Unsupported file format", (value) => {
      if (!value) return true;
      if (value instanceof File) {
        return ["image/jpeg", "image/png", "image/webp"].includes(value.type);
      } else if (typeof value === "string") {
        if (isValidUrl(value)) {
          return true; // Skip file type check for URLs
        }
        const mimeType = value.match(/^data:(.*?);base64/); // Extract MIME type from base64
        return mimeType && ["image/jpeg", "image/png", "image/webp"].includes(mimeType[1]);
      }else if(typeof value === "object"){
        return true;
      }

      return false;
    }),
});

const BasicDetails = ({ onSubmit, defaultValues, visaId, isLoading, nextStep }) => {
  /*  const [previewImg, setPreviewImg] = useState(
     defaultValues?.coverImage instanceof File 
       ? URL.createObjectURL(defaultValues.coverImage) 
       : typeof defaultValues?.coverImage === 'string'
       ? defaultValues.coverImage
       : null
   ); */
  const [previewImg, setPreviewImg] = useState(null);
  // const [imageName, setImageName] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    // trigger,
    // reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
    // mode: "onTouched",
    defaultValues: defaultValues || {
      countryName: "",
      totalVisaCompleted: "",
      coverImage: null,
    },
  });


  /*   useEffect(() => {
      if (defaultValues?.coverImage instanceof File) {
        setPreviewImg(URL.createObjectURL(defaultValues.coverImage));
      } else if (typeof defaultValues?.coverImage === 'string') {
        setPreviewImg(defaultValues.coverImage); 
      }
    }, [defaultValues?.coverImage]); */

  useEffect(() => {
    if (defaultValues?.coverImage instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImg(reader.result); // Set the base64 string
      };
      reader.readAsDataURL(defaultValues.coverImage); // Read file as base64
    } else if (typeof defaultValues?.coverImage === 'string') {
      // If it's already a base64 string or URL, just set it directly
      setPreviewImg(defaultValues.coverImage);
    } else {
      setPreviewImg(defaultValues?.coverImage?.s3FileUrl); // No image case
    }
  }, [defaultValues?.coverImage]);

  useEffect(() => {
    if (visaId && defaultValues) {
      setValue("countryName", defaultValues?.countryName || "")
      setValue("coverImage", defaultValues?.coverImage || "")
      setValue("expectedTime", Number(defaultValues?.expectedTime?.toString().replace(/\D/g, ''), 10) || "")
      setValue("totalVisaCompleted", parseInt(defaultValues?.totalVisaCompleted) || "")
      // trigger()
    } 
   /*  else {
      reset()
    } */
  }, [visaId, defaultValues])

  /* const handlecoverImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPreviewImg(URL.createObjectURL(file));
      setValue("coverImage", file, { shouldValidate: true });
    }
  }; */

  const handlecoverImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;

        setValue("coverImage", base64String, { shouldValidate: true });
        setPreviewImg(base64String);
        // setImageName(file.name);
      };

      reader.readAsDataURL(file);
      /* setPreviewImg(URL.createObjectURL(file));
      setValue("coverImage", file, { shouldValidate: true }); */
    }
  };


  return (
    <Stack mt={4} spacing={4}>
      <Paper sx={{ padding: "20px", borderRadius: "15px" }}>
        <Grid2 container spacing={3}>
          <Grid2 size={{ xs: 12 }}>
            <Typography variant="subtitle1" fontWeight="500" mb={1}>
              Cover Image <span style={{ color: 'red' }}>*</span>
            </Typography>
            <Stack direction="column" spacing={2}>
              <Box
                sx={{
                  border: "1px solid #444",
                  padding: "10px 15px",
                  borderRadius: "5px",
                  width: "49%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  {!previewImg ? (
                    <>
                      <CloudUploadIcon sx={{ color: "#aaa" }} />
                      <Typography variant="body2">
                        Drag files or browse to upload
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2">
                      {getValues("coverImage")?.name}
                      {/* {imageName} */}
                    </Typography>
                  )}
                </Stack>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handlecoverImageChange}
                  style={{ display: "none" }}
                  id="upload-profile-pic"
                />
                <label htmlFor="upload-profile-pic">
                  <Button variant="contained" component="span">
                    Upload
                  </Button>
                </label>
              </Box>
              {previewImg && (
                <Box mt={2}>
                  <img
                    src={previewImg}
                    alt="Preview"
                    style={{ height: '200px', width: 'auto', borderRadius: "8px", border: "1px solid #ccc" }}
                  />
                </Box>
              )}
            </Stack>
            {errors.coverImage && (
              <Typography color="error" variant="caption">
                {errors.coverImage.message}
              </Typography>
            )}
          </Grid2>

          <Grid2 size={{ xs: 12 }}>
            <Controller
              name="countryName"
              control={control}
              render={({ field }) => (
                <CommonInput
                  {...field}
                  fullWidth
                  variant="standard"
                  label={
                    <span>
                      Country Name <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  placeholder="Enter country name"
                  error={Boolean(errors.countryName)}
                  helperText={errors.countryName?.message}
                  InputProps={{
                    style: { color: 'black' },
                  }}
                />
              )}
            />
          </Grid2>

          <Grid2 size={{ xs: 12 }}>
            <Controller
              name="expectedTime"
              control={control}
              render={({ field }) => (
                <CommonInput
                  {...field}
                  fullWidth
                  type="number"
                  variant="standard"
                  label={
                    <span>
                      Expected Duration Of Visa <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  placeholder="Enter Expected Duration Of Visa"
                  error={Boolean(errors.expectedTime)}
                  helperText={errors.expectedTime?.message}
                />
              )}
            />
          </Grid2>

          <Grid2 size={{ xs: 12 }}>
            <Controller
              name="totalVisaCompleted"
              control={control}
              render={({ field }) => (
                <CommonInput
                  {...field}
                  fullWidth
                  type="number"
                  variant="standard"
                  label={
                    <span>
                      Total Visa Completed  <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  placeholder="Enter Total Visa Number"
                  error={Boolean(errors.totalVisaCompleted)}
                  helperText={errors.totalVisaCompleted?.message}
                />
              )}
            />
          </Grid2>
        </Grid2>
      </Paper>

      <Paper sx={{ padding: "20px", borderRadius: "15px" }}>
        <Stack alignItems="flex-end">
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
      </Paper>
    </Stack>
  );
};

export default BasicDetails;
