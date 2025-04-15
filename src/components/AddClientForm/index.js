// import React, { useEffect, useState } from "react";
// import Box from "@mui/material/Box";
// import {
//   addInspectors,
//   getInspectorsDetails,
//   updateInspectorDetail,
// } from "@/api";
// import {
//   CircularProgress,
//   FormControl,
//   FormControlLabel,
//   FormHelperText,
//   FormLabel,
//   Grid2,
//   Paper,
//   Radio,
//   RadioGroup,
//   Snackbar,
//   Stack,
// } from "@mui/material";
// // import SuccessModal from "./SuccessModal";
// import { useDispatch, useSelector } from "react-redux";
// import { addCountryInfos } from "@/redux/slice/countrysSlice";
// import { Controller, useForm } from "react-hook-form";
// import CommonInput from "../CommonInput";
// import CommonButton from "../CommonButton";
// import * as yup from "yup";
// import { yupResolver } from "@hookform/resolvers/yup";
// import { useRouter } from "next/navigation";

// const schema = yup.object().shape({
//   shipName: yup.string().required("Ship Name is required"),
//   imoNumber: yup.string().required("Imo Number is required"),
//   classId: yup.string().required("Class Id is required"),
//   nameOfCompany: yup.string().required("Company Name is required"),
//   completeAdress: yup.string().required("Complete Adress is required"),
//   phoneNo: yup
//   .string()
//   .required("Phone number is required")
//   .matches(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
//   email: yup
//   .string()
//   .required("Email is required")
//   .email("Enter a valid email"),
//   tax: yup.string().required("TRN / VAT / GST No. is required"),
// });

// const AddClientForm = ({
//   mode = "create",
//   clientId = null,
//   defaultValues = {},
// }) => {
//   const [formData, setFormData] = useState({});
//   const [snackBar, setSnackBar] = useState({ open: false, message: "" });
//   const [isDataLoading, setIsDataLoading] = useState(false);
//   const dispatch = useDispatch();
//   const router = useRouter();
//   const {
//     control,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     getValues,
//   } = useForm({
//     resolver: yupResolver(schema),
//     defaultValues: defaultValues || {
//       shipName: "",
//       imoNumber: "",
//       classId: "",
//       nameOfCompany: "",
//       completeAdress: "",
//       phoneNo: "",
//       email: "",

//     },
//   });

//   const objRole = {
//     1: "admin",
//     2: "staff",
//     3: "customer",
//   };

//   useEffect(() => {
//     if (mode !== "update" || !clientId) return;

//     const fetchUserDetails = async () => {
//       try {
//         const res = await getInspectorsDetails(clientId);
//         const data = res?.data?.data;

//         if (!data) return;

//         setFormData(data);
//         setValue("shipName", data?.shipName);
//         setValue("imoNumber", data?.imoNumber);
//         setValue("classId", data?.classId);
//         setValue("nameOfCompany", data?.nameOfCompany);
//         setValue("completeAdress", data?.completeAdress);
//         setValue("phoneNo", data?.phoneNo);
//         setValue("email", data?.email);

//       } catch (error) {
//         console.error("Error fetching visa details:", error);
//       }
//     };

//     fetchUserDetails();
//   }, [mode, clientId]);

//   const snackbarClose = () => {
//     setSnackBar({ open: false, message: "" });
//   };

//   const onSubmit = async (data) => {
//     // console.log(data, "data");

//     console.log("data", data);
//     // let payload = {
//     //   name: data?.shipName,
//     //   roleId: data?.role,
//     //   email: data?.clientEmail,
//     //   password: data?.clientPassword,
//     //   clientDesignation: data?.clientDesignation,
//     //   companyName: data?.companyName,
//     //   // ...data,
//     // };

