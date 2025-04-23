import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import Paper from "@mui/material/Paper";
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Grid2";
import { toast } from "react-toastify";
import Snackbar from "@mui/material/Snackbar";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CommonInput from "../CommonInput";
import CommonButton from "../CommonButton";
import { createClient, getSpecificClient, searchowner_detail, updateClient } from "@/api";

const schema = yup.object().shape({
  shipName: yup.string().required("Ship Name is required"),
  owner_detail: yup.object().shape({
    companyName: yup.string().required("Company Name is required"),
    companyAddress: yup.string().required("Complete Address is required"),
    phoneNumber: yup
      .string()
      .required("Phone number is required")
      .matches(/^\d{10}$/, "Enter a valid 10-digit Indian phone number"),
    email: yup.string().required("Email is required").email("Invalid email"),
  }),
  manager_detail: yup.object().shape({
    companyName: yup.string().required("Company Name is required"),
    companyAddress: yup.string().required("Complete Address is required"),
    phoneNumber: yup
      .string()
      .required("Phone number is required")
      .matches(/^\d{10}$/, "Enter a valid 10-digit Indian phone number"),
    email: yup.string().required("Email is required").email("Invalid email"),
  }),
  invoicing_detail: yup.object().shape({
    companyName: yup.string().required("Company Name is required"),
    companyAddress: yup.string().required("Complete Address is required"),
    phoneNumber: yup
      .string()
      .required("Phone number is required")
      .matches(/^\d{10}$/, "Enter a valid 10-digit Indian phone number"),
    email: yup.string().required("Email is required").email("Invalid email"),
  }),
});

