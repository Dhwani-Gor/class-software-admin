import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import {
  addInspectors,
  getInspectorsDetails,
  updateInspectorDetail,
} from "@/api";
import {
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid2,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
} from "@mui/material";
// import SuccessModal from "./SuccessModal";
import { useDispatch, useSelector } from "react-redux";
import { addCountryInfos } from "@/redux/slice/countrysSlice";
import { Controller, useForm } from "react-hook-form";
import CommonInput from "../CommonInput";
import CommonButton from "../CommonButton";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";

const schema = yup.object().shape({
  clientName: yup.string().required("Client Name is required"),
  clientEmail: yup.string().required("Email Name is required"),
  clientPassword: yup.string().required("Password is required"),
  role: yup
    .number()
    .required("Role is required") // Validation message
    .oneOf([1, 2, 3], "Invalid role selected"),
  companyName: yup.string().required("Company Name is required"),
  clientDesignation: yup
    .string()
    .required("Client Designation is required"),
});

const AddClientForm = ({
  mode = "create",
  clientId = null,
  defaultValues = {},
}) => {
  const [formData, setFormData] = useState({});
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaultValues || {
      clientName: "",
      clientEmail: "",
      clientPassword: "",
      role: "",
      companyName: "",
    },
  });

  const objRole = {
    1: "admin",
    2: "staff",
    3: "customer",
  };

  /*  useEffect(() => {
    if (countryData.countryDetails) {
      const newCompletedSteps = {};

      if (countryData.countryDetails.basicDetails) newCompletedSteps[0] = true;
      if (countryData.countryDetails.visaDetails) newCompletedSteps[1] = true;
      if (countryData.countryDetails.documents) newCompletedSteps[2] = true;
      if (countryData.countryDetails.faqs?.length > 0)
        newCompletedSteps[3] = true;

      setCompletedSteps(newCompletedSteps);
    }
  }, [countryData]); */

  useEffect(() => {
    if (mode !== "update" || !clientId) return;

    const fetchUserDetails = async () => {
      try {
        const res = await getInspectorsDetails(clientId);
        const data = res?.data?.data;

        if (!data) return;

        setFormData(data);
        setValue("clientName", data?.name);
        setValue("companyName", data?.companyName);
        setValue("clientEmail", data?.email);
        setValue("clientPassword", data?.password);
        setValue("role", parseInt(data?.roleId));
        setValue("clientDesignation", data?.clientDesignation);
      } catch (error) {
        console.error("Error fetching visa details:", error);
      }
    };

    fetchUserDetails();
  }, [mode, clientId]);

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  const onSubmit = async (data) => {
    // console.log(data, "data");

    console.log("data", data);

    setIsDataLoading(true);
    // Handle the submission logic here
    // setTimeout(() => {
    //   setSnackBar({ open: true, message: "Form submitted successfully!" });
    //   setIsDataLoading(false);
    // }, 2000);
    let payload = {
      name: data?.clientName,
      roleId: data?.role,
      email: data?.clientEmail,
      password: data?.clientPassword,
      clientDesignation: data?.clientDesignation,
      companyName: data?.companyName,
      // ...data,
    };

    if (mode === "create") {
      // const handleSubmitInspectors = async (payload) => {
      await addInspectors(payload)
        .then((res) => {
          console.log("res", res);
          console.log("res 22", res?.response?.data?.message);
          if (res?.status === 400) {
            setSnackBar({ open: true, message: res?.data.message });
          } else {
            router.push("/clients/");
          }
        })
        .catch((error) => {
          console.log("error", error);
        });
      setIsDataLoading(false);
    } else if (mode === "update" && clientId) {
      await updateInspectorDetail(clientId, payload)
        .then((res) => {
          if (res?.status === 400) {
            setSnackBar({ open: true, message: res?.data.message });
          } else {
            router.push("/clients/");
          }
        })
        .catch((error) => {
          console.log("error", error);
        });
      setIsDataLoading(false);
    }
  };

  return (
    <Box>
      {isDataLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ height: 300 }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Stack mt={4} spacing={4}>
            <Paper sx={{ padding: "20px", borderRadius: "15px" }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid2 container spacing={3}>
                  <Grid2 size={{ xs: 12 }}>
                    <Controller
                      name="clientName"
                      control={control}
                      render={({ field }) => {
                        return (
                          <CommonInput
                            {...field}
                            fullWidth
                            variant="standard"
                            label={
                              <span>
                                Client Name{" "}
                                <span style={{ color: "red" }}>*</span>
                              </span>
                            }
                            placeholder="Enter name"
                            error={Boolean(errors.clientName)}
                            helperText={errors.clientName?.message}
                            InputProps={{
                              style: { color: "black" },
                            }}
                          />
                        );
                      }}
                    />
                  </Grid2>

                  <Grid2 size={{ xs: 12 }}>
                    <Controller
                      name="clientEmail"
                      control={control}
                      render={({ field }) => {
                        return (
                          <CommonInput
                            {...field}
                            fullWidth
                            variant="standard"
                            label={
                              <span>
                                Email <span style={{ color: "red" }}>*</span>
                              </span>
                            }
                            placeholder="Enter email"
                            error={Boolean(errors.clientEmail)}
                            helperText={errors.clientEmail?.message}
                            InputProps={{
                              style: { color: "black" },
                            }}
                          />
                        );
                      }}
                    />
                  </Grid2>

                  <Grid2 size={{ xs: 12 }}>
                    <Controller
                      name="clientPassword"
                      control={control}
                      render={({ field }) => (
                        <CommonInput
                          {...field}
                          fullWidth
                          variant="standard"
                          label={
                            <span>
                              Password <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          placeholder="Enter password"
                          error={Boolean(errors.clientPassword)}
                          helperText={errors.clientPassword?.message}
                          type="password"
                          InputProps={{
                            style: { color: "black" },
                          }}
                        />
                      )}
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12 }}>
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <FormControl component="fieldset" fullWidth>
                          <FormLabel
                            component="legend"
                            style={{ color: "black" }}
                          >
                            Role Id <span style={{ color: "red" }}>*</span>
                          </FormLabel>
                          <RadioGroup
                            {...field}
                            row
                            aria-label="role"
                            name="role"
                            value={objRole[field.value] || ""}
                            onChange={(e) => {
                              const selectedValue = {
                                admin: 1,
                                staff: 2,
                                customer: 3,
                              }[e.target.value];
                              field.onChange(selectedValue);
                            }}
                          >
                            {["admin", "staff", "customer"].map((role) => (
                              <FormControlLabel
                                key={role}
                                value={role}
                                control={
                                  <Radio
                                    sx={{
                                      "&.Mui-checked": {
                                        color: "black",
                                      },
                                      "&:focus-within": {
                                        outline: "none",
                                      },
                                    }}
                                  />
                                }
                                label={
                                  role.charAt(0).toUpperCase() + role.slice(1)
                                }
                              />
                            ))}
                          </RadioGroup>
                          {Boolean(errors.role) && (
                            <FormHelperText error>
                              {errors.role?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid2>

                  <Grid2 size={{ xs: 12 }}>
                    <Controller
                      name="companyName"
                      control={control}
                      render={({ field }) => (
                        <CommonInput
                          {...field}
                          fullWidth
                          variant="standard"
                          label={
                            <span>
                              Company Name{" "}
                              <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          placeholder="Enter password"
                          error={Boolean(errors.companyName)}
                          helperText={errors.companyName?.message}
                          InputProps={{
                            style: { color: "black" },
                          }}
                        />
                      )}
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12 }}>
                    <Controller
                      name="clientDesignation"
                      control={control}
                      render={({ field }) => (
                        <CommonInput
                          {...field}
                          fullWidth
                          variant="standard"
                          label={
                            <span>
                              Client Designation{" "}
                              <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          placeholder="Enter password"
                          error={Boolean(errors.clientDesignation)}
                          helperText={errors.clientDesignation?.message}
                          InputProps={{
                            style: { color: "black" },
                          }}
                        />
                      )}
                    />
                  </Grid2>
                </Grid2>

                <Stack
                  mt={4}
                  spacing={2}
                  direction="row"
                  justifyContent="flex-start"
                >
                  <CommonButton
                    type="submit"
                    variant="contained"
                    text="Submit"
                  />
                </Stack>
              </form>

              <Snackbar
                open={snackBar.open}
                autoHideDuration={2000}
                message={snackBar.message}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "center",
                }}
                onClose={snackbarClose}
                className="snackBarColor"
                key="snackbar"
              />
            </Paper>
          </Stack>
        </>
      )}
    </Box>
  );
};

export default AddClientForm;
