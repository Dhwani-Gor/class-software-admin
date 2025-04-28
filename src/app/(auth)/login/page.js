"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Snackbar from "@mui/material/Snackbar";
import { styled } from "@mui/system";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CommonInput from "@/components/CommonInput";
import CommonButton from "@/components/CommonButton";
import { adminLogin } from "@/api";
import { useAuth } from "@/hooks/useAuth";

const MainWrapper = styled(Box)(({}) => ({
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
  username: yup.string().required("Required"),
  password: yup.string().required("Required"),
});

const Login = () => {
  const { login } = useAuth();
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
      if (!res?.data?.data?.status) {
        setSnackBar({ open: true, message: res?.response?.data?.message });
      }
      login(res?.data?.data);
      setSnackBar({ open: true, message: res?.data.status });
    } catch (err) {
      console.log("error", err);
      setSnackBar({ open: true, message: response?.data?.message });
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
              name="username"
              control={control}
              render={({ field }) => (
                <CommonInput
                  {...field}
                  fullWidth
                  label="Username"
                  placeholder="Enter your username"
                  error={Boolean(errors.username)}
                  helperText={errors.username?.message}
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
