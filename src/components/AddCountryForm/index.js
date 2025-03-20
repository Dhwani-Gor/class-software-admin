import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
//relative path imports
import BasicDetailSection from "./BasicDetails";
import VisaDetailSection from "./VisaDetail";
import Documents from "./Documents";
import FAQs from "./FAQs";
import { addCountry, getParticularVisaDetails, updateCountry } from "@/api";
import { Snackbar } from "@mui/material";
import SuccessModal from "./SuccessModal";
import { useDispatch, useSelector } from "react-redux";
import { addCountryInfos } from "@/redux/slice/countrysSlice";

const steps = ["Basic Details", "Visa Details", "Documents", "FAQs"];
const stepKeys = ["basicDetails", "visaDetails", "documents", "faqs"];

const AddCountryForm = ({ mode = "create", visaId = null }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [completedSteps, setCompletedSteps] = useState({});
  const [currentId, setcurrentId] = useState("");
  const dispatch = useDispatch();
  const countryData = useSelector((state) => state.countrys);
  const [isLoading, setIsLoading] = useState(false);
  const [isBack, setIsBack] = useState(false);

  
  useEffect(() => {
    if (countryData.countryDetails) {
      const newCompletedSteps = {};

      if (countryData.countryDetails.basicDetails) newCompletedSteps[0] = true;
      if (countryData.countryDetails.visaDetails) newCompletedSteps[1] = true;
      if (countryData.countryDetails.documents) newCompletedSteps[2] = true;
      if (countryData.countryDetails.faqs?.length > 0)
        newCompletedSteps[3] = true;

      setCompletedSteps(newCompletedSteps);
    }
  }, [countryData]);

  useEffect(() => {
    if (mode !== "update" || !visaId) return;

    const fetchVisaDetails = async () => {
      try {
        const res = await getParticularVisaDetails(visaId);
        const data = res?.data?.data;

        if (!data) return;

        dispatch(
          addCountryInfos({
            type: "basic",
            basicDetail: data.basicDetails,
            countryID: data.id,
          })
        );

        dispatch(
          addCountryInfos({
            type: "visa",
            visaDetail: data.visaDetails,
          })
        );

        dispatch(
          addCountryInfos({
            type: "document",
            document: data.documents,
          })
        );

        dispatch(
          addCountryInfos({
            type: "faq",
            faqs: data.additionalDetails,
          })
        );

        setFormData(data);
      } catch (error) {
        console.error("Error fetching visa details:", error);
      }
    };

    fetchVisaDetails();
  }, [mode, visaId, dispatch]);

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  const onSubmit = async (data) => {
    // const formDataSend = new FormData();
    setIsLoading(true);
    let payloadObj = {
      step: activeStep + 1,
      ...data,
    };

    if (activeStep === 0) {
      payloadObj = { ...payloadObj };
    } else {
      payloadObj = { ...payloadObj, id: currentId };
    }

    const handleAddCountry = async (payloadObj, type, detailKey, mode) => {
      
      const removableFields = ['basicDetails', 'visaDetails', 'documents', 'additionalDetails', 'createdAt', 'updatedAt'];

      removableFields.forEach(field => {
        if (payloadObj?.[field] === null || payloadObj?.[field]) {
          delete payloadObj[field];
        }
      });
      
      if (isBack) {
        payloadObj["id"] = countryData?.countryDetails?.countryId;
      }

      if (mode === "create" && !isBack) {
        await addCountry(payloadObj)
          .then((res) => {
            dispatch(
              addCountryInfos({
                type,
                [detailKey]: payloadObj,
                countryID: !isBack
                  ? res?.data?.data?.id
                  : countryData?.countryDetails?.countryId,
              })
            );
            setcurrentId(res?.data?.data?.id);
            setSnackBar({ open: true, message: res?.data.message });
          })
          .catch((error) => console.log(`error in step for ${type}`, error));
      } else if (mode === "update" || isBack) {
        await updateCountry(
          visaId ?? countryData?.countryDetails?.countryId,
          payloadObj
        )
          .then((res) => {
            dispatch(
              addCountryInfos({
                type,
                [detailKey]: payloadObj,
                countryID: payloadObj?.id,
              })
            );
            setSnackBar({ open: true, message: res?.data.message });
          })
          .catch((error) => console.log("error", error));
      }
    };

    if (mode == "create") {
      let payloadObj = {
        step: activeStep + 1,
        ...data,
      };

      if (activeStep === 0) {
        payloadObj = {
          ...payloadObj,
          expectedTime: String(payloadObj.expectedTime),
        };
        await handleAddCountry(payloadObj, "basic", "basicDetail", mode);
      } else {
        payloadObj = { ...payloadObj, id: currentId };
        switch (activeStep) {
          case 1:
            await handleAddCountry(payloadObj, "visa", "visaDetail", mode);
            break;
          case 2:
            await handleAddCountry(payloadObj, "document", "document", mode);
            break;
          case 3:
            handleAddCountry(payloadObj, "faq", "faqs", mode);
            break;
          default:
            console.log("Invalid step");
        }
      }
    } else if (mode == "update") {
      let payloadObj = {
        id: visaId,
        ...data,
        step: activeStep + 1,
      };

      if (activeStep === 0) {
        payloadObj = {
          ...payloadObj,
          expectedTime: String(payloadObj.expectedTime),
        };
        await handleAddCountry(payloadObj, "basic", "basicDetail", mode);
      } else {
        switch (activeStep) {
          case 1:
            await handleAddCountry(payloadObj, "visa", "visaDetail", mode);
            break;
          case 2:
            await handleAddCountry(payloadObj, "document", "document", mode);
            break;
          case 3:
            handleAddCountry(payloadObj, "faq", "faqs", mode);
            break;
          default:
            console.log("Invalid step");
        }
      }
    }

    setIsLoading(false);
    setFormData((prevData) => ({
      ...prevData,
      [stepKeys[activeStep]]: data,
    }));

    setActiveStep((prevStep) => prevStep + 1);
  };

  const onBack = () => {
    setIsBack(true);
    setActiveStep(activeStep - 1);
  };

  const handleStepClick = (step) => {
    setIsBack(true);
    setActiveStep(step);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <BasicDetailSection
            onSubmit={onSubmit}
            defaultValues={
              {
                ...countryData.countryDetails.basicDetails,
                expectedTime: Number(
                  countryData?.countryDetails.basicDetails?.expectedTime || ""
                ),
              } || formData
            }
            visaId={visaId}
            isLoading={isLoading}
            nextStep={() => setActiveStep((prevStep) => prevStep + 1)}
          />
        );

      case 1:
        return (
          <VisaDetailSection
            onBack={onBack}
            onSubmit={onSubmit}
            defaultValues={countryData.countryDetails.visaDetails || formData}
            visaId={visaId}
            isLoading={isLoading}
            nextStep={() => setActiveStep((prevStep) => prevStep + 1)}
          />
        );

      case 2:
        return (
          <Documents
            onSubmit={onSubmit}
            onBack={onBack}
            defaultValues={countryData.countryDetails.documents || formData}
            visaId={visaId}
            isLoading={isLoading}
            nextStep={() => setActiveStep((prevStep) => prevStep + 1)}
          />
        );

      case 3:
        return (
          <FAQs
            onSubmit={onSubmit}
            onBack={onBack}
            defaultValues={{
              faqs:
                countryData.countryDetails?.faqs?.length > 0
                  ? countryData.countryDetails?.faqs
                  : formData?.faqs?.faqs?.length > 0
                  ? formData?.faqs?.faqs
                  : [{ question: "", answer: "" }],
            }}
            visaId={visaId}
            isLoading={isLoading}
            nextStep={() => setActiveStep((prevStep) => prevStep + 1)}
          />
        );

      default:
        return <SuccessModal />;
    }
  };

  return (
    <Box>
      <Box mt={4}>
        <Stepper alternativeLabel activeStep={activeStep}>
          {steps.map((label, index) => (
            <Step key={label} completed={completedSteps[index] || false}>
              <StepButton
                color="inherit"
                onClick={() => handleStepClick(index)}
              >
                {label}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Box>

      {renderStepContent(activeStep)}

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
    </Box>
  );
};

export default AddCountryForm;
