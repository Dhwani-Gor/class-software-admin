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
    Typography,
  } from "@mui/material";
// import SuccessModal from "./SuccessModal";
import { useDispatch, useSelector } from "react-redux";
import Checkbox from "@mui/material/Checkbox";

import { Controller, useForm } from "react-hook-form";
import CommonInput from "../CommonInput";
import CommonButton from "../CommonButton";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { CheckBox } from "@mui/icons-material";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  userName: yup.string().required("User Name is required"),
  password: yup.string().required("Password is required"),
  confirmPassword: yup
    .string()
    .required("Confirm Password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),
});

const AddInspectorForm = ({
  mode = "create",
  userId = null,
  defaultValues = {},
}) => {
  const [formData, setFormData] = useState({});
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [reportingRights, setReportingRights] = useState(false);
  const [dataEntryRights, setDataEntryRights] = useState(false);
  const [journalRights, setJournalRights] = useState(false);
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
      name: "",
      userName: "",
      password: "",
      confirmPassword: "",
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
    if (mode !== "update" || !userId) return;

    const fetchUserDetails = async () => {
      try {
        const res = await getInspectorsDetails(userId);
        const data = res?.data?.data;

        if (!data) return;

        setFormData(data);
        setValue("name", data?.name);
        setValue("userName", data?.userName);
        setValue("password", data?.password);
        setValue("confirmPassword", data?.confirmPassword);
        setValue("role", parseInt(data?.roleId));
        setValue("inspectorDesignation", data?.inspectorDesignation);
      } catch (error) {
        console.error("Error fetching visa details:", error);
      }
    };

    fetchUserDetails();
  }, [mode, userId]);

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  const cancelBtn = () => {
    router.push("/staff");
  }

  const onSubmit = async (data) => {
    // console.log(data, "data");

    console.log("data", data);

    let payload ={
      ...data,
      reportingRights : reportingRights,
      dataEntryRights : dataEntryRights,
      journalRights : journalRights
    }

    console.log(payload, 'on submit payload');
    

    // setIsDataLoading(true);
    // Handle the submission logic here
    // setTimeout(() => {
    //   setSnackBar({ open: true, message: "Form submitted successfully!" });
    //   setIsDataLoading(false);
    // }, 2000);

    // let payload = {
    //   name: data?.name,
    //   roleId: data?.role,
    //   userName: data?.userName,
    //   password: data?.password,
    //   confirmPassword: data?.confirmPassword,
    //   inspectorDesignation: data?.inspectorDesignation,
    //   companyName: data?.companyName,
    //   // ...data,
    // };

    // if (mode === "create") {
    //   // const handleSubmitInspectors = async (payload) => {
    //   await addInspectors(payload)
    //     .then((res) => {
    //       console.log("res", res);
    //       console.log("res 22", res?.response?.data?.message);
    //       if (res?.status === 400) {
    //         setSnackBar({ open: true, message: res?.data.message });
    //       } else {
    //         router.push("/staff/");
    //       }
    //     })
    //     .catch((error) => {
    //       console.log("error", error);
    //     });
    //   setIsDataLoading(false);
    // } else if (mode === "update" && userId) {
    //   await updateInspectorDetail(userId, payload)
    //     .then((res) => {
    //       if (res?.status === 400) {
    //         setSnackBar({ open: true, message: res?.data.message });
    //       } else {
    //         router.push("/staff/");
    //       }
    //     })
    //     .catch((error) => {
    //       console.log("error", error);
    //     });
    //   setIsDataLoading(false);
    // }
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
                      name="name"
                      control={control}
                      render={({ field }) => {
                        return (
                          <CommonInput
                            {...field}
                            fullWidth
                            variant="standard"
                            label={
                              <span>
                                Name{" "}
                                <span style={{ color: "red" }}>*</span>
                              </span>
                            }
                            placeholder="Enter name"
                            error={Boolean(errors.name)}
                            helperText={errors.name?.message}
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
                      name="userName"
                      control={control}
                      render={({ field }) => {
                        return (
                          <CommonInput
                            {...field}
                            fullWidth
                            variant="standard"
                            label={
                              <span>
                                User Name <span style={{ color: "red" }}>*</span>
                              </span>
                            }
                            placeholder="Enter User Name"
                            error={Boolean(errors.userName)}
                            helperText={errors.userName?.message}
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
                      name="password"
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
                          error={Boolean(errors.password)}
                          helperText={errors.password?.message}
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
                      name="confirmPassword"
                      control={control}
                      render={({ field }) => (
                        <CommonInput
                          {...field}
                          fullWidth
                          variant="standard"
                          label={
                            <span>
                              Confirm Password <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          placeholder="Enter confirm password"
                          error={Boolean(errors.confirmPassword)}
                          helperText={errors.confirmPassword?.message}
                          type="password"
                          InputProps={{
                            style: { color: "black" },
                          }}
                        />
                      )}
                    />
                  </Grid2>

                  <Grid2 xs={12}>
                    <Stack >
                      <Typography variant="p" component="p">Rights</Typography>
                    </Stack>

                  <Grid2 item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                        checked={reportingRights}
                        onChange={(e) => setReportingRights(e.target.checked)}
                        />
                      }
                      label="Reporting Rights"
                      />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={dataEntryRights}
                          onChange={(e) => setDataEntryRights(e.target.checked)}
                        />
                      }
                      label=" Data Entry rights"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={journalRights}
                          onChange={(e) => setJournalRights(e.target.checked)}
                        />
                      }
                      label=" Journal Unlocking Rights"
                    />
                  </Grid2>
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
                  <CommonButton
                    onClick={cancelBtn}
                    variant="contained"
                    text="Cancel"
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

export default AddInspectorForm;
