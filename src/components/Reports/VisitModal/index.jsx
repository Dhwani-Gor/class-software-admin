"use client"
import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Grid2 } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import CommonInput from '@/components/CommonInput';
import CommonButton from '@/components/CommonButton';


// Validation Schema
const visitSchema = yup.object().shape({
    date: yup.string().required("Date is required"),
    timeFrom: yup.string().required("Start time is required"),
    timeTo: yup.string().required("End time is required"),
    location: yup.string().required("Location is required"),
});

const VisitModal = ({ open, onClose, onSave, defaultValues }) => {
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm({
        resolver: yupResolver(visitSchema),
        defaultValues: { date: '', timeFrom: '', timeTo: '', location: '' }
    });

    useEffect(() => {
        reset(defaultValues || { date: '', timeFrom: '', timeTo: '', location: '' });
    }, [defaultValues, reset]);

    const onSubmit = (data) => {
        onSave(data);
        reset();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{defaultValues ? "Edit Visit" : "Add Visit"}</DialogTitle>
            <DialogContent>
                <Grid2 container spacing={2} sx={{ mt: 1 }}>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="date"
                            control={control}
                            render={({ field }) => (
                                <CommonInput {...field} type="date" label="Date" error={!!errors.date} helperText={errors.date?.message} />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="timeFrom"
                            control={control}
                            render={({ field }) => (
                                <CommonInput {...field} type="time" label="Time From" error={!!errors.timeFrom} helperText={errors.timeFrom?.message} />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="timeTo"
                            control={control}
                            render={({ field }) => (
                                <CommonInput {...field} type="time" label="Time To" error={!!errors.timeTo} helperText={errors.timeTo?.message} />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="location"
                            control={control}
                            render={({ field }) => (
                                <CommonInput {...field} label="Location" placeholder="Enter location" error={!!errors.location} helperText={errors.location?.message} />
                            )}
                        />
                    </Grid2>
                </Grid2>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <CommonButton text="Cancel" onClick={onClose} variant="outlined" />
                <CommonButton text={defaultValues ? "Update" : "Add"} onClick={handleSubmit(onSubmit)} />
            </DialogActions>
        </Dialog>
    );
};

export default VisitModal