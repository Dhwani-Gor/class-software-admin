"use client";
import React, { useState } from "react";
import { Snackbar, styled } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
//relative path imports
import CommonInput from "@/components/CommonInput";
import CommonButton from "@/components/CommonButton";
import { useDispatch } from "react-redux";
import { login } from "@/redux/slice/authSlice";
import { adminLogin } from "@/api";
import { toast } from "react-toastify";

const MainWrapper = styled(Box)(({ }) => ({
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

const StyledCard = styled(Card)(({ theme }) => ({
  width: "500px",
  padding: theme.spacing(4),
  borderRadius: "16px",
}));

const validationSchema = yup.object().shape({
  email: yup.string().required("Required"),
  password: yup.string().required("Required"),
});

const Login = () => {
  const dispatch = useDispatch();
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "onTouched",
  });

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  const onSubmit = async (data) => {
    try {
      const res = await adminLogin(data);
      if (!res?.data?.data.status)
        toast.error(res?.data?.data?.errorMessage);
      
      dispatch(
        login({
          email: res?.data?.data?.email,
          password: res?.data?.data?.password,
          token: res?.data?.data?.token,...res?.data?.data
        })
      );
      setSnackBar({ open: true, message: res?.data.status });
    } catch (err) {
      console.log("error", err?.response);
      toast.error(err?.response?.data?.errorMessage);
    }
  };

  return (
    <MainWrapper>
      <StyledCard>
        <Typography
          textAlign={"center"}
          variant="h5"
          fontWeight="bold"
          gutterBottom
          sx={{
            textShadow: "2px 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          Class Software Admin
        </Typography>

        <Typography
          textAlign="center"
          variant="body2"
          color="textSecondary"
          mb={3}
        >
          Please enter your login credentials to continue.
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3} mt={4}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <CommonInput
                  {...field}
                  fullWidth
                  label="Username"
                  placeholder="Enter your username"
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <CommonInput
                  {...field}
                  fullWidth
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                />
              )}
            />
          </Stack>
          <Box mt={4}>
            <CommonButton
              sx={{ textTransform: "uppercase" }}
              text="login"
              isLoading={isSubmitting}
              variant="contained"
              fullWidth
              type="submit"
            />
          </Box>
        </form>
      </StyledCard>

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
    </MainWrapper>
  );
};

export default Login;
