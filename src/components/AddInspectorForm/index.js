import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import {
  addInspectors,
  createInspector,
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
import { toast } from "react-toastify";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  username: yup.string().required("User Name is required"),
  password: yup.string().when("$isUpdate", {
    is: false,
    then: (schema) => schema.required("Password is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  confirmPassword: yup.string().when("$isUpdate", {
    is: false,
    then: (schema) =>
      schema
        .required("Confirm Password is required")
        .oneOf([yup.ref("password")], "Passwords must match"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const AddInspectorForm = ({
  mode = "create",
  userId = null,
  defaultValues = {},
}) => {
  const [formData, setFormData] = useState({});
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const isUpdate = !!userId;
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    reset
  } = useForm({
    resolver: yupResolver(schema, { context: { isUpdate } }),
    defaultValues: defaultValues || {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
      reportingRights: false,
      dataEntryRights: false,
      journalUnlockRights: false
    },
  });

  const fetchUserDetails = async () => {
    try {
      const res = await getInspectorsDetails(userId);
      const data = res?.data?.data;

      if (!data) return;

      reset(res?.data.data);
    } catch (error) {
      console.error("Error fetching visa details:", error);
    }
  };

  useEffect(() => {
    if (mode !== "update" || !userId) return;
    fetchUserDetails();
  }, [mode, userId]);

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  const cancelBtn = () => {
    router.push("/staff");
  }

  const onSubmit = async (data) => {
    try {
      if (userId) {
        const res = await updateInspectorDetail(userId, data);

        if (res?.data?.status === "success") {
          toast.success("Inspector updated successfully");
          router.push('/staff')
        } else {
          toast.error(res?.response?.data?.message);
        }
      } else {
        const res = await createInspector({ ...data, roleId: 2 });
        if (res?.data?.status === "success") {
          toast.success("Inspector created successfully");
          router.push('/staff')
        } else {
          toast.error(res?.response?.data?.message);
        }
      }
    } catch (error) {
      console.error("Error:", error);
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
              <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
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
                            autoComplete="Enter Name"                          />
                        );
                      }}
                    />
                  </Grid2>

                  <Grid2 size={{ xs: 12 }}>
                    <Controller
                      name="username"
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
                            error={Boolean(errors.username)}
                            helperText={errors.username?.message}
                            autoComplete="New Username"
                            InputProps={{
                              style: { color: "black" },
                            }}
                          />
                        );
                      }}
                    />
                  </Grid2>

                  {!userId && <>
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
                            autoComplete="password"
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
                  </>}

                  <Grid2 xs={12}>
                    <Stack >
                      <Typography variant="p" component="p">Rights</Typography>
                    </Stack>

                    <Grid2 item xs={12}>
                      <Controller
                        name="reportingRights"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                {...field}
                                checked={field.value === true}
                                onChange={(e) => field.onChange(e.target.checked)}
                              />
                            }
                            label="Reporting Rights"
                          />
                        )}
                      />
                      <Controller
                        name="dataEntryRights"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                {...field}
                                checked={field.value === true}
                                onChange={(e) => field.onChange(e.target.checked)}
                              />
                            }
                            label="Data Entry Rights"
                          />
                        )}
                      />
                      <Controller
                        name="journalUnlockRights"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                {...field}
                                checked={field.value === true}
                                onChange={(e) => field.onChange(e.target.checked)}
                              />
                            }
                            label="Journal Unlocking Rights"
                          />
                        )}
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
                    text="Save"
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
