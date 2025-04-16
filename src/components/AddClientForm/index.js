import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";

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
import { useDispatch } from "react-redux";
import Checkbox from "@mui/material/Checkbox";

import { Controller, useForm } from "react-hook-form";
import CommonInput from "../CommonInput";
import CommonButton from "../CommonButton";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";

const schema = yup.object().shape({
  shipName: yup.string().required("Ship Name is required"),
  // imoNumber: yup.string().required("Imo Number is required"),
  // classId: yup.string().required("Class Id is required"),
  owner: yup.object().shape({
    nameOfCompany: yup.string().required("Company Name is required"),
    completeAdress: yup.string().required("Complete Address is required"),
    phoneNo: yup
      .string()
      .required("Phone number is required")
      .matches(/^\d{10}$/, "Enter a valid 10-digit Indian phone number"),
    email: yup.string().required("Email is required").email("Invalid email"),
  }),
  manager: yup.object().shape({
    nameOfCompany: yup.string().required("Company Name is required"),
    completeAdress: yup.string().required("Complete Address is required"),
    phoneNo: yup
      .string()
      .required("Phone number is required")
      .matches(/^\d{10}$/, "Enter a valid 10-digit Indian phone number"),
    email: yup.string().required("Email is required").email("Invalid email"),
  }),
  invoice: yup.object().shape({
    nameOfCompany: yup.string().required("Company Name is required"),
    completeAdress: yup.string().required("Complete Address is required"),
    phoneNo: yup
      .string()
      .required("Phone number is required")
      .matches(/^\d{10}$/, "Enter a valid 10-digit Indian phone number"),
    email: yup.string().required("Email is required").email("Invalid email"),
    // tax: yup.string().required("TRN / VAT / GST No. is required"),
  }),
});

const AddClientForm = ({
  mode = "create",
  clientId = null,
  defaultValues = {},
}) => {
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isManagerSameAsOwner, setIsManagerSameAsOwner] = useState(false);
  const [isInvoiceSameAsOwner, setIsInvoiceSameAsOwner] = useState(false);
  const [isInvoiceSameAsManager, setIsInvoiceSameAsManager] = useState(false);

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
      owner: {
        nameOfCompany: "",
        completeAdress: "",
        phoneNo: "",
        email: "",
      },
      manager: {
        nameOfCompany: "",
        completeAdress: "",
        phoneNo: "",
        email: "",
      },
      invoice: {
        nameOfCompany: "",
        completeAdress: "",
        phoneNo: "",
        email: "",
        tax: "",
      },
      ...defaultValues,
    },
  });

  useEffect(() => {
    const owner = getValues("owner");
    const manager = getValues("manager");

    if (isManagerSameAsOwner) {
      setValue("manager", { ...owner });
      clearErrors('manager.completeAdress');
      clearErrors("manager.email")
      clearErrors("manager.nameOfCompany")
      clearErrors('manager.phoneNo') 
    }

    if (isInvoiceSameAsOwner) {
      setValue("invoice", {
        ...owner,
        tax: getValues("invoice.tax"),
      });
      clearErrors('invoice'); 
      clearErrors('invoice.completeAdress');
      clearErrors("invoice.email")
      clearErrors("invoice.nameOfCompany")
      clearErrors('invoice.phoneNo') 

    }

    if (isInvoiceSameAsManager) {
      setValue("invoice", {
        ...manager,
        tax: getValues("invoice.tax"),
      });
      clearErrors('invoice'); 
      clearErrors('invoice.completeAdress');
      clearErrors("invoice.email")
      clearErrors("invoice.nameOfCompany")
      clearErrors('invoice.phoneNo') 

    }

  }, [isManagerSameAsOwner, isInvoiceSameAsOwner, isInvoiceSameAsManager]);

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  const onSubmit = (data) => {
    console.log("Final form data", data);
    // Handle submit
  };
  const cancelBtn = () => {
      router.push("/clients");
  }

  //Common section renderer
  const renderContactSection = (sectionKey) => (
    <Stack gap={2}>

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
            error={Boolean(errors?.[sectionKey]?.nameOfCompany)}
            helperText={errors?.[sectionKey]?.nameOfCompany?.message}
            
          />
        )}
      />
      <Controller
        name={`${sectionKey}.completeAdress`}
        control={control}
        render={({ field }) => (
          <CommonInput
            {...field}
            fullWidth
            variant="standard"
            label="Complete Address *"
            placeholder="Enter Complete Address"
            error={Boolean(errors?.[sectionKey]?.completeAdress)}
            helperText={errors?.[sectionKey]?.completeAdress?.message}
          />
        )}
      />
      <Controller
        name={`${sectionKey}.phoneNo`}
        control={control}
        render={({ field }) => (
          <CommonInput
            {...field}
            fullWidth
            variant="standard"
            type="text"
            label="Phone Number *"
            placeholder="Enter Phone Number"
            error={Boolean(errors?.[sectionKey]?.phoneNo)}
            helperText={errors?.[sectionKey]?.phoneNo?.message}
            inputProps={{
              inputMode: "numeric",
              pattern: "[0-9]*",
              maxLength: 10
            }}
            onChange={(e) => {
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
            error={Boolean(errors?.[sectionKey]?.email)}
            helperText={errors?.[sectionKey]?.email?.message}
          />
        )}
      />
      {sectionKey == "invoice" ? (
        <Controller
          name="invoice.tax"
          control={control}
          render={({ field }) => (
            <CommonInput
              {...field}
              fullWidth
              variant="standard"
              label="TRN / VAT / GST No."
              placeholder="Enter TRN / VAT / GST No."
              error={Boolean(errors?.invoice?.tax)}
              helperText={errors?.invoice?.tax?.message}
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
                <h3 style={{ marginBottom : "10px"}}>Owner's Detail</h3>

                  {renderContactSection("owner")}
                </Grid2>

                {/* Manager's Details  */}
                <Grid2 size={{ xs: 4 }}>
                <h3 style={{ marginBottom : "10px"}}>Manager's Detail</h3>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isManagerSameAsOwner}
                        onChange={(e) =>
                          setIsManagerSameAsOwner(e.target.checked)
                        }
                      />
                    }
                    label="Same as Owner"
                  />
                  {renderContactSection("manager",  isManagerSameAsOwner)}
                </Grid2>

                {/* Invoicing Details  */}
                <Grid2 size={{ xs: 4 }}>
                <h3 style={{ marginBottom : "10px"}}>Invoicing Detail</h3>
                <Stack flexDirection={'row'} spacing={2} justifyContent={'space-between'} alignItems={'center'}>
                <FormControlLabel
                sx={{ marginTop : "0px !important"}}
                control={
                <Checkbox
                checked={isInvoiceSameAsOwner}
                onChange={(e) => {
                const checked = e.target.checked;
                setIsInvoiceSameAsOwner(checked);
                if (checked) setIsInvoiceSameAsManager(false);
                }}
                />
                }
                label="Same as Owner"
                />

                <FormControlLabel
                sx={{ marginTop : "0px !important"}}
                control={
                <Checkbox
                checked={isInvoiceSameAsManager}
                onChange={(e) => {
                const checked = e.target.checked;
                setIsInvoiceSameAsManager(checked);
                if (checked) setIsInvoiceSameAsOwner(false);
                }}
                />
                }
                label="Same as Manager"
                />
                </Stack>

                  {renderContactSection(
                    "invoice",
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
                <CommonButton type="submit" variant="contained" text="Submit" />
                <CommonButton  onClick={cancelBtn} variant="contained" text="Cancel" />
                
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