const AddClientForm = ({
  mode = "create",
  clientId = null,
  defaultValues = {},
  editingAllowed = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isManagerSameAsOwner, setIsManagerSameAsOwner] = useState(false);
  const [isInvoiceSameAsOwner, setIsInvoiceSameAsOwner] = useState(false);
  const [isInvoiceSameAsManager, setIsInvoiceSameAsManager] = useState(false);
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [ownerInputValue, setOwnerInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    clearErrors,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      shipName: "",
      imoNumber: "",
      classId: "",
      owner_detail: {
        companyName: "",
        companyAddress: "",
        phoneNumber: "",
        email: "",
      },
      manager_detail: {
        companyName: "",
        companyAddress: "",
        phoneNumber: "",
        email: "",
      },
      invoicing_detail: {
        companyName: "",
        companyAddress: "",
        phoneNumber: "",
        email: "",
        gstNo: "",
      },
      ...defaultValues,
    },
  });

  useEffect(() => {
    const owner_detail = getValues("owner_detail");
    const manager_detail = getValues("manager_detail");

    if (isManagerSameAsOwner) {
      setValue("manager_detail", { ...owner_detail });
      clearErrors('manager_detail.companyAddress');
      clearErrors("manager_detail.email")
      clearErrors("manager_detail.companyName")
      clearErrors('manager_detail.phoneNumber')
    }

    if (isInvoiceSameAsOwner) {
      setValue("invoicing_detail", {
        ...owner_detail,
        gstNo: getValues("invoicing_detail.gstNo"),
      });
      clearErrors('invoicing_detail');
      clearErrors('invoicing_detail.companyAddress');
      clearErrors("invoicing_detail.email")
      clearErrors("invoicing_detail.companyName")
      clearErrors('invoicing_detail.phoneNumber')
    }

    if (isInvoiceSameAsManager) {
      setValue("invoicing_detail", {
        ...manager_detail,
        gstNo: getValues("invoicing_detail.gstNo"),
      });
      clearErrors('invoicing_detail');
      clearErrors('invoicing_detail.companyAddress');
      clearErrors("invoicing_detail.email")
      clearErrors("invoicing_detail.companyName")
      clearErrors('invoicing_detail.phoneNumber')
    }

  }, [isManagerSameAsOwner, isInvoiceSameAsOwner, isInvoiceSameAsManager]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const result = await getSpecificClient(clientId);
      if (result?.status === 200) {
        console.log('151 ===>',result.data.data)
        reset(result.data.data)
        setOwnerInputValue(result.data.data.owner_detail.companyName || '');
      } else {
        toast.error("Something went wrong ! Please try again after some time")
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error)
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  // Handle search for owner company details
  const handleOwnerSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') {
      setOwnerOptions([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchowner_detail(searchQuery);
      if (result?.status === 200 && result?.data) {
        setOwnerOptions(result.data.data || []);
      } else {
        setOwnerOptions([]);
      }
    } catch (error) {
      console.error("Error searching owner details:", error);
      setOwnerOptions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (ownerInputValue) {
        handleOwnerSearch(ownerInputValue);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [ownerInputValue]);

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  const onSubmit = async (data) => {
    try {
      if (clientId) {
        const res = await updateClient(clientId, data);

        if (res?.data.status === "success" && res?.data?.url) {
          toast.success("Client updated successfully");
        } else {
          throw new Error("Invalid response format or missing URL");
        }
      } else {
        const res = await createClient(data);

        if (res?.data.status === "success" && res?.data?.url) {
          toast.success("Client created successfully");
        } else {
          throw new Error("Invalid response format or missing URL");
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  
  const cancelBtn = () => {
    router.push("/clients");
  }

  //Common section renderer
  const renderContactSection = (sectionKey) => (
    <Stack gap={2}>
      {sectionKey === "owner_detail" ? (
        <Controller
          name={`${sectionKey}.companyName`}
          control={control}
          render={({ field }) => (
            <Autocomplete
              freeSolo
              options={ownerOptions}
              loading={isSearching}
              inputValue={ownerInputValue}
              disabled={!editingAllowed}
              onInputChange={(event, newInputValue) => {
                setOwnerInputValue(newInputValue);
              }}
              onChange={(event, newValue) => {
                if (typeof newValue === 'string') {
                  field.onChange(newValue);
                } else if (newValue && newValue.name) {
                  // Assuming the API returns objects with a name property
                  field.onChange(newValue.name);
                } else {
                  field.onChange('');
                }
              }}
              getOptionLabel={(option) => {
                // Value selected with enter, right from the input
                if (typeof option === 'string') {
                  return option;
                }
                // Regular option
                return option.name || '';
              }}
              renderInput={(params) => (
                <CommonInput
                  {...params}
                  variant="standard"
                  label="Company Name *"
                  placeholder="Company Name"
                  disabled={!editingAllowed}
                  error={Boolean(errors?.owner_detail?.companyName)}
                  helperText={errors?.owner_detail?.companyName?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        />
      ) : (
        <Controller
          name={`${sectionKey}.companyName`}
          control={control}
          render={({ field }) => (
            <CommonInput
              {...field}
              fullWidth
              variant="standard"
              label="Company Name *"
              placeholder="Company Name"
              disabled={!editingAllowed}
              error={Boolean(errors?.[sectionKey]?.companyName)}
              helperText={errors?.[sectionKey]?.companyName?.message}
            />
          )}
        />
      )}
      <Controller
        name={`${sectionKey}.companyAddress`}
        control={control}
        render={({ field }) => (
          <CommonInput
            {...field}
            fullWidth
            variant="standard"
            label="Complete Address *"
            placeholder="Enter Complete Address"
            disabled={!editingAllowed}
            error={Boolean(errors?.[sectionKey]?.companyAddress)}
            helperText={errors?.[sectionKey]?.companyAddress?.message}
          />
        )}
      />
      <Controller
        name={`${sectionKey}.phoneNumber`}
        control={control}
        render={({ field }) => (
          <CommonInput
            {...field}
            fullWidth
            variant="standard"
            type="text"
            label="Phone Number *"
            placeholder="Enter Phone Number"
            disabled={!editingAllowed}
            error={Boolean(errors?.[sectionKey]?.phoneNumber)}
            helperText={errors?.[sectionKey]?.phoneNumber?.message}
            inputProps={{
              inputMode: "numeric",
              pattern: "[0-9]*",
              maxLength: 10
            }}
            onChange={(e) => {
              if (!editingAllowed) return;
              const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
              field.onChange(onlyDigits);
            }}
          />
        )}
      />
      <Controller
        name={`${sectionKey}.email`}
        control={control}
        render={({ field }) => (
          <CommonInput
            {...field}
            fullWidth
            variant="standard"
            type="email"
            label="Email *"
            placeholder="Enter Email Address"
            disabled={!editingAllowed}
            error={Boolean(errors?.[sectionKey]?.email)}
            helperText={errors?.[sectionKey]?.email?.message}
          />
        )}
      />
      {sectionKey == "invoicing_detail" ? (
        <Controller
          name="invoicing_detail.gstNo"
          control={control}
          render={({ field }) => (
            <CommonInput
              {...field}
              fullWidth
              variant="standard"
              label="TRN / VAT / GST No."
              placeholder="Enter TRN / VAT / GST No."
              disabled={!editingAllowed}
              error={Boolean(errors?.invoicing_detail?.gstNo)}
              helperText={errors?.invoicing_detail?.gstNo?.message}
            />
          )}
        />
      ) : <></>}
    </Stack>
  );

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
        <Stack mt={4} spacing={4}>
          <Paper sx={{ padding: "20px", borderRadius: "15px" }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid2 container spacing={3} marginBottom={3}>
                <Grid2 size={{ xs: 4 }}>
                  <Controller
                    name="shipName"
                    control={control}
                    render={({ field }) => (
                      <CommonInput
                        {...field}
                        fullWidth
                        variant="standard"
                        label="Ship Name *"
                        placeholder="Enter Ship Name"
                        disabled={!editingAllowed}
                        error={Boolean(errors?.shipName)}
                        helperText={errors?.shipName?.message}
                      />
                    )}
                  />
                </Grid2>
                <Grid2 size={{ xs: 4 }}>
                  <Controller
                    name="imoNumber"
                    control={control}
                    render={({ field }) => (
                      <CommonInput
                        {...field}
                        fullWidth
                        variant="standard"
                        label="IMO Number"
                        placeholder="Enter IMO Number"
                        disabled={!editingAllowed}
                        error={Boolean(errors?.imoNumber)}
                        helperText={errors?.imoNumber?.message}
                      />
                    )}
                  />
                </Grid2>
                <Grid2 size={{ xs: 4 }}>
                  <Controller
                    name="classId"
                    control={control}
                    render={({ field }) => (
                      <CommonInput
                        {...field}
                        fullWidth
                        variant="standard"
                        label="Class ID"
                        placeholder="Enter Class ID"
                        disabled={!editingAllowed}
                        error={Boolean(errors?.classId)}
                        helperText={errors?.classId?.message}
                      />
                    )}
                  />
                </Grid2>
              </Grid2>

              <Grid2 container spacing={4}>
                {/* Owners Details  */}
                <Grid2 size={{ xs: 4 }}>
                  <h3 style={{ marginBottom: "10px" }}>Owner's Detail</h3>
                  {renderContactSection("owner_detail")}
                </Grid2>

                {/* Manager's Details  */}
                <Grid2 size={{ xs: 4 }}>
                  <h3 style={{ marginBottom: "10px" }}>Manager's Detail</h3>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isManagerSameAsOwner}
                        onChange={(e) => {
                          if (editingAllowed) {
                            setIsManagerSameAsOwner(e.target.checked);
                          }
                        }}
                        disabled={!editingAllowed}
                      />
                    }
                    label="Same as Owner"
                  />
                  {renderContactSection("manager_detail", isManagerSameAsOwner)}
                </Grid2>

                {/* Invoicing Details  */}
                <Grid2 size={{ xs: 4 }}>
                  <h3 style={{ marginBottom: "10px" }}>Invoicing Detail</h3>
                  <Stack flexDirection={'row'} spacing={2} justifyContent={'space-between'} alignItems={'center'}>
                    <FormControlLabel
                      sx={{ marginTop: "0px !important" }}
                      control={
                        <Checkbox
                          checked={isInvoiceSameAsOwner}
                          onChange={(e) => {
                            if (!editingAllowed) return;
                            const checked = e.target.checked;
                            setIsInvoiceSameAsOwner(checked);
                            if (checked) setIsInvoiceSameAsManager(false);
                          }}
                          disabled={!editingAllowed}
                        />
                      }
                      label="Same as Owner"
                    />

                    <FormControlLabel
                      sx={{ marginTop: "0px !important" }}
                      control={
                        <Checkbox
                          checked={isInvoiceSameAsManager}
                          onChange={(e) => {
                            if (!editingAllowed) return;
                            const checked = e.target.checked;
                            setIsInvoiceSameAsManager(checked);
                            if (checked) setIsInvoiceSameAsOwner(false);
                          }}
                          disabled={!editingAllowed}
                        />
                      }
                      label="Same as Manager"
                    />
                  </Stack>

                  {renderContactSection(
                    "invoicing_detail",
                    isInvoiceSameAsOwner
                  )}
                </Grid2>
              </Grid2>

              <Stack
                mt={4}
                spacing={2}
                direction="row"
                justifyContent="flex-start"
              >
                {editingAllowed && (
                  <>
                    <CommonButton type="submit" variant="contained" text="Save" />
                    <CommonButton onClick={cancelBtn} variant="contained" text="Cancel" />
                  </>
                )}
                {!editingAllowed && (
                  <CommonButton onClick={cancelBtn} variant="contained" text="Back" />
                )}
              </Stack>
            </form>

            <Snackbar
              open={snackBar.open}
              autoHideDuration={2000}
              message={snackBar.message}
              anchorOrigin={{ vertical: "top", horizontal: "center" }}
              onClose={snackbarClose}
              key="snackbar"
            />
          </Paper>
        </Stack>
      )}
    </Box>
  );
};

export default AddClientForm;