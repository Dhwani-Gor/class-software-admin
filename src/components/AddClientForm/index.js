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
import CommonInput from "../CommonInput";
import CommonButton from "../CommonButton";
import { createClient, getSpecificClient, updateClient } from "@/api";

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
}) => {
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const ownerDetails = getValues("ownerDetails");
    const managerDetails = getValues("managerDetails");

    if (isManagerSameAsOwner) {
      setValue("managerDetails", { ...ownerDetails });
      clearErrors('managerDetails.companyAddress');
      clearErrors("managerDetails.email")
      clearErrors("managerDetails.nameOfCompany")
      clearErrors('managerDetails.phoneNumber')
    }

    if (isInvoiceSameAsOwner) {
      setValue("invoicingDetails", {
        ...ownerDetails,
        gstNo: getValues("invoicingDetails.gstNo"),
      });
      clearErrors('invoicingDetails');
      clearErrors('invoicingDetails.companyAddress');
      clearErrors("invoicingDetails.email")
      clearErrors("invoicingDetails.nameOfCompany")
      clearErrors('invoicingDetails.phoneNumber')

    }

    if (isInvoiceSameAsManager) {
      setValue("invoicingDetails", {
        ...managerDetails,
        gstNo: getValues("invoicingDetails.gstNo"),
      });
      clearErrors('invoicingDetails');
      clearErrors('invoicingDetails.companyAddress');
      clearErrors("invoicingDetails.email")
      clearErrors("invoicingDetails.nameOfCompany")
      clearErrors('invoicingDetails.phoneNumber')

    }

  }, [isManagerSameAsOwner, isInvoiceSameAsOwner, isInvoiceSameAsManager]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const result = await getSpecificClient(clientId);
      if (result?.status === 200) {
        reset(result.data.data)
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
  }, [clientId])

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  const onSubmit = async (data) => {
    try {
      if (clientId) {
        const res = await updateClient(clientId, data);

        if (res?.data.status === "success" && res?.data?.url) {
          toast.success("Client created successfully");
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
        name={`${sectionKey}.companyAddress`}
        control={control}
        render={({ field }) => (
          <CommonInput
            {...field}
            fullWidth
            variant="standard"
            label="Complete Address *"
            placeholder="Enter Complete Address"
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
            error={Boolean(errors?.[sectionKey]?.phoneNumber)}
            helperText={errors?.[sectionKey]?.phoneNumber?.message}
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
      {sectionKey == "invoicingDetails" ? (
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
              error={Boolean(errors?.invoicingDetails?.gstNo)}
              helperText={errors?.invoicingDetails?.gstNo?.message}
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
                        onChange={(e) =>
                          setIsManagerSameAsOwner(e.target.checked)
                        }
                      />
                    }
                    label="Same as Owner"
                  />
                  {renderContactSection("managerDetails", isManagerSameAsOwner)}
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
                            const checked = e.target.checked;
                            setIsInvoiceSameAsOwner(checked);
                            if (checked) setIsInvoiceSameAsManager(false);
                          }}
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
                    "invoicingDetails",
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
                <CommonButton onClick={cancelBtn} variant="contained" text="Cancel" />

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
