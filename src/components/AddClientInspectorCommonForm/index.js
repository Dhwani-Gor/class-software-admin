import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { addInspectors, getInspectorsDetails, updateInspectorDetail } from "@/api";
import { CircularProgress, FormControl, FormControlLabel, FormHelperText, FormLabel, Grid2, Paper, Radio, RadioGroup, Snackbar, Stack } from "@mui/material";
// import SuccessModal from "./SuccessModal";
import { useDispatch, useSelector } from "react-redux";
import { Controller, useForm } from "react-hook-form";
import CommonInput from "../CommonInput";
import CommonButton from "../CommonButton";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";

const inspectorSchema = (mode) =>
  yup.object().shape({
    name: yup.string().required("Inspector Name is required"),
    mail: yup.string().required("Email is required"),
    password: mode === "create" ? yup.string().required("Password is required") : yup.string().notRequired(),
    inspectorDesignation: yup.string().required("Inspector Designation is required"),
  });

const clientSchema = (mode) =>
  yup.object().shape({
    name: yup.string().required("Client Name is required"),
    mail: yup.string().required("Email is required"),
    password: mode === "create" ? yup.string().required("Password is required") : yup.string().notRequired(),
    nameOfCompany: yup.string().required("Company Name is required"),
  });

const AddClientInspectorCommonForm = ({ mode = "create", userId = null, defaultValues = {}, role = "" }) => {
  const [formData, setFormData] = useState({});
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const router = useRouter();

  const objRole = {
    1: "admin",
    2: "staff",
    3: "customer",
  };

  // Dynamically assign schema based on role
  //   const validationSchema = useMemo(() => {
  //     return role === "client" ? clientSchema : inspectorSchema;
  //   }, [role]);

  const validationSchema = role === "client" ? clientSchema(mode) : inspectorSchema(mode);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: defaultValues || {
      name: "",
      mail: "",
      password: "",
      nameOfCompany: "",
    },
  });

  useEffect(() => {
    if (mode !== "update" || !userId) return;

    const fetchUserDetails = async () => {
      if (role === "client") {
        try {
          const res = await getInspectorsDetails(userId);
          const data = res?.data?.data;

          if (!data) return;
          setFormData(data);
          setValue("id", data?.id);
          setValue("name", data?.name);
          setValue("nameOfCompany", data?.nameOfCompany);
          setValue("mail", data?.email);
          setValue("password", data?.password);
        } catch (error) {
          console.error("Error fetching client details:", error);
        }
      } else {
        try {
          const res = await getInspectorsDetails(userId);
          const data = res?.data?.data;

          if (!data) return;

          setFormData(data);
          setValue("id", data?.id);
          setValue("name", data?.name);
          setValue("inspectorDesignation", data?.inspectorDesignation);
          setValue("mail", data?.email);
          setValue("password", data?.password);
          // setValue("role", parseInt(data?.roleId));
        } catch (error) {
          console.error("Error fetching client details:", error);
        }
      }
    };

    fetchUserDetails();
  }, [mode, userId, role, setValue]);

  const onSubmit = async (data) => {
    setIsDataLoading(true);

    let payload = {
      id: data.id ? data.id : null,
      name: data?.name,
      roleId: role === "client" ? 3 : 2,
      email: data?.mail,
    };

    if (role === "client") {
      payload.nameOfCompany = data?.nameOfCompany;
    } else {
      payload.inspectorDesignation = data?.inspectorDesignation;
    }

    // Only add password if it's a new user (create mode)
    if (mode === "create") {
      payload.password = data?.password;
    }

    const redirectPath = role === "client" ? "/clients/" : "/staff/";

    if (mode === "create") {
      await addInspectors(payload)
        .then((res) => {
          if (res?.status === 400) {
            setSnackBar({ open: true, message: res?.data.message });
          } else {
            router.push(redirectPath);
          }
        })
        .catch((error) => console.log("error", error));
    } else if (mode === "update" && userId) {
      await updateInspectorDetail(userId, payload)
        .then((res) => {
          if (res?.status === 400) {
            setSnackBar({ open: true, message: res?.data.message });
          } else {
            router.push(redirectPath);
          }
        })
        .catch((error) => console.log("error", error));
    }

    setIsDataLoading(false);
  };

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  return (
    <Box>
      {isDataLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: 300 }}>
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
                                {role === "client" ? "Client Name" : "Inserpector Name"}
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
                      name="mail"
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
                            error={Boolean(errors.mail)}
                            helperText={errors.mail?.message}
                            InputProps={{
                              style: { color: "black" },
                            }}
                          />
                        );
                      }}
                    />
                  </Grid2>

                  {mode != "update" && (
                    <Grid2 size={{ xs: 12 }}>
                      <Controller
                        name="password"
                        control={control}
                        disabled={mode === "update"}
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
                  )}
                  {/* <Grid2 size={{ xs: 12 }}>
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
                  </Grid2> */}
                  {role === "client" ? (
                    <Grid2 size={{ xs: 12 }}>
                      <Controller
                        name="nameOfCompany"
                        control={control}
                        render={({ field }) => (
                          <CommonInput
                            {...field}
                            fullWidth
                            variant="standard"
                            label={
                              <span>
                                Company Name <span style={{ color: "red" }}>*</span>
                              </span>
                            }
                            placeholder="Enter company name"
                            error={Boolean(errors.nameOfCompany)}
                            helperText={errors.nameOfCompany?.message}
                            InputProps={{
                              style: { color: "black" },
                            }}
                          />
                        )}
                      />
                    </Grid2>
                  ) : (
                    <Grid2 size={{ xs: 12 }}>
                      <Controller
                        name="inspectorDesignation"
                        control={control}
                        render={({ field }) => (
                          <CommonInput
                            {...field}
                            fullWidth
                            variant="standard"
                            label={
                              <span>
                                Inspector Designation <span style={{ color: "red" }}>*</span>
                              </span>
                            }
                            placeholder="Enter inspector designation"
                            error={Boolean(errors.inspectorDesignation)}
                            helperText={errors.inspectorDesignation?.message}
                            InputProps={{
                              style: { color: "black" },
                            }}
                          />
                        )}
                      />
                    </Grid2>
                  )}
                </Grid2>

                <Stack mt={4} spacing={2} direction="row" justifyContent="flex-start">
                  <CommonButton type="submit" variant="contained" text="Submit" />
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

export default AddClientInspectorCommonForm;
