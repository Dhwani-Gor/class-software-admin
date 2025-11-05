import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import Paper from "@mui/material/Paper";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Grid2";
import { toast } from "react-toastify";
import Snackbar from "@mui/material/Snackbar";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CommonInput from "../CommonInput";
import CommonButton from "../CommonButton";
import { createClient, getSpecificClient, searchinvoicing_detail, searchmanager_detail, searchowner_detail, updateClient } from "@/api";
import { Accordion, AccordionDetails, AccordionSummary, Typography, IconButton, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, MenuItem } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const requiredFields = ["shipName", "imoNumber", "classId", "flag", "portOfRegistry", "grossTonnage", "netTonnage", "lengthOfShip", "shipBuilder", "countryOfBuild", "dateOfBuild", "callSign", "officialNo", "deadweight", "typeOfShip", "dateOfDelivery"];

const renderLabel = (field) => {
  const labelText = field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <Typography fontStyle="italic">{labelText}</Typography>
      {requiredFields.includes(field) && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
    </span>
  );
};

const schema = yup.object().shape({
  shipName: yup.string().required("Ship Name is required"),
  imoNumber: yup.string().required("IMO number is required"),
  classId: yup.string().required("Class Id is required"),
  flag: yup.string().required("Flag is required"),
  portOfRegistry: yup.string().required("Port of Registry is required"),
  grossTonnage: yup.string().required("Gross Tonnage is required"),
  netTonnage: yup.string().required("Net Tonnage is required"),
  lengthOfShip: yup.string().required("Length of Ship is required"),
  shipBuilder: yup.string().required("Ship Builder is required"),
  countryOfBuild: yup.string().required("Country of Build is required"),
  dateOfBuild: yup.string().required("Date of Build is required"),
  keelLaidDate: yup.string(),
  callSign: yup.string().required("Call Sign is required"),
  officialNo: yup.string().required("Official Number is required"),
  deadweight: yup.number().required("Dead weight is required"),
  dateOfModification: yup.string(),
  typeOfShip: yup.string().required("Type of Ship required"),
  dateOfBuildingContract: yup.string(),
  dateOfDelivery: yup.string().required("Date of Delivery required"),
  areaOfOperation: yup.string(),
  carryingCapacity: yup.string(),
  classSymbol: yup.string().notRequired(),
  hullNotation: yup.string().optional(),
  machineryNotation: yup.string().optional(),
  descriptiveNotation: yup.string().optional(),
  ownerDetails: yup.object().shape({
    nameOfCompany: yup.string().required("Company Name is required"),
    companyAddress: yup.string().required("Complete Address is required"),
    phoneNumber: yup.string().optional(),
    email: yup.string().optional().email("Invalid email"),
    imoNumber: yup.string().optional(),
  }),
  managerDetails: yup.object().shape({
    nameOfCompany: yup.string().required("Company Name is required"),
    companyAddress: yup.string().required("Complete Address is required"),
    phoneNumber: yup.string().optional(),
    email: yup.string().optional().email("Invalid email"),
    imoNumber: yup.string().optional(),
  }),
  invoicingDetails: yup.object().shape({
    nameOfCompany: yup.string().required("Company Name is required"),
    companyAddress: yup.string().required("Complete Address is required"),
    phoneNumber: yup.string().optional(),
    email: yup.string().optional().email("Invalid email"),
  }),
});