//     // if (mode === "create") {
//     //   // const handleSubmitInspectors = async (payload) => {
//     //   await addInspectors(payload)
//     //     .then((res) => {
//     //       console.log("res", res);
//     //       console.log("res 22", res?.response?.data?.message);
//     //       if (res?.status === 400) {
//     //         setSnackBar({ open: true, message: res?.data.message });
//     //       } else {
//     //         router.push("/clients/");
//     //       }
//     //     })
//     //     .catch((error) => {
//     //       console.log("error", error);
//     //     });
//     //   setIsDataLoading(false);
//     // } else if (mode === "update" && clientId) {
//     //   await updateInspectorDetail(clientId, payload)
//     //     .then((res) => {
//     //       if (res?.status === 400) {
//     //         setSnackBar({ open: true, message: res?.data.message });
//     //       } else {
//     //         router.push("/clients/");
//     //       }
//     //     })
//     //     .catch((error) => {
//     //       console.log("error", error);
//     //     });
//     //   setIsDataLoading(false);
//     // }
//   };

//   return (
//     <Box>
//       {isDataLoading ? (
//         <Box
//           display="flex"
//           justifyContent="center"
//           alignItems="center"
//           sx={{ height: 300 }}
//         >
//           <CircularProgress />
//         </Box>
//       ) : (
//         <>
//           <Stack mt={4} spacing={4}>
//             <Paper sx={{ padding: "20px", borderRadius: "15px" }}>
//               <form onSubmit={handleSubmit(onSubmit)}>
//                 <Grid2 container spacing={3}>
//                   <Grid2 size={{ xs: 4 }}>
//                     <Controller
//                       name="shipName"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             label={
//                               <span>
//                                 Ship Name{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Enter Ship Name"
//                             error={Boolean(errors.shipName)}
//                             helperText={errors.shipName?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                   </Grid2>

//                   <Grid2 size={{ xs: 4 }}>
//                     <Controller
//                       name="imoNumber"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             label={
//                               <span>
//                                 Imo Number <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Enter Imo Number"
//                             error={Boolean(errors.imoNumber)}
//                             helperText={errors.imoNumber?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                   </Grid2>

//                   <Grid2 size={{ xs: 4 }}>
//                     <Controller
//                       name="classId"
//                       control={control}
//                       render={({ field }) => (
//                         <CommonInput
//                           {...field}
//                           fullWidth
//                           variant="standard"
//                           label={
//                             <span>
//                               Class Id <span style={{ color: "red" }}>*</span>
//                             </span>
//                           }
//                           placeholder="Enter Class Id"
//                           error={Boolean(errors.classId)}
//                           helperText={errors.classId?.message}

//                           InputProps={{
//                             style: { color: "black" },
//                           }}
//                         />
//                       )}
//                     />
//                   </Grid2>


