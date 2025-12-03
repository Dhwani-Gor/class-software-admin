"use client";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { styled } from "@mui/system";
import { Card, Box, Stack, Typography } from "@mui/material";
import CommonInput from "@/components/CommonInput";
import CommonButton from "@/components/CommonButton";
import { resetPassword } from "@/api";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
    newPassword: yup
        .string()
        .required("New password is required")
        .min(6, "Password must be at least 6 characters"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("newPassword"), null], "Passwords must match")
        .required("Confirm password is required"),
});

const ResetPassword = () => {
    const router = useRouter();
    const pathname = usePathname();
    // Example: "/reset-password/eyJhbGciOiJ"
    const token = pathname.split("/reset-password/")[1]; // ✅ Extract token part


    const [isValidToken, setIsValidToken] = useState(true);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(validationSchema),
        mode: "onTouched",
    });

    useEffect(() => {
        if (!token) {
            toast.error("Invalid or missing reset token.");
            setIsValidToken(false);
        }
    }, [token]);

    const onSubmit = async (data) => {
        if (!token) return toast.error("Missing reset token.");

        try {
            const payload = {
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword,
            };

            const res = await resetPassword(token, payload);

            if (res?.data?.status === "success") {
                toast.success("Password has been reset successfully!");
                router.push("/login");
            } else {
                toast.error(res?.data?.message || "Unable to reset password.");
            }
        } catch (err) {
            console.error("Reset password error:", err);
            toast.error(err?.response?.data?.message || "Something went wrong.");
        }
    };

    if (!isValidToken) {
        return (
            <MainWrapper>
                <Typography color="error" variant="h6">
                    Invalid or expired reset link.
                </Typography>
            </MainWrapper>
        );
    }

    return (
        <MainWrapper>
            <StyledCard>
                <Typography
                    textAlign="center"
                    variant="h5"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ textShadow: "2px 2px 8px rgba(0, 0, 0, 0.1)" }}
                >
                    Reset Password
                </Typography>

                <Typography
                    textAlign="center"
                    variant="body2"
                    color="textSecondary"
                    mb={3}
                >
                    Please enter your new password below.
                </Typography>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack spacing={3} mt={3}>
                        <Controller
                            name="newPassword"
                            control={control}
                            render={({ field }) => (
                                <CommonInput
                                    {...field}
                                    fullWidth
                                    label="New Password"
                                    type="password"
                                    placeholder="Enter new password"
                                    error={Boolean(errors.newPassword)}
                                    helperText={errors.newPassword?.message}
                                />
                            )}
                        />

                        <Controller
                            name="confirmPassword"
                            control={control}
                            render={({ field }) => (
                                <CommonInput
                                    {...field}
                                    fullWidth
                                    label="Confirm Password"
                                    type="password"
                                    placeholder="Confirm new password"
                                    error={Boolean(errors.confirmPassword)}
                                    helperText={errors.confirmPassword?.message}
                                />
                            )}
                        />
                    </Stack>

                    <Box mt={4}>
                        <CommonButton
                            text="Reset Password"
                            type="submit"
                            fullWidth
                            isLoading={isSubmitting}
                            variant="contained"
                        />
                    </Box>
                </form>
            </StyledCard>
        </MainWrapper>
    );
};

export default ResetPassword;