const AddSurveyType = ({ mode = "create", clientId = null, defaultValues = {}, editingAllowed = true, editReason = "" }) => {
  const [loading, setLoading] = useState(false);
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isManagerSameAsOwner, setIsManagerSameAsOwner] = useState(false);
  const [isInvoiceSameAsOwner, setIsInvoiceSameAsOwner] = useState(false);
  const [isInvoiceSameAsManager, setIsInvoiceSameAsManager] = useState(false);
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [ownerInputValue, setOwnerInputValue] = useState("");
  const [managerOptions, setManagerOptions] = useState([]);
  const [managerInputValue, setManagerInputValue] = useState("");
  const [isSearching, setIsSearching] = useState({
    owner: false,
    manager: false,
    invoicing: false,
  });
  const [invoicingOptions, setInvoicingOptions] = useState([]);
  const [invoicingInputValue, setInvoicingInputValue] = useState("");
  const [shipName, setShipName] = useState("");

  // Class History State
  const [classHistory, setClassHistory] = useState([{ shipStatus: "", reason: "", remarks: "", from_date: "", to_date: "" }]);

  // Machine List State
  const [machineList, setMachineList] = useState({
    main_engine_model: "",
    no_of_engines: "",
    total_power: null,
    engine_builder: "",
    engine_built: null,
    propeller: "",
    electrical_installation: "",
    boilers: "",
    speed_knots: null,
    rpm: null,
  });

  const [manuallyEditedManager, setManuallyEditedManager] = useState(false);
  const [manuallyEditedInvoice, setManuallyEditedInvoice] = useState(false);

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
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      shipName: "",
      imoNumber: "",
      classId: "",
      flag: "",
      portOfRegistry: "",
      grossTonnage: "",
      netTonnage: "",
      lengthOfShip: "",
      shipBuilder: "",
      countryOfBuild: "",
      dateOfBuild: "",
      keelLaidDate: "",
      callSign: "",
      officialNo: "",
      deadweight: "",
      dateOfModification: "",
      typeOfShip: "",
      dateOfBuildingContract: "",
      dateOfDelivery: "",
      areaOfOperation: "",
      carryingCapacity: "",
      classSymbol: "",
      hullNotation: "",
      machineryNotation: "",
      descriptiveNotation: "",
      machineList: {
        main_engine_model: "",
        no_of_engines: "",
        total_power: null,
        engine_builder: "",
        engine_built: null,
        propeller: "",
        electrical_installation: "",
        boilers: "",
        speed_knots: null,
        rpm: null,
      },
      classHistory: [{ shipStatus: "", reason: "", remarks: "", from_date: "", to_date: "" }],
      ownerDetails: {
        nameOfCompany: "",
        companyAddress: "",
        phoneNumber: "",
        email: "",
        imoNumber: "",
      },
      managerDetails: {
        nameOfCompany: "",
        companyAddress: "",
        phoneNumber: "",
        email: "",
        imoNumber: "",
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

  const handleAddRow = () => {
    setClassHistory([...classHistory, { shipStatus: "", reason: "", remarks: "", from_date: "", to_date: "" }]);
  };

  const handleDeleteRow = (index) => {
    setClassHistory(classHistory.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const ownerDetails = getValues("ownerDetails");
    const managerDetails = getValues("managerDetails");
    const invoicingDetails = getValues("invoicingDetails");
    if (isManagerSameAsOwner && ownerDetails) {
      setValue("managerDetails", { ...ownerDetails });
      clearErrors("managerDetails.companyAddress");
      clearErrors("managerDetails.email");
      clearErrors("managerDetails.nameOfCompany");
      clearErrors("managerDetails.phoneNumber");
      setManuallyEditedManager(false);
    }

    if (isInvoiceSameAsOwner && ownerDetails) {
      setValue("invoicingDetails", {
        ...ownerDetails,
        gstNo: getValues("invoicingDetails.gstNo") || "",
      });
      clearErrors("invoicingDetails");
      clearErrors("invoicingDetails.companyAddress");
      clearErrors("invoicingDetails.email");
      clearErrors("invoicingDetails.nameOfCompany");
      clearErrors("invoicingDetails.phoneNumber");
      setManuallyEditedInvoice(false);
    }

    if (isInvoiceSameAsManager && managerDetails) {
      setValue("invoicingDetails", {
        ...managerDetails,
        gstNo: getValues("invoicingDetails.gstNo") || "",
      });
      clearErrors("invoicingDetails");
      clearErrors("invoicingDetails.companyAddress");
      clearErrors("invoicingDetails.email");
      clearErrors("invoicingDetails.nameOfCompany");
      clearErrors("invoicingDetails.phoneNumber");
      setManuallyEditedInvoice(false);
    }
  }, [isManagerSameAsOwner, isInvoiceSameAsOwner, isInvoiceSameAsManager, setValue, getValues, clearErrors]);

  const ownerDetail = watch("ownerDetails");
  useEffect(() => {
    if (isManagerSameAsOwner && !manuallyEditedManager && ownerDetail) {
      setValue("managerDetails", { ...ownerDetail });
    }

    if (isInvoiceSameAsOwner && !manuallyEditedInvoice && ownerDetail) {
      setValue("invoicingDetails", {
        ...ownerDetail,
        gstNo: getValues("invoicingDetails.gstNo") || "",
      });
    }
  }, [ownerDetail, isManagerSameAsOwner, isInvoiceSameAsOwner, setValue, getValues, manuallyEditedManager, manuallyEditedInvoice]);

  const managerDetail = watch("managerDetails");
  useEffect(() => {
    if (isInvoiceSameAsManager && !manuallyEditedInvoice && managerDetail) {
      setValue("invoicingDetails", {
        ...managerDetail,
        gstNo: getValues("invoicingDetails.gstNo") || "",
      });
    }
  }, [managerDetail, isInvoiceSameAsManager, setValue, getValues, manuallyEditedInvoice]);

  const normalizeValue = (value, defaultValue = "") => {
    return value === null || value === undefined ? defaultValue : value;
  };

  const normalizeClientData = (data) => {
    const normalized = {
      ...data,
      dateOfBuild: normalizeValue(data.dateOfBuild),
      keelLaidDate: normalizeValue(data.keelLaidDate),
      dateOfModification: normalizeValue(data.dateOfModification),
      dateOfBuildingContract: normalizeValue(data.dateOfBuildingContract),
      dateOfDelivery: normalizeValue(data.dateOfDelivery),
      callSign: normalizeValue(data.callSign),
      officialNo: normalizeValue(data.officialNo),
      deadweight: normalizeValue(data.deadweight),
      areaOfOperation: normalizeValue(data.areaOfOperation),
      carryingCapacity: normalizeValue(data.carryingCapacity),
      hullNotation: normalizeValue(data.hullNotation),
      machineryNotation: normalizeValue(data.machineryNotation),
      descriptiveNotation: normalizeValue(data.descriptiveNotation),

      // Nested fields
      ownerDetails: {
        nameOfCompany: normalizeValue(data.ownerDetails?.companyName),
        companyAddress: normalizeValue(data.ownerDetails?.companyAddress),
        phoneNumber: normalizeValue(data.ownerDetails?.phoneNumber),
        email: normalizeValue(data.ownerDetails?.email),
        imoNumber: normalizeValue(data.ownerDetails?.imoNumber),
      },
      managerDetails: {
        nameOfCompany: normalizeValue(data.managerDetails?.companyName),
        companyAddress: normalizeValue(data.managerDetails?.companyAddress),
        phoneNumber: normalizeValue(data.managerDetails?.phoneNumber),
        email: normalizeValue(data.managerDetails?.email),
        imoNumber: normalizeValue(data.managerDetails?.imoNumber),
      },
      invoicingDetails: {
        nameOfCompany: normalizeValue(data.invoicingDetails?.companyName),
        companyAddress: normalizeValue(data.invoicingDetails?.companyAddress),
        phoneNumber: normalizeValue(data.invoicingDetails?.phoneNumber),
        email: normalizeValue(data.invoicingDetails?.email),
        gstNo: normalizeValue(data.invoicingDetails?.gstNo),
      },
    };

    // Format date fields
    const dateFields = ["dateOfBuild", "keelLaidDate", "dateOfModification", "dateOfBuildingContract", "dateOfDelivery"];
    dateFields.forEach((field) => {
      if (normalized[field]) {
        try {
          const date = new Date(normalized[field]);
          if (!isNaN(date.getTime())) {
            normalized[field] = date.toISOString().split("T")[0];
          }
        } catch (e) {
          console.error(`Error formatting date for ${field}:`, e);
        }
      }
    });

    return normalized;
  };

  const fetchClient = async () => {
    try {
      const result = await getSpecificClient(clientId);
      if (result?.status === 200 && result.data?.data) {
        const normalizedData = normalizeClientData(result.data.data);

        setShipName(normalizedData.shipName);
        reset(normalizedData);
        setOwnerInputValue(normalizedData.ownerDetails.nameOfCompany);

        setValue("ownerDetails.nameOfCompany", normalizedData.ownerDetails.nameOfCompany);
        setValue("managerDetails.nameOfCompany", normalizedData.managerDetails.nameOfCompany);
        setValue("invoicingDetails.nameOfCompany", normalizedData.invoicingDetails.nameOfCompany);

        if (result.data.data.classHistory && Array.isArray(result.data.data.classHistory)) {
          const loadedHistory = result.data.data.classHistory.map((item) => ({
            shipStatus: normalizeValue(item.shipStatus),
            reason: normalizeValue(item.reason),
            remarks: normalizeValue(item.remarks),
            from_date: normalizeValue(item.from_date),
            to_date: normalizeValue(item.to_date),
          }));
          setClassHistory(loadedHistory);
          // const defaultStatuses = ["Class", "Withdrawn", "Re-classed"];
          // const mergedHistory = defaultStatuses.map((status, index) => {
          //   const existing = loadedHistory.find((h) => h.shipStatus === status);
          //   return (
          //     existing || {
          //       shipStatus: status,
          //       reason: "",
          //       remarks: "",
          //       from_date: "",
          //       to_date: "",
          //     }
          //   );
          // });
          // setClassHistory(mergedHistory);
        }

        if (result.data.data.machineList) {
          setMachineList({
            main_engine_model: normalizeValue(result.data.data.machineList.main_engine_model),
            no_of_engines: normalizeValue(result.data.data.machineList.no_of_engines),
            total_power: normalizeValue(result.data.data.machineList.total_power),
            engine_builder: normalizeValue(result.data.data.machineList.engine_builder),
            engine_built: normalizeValue(result.data.data.machineList.engine_built),
            propeller: normalizeValue(result.data.data.machineList.propeller),
            electrical_installation: normalizeValue(result.data.data.machineList.electrical_installation),
            boilers: normalizeValue(result.data.data.machineList.boilers),
            speed_knots: normalizeValue(result.data.data.machineList.speed_knots),
            rpm: normalizeValue(result.data.data.machineList.rpm),
          });
        }
      } else {
        toast.error("Something went wrong! Please try again after some time");
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error("Error fetching client data");
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  const handleOwnerSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === "") {
      setOwnerOptions([]);
      return;
    }

    setIsSearching((prev) => ({ ...prev, owner: true }));
    try {
      const result = await searchowner_detail(searchQuery);
      if (result?.status === 200 && result?.data) {
        setOwnerOptions(
          (result.data.data || []).map((item) => ({
            label: item.companyName,
            value: item.companyName,
            ...item,
          }))
        );
      } else {
        setOwnerOptions([]);
      }
    } catch (error) {
      console.error("Error searching owner details:", error);
      setOwnerOptions([]);
    } finally {
      setIsSearching((prev) => ({ ...prev, owner: false }));
    }
  };

  const handleManagerSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === "") {
      setManagerOptions([]);
      return;
    }

    setIsSearching((prev) => ({ ...prev, manager: true }));
    try {
      const result = await searchmanager_detail(searchQuery);
      if (result?.status === 200 && result?.data) {
        setManagerOptions(
          (result.data.data || []).map((item) => ({
            label: item.companyName,
            value: item.companyName,
            ...item,
          }))
        );
      } else {
        setManagerOptions([]);
      }
    } catch (error) {
      console.error("Error searching manager details:", error);
      setManagerOptions([]);
    } finally {
      setIsSearching((prev) => ({ ...prev, manager: false }));
    }
  };

  const handleInvoicingSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === "") {
      setInvoicingOptions([]);
      return;
    }
    setIsSearching((prev) => ({ ...prev, invoicing: true }));
    try {
      const result = await searchinvoicing_detail(searchQuery);
      if (result?.status === 200 && result?.data) {
        setInvoicingOptions(
          (result.data.data || []).map((item) => ({
            label: item.companyName,
            value: item.companyName,
            ...item,
          }))
        );
      } else {
        setInvoicingOptions([]);
      }
    } catch (error) {
      console.error("Error searching invoicing details:", error);
      setInvoicingOptions([]);
    } finally {
      setIsSearching((prev) => ({ ...prev, invoicing: false }));
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (ownerInputValue) handleOwnerSearch(ownerInputValue);
    }, 500);
    return () => clearTimeout(timeout);
  }, [ownerInputValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (managerInputValue) handleManagerSearch(managerInputValue);
    }, 500);
    return () => clearTimeout(timeout);
  }, [managerInputValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (invoicingInputValue) handleInvoicingSearch(invoicingInputValue);
    }, 500);

    return () => clearTimeout(timeout);
  }, [invoicingInputValue]);

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  const handleClassHistoryChange = (index, field, value) => {
    const newHistory = [...classHistory];
    newHistory[index][field] = value;
    setClassHistory(newHistory);
  };

  const handleMachineListChange = (field, value) => {
    setMachineList((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (data) => {
    if (!data.ownerDetails || !data.managerDetails || !data.invoicingDetails) {
      toast.error("Missing required details. Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);
      let res;

      const hasValue = (value) => {
        return value !== null && value !== undefined && value !== "" && value !== 0;
      };

      const payload = {
        shipName: data.shipName,
        imoNumber: data.imoNumber,
        classId: data.classId,
        flag: data.flag,
        portOfRegistry: data.portOfRegistry,
        grossTonnage: data.grossTonnage,
        netTonnage: data.netTonnage,
        lengthOfShip: data.lengthOfShip,
        shipBuilder: data.shipBuilder,
        countryOfBuild: data.countryOfBuild,
        dateOfBuild: data.dateOfBuild,
        callSign: data.callSign,
        officialNo: data.officialNo,
        deadweight: data.deadweight,
        typeOfShip: data.typeOfShip,
        dateOfDelivery: data.dateOfDelivery,

        ownerDetails: {
          nameOfCompany: data.ownerDetails.nameOfCompany,
          companyAddress: data.ownerDetails.companyAddress,
          phoneNumber: data.ownerDetails.phoneNumber,
          email: data.ownerDetails.email,
          imoNumber: data.ownerDetails.imoNumber,
        },
        managerDetails: {
          nameOfCompany: data.managerDetails.nameOfCompany,
          companyAddress: data.managerDetails.companyAddress,
          phoneNumber: data.managerDetails.phoneNumber,
          email: data.managerDetails.email,
          imoNumber: data.managerDetails.imoNumber,
        },
        invoicingDetails: {
          nameOfCompany: data.invoicingDetails.nameOfCompany,
          companyAddress: data.invoicingDetails.companyAddress,
          phoneNumber: data.invoicingDetails.phoneNumber,
          email: data.invoicingDetails.email,
        },
      };

      payload.keelLaidDate = hasValue(data.keelLaidDate) ? data.keelLaidDate : null;
      payload.dateOfModification = hasValue(data.dateOfModification) ? data.dateOfModification : null;
      payload.dateOfBuildingContract = hasValue(data.dateOfBuildingContract) ? data.dateOfBuildingContract : null;
      payload.areaOfOperation = hasValue(data.areaOfOperation) ? data.areaOfOperation : null;
      payload.carryingCapacity = hasValue(data.carryingCapacity) ? data.carryingCapacity : null;
      payload.classSymbol = hasValue(data.classSymbol) ? data.classSymbol : null;
      payload.hullNotation = hasValue(data.hullNotation) ? data.hullNotation : null;
      payload.machineryNotation = hasValue(data.machineryNotation) ? data.machineryNotation : null;
      payload.descriptiveNotation = hasValue(data.descriptiveNotation) ? data.descriptiveNotation : null;
      payload.invoicingDetails.gstNo = hasValue(data.invoicingDetails.gstNo) ? data.invoicingDetails.gstNo : null;

      const filledClassHistory = classHistory
        .filter((item) => hasValue(item.reason) || hasValue(item.remarks) || hasValue(item.from_date) || hasValue(item.to_date))
        .map((item) => ({
          shipStatus: item.shipStatus,
          reason: hasValue(item.reason) ? item.reason : "",
          remarks: hasValue(item.remarks) ? item.remarks : "",
          from_date: hasValue(item.from_date) ? item.from_date : "",
          to_date: hasValue(item.to_date) ? item.to_date : "",
        }));
      payload.classHistory = filledClassHistory.length > 0 ? filledClassHistory : [];

      const hasAnyMachineData = Object.values(machineList).some((value) => hasValue(value));
      if (hasAnyMachineData) {
        payload.machineList = {
          main_engine_model: hasValue(machineList.main_engine_model) ? machineList.main_engine_model : "",
          no_of_engines: hasValue(machineList.no_of_engines) ? machineList.no_of_engines : "",
          total_power: hasValue(machineList.total_power) ? Number(machineList.total_power) : null,
          engine_builder: hasValue(machineList.engine_builder) ? machineList.engine_builder : "",
          engine_built: hasValue(machineList.engine_built) ? machineList.engine_built : null,
          propeller: hasValue(machineList.propeller) ? machineList.propeller : "",
          electrical_installation: hasValue(machineList.electrical_installation) ? machineList.electrical_installation : "",
          boilers: hasValue(machineList.boilers) ? machineList.boilers : "",
          speed_knots: hasValue(machineList.speed_knots) ? Number(machineList.speed_knots) : null,
          rpm: hasValue(machineList.rpm) ? Number(machineList.rpm) : null,
        };
      } else {
        payload.machineList = {};
      }

      if (clientId) {
        res = await updateClient(clientId, { ...payload, message: editReason });
      } else {
        res = await createClient(payload);
      }

      if (res?.data?.status === "success") {
        toast.success(clientId ? "Client updated successfully" : "Client created successfully");
        router.push("/clients");
      } else if (res?.response?.data?.status === "error") {
        toast.error(res?.response?.data?.message);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelBtn = () => {
    router.push("/clients");
  };

  const createManualEditHandler = (sectionKey) => {
    return () => {
      if (sectionKey === "managerDetails" && isManagerSameAsOwner) {
        setIsManagerSameAsOwner(false);
        setManuallyEditedManager(true);
      } else if (sectionKey === "invoicingDetails") {
        if (isInvoiceSameAsOwner) {
          setIsInvoiceSameAsOwner(false);
          setManuallyEditedInvoice(true);
        }
        if (isInvoiceSameAsManager) {
          setIsInvoiceSameAsManager(false);
          setManuallyEditedInvoice(true);
        }
      }
    };
  };

  const renderOwnerCompanyField = () => (
    <Controller
      name="ownerDetails.nameOfCompany"
      control={control}
      render={({ field }) => (
        <Autocomplete
          freeSolo
          options={ownerOptions}
          loading={ownerInputValue && isSearching.owner}
          value={field.value || ""}
          inputValue={ownerInputValue}
          disabled={!editingAllowed}
          onInputChange={(event, newInputValue) => {
            setOwnerInputValue(newInputValue);

            if (newInputValue) {
              field.onChange(newInputValue);
            }
          }}
          onChange={(event, newValue) => {
            if (typeof newValue === "string") {
              field.onChange(newValue);
            } else if (newValue && newValue.label) {
              field.onChange(newValue.value);

              setValue("ownerDetails.companyAddress", newValue.companyAddress || "");
              setValue("ownerDetails.phoneNumber", newValue.phoneNumber || "");
              setValue("ownerDetails.email", newValue.email || "");

              if (isManagerSameAsOwner) {
                setValue("managerDetails.nameOfCompany", newValue.nameOfCompany || "");
                setValue("managerDetails.companyAddress", newValue.companyAddress || "");
                setValue("managerDetails.phoneNumber", newValue.phoneNumber || "");
                setValue("managerDetails.email", newValue.email || "");
              }

              if (isInvoiceSameAsOwner) {
                setValue("invoicingDetails.nameOfCompany", newValue.nameOfCompany || "");
                setValue("invoicingDetails.companyAddress", newValue.companyAddress || "");
                setValue("invoicingDetails.phoneNumber", newValue.phoneNumber || "");
                setValue("invoicingDetails.email", newValue.email || "");
              }
            } else if (newValue === null) {
              field.onChange("");
            }
          }}
          getOptionLabel={(option) => {
            if (typeof option === "string") return option;
            return option.label || "";
          }}
          renderInput={(params) => (
            <CommonInput
              {...params}
              variant="standard"
              label={
                <>
                  Company Name <span style={{ color: "red" }}>*</span>
                </>
              }
              placeholder="Company Name"
              disabled={!editingAllowed}
              error={Boolean(errors?.ownerDetails?.nameOfCompany)}
              helperText={errors?.ownerDetails?.nameOfCompany?.message}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isSearching.owner ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      )}
    />
  );

  const renderManageCompanyField = () => (
    <Controller
      name="managerDetails.nameOfCompany"
      control={control}
      render={({ field }) => (
        <Autocomplete
          freeSolo
          options={managerOptions}
          loading={managerInputValue && isSearching.manager}
          value={field.value || ""}
          inputValue={managerInputValue}
          disabled={!editingAllowed}
          onInputChange={(event, newInputValue) => {
            setManagerInputValue(newInputValue);
            if (newInputValue) {
              field.onChange(newInputValue);
            }
          }}
          onChange={(event, newValue) => {
            if (typeof newValue === "string") {
              field.onChange(newValue);
            } else if (newValue && newValue.label) {
              field.onChange(newValue.value);
              setValue("managerDetails.companyAddress", newValue.companyAddress || "");
              setValue("managerDetails.phoneNumber", newValue.phoneNumber || "");
              setValue("managerDetails.email", newValue.email || "");

              if (isInvoiceSameAsManager) {
                setValue("invoicingDetails.nameOfCompany", newValue.nameOfCompany || "");
                setValue("invoicingDetails.companyAddress", newValue.companyAddress || "");
                setValue("invoicingDetails.phoneNumber", newValue.phoneNumber || "");
                setValue("invoicingDetails.email", newValue.email || "");
              }
            } else if (newValue === null) {
              field.onChange("");
            }
          }}
          getOptionLabel={(option) => {
            if (typeof option === "string") return option;
            return option.label || "";
          }}
          renderInput={(params) => (
            <CommonInput
              {...params}
              variant="standard"
              label={
                <>
                  Company Name <span style={{ color: "red" }}>*</span>
                </>
              }
              placeholder="Company Name"
              disabled={!editingAllowed}
              error={Boolean(errors?.managerDetails?.nameOfCompany)}
              helperText={errors?.managerDetails?.nameOfCompany?.message}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isSearching.manager ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      )}
    />
  );

  const renderInvoicingCompanyField = () => (
    <Controller
      name="invoicingDetails.nameOfCompany"
      control={control}
      render={({ field }) => (
        <Autocomplete
          freeSolo
          options={invoicingOptions}
          loading={invoicingInputValue && isSearching.invoicing}
          value={field.value || ""}
          inputValue={invoicingInputValue}
          disabled={!editingAllowed}
          onInputChange={(event, newInputValue) => {
            setInvoicingInputValue(newInputValue);
            if (newInputValue) {
              field.onChange(newInputValue);
            }
          }}
          onChange={(event, newValue) => {
            if (typeof newValue === "string") {
              field.onChange(newValue);
            } else if (newValue && newValue.label) {
              field.onChange(newValue.value);
              setValue("invoicingDetails.companyAddress", newValue.companyAddress || "");
              setValue("invoicingDetails.phoneNumber", newValue.phoneNumber || "");
              setValue("invoicingDetails.email", newValue.email || "");
              setValue("invoicingDetails.gstNo", newValue.gstNo || "");
            } else if (newValue === null) {
              field.onChange("");
            }
          }}
          getOptionLabel={(option) => {
            if (typeof option === "string") return option;
            return option.label || "";
          }}
          renderInput={(params) => (
            <CommonInput
              {...params}
              variant="standard"
              label={
                <>
                  Company Name <span style={{ color: "red" }}>*</span>
                </>
              }
              placeholder="Company Name"
              disabled={!editingAllowed}
              error={Boolean(errors?.invoicingDetails?.nameOfCompany)}
              helperText={errors?.invoicingDetails?.nameOfCompany?.message}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isSearching.invoicing ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      )}
    />
  );

  const renderContactSection = (sectionKey) => (
    <Stack gap={2}>
      {sectionKey === "ownerDetails" ? (
        renderOwnerCompanyField()
      ) : sectionKey === "managerDetails" ? (
        renderManageCompanyField()
      ) : sectionKey === "invoicingDetails" ? (
        renderInvoicingCompanyField()
      ) : (
        <Controller
          name={`${sectionKey}.nameOfCompany`}
          control={control}
          render={({ field }) => (
            <CommonInput
              {...field}
              fullWidth
              variant="standard"
              label="Company Name"
              placeholder="Company Name"
              disabled={!editingAllowed || (sectionKey === "managerDetails" && isManagerSameAsOwner) || (sectionKey === "invoicingDetails" && (isInvoiceSameAsOwner || isInvoiceSameAsManager))}
              error={Boolean(errors?.[sectionKey]?.nameOfCompany)}
              helperText={errors?.[sectionKey]?.nameOfCompany?.message}
              onChange={(e) => {
                field.onChange(e.target.value);
                createManualEditHandler(sectionKey)();
              }}
            />
          )}
        />
      )}
      <Controller
        name={`${sectionKey}.companyAddress`}
        control={control}
        render={({ field }) => (
          <CommonInput
            {...field}
            fullWidth
            variant="standard"
            label={
              <>
                Complete Address <span style={{ color: "red" }}>*</span>
              </>
            }
            placeholder="Enter Complete Address"
            disabled={!editingAllowed || (sectionKey === "managerDetails" && isManagerSameAsOwner) || (sectionKey === "invoicingDetails" && (isInvoiceSameAsOwner || isInvoiceSameAsManager))}
            error={Boolean(errors?.[sectionKey]?.companyAddress)}
            helperText={errors?.[sectionKey]?.companyAddress?.message}
            onChange={(e) => {
              field.onChange(e.target.value);
              createManualEditHandler(sectionKey)();
            }}
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
            label={<>Phone Number</>}
            placeholder="Enter Phone Number"
            disabled={!editingAllowed || (sectionKey === "managerDetails" && isManagerSameAsOwner) || (sectionKey === "invoicingDetails" && (isInvoiceSameAsOwner || isInvoiceSameAsManager))}
            error={Boolean(errors?.[sectionKey]?.phoneNumber)}
            helperText={errors?.[sectionKey]?.phoneNumber?.message}
            inputProps={{
              inputMode: "numeric",
              pattern: "[0-9]*",
              maxLength: 10,
            }}
            onChange={(e) => {
              if (!editingAllowed) return;
              field.onChange(e.target.value);
              createManualEditHandler(sectionKey)();
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
            label={<>Email</>}
            placeholder="Enter Email Address"
            disabled={!editingAllowed || (sectionKey === "managerDetails" && isManagerSameAsOwner) || (sectionKey === "invoicingDetails" && (isInvoiceSameAsOwner || isInvoiceSameAsManager))}
            error={Boolean(errors?.[sectionKey]?.email)}
            helperText={errors?.[sectionKey]?.email?.message}
            onChange={(e) => {
              field.onChange(e.target.value);
              createManualEditHandler(sectionKey)();
            }}
          />
        )}
      />
      {sectionKey !== "invoicingDetails" && (
        <Controller
          name={`${sectionKey}.imoNumber`}
          control={control}
          render={({ field }) => (
            <CommonInput
              {...field}
              fullWidth
              variant="standard"
              type="text"
              label={<>IMO Number</>}
              placeholder="Enter IMO Number"
              disabled={!editingAllowed || (sectionKey === "managerDetails" && isManagerSameAsOwner) || (sectionKey === "invoicingDetails" && (isInvoiceSameAsOwner || isInvoiceSameAsManager))}
              error={Boolean(errors?.[sectionKey]?.imoNumber)}
              helperText={errors?.[sectionKey]?.imoNumber?.message}
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9]*",
                maxLength: 10,
              }}
              onChange={(e) => {
                if (!editingAllowed) return;
                const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                field.onChange(onlyDigits);
                createManualEditHandler(sectionKey)();
              }}
            />
          )}
        />
      )}
      {sectionKey === "invoicingDetails" && <Controller name="invoicingDetails.gstNo" control={control} render={({ field }) => <CommonInput {...field} fullWidth variant="standard" label="TRN / VAT / GST No." placeholder="Enter TRN / VAT / GST No." disabled={!editingAllowed} error={Boolean(errors?.invoicingDetails?.gstNo)} helperText={errors?.invoicingDetails?.gstNo?.message} onChange={(e) => field.onChange(e.target.value)} />} />}
    </Stack>
  );

  const renderShipParticularsSection = () => {
    const [expanded, setExpanded] = useState(false);

    const handleAccordionChange = () => {
      setExpanded(!expanded);
    };

    return (
      <Accordion
        expanded={expanded}
        onChange={handleAccordionChange}
        sx={{
          borderRadius: "15px",
          "&:before": {
            display: "none",
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="ship-particulars-content"
          id="ship-particulars-header"
          sx={{
            bgcolor: expanded && "#f5f5f5",
            borderRadius: "15px",
            minHeight: 56,
          }}
        >
          <Typography fontWeight={600}>Ship Particulars {shipName && `-  [${shipName}]`}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid2 container spacing={3}>
            {["shipName", "imoNumber", "classId", "flag", "portOfRegistry", "grossTonnage", "netTonnage", "lengthOfShip", "shipBuilder", "countryOfBuild", "areaOfOperation", "carryingCapacity", "classSymbol", "hullNotation", "machineryNotation", "descriptiveNotation", "typeOfShip"].map((field) => (
              <Grid2 key={field} size={{ xs: 4 }}>
                <Controller name={field} control={control} render={({ field: controllerField }) => <CommonInput {...controllerField} fullWidth type="text" variant="standard" label={renderLabel(field)} placeholder={`Enter ${field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}`} disabled={!editingAllowed} error={Boolean(errors?.[field])} helperText={errors?.[field]?.message} />} />
              </Grid2>
            ))}

            {["deadweight"].map((field) => (
              <Grid2 key={field} size={{ xs: 4 }}>
                <Controller
                  name={field}
                  control={control}
                  render={({ field: controllerField }) => (
                    <CommonInput
                      {...controllerField}
                      fullWidth
                      type="number"
                      variant="standard"
                      label={
                        <span style={{ display: "inline-flex", alignItems: "center" }}>
                          <Typography fontStyle="italic">{field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Typography>
                          <span style={{ color: "red", marginLeft: 4 }}>*</span>
                        </span>
                      }
                      placeholder={`Enter ${field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}`}
                      disabled={!editingAllowed}
                      error={Boolean(errors?.[field])}
                      helperText={errors?.[field]?.message}
                    />
                  )}
                />
              </Grid2>
            ))}

            {["dateOfBuild", "keelLaidDate", "dateOfModification", "dateOfBuildingContract", "dateOfDelivery"].map((field) => (
              <Grid2 key={field} size={{ xs: 4 }}>
                <Controller name={field} control={control} render={({ field: controllerField }) => <CommonInput {...controllerField} fullWidth type="date" variant="standard" label={renderLabel(field)} placeholder={`Enter ${field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}`} disabled={!editingAllowed} error={Boolean(errors?.[field])} helperText={errors?.[field]?.message} />} />
              </Grid2>
            ))}

            {["callSign", "officialNo"].map((field) => (
              <Grid2 key={field} size={{ xs: 4 }}>
                <Controller
                  name={field}
                  control={control}
                  render={({ field: controllerField }) => (
                    <CommonInput
                      {...controllerField}
                      fullWidth
                      variant="standard"
                      label={
                        <span style={{ display: "inline-flex", alignItems: "center" }}>
                          <Typography fontStyle="italic">{field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Typography>
                          <span style={{ color: "red", marginLeft: 4 }}>*</span>
                        </span>
                      }
                      placeholder={`Enter ${field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}`}
                      disabled={!editingAllowed}
                      error={Boolean(errors?.[field])}
                      helperText={errors?.[field]?.message}
                    />
                  )}
                />
              </Grid2>
            ))}
          </Grid2>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderClassHistorySection = () => {
    const [expanded, setExpanded] = useState(false);
    const shipStatusOptions = ["Class", "Withdrawn", "Re-classed", "Suspended"];

    return (
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        sx={{
          borderRadius: "15px",
          "&:before": { display: "none" },
          width: "100%",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: expanded && "#f5f5f5",
            borderRadius: "15px",
            minHeight: 56,
          }}
        >
          <Typography fontWeight={600}>Class History</Typography>
        </AccordionSummary>

        <AccordionDetails>
          <TableContainer sx={{ boxShadow: "none" }}>
            <Table sx={{ borderCollapse: "collapse", "& td, & th": { border: "none" } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Ship Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>From Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>To Date</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {classHistory.map((item, index) => (
                  <TableRow key={index} sx={{ verticalAlign: "top" }}>
                    <TableCell sx={{ width: "20%" }}>
                      <CommonInput select fullWidth variant="standard" value={item.shipStatus || ""} onChange={(e) => handleClassHistoryChange(index, "shipStatus", e.target.value)} disabled={!editingAllowed}>
                        {shipStatusOptions.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </CommonInput>
                    </TableCell>

                    <TableCell sx={{ width: "20%" }}>
                      <CommonInput fullWidth variant="standard" placeholder="Enter Reason" value={item.reason || ""} disabled={!editingAllowed} onChange={(e) => handleClassHistoryChange(index, "reason", e.target.value)} />
                    </TableCell>

                    <TableCell sx={{ width: "25%" }}>
                      <CommonInput fullWidth variant="standard" placeholder="Enter Remarks" value={item.remarks || ""} disabled={!editingAllowed} onChange={(e) => handleClassHistoryChange(index, "remarks", e.target.value)} />
                    </TableCell>

                    <TableCell sx={{ width: "17.5%" }}>
                      <CommonInput fullWidth variant="standard" type="date" value={item.from_date || ""} disabled={!editingAllowed} onChange={(e) => handleClassHistoryChange(index, "from_date", e.target.value)} InputLabelProps={{ shrink: true }} />
                    </TableCell>

                    <TableCell sx={{ width: "17.5%" }}>
                      <CommonInput fullWidth variant="standard" type="date" value={item.to_date || ""} disabled={!editingAllowed} onChange={(e) => handleClassHistoryChange(index, "to_date", e.target.value)} InputLabelProps={{ shrink: true }} />
                    </TableCell>

                    <TableCell sx={{ width: "5%", textAlign: "center" }}>
                      {editingAllowed && (
                        <IconButton onClick={() => handleDeleteRow(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {editingAllowed && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <IconButton color="primary" onClick={handleAddRow}>
                <AddCircleOutlineIcon />
              </IconButton>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderMachineListSection = () => {
    const [expanded, setExpanded] = useState(false);

    return (
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        sx={{
          borderRadius: "15px",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: expanded && "#f5f5f5",
            borderRadius: "15px",
            minHeight: 56,
          }}
        >
          <Typography fontWeight={600}>Machinery Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid2 container spacing={3}>
            <Grid2 size={{ xs: 4 }}>
              <TextField fullWidth variant="standard" label="Main Engine Model" placeholder="Enter Main Engine Model" value={machineList.main_engine_model} disabled={!editingAllowed} onChange={(e) => handleMachineListChange("main_engine_model", e.target.value)} />
            </Grid2>
            <Grid2 size={{ xs: 4 }}>
              <TextField fullWidth variant="standard" type="string" label="No. of Engines" placeholder="Enter No. of Engines" value={machineList.no_of_engines} disabled={!editingAllowed} onChange={(e) => handleMachineListChange("no_of_engines", e.target.value)} />
            </Grid2>
            <Grid2 size={{ xs: 4 }}>
              <TextField fullWidth variant="standard" type="number" label="Total Power (KW)" placeholder="Enter Total Power" value={machineList.total_power} disabled={!editingAllowed} onChange={(e) => handleMachineListChange("total_power", e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid2>
            <Grid2 size={{ xs: 4 }}>
              <TextField fullWidth variant="standard" label="Engine Builder" placeholder="Enter Engine Builder" value={machineList.engine_builder} disabled={!editingAllowed} onChange={(e) => handleMachineListChange("engine_builder", e.target.value)} />
            </Grid2>
            <Grid2 size={{ xs: 4 }}>
              <TextField fullWidth variant="standard" type="date" label="Engine Built" value={machineList.engine_built ? machineList.engine_built.split("T")[0] : ""} disabled={!editingAllowed} onChange={(e) => handleMachineListChange("engine_built", e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid2>
            <Grid2 size={{ xs: 4 }}>
              <TextField fullWidth variant="standard" label="Propeller" placeholder="Enter Propeller" value={machineList.propeller} disabled={!editingAllowed} onChange={(e) => handleMachineListChange("propeller", e.target.value)} />
            </Grid2>
            <Grid2 size={{ xs: 6 }}>
              <TextField fullWidth variant="standard" label="Electrical Installation" placeholder="Enter Electrical Installation" multiline rows={3} value={machineList.electrical_installation} disabled={!editingAllowed} onChange={(e) => handleMachineListChange("electrical_installation", e.target.value)} sx={{ border: "1px soild red" }} />
            </Grid2>
            <Grid2 size={{ xs: 6 }}>
              <TextField fullWidth variant="standard" label="Boilers" placeholder="Enter Boilers" multiline rows={3} value={machineList.boilers} disabled={!editingAllowed} onChange={(e) => handleMachineListChange("boilers", e.target.value)} />
            </Grid2>
            <Grid2 size={{ xs: 6 }}>
              <TextField fullWidth variant="standard" type="number" label="Speed (Knots)" placeholder="Enter Speed in Knots" value={machineList.speed_knots} disabled={!editingAllowed} onChange={(e) => handleMachineListChange("speed_knots", e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid2>
            <Grid2 size={{ xs: 6 }}>
              <TextField fullWidth variant="standard" type="number" label="RPM" placeholder="Enter RPM" value={machineList.rpm} disabled={!editingAllowed} onChange={(e) => handleMachineListChange("rpm", e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box>
      {isDataLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: 300 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack mt={4} spacing={4}>
          <Paper sx={{ padding: "20px", borderRadius: "15px" }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid2 container spacing={3} marginBottom={3}>
                {renderShipParticularsSection()}
              </Grid2>

              <Grid2 container spacing={3} marginBottom={3}>
                {renderClassHistorySection()}
              </Grid2>

              <Grid2 container spacing={3} marginBottom={3}>
                {renderMachineListSection()}
              </Grid2>

              <Grid2 container spacing={4}>
                <Grid2 size={{ xs: 4 }}>
                  <h3 style={{ marginBottom: "10px" }}>Owner's Detail</h3>
                  {renderContactSection("ownerDetails")}
                </Grid2>

                <Grid2 size={{ xs: 4 }}>
                  <h3 style={{ marginBottom: "10px" }}>Manager's Detail</h3>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isManagerSameAsOwner}
                        onChange={(e) => {
                          if (editingAllowed) {
                            const checked = e.target.checked;
                            setIsManagerSameAsOwner(checked);
                            if (checked) {
                              const currentOwnerDetails = getValues("ownerDetails");
                              setValue("managerDetails", {
                                nameOfCompany: currentOwnerDetails.nameOfCompany || "",
                                companyAddress: currentOwnerDetails.companyAddress || "",
                                phoneNumber: currentOwnerDetails.phoneNumber || "",
                                email: currentOwnerDetails.email || "",
                              });
                              setManuallyEditedManager(false);
                              clearErrors("managerDetails");
                            }
                          }
                        }}
                        disabled={!editingAllowed}
                      />
                    }
                    label="Same as Owner"
                  />
                  {renderContactSection("managerDetails")}
                </Grid2>

                <Grid2 size={{ xs: 4 }}>
                  <h3 style={{ marginBottom: "10px" }}>Invoicing Detail</h3>
                  <Stack flexDirection={"row"} spacing={2} justifyContent={"space-between"} alignItems={"center"}>
                    <FormControlLabel
                      sx={{ marginTop: "0px !important" }}
                      control={
                        <Checkbox
                          checked={isInvoiceSameAsOwner}
                          onChange={(e) => {
                            if (!editingAllowed) return;
                            const checked = e.target.checked;
                            setIsInvoiceSameAsOwner(checked);
                            if (checked) {
                              const currentOwnerDetails = getValues("ownerDetails");
                              setValue("invoicingDetails", {
                                nameOfCompany: currentOwnerDetails.nameOfCompany || "",
                                companyAddress: currentOwnerDetails.companyAddress || "",
                                phoneNumber: currentOwnerDetails.phoneNumber || "",
                                email: currentOwnerDetails.email || "",
                                gstNo: getValues("invoicingDetails.gstNo") || "",
                              });
                              setIsInvoiceSameAsManager(false);
                              setManuallyEditedInvoice(false);
                              clearErrors("invoicingDetails");
                            }
                          }}
                          disabled={!editingAllowed}
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
                            if (!editingAllowed) return;
                            const checked = e.target.checked;
                            setIsInvoiceSameAsManager(checked);
                            if (checked) {
                              const currentManagerDetails = getValues("managerDetails");
                              setValue("invoicingDetails", {
                                nameOfCompany: currentManagerDetails.nameOfCompany || "",
                                companyAddress: currentManagerDetails.companyAddress || "",
                                phoneNumber: currentManagerDetails.phoneNumber || "",
                                email: currentManagerDetails.email || "",
                                gstNo: getValues("invoicingDetails.gstNo") || "",
                              });
                              setIsInvoiceSameAsOwner(false);
                              setManuallyEditedInvoice(false);
                              clearErrors("invoicingDetails");
                            }
                          }}
                          disabled={!editingAllowed}
                        />
                      }
                      label="Same as Manager"
                    />
                  </Stack>

                  {renderContactSection("invoicingDetails")}
                </Grid2>
              </Grid2>

              <Stack mt={4} spacing={2} direction="row" justifyContent="flex-start">
                {editingAllowed && (
                  <>
                    <CommonButton type="submit" variant="contained" text="Save" disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : null} />
                    <CommonButton onClick={cancelBtn} variant="contained" text="Cancel" disabled={loading} />
                  </>
                )}
                {!editingAllowed && <CommonButton onClick={cancelBtn} variant="contained" text="Back" />}
              </Stack>
            </form>

            <Snackbar open={snackBar.open} autoHideDuration={2000} message={snackBar.message} anchorOrigin={{ vertical: "top", horizontal: "center" }} onClose={snackbarClose} key="snackbar" />
          </Paper>
        </Stack>
      )}
    </Box>
  );
};

export default AddSurveyType;
