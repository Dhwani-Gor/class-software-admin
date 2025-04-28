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
  ownerDetails: yup.object().shape({
    nameOfCompany: yup.string().required("Company Name is required"),
    companyAddress: yup.string().required("Complete Address is required"),
    phoneNumber: yup
      .string()
      .required("Phone number is required")
      .matches(/^\d{10}$/, "Enter a valid 10-digit Indian phone number"),
    email: yup.string().required("Email is required").email("Invalid email"),
  }),
  managerDetails: yup.object().shape({
    nameOfCompany: yup.string().required("Company Name is required"),
    companyAddress: yup.string().required("Complete Address is required"),
    phoneNumber: yup
      .string()
      .required("Phone number is required")
      .matches(/^\d{10}$/, "Enter a valid 10-digit Indian phone number"),
    email: yup.string().required("Email is required").email("Invalid email"),
  }),
  invoicingDetails: yup.object().shape({
    nameOfCompany: yup.string().required("Company Name is required"),
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
  editReason = ''
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
  
  // Flags to track manual edits
  const [manuallyEditedManager, setManuallyEditedManager] = useState(false);
  const [manuallyEditedInvoice, setManuallyEditedInvoice] = useState(false);

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
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      shipName: "",
      imoNumber: "",
      classId: "",
      ownerDetails: {
        nameOfCompany: "",
        companyAddress: "",
        phoneNumber: "",
        email: "",
      },
      managerDetails: {
        nameOfCompany: "",
        companyAddress: "",
        phoneNumber: "",
        email: "",
      },
      invoicingDetails: {
        nameOfCompany: "",
        companyAddress: "",
        phoneNumber: "",
        email: "",
        gstNo: "",
      },
      ...defaultValues,
    },
  });

  // Copy values when checkboxes are checked
  useEffect(() => {
    const ownerDetails = getValues("ownerDetails");
    const managerDetails = getValues("managerDetails");

    if (isManagerSameAsOwner && ownerDetails) {
      setValue("managerDetails", { ...ownerDetails });
      clearErrors('managerDetails.companyAddress');
      clearErrors("managerDetails.email");
      clearErrors("managerDetails.nameOfCompany");
      clearErrors('managerDetails.phoneNumber');
      setManuallyEditedManager(false); // Reset flag when auto-copying
    }

    if (isInvoiceSameAsOwner && ownerDetails) {
      setValue("invoicingDetails", {
        ...ownerDetails,
        gstNo: getValues("invoicingDetails.gstNo") || "",
      });
      clearErrors('invoicingDetails');
      clearErrors('invoicingDetails.companyAddress');
      clearErrors("invoicingDetails.email");
      clearErrors("invoicingDetails.nameOfCompany");
      clearErrors('invoicingDetails.phoneNumber');
      setManuallyEditedInvoice(false); // Reset flag when auto-copying
    }

    if (isInvoiceSameAsManager && managerDetails) {
      setValue("invoicingDetails", {
        ...managerDetails,
        gstNo: getValues("invoicingDetails.gstNo") || "",
      });
      clearErrors('invoicingDetails');
      clearErrors('invoicingDetails.companyAddress');
      clearErrors("invoicingDetails.email");
      clearErrors("invoicingDetails.nameOfCompany");
      clearErrors('invoicingDetails.phoneNumber');
      setManuallyEditedInvoice(false); // Reset flag when auto-copying
    }
  }, [isManagerSameAsOwner, isInvoiceSameAsOwner, isInvoiceSameAsManager, setValue, getValues, clearErrors]);

  // Watch for changes in the owner's details to update copied fields
  const ownerDetail = watch("ownerDetails");
  useEffect(() => {
    // Only copy if the checkbox is checked and we're not in manual edit mode
    if (isManagerSameAsOwner && !manuallyEditedManager && ownerDetail) {
      setValue("managerDetails", { ...ownerDetail });
    }
    
    if (isInvoiceSameAsOwner && !manuallyEditedInvoice && ownerDetail) {
      setValue("invoicingDetails", {
        ...ownerDetail,
        gstNo: getValues("invoicingDetails.gstNo") || "",
      });
    }
  }, [ownerDetail, isManagerSameAsOwner, isInvoiceSameAsOwner, setValue, getValues, manuallyEditedManager, manuallyEditedInvoice]);

  // Watch for changes in the manager's details to update invoicing if needed
  const managerDetail = watch("managerDetails");
  useEffect(() => {
    // Only copy if the checkbox is checked and we're not in manual edit mode
    if (isInvoiceSameAsManager && !manuallyEditedInvoice && managerDetail) {
      setValue("invoicingDetails", {
        ...managerDetail,
        gstNo: getValues("invoicingDetails.gstNo") || "",
      });
    }
  }, [managerDetail, isInvoiceSameAsManager, setValue, getValues, manuallyEditedInvoice]);

  const fetchClient = async () => {
    try {
      setIsDataLoading(true);
      const result = await getSpecificClient(clientId);
      if (result?.status === 200 && result.data?.data) {
        reset(result.data.data);
        setOwnerInputValue(result.data.data.ownerDetails?.nameOfCompany || '');
      } else {
        toast.error("Something went wrong! Please try again after some time");
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error("Error fetching client data");
    } finally {
      setIsDataLoading(false);
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
    // Add debug logging to verify form data
    console.log("Submitting form with data:", data);
    console.log("Owner company:", data.ownerDetails?.nameOfCompany);
    console.log("Manager company:", data.managerDetails?.nameOfCompany);
    console.log("Invoicing company:", data.invoicingDetails?.nameOfCompany);
    
    // Ensure all required data is present
    if (!data.ownerDetails || !data.managerDetails || !data.invoicingDetails) {
      toast.error("Missing required details. Please fill all required fields.");
      return;
    }
    
    try {
      setLoading(true);
      let res;
      
      // Prepare the payload with the correct structure
      const payload = {
        shipName: data.shipName,
        imoNumber: data.imoNumber || "",
        classId: data.classId || "",
        ownerDetails: {
          nameOfCompany: data.ownerDetails.nameOfCompany,
          companyAddress: data.ownerDetails.companyAddress,
          phoneNumber: data.ownerDetails.phoneNumber,
          email: data.ownerDetails.email,
        },
        managerDetails: {
          nameOfCompany: data.managerDetails.nameOfCompany,
          companyAddress: data.managerDetails.companyAddress,
          phoneNumber: data.managerDetails.phoneNumber,
          email: data.managerDetails.email,
        },
        invoicingDetails: {
          nameOfCompany: data.invoicingDetails.nameOfCompany,
          companyAddress: data.invoicingDetails.companyAddress,
          phoneNumber: data.invoicingDetails.phoneNumber,
          email: data.invoicingDetails.email,
          gstNo: data.invoicingDetails.gstNo || "",
        }
      };
      
      if (clientId) {
        res = await updateClient(clientId, {...payload, message: editReason});
      } else {
        res = await createClient(payload);
      }
  
      if (res?.data?.status === "success" && res?.data?.url) {
        toast.success(clientId ? "Client updated successfully" : "Client created successfully");
        router.push('/clients');
      } else if (res?.response?.data?.status === "error") {
        toast.error(res?.response?.data?.message);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelBtn = () => {
    router.push("/clients");
  }

  // Helper function to create change handler for manual edits
  const createManualEditHandler = (sectionKey) => {
    return () => {
      if (sectionKey === "managerDetails" && isManagerSameAsOwner) {
        setIsManagerSameAsOwner(false);
        setManuallyEditedManager(true);
      } else if (sectionKey === "invoicingDetails") {
        if (isInvoiceSameAsOwner) {
          setIsInvoiceSameAsOwner(false);
          setManuallyEditedInvoice(true);
        }
        if (isInvoiceSameAsManager) {
          setIsInvoiceSameAsManager(false);
          setManuallyEditedInvoice(true);
        }
      }
    };
  };

  // Fixed Autocomplete component for owner's company name
  const renderOwnerCompanyField = () => (
    <Controller
      name="ownerDetails.nameOfCompany"
      control={control}
      render={({ field }) => (
        <Autocomplete
          freeSolo
          options={ownerOptions}
          loading={isSearching}
          value={field.value || ""}
          inputValue={ownerInputValue}
          disabled={!editingAllowed}
          onInputChange={(event, newInputValue) => {
            setOwnerInputValue(newInputValue);
            
            // Directly update the form value when typing
            if (newInputValue) {
              field.onChange(newInputValue);
            }
          }}
          onChange={(event, newValue) => {
            if (typeof newValue === 'string') {
              field.onChange(newValue);
            } else if (newValue && newValue.nameOfCompany) {
              field.onChange(newValue.nameOfCompany);

              // Update other owner fields
              setValue('ownerDetails.companyAddress', newValue.companyAddress || '');
              setValue('ownerDetails.phoneNumber', newValue.phoneNumber || '');
              setValue('ownerDetails.email', newValue.email || '');
              
              // If checkboxes are checked, propagate the changes
              if (isManagerSameAsOwner) {
                setValue('managerDetails.nameOfCompany', newValue.nameOfCompany || '');
                setValue('managerDetails.companyAddress', newValue.companyAddress || '');
                setValue('managerDetails.phoneNumber', newValue.phoneNumber || '');
                setValue('managerDetails.email', newValue.email || '');
              }
              
              if (isInvoiceSameAsOwner) {
                setValue('invoicingDetails.nameOfCompany', newValue.nameOfCompany || '');
                setValue('invoicingDetails.companyAddress', newValue.companyAddress || '');
                setValue('invoicingDetails.phoneNumber', newValue.phoneNumber || '');
                setValue('invoicingDetails.email', newValue.email || '');
              }
            } else if (newValue === null) {
              // Handle clearing the field
              field.onChange('');
            }
          }}
          getOptionLabel={(option) => {
            // Value selected with enter, right from the input
            if (typeof option === 'string') {
              return option;
            }
            return option?.nameOfCompany || '';
          }}
          renderInput={(params) => (
            <CommonInput
              {...params}
              variant="standard"
              label="Company Name *"
              placeholder="Company Name"
              disabled={!editingAllowed}
              error={Boolean(errors?.ownerDetails?.nameOfCompany)}
              helperText={errors?.ownerDetails?.nameOfCompany?.message}
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
  );

  // Common section renderer
  const renderContactSection = (sectionKey) => (
    <Stack gap={2}>
      {sectionKey === "ownerDetails" 
        ? renderOwnerCompanyField()
        : (
          <Controller
            name={`${sectionKey}.nameOfCompany`}
            control={control}
            render={({ field }) => (
              <CommonInput
                {...field}
                fullWidth
                variant="standard"
                label="Company Name *"
                placeholder="Company Name"
                disabled={!editingAllowed || (sectionKey === "managerDetails" && isManagerSameAsOwner) || 
                          (sectionKey === "invoicingDetails" && (isInvoiceSameAsOwner || isInvoiceSameAsManager))}
                error={Boolean(errors?.[sectionKey]?.nameOfCompany)}
                helperText={errors?.[sectionKey]?.nameOfCompany?.message}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  createManualEditHandler(sectionKey)();
                }}
              />
            )}
          />
        )
      }
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
            disabled={!editingAllowed || (sectionKey === "managerDetails" && isManagerSameAsOwner) || 
                      (sectionKey === "invoicingDetails" && (isInvoiceSameAsOwner || isInvoiceSameAsManager))}
            error={Boolean(errors?.[sectionKey]?.companyAddress)}
            helperText={errors?.[sectionKey]?.companyAddress?.message}
            onChange={(e) => {
              field.onChange(e.target.value);
              createManualEditHandler(sectionKey)();
            }}
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
            disabled={!editingAllowed || (sectionKey === "managerDetails" && isManagerSameAsOwner) || 
                      (sectionKey === "invoicingDetails" && (isInvoiceSameAsOwner || isInvoiceSameAsManager))}
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
              createManualEditHandler(sectionKey)();
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
            disabled={!editingAllowed || (sectionKey === "managerDetails" && isManagerSameAsOwner) || 
                      (sectionKey === "invoicingDetails" && (isInvoiceSameAsOwner || isInvoiceSameAsManager))}
            error={Boolean(errors?.[sectionKey]?.email)}
            helperText={errors?.[sectionKey]?.email?.message}
            onChange={(e) => {
              field.onChange(e.target.value);
              createManualEditHandler(sectionKey)();
            }}
          />
        )}
      />
      {sectionKey === "invoicingDetails" ? (
        <Controller
          name="invoicingDetails.gstNo"
          control={control}
          render={({ field }) => (
            <CommonInput
              {...field}
              fullWidth
              variant="standard"
              label="TRN / VAT / GST No."
              placeholder="Enter TRN / VAT / GST No."
              disabled={!editingAllowed}
              error={Boolean(errors?.invoicingDetails?.gstNo)}
              helperText={errors?.invoicingDetails?.gstNo?.message}
              onChange={(e) => field.onChange(e.target.value)}
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
                        onChange={(e) => field.onChange(e.target.value)}
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
                        onChange={(e) => field.onChange(e.target.value)}
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
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    )}
                  />
                </Grid2>
              </Grid2>

              <Grid2 container spacing={4}>
                {/* Owners Details  */}
                <Grid2 size={{ xs: 4 }}>
                  <h3 style={{ marginBottom: "10px" }}>Owner's Detail</h3>
                  {renderContactSection("ownerDetails")}
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
                            const checked = e.target.checked;
                            setIsManagerSameAsOwner(checked);
                            if (checked) {
                              // Immediately copy the values
                              const currentOwnerDetails = getValues("ownerDetails");
                              setValue("managerDetails", {
                                nameOfCompany: currentOwnerDetails.nameOfCompany || "",
                                companyAddress: currentOwnerDetails.companyAddress || "",
                                phoneNumber: currentOwnerDetails.phoneNumber || "",
                                email: currentOwnerDetails.email || ""
                              });
                              setManuallyEditedManager(false);
                              
                              // Clear any errors
                              clearErrors("managerDetails");
                            }
                          }
                        }}
                        disabled={!editingAllowed}
                      />
                    }
                    label="Same as Owner"
                  />
                  {renderContactSection("managerDetails")}
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
                            if (checked) {
                              // Immediately copy the values
                              const currentOwnerDetails = getValues("ownerDetails");
                              setValue("invoicingDetails", {
                                nameOfCompany: currentOwnerDetails.nameOfCompany || "",
                                companyAddress: currentOwnerDetails.companyAddress || "",
                                phoneNumber: currentOwnerDetails.phoneNumber || "",
                                email: currentOwnerDetails.email || "",
                                gstNo: getValues("invoicingDetails.gstNo") || "",
                              });
                              setIsInvoiceSameAsManager(false);
                              setManuallyEditedInvoice(false);
                              
                              // Clear any errors
                              clearErrors("invoicingDetails");
                            }
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
                            if (checked) {
                              // Immediately copy the values
                              const currentManagerDetails = getValues("managerDetails");
                              setValue("invoicingDetails", {
                                nameOfCompany: currentManagerDetails.nameOfCompany || "",
                                companyAddress: currentManagerDetails.companyAddress || "",
                                phoneNumber: currentManagerDetails.phoneNumber || "",
                                email: currentManagerDetails.email || "",
                                gstNo: getValues("invoicingDetails.gstNo") || "",
                              });
                              setIsInvoiceSameAsOwner(false);
                              setManuallyEditedInvoice(false);
                              
                              // Clear any errors
                              clearErrors("invoicingDetails");
                            }
                          }}
                          disabled={!editingAllowed}
                        />
                      }
                      label="Same as Manager"
                    />
                  </Stack>

                  {renderContactSection("invoicingDetails")}
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
                    <CommonButton 
                      type="submit"

                      variant="contained" 
                      text="Save" 
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : null}
                    />
                    <CommonButton onClick={cancelBtn} variant="contained" text="Cancel" disabled={loading} />
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