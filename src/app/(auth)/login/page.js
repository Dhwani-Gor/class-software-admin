"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { styled } from "@mui/system";
import { Card, Box, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CommonInput from "@/components/CommonInput";
import CommonButton from "@/components/CommonButton";
import { adminLogin, forgotPassword } from "@/api"; // ← add forgotPassword API
import { useAuth } from "@/hooks/useAuth";
import { useDispatch } from "react-redux";
import { saveUserInfo } from "@/redux/slice/authSlice";
import { toast } from "react-toastify";

const MainWrapper = styled(Box)(() => ({
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

const forgotSchema = yup.object().shape({
  usernameOrEmail: yup.string().required("Username or Email is required"),
});

const Login = () => {
  const { login } = useAuth();
  const dispatch = useDispatch();

  const [openForgot, setOpenForgot] = useState(false);

  // main login form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "onTouched",
  });

  // forgot password form
  const {
    control: forgotControl,
    handleSubmit: handleForgotSubmit,
    reset: resetForgotForm,
    formState: { errors: forgotErrors, isSubmitting: isForgotSubmitting },
  } = useForm({
    resolver: yupResolver(forgotSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data) => {
    try {
      const res = await adminLogin(data);
      if (res?.data?.data?.permissionModule?.length === 0) {
        return toast.error("You don't have access to any module");
      }

      if (res?.response?.data?.status === "error") {
        return toast.error(res?.response?.data?.message);
      }

      dispatch(saveUserInfo(res?.data?.data));
      login(res?.data?.data);
      toast.success("Login successful");
    } catch (err) {
      console.error("error", err);
      toast.error(err?.response?.data?.message || "Login failed");
    }
  };

  const onForgotSubmit = async (data) => {
    console.log(data, "dtaa");
    try {
      const res = await forgotPassword({ email: data.usernameOrEmail });
      if (res?.data?.status === "success") {
        toast.success("Password reset link sent to your registered email.");
        resetForgotForm();
        setOpenForgot(false);
      } else {
        toast.error(res?.data?.message || "Unable to send reset link");
      }
    } catch (err) {
      console.error("forgot error", err);
      toast.error(err?.response?.data?.message || "Failed to process request");
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

        <Typography textAlign="center" variant="body2" color="textSecondary" mb={3}>
          Please enter your login credentials to continue.
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3} mt={4}>
            <Controller name="username" control={control} render={({ field }) => <CommonInput {...field} fullWidth label="Username" placeholder="Enter your username" error={Boolean(errors.username)} helperText={errors.username?.message} />} />
            <Controller name="password" control={control} render={({ field }) => <CommonInput {...field} fullWidth label="Password" type="password" autoComplete="off" placeholder="Enter your password" error={Boolean(errors.password)} helperText={errors.password?.message} />} />
          </Stack>

          <Box mt={2} textAlign="right">
            <Typography
              variant="body2"
              sx={{
                cursor: "pointer",
                color: "primary.main",
                fontWeight: 500,
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={() => setOpenForgot(true)}
            >
              Forgot Password?
            </Typography>
          </Box>

          <Box mt={4}>
            <CommonButton sx={{ textTransform: "uppercase" }} text="Login" isLoading={isSubmitting} variant="contained" fullWidth type="submit" />
          </Box>
        </form>
      </StyledCard>

      {/* Forgot Password Dialog */}
      <Dialog open={openForgot} onClose={() => setOpenForgot(false)} maxWidth="xs">
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Forgot Password
          <IconButton onClick={() => setOpenForgot(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Enter your username or registered email address. We’ll send you a password reset link.
          </Typography>
          <form id="forgotForm" onSubmit={handleForgotSubmit(onForgotSubmit)}>
            <Controller name="usernameOrEmail" control={forgotControl} render={({ field }) => <CommonInput {...field} fullWidth label="Username or Email" placeholder="Enter your username or email" error={Boolean(forgotErrors.usernameOrEmail)} helperText={forgotErrors.usernameOrEmail?.message} />} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <CommonButton text="Cancel" variant="outlined" onClick={() => setOpenForgot(false)} />
          <CommonButton text="Send Reset Link" type="submit" form="forgotForm" isLoading={isForgotSubmitting} variant="contained" />
        </DialogActions>
      </Dialog>
    </MainWrapper>
  );
};

export default Login;
