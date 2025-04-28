"use client"
import React, { useEffect, } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Grid2 } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import CommonInput from '@/components/CommonInput';
import CommonButton from '@/components/CommonButton';


// Validation Schema
const activitySchema = yup.object().shape({
    typeOfSurvey: yup.string().required("Required"),
    initialOfSurveyors: yup.string().required("Required"),
});

const ActivitiesModal = ({ open, onClose, onSave, defaultValues }) => {
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm({
        resolver: yupResolver(activitySchema),
        defaultValues: { typeOfSurvey: '', initialOfSurveyors: '' }
    });

    useEffect(() => {
        reset(defaultValues || { typeOfSurvey: '', initialOfSurveyors: '' });
    }, [defaultValues, reset]);

    const onSubmit = (data) => {
        onSave(data);
        reset();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{defaultValues ? "Edit Activity" : "Add Activity"}</DialogTitle>
            <DialogContent sx={{minWidth: '50vw'}}>
                <Grid2 container spacing={2} sx={{ mt: 1 }}>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="typeOfSurvey"
                            control={control}
                            render={({ field }) => (
                                <CommonInput {...field} label="Type of survey/Inspection" error={!!errors.typeOfSurvey} helperText={errors.typeOfSurvey?.message} />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="initialOfSurveyors"
                            control={control}
                            render={({ field }) => (
                                <CommonInput {...field} label="Initial of surveyors" error={!!errors.initialOfSurveyors} helperText={errors.surveyors?.message} />
                            )}
                        />
                    </Grid2>
                </Grid2>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <CommonButton text="Cancel" onClick={onClose} variant="outlined" />
                <CommonButton text={defaultValues ? "Update " : "Add"} onClick={handleSubmit(onSubmit)} />
            </DialogActions>
        </Dialog>
    );
};

export default ActivitiesModal