//                   <Grid2  size={{ xs: 4 } }>
//                     <h2>Owner's Detail</h2>
//                     <Controller
//                       name="nameOfCompany"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             label={
//                               <span>
//                                 Name of the company{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Company Name"
//                             error={Boolean(errors.nameOfCompany)}
//                             helperText={errors.nameOfCompany?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                     <Controller
//                       name="completeAdress"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             label={
//                               <span>
//                                 Complete Address{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Enter Complete Address"
//                             error={Boolean(errors.completeAdress)}
//                             helperText={errors.completeAdress?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                     <Controller
//                       name="phoneNo"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             type="number"
//                             label={
//                               <span>
//                                 Phone Number{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Enter Phone Number"
//                             error={Boolean(errors.phoneNo)}
//                             helperText={errors.phoneNo?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                     <Controller
//                       name="email"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             type="email"
//                             label={
//                               <span>
//                                 Email{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Enter Email Adress"
//                             error={Boolean(errors.email)}
//                             helperText={errors.email?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                   </Grid2>
//                   <Grid2  size={{ xs: 4 } }>
//                     <h2>Manager's Detail</h2>
//                     <Controller
//                       name="nameOfCompany"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             label={
//                               <span>
//                                 Name of the company{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Company Name"
//                             error={Boolean(errors.nameOfCompany)}
//                             helperText={errors.nameOfCompany?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                     <Controller
//                       name="completeAdress"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             label={
//                               <span>
//                                 Complete Address{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Enter Complete Address"
//                             error={Boolean(errors.completeAdress)}
//                             helperText={errors.completeAdress?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                     <Controller
//                       name="phoneNo"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             type="number"
//                             label={
//                               <span>
//                                 Phone Number{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Enter Phone Number"
//                             error={Boolean(errors.phoneNo)}
//                             helperText={errors.phoneNo?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                     <Controller
//                       name="email"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             type="email"
//                             label={
//                               <span>
//                                 Email{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Enter Email Adress"
//                             error={Boolean(errors.email)}
//                             helperText={errors.email?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                   </Grid2>
//                   <Grid2  size={{ xs: 4 } }>
//                     <h2>Invoicing Detail</h2>
//                     <Controller
//                       name="nameOfCompany"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             label={
//                               <span>
//                                 Name of the company{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Company Name"
//                             error={Boolean(errors.nameOfCompany)}
//                             helperText={errors.nameOfCompany?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                     <Controller
//                       name="completeAdress"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             label={
//                               <span>
//                                 Complete Address{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Enter Complete Address"
//                             error={Boolean(errors.completeAdress)}
//                             helperText={errors.completeAdress?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                     <Controller
//                       name="phoneNo"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             type="number"
//                             label={
//                               <span>
//                                 Phone Number{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Enter Phone Number"
//                             error={Boolean(errors.phoneNo)}
//                             helperText={errors.phoneNo?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                     <Controller
//                       name="email"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             type="email"
//                             label={
//                               <span>
//                                 Email{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Enter Email Adress"
//                             error={Boolean(errors.email)}
//                             helperText={errors.email?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                     <Controller
//                       name="tax"
//                       control={control}
//                       render={({ field }) => {
//                         return (
//                           <CommonInput
//                             {...field}
//                             fullWidth
//                             variant="standard"
//                             label={
//                               <span>
//                                 TRN / VAT / GST No.{" "}
//                                 <span style={{ color: "red" }}>*</span>
//                               </span>
//                             }
//                             placeholder="Enter TRN / VAT / GST No."
//                             error={Boolean(errors.tax)}
//                             helperText={errors.tax?.message}
//                             InputProps={{
//                               style: { color: "black" },
//                             }}
//                           />
//                         );
//                       }}
//                     />
//                   </Grid2>

//                 </Grid2>

//                 <Stack
//                   mt={4}
//                   spacing={2}
//                   direction="row"
//                   justifyContent="flex-start"
//                 >
//                   <CommonButton
//                     type="submit"
//                     variant="contained"
//                     text="Submit"
//                   />
//                 </Stack>
//               </form>

//               <Snackbar
//                 open={snackBar.open}
//                 autoHideDuration={2000}
//                 message={snackBar.message}
//                 anchorOrigin={{
//                   vertical: "top",
//                   horizontal: "center",
//                 }}
//                 onClose={snackbarClose}
//                 className="snackBarColor"
//                 key="snackbar"
//               />
//             </Paper>
//           </Stack>
//         </>
//       )}
//     </Box>
//   );
// };

// export default AddClientForm;







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
  imoNumber: yup.string().required("Imo Number is required"),
  classId: yup.string().required("Class Id is required"),
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
    tax: yup.string().required("TRN / VAT / GST No. is required"),
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
  }, [isManagerSameAsOwner, isInvoiceSameAsOwner]);

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
              label="TRN / VAT / GST No. *"
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
                        label="IMO Number *"
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
                        label="Class ID *"
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
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isInvoiceSameAsOwner}
                        onChange={(e) =>
                          setIsInvoiceSameAsOwner(e.target.checked)
                        }
                      />
                    }
                    label="Same as Owner"
                  />
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
