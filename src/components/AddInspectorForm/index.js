import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { addInspectors, createInspector, getAllClients, getAllModules, getInspectorsDetails, updateInspectorDetail } from "@/api";
import { CircularProgress, FormControl, FormControlLabel, FormHelperText, FormLabel, Grid2, Paper, Radio, RadioGroup, Snackbar, Stack, Typography, Select, MenuItem, InputLabel, Autocomplete, TextField } from "@mui/material";
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

const roles = [
  {
    label: "Agent",
    value: "agent",
    roleId: 3,
  },
  {
    label: "Inspector",
    value: "inspector",
    roleId: 4,
  },
  {
    label: "Staff",
    value: "staff",
    roleId: 2,
  },
];

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
    then: (schema) => schema.required("Confirm Password is required").oneOf([yup.ref("password")], "Passwords must match"),
    otherwise: (schema) => schema.notRequired(),
  }),
  role: yup.string().required("Role is required"),
});

const AddInspectorForm = ({ mode = "create", userId = null, defaultValues = {}, permissionData = [], specialPermissionData = [] }) => {
  const [clientsList, setClientsList] = useState([]);
  const [formData, setFormData] = useState({});
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const isUpdate = !!userId;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(schema, { context: { isUpdate } }),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "",
      reportingRights: false,
      dataEntryRights: false,
      journalUnlockRights: false,
      permissionModule: [],
      specialPermission: [],
      clientIds: [],
      ...defaultValues,
    },
  });
  const userRole = watch("role");

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (userRole !== "agent") {
      setValue("clientIds", []);
    }
  }, [userRole, setValue]);

  const fetchClients = async () => {
    try {
      const result = await getAllClients();
      if (result?.status === 200) {
        setClientsList(result.data.data);
      } else {
        toast.error(result?.message);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to fetch clients");
    }
  };

  const fetchUserDetails = async () => {
    if (!userId || permissionData.length === 0) return;

    setIsDataLoading(true);
    try {
      const res = await getInspectorsDetails(userId);
      const data = res?.data?.data;
      if (!data) return;

      // Map backend permission names/descriptions to form values
      const mappedPermissions =
        data.permissionModule
          ?.map((backendValue) => {
            // Try matching with both 'name' (value) and 'description' (label)
            const match = permissionData.find((m) => m.value === backendValue || m.label === backendValue);
            return match?.value;
          })
          .filter(Boolean) || [];

      const mappedSpecial =
        data.specialPermission
          ?.map((backendValue) => {
            const match = specialPermissionData.find((s) => s.value === backendValue || s.label === backendValue);
            return match?.value;
          })
          .filter(Boolean) || [];

      // Reset form with all data including mapped permissions
      reset({
        name: data.name || "",
        username: data.username || "",
        role: data.role || "",
        reportingRights: data.reportingRights || false,
        dataEntryRights: data.dataEntryRights || false,
        journalUnlockRights: data.journalUnlockRights || false,
        clientIds: data.clients?.map((c) => c.id) || [],
        permissionModule: mappedPermissions,
        specialPermission: mappedSpecial,
      });

      setIsFormReady(true);
    } catch (error) {
      console.error("Error fetching inspector details:", error);
      toast.error("Failed to fetch user details");
    } finally {
      setIsDataLoading(false);
    }
  };

  // Fetch user details only after permission data is loaded
  useEffect(() => {
    if (mode === "update" && userId && permissionData.length > 0 && specialPermissionData.length > 0) {
      fetchUserDetails();
    } else if (mode === "create") {
      setIsFormReady(true);
    }
  }, [mode, userId, permissionData, specialPermissionData]);

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  const cancelBtn = () => {
    router.push("/staff");
  };

  const onSubmit = async (data) => {
    const selectedRole = roles.find((r) => r.value === data.role);
    const roleId = selectedRole?.roleId;

    const payload = {
      ...data,
      roleId,
      clientIds: data.clientIds && data.clientIds.length > 0 ? data.clientIds : [],
    };

    try {
      if (userId) {
        let res = await updateInspectorDetail(userId, payload);
        console.log(res, "res");
        if (res?.data?.status === "success") {
          toast.success(res?.data?.message);
        } else {
          toast.error(res?.response?.data?.message);
        }
      } else {
        let res = await createInspector(payload);
        if (res?.response?.data?.status === "error") {
          toast.error(res?.response?.data?.message);
        } else {
          toast.success(res?.response?.data?.message);
        }
      }
      router.push("/staff");
    } catch (error) {
      toast.error(error?.message || "Failed to save user");
    }
  };

  if (isDataLoading || !isFormReady) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack mt={4} spacing={4}>
        <Paper sx={{ padding: "20px", borderRadius: "15px" }}>
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <Grid2 container spacing={3}>
              <Grid2 size={{ xs: 12 }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      fullWidth
                      variant="standard"
                      label={
                        <span>
                          Name <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      placeholder="Enter name"
                      error={Boolean(errors.name)}
                      helperText={errors.name?.message}
                      InputProps={{
                        style: { color: "black" },
                      }}
                      autoComplete="Enter Name"
                    />
                  )}
                />
              </Grid2>

              <Grid2 size={{ xs: 12 }}>
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
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
                      autoComplete="off"
                      InputProps={{
                        style: { color: "black" },
                      }}
                    />
                  )}
                />
              </Grid2>

              {!userId && (
                <>
                  <Grid2 size={{ xs: 12 }}>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <CommonInput
                          {...field}
                          fullWidth
                          variant="standard"
                          autoComplete="off"
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
                </>
              )}

              <Grid2 size={{ xs: 12 }}>
                <Typography>
                  Select Role <span style={{ color: "red" }}>*</span>
                </Typography>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth variant="standard" error={Boolean(errors.role)}>
                      <Select {...field} value={field.value || ""} onChange={field.onChange}>
                        {roles.map((role) => (
                          <MenuItem key={role.value} value={role.value}>
                            {role.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.role && <FormHelperText>{errors.role?.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid2>
              <Grid2 size={{ xs: 12 }}>
                <Typography>Select the Ship</Typography>
                <Controller
                  name="clientIds"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      multiple
                      options={clientsList}
                      getOptionLabel={(option) => option.shipName || ""}
                      value={clientsList.filter((item) => field.value?.includes(item.id)) || []}
                      onChange={(_, newValue) => {
                        field.onChange(newValue.map((item) => item.id));
                      }}
                      renderInput={(params) => <TextField {...params} variant="standard" error={Boolean(errors.clientIds)} helperText={errors.clientIds?.message} fullWidth />}
                    />
                  )}
                />
              </Grid2>
            </Grid2>

            <Box>
              {/* Dynamic Permissions */}
              {permissionData?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Stack>
                    <Typography fontWeight={500}>Permission</Typography>
                  </Stack>
                  <Grid2 container>
                    {permissionData.map((permissionItem, index) => (
                      <Grid2 key={`permission-${permissionItem.value}-${index}`} item xs={12} sx={{ mt: 1 }}>
                        <Controller
                          name="permissionModule"
                          control={control}
                          render={({ field }) => {
                            const { value = [], onChange } = field;
                            const checked = value.includes(permissionItem.value);

                            return (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={checked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        onChange([...value, permissionItem.value]);
                                      } else {
                                        onChange(value.filter((item) => item !== permissionItem.value));
                                      }
                                    }}
                                  />
                                }
                                label={permissionItem.label}
                              />
                            );
                          }}
                        />
                      </Grid2>
                    ))}
                  </Grid2>
                </Box>
              )}

              {specialPermissionData?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Stack>
                    <Typography fontWeight={500}>Special Permission</Typography>
                  </Stack>
                  <Grid2 container>
                    {specialPermissionData.map((sPermission, index) => (
                      <Grid2 key={`special-${sPermission.value}-${index}`} item xs={12} sx={{ mt: 1 }}>
                        <Controller
                          name="specialPermission"
                          control={control}
                          render={({ field }) => {
                            const { value = [], onChange } = field;
                            const checked = value.includes(sPermission.value);

                            return (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={checked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        onChange([...value, sPermission.value]);
                                      } else {
                                        onChange(value.filter((item) => item !== sPermission.value));
                                      }
                                    }}
                                  />
                                }
                                label={sPermission.label}
                              />
                            );
                          }}
                        />
                      </Grid2>
                    ))}
                  </Grid2>
                </Box>
              )}
            </Box>

            <Stack mt={4} spacing={2} direction="row" justifyContent="flex-start">
              <CommonButton type="submit" variant="contained" text="Save" />
              <CommonButton onClick={cancelBtn} variant="contained" text="Cancel" />
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
    </Box>
  );
};

export default AddInspectorForm;
