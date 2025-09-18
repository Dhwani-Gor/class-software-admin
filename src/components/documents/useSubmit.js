import { useState, useEffect } from "react";
import { formattedDate } from "@/utils/date";

const applyStrikethrough = (text) =>
  text
    ?.split("")
    .map((c) => c + "\u0336")
    .join("");

const isStrikethroughText = (text) => text?.split("").some((c) => c === "\u0336");

export const useFormInitialization = (fields, reportDetails, open) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!fields || fields.length === 0) return;

    const initialValues = {};

    fields.forEach((field) => {
      const attr = field.attribute;

      if (attr.startsWith("_checkbox")) {
        initialValues[attr] =
          reportDetails && reportDetails[attr] === "\u2611" ? true : false;

      } else if (attr.startsWith("_st_")) {
        const rawValue =
          reportDetails && typeof reportDetails[attr] === "string"
            ? reportDetails[attr]
            : "";
        if (rawValue) {
          const parts = rawValue.split(" / ").map((s) => s.trim());
          initialValues[attr] = parts.filter((p) => !isStrikethroughText(p));
        } else {
          initialValues[attr] = [];
        }

      } else {
        if (reportDetails && reportDetails[attr] !== undefined && reportDetails[attr] !== null) {
          const val =
            typeof reportDetails[attr] === "string" ||
            typeof reportDetails[attr] === "number"
              ? String(reportDetails[attr])
              : "";
          if (
            attr.toLowerCase().includes("date") &&
            (!val || val.toLowerCase().includes("undefined"))
          ) {
            initialValues[attr] = "";
          } else {
            initialValues[attr] = val;
          }
        } else {
          initialValues[attr] = "";
        }
      }
    });

    setFormData(initialValues);
  }, [fields, open, reportDetails]);

  return { formData, setFormData };
};

export const useCommonSubmit = (onSubmit, onClose, setFormData, onSave) => {
  
  const isUndefinedValue = (raw) => {
    if (!raw) return true;
    
    const stringValue = raw?.toString().trim().toLowerCase();
    const invalidValues = ["undefined", "undefined//", "//", "null", "null//"];
    
    return invalidValues.includes(stringValue) || stringValue.includes("undefined");
  };

  const handleSubmit = (formData, shouldClose = true) => {
    const filledValues = Object.entries(formData).reduce((acc, [key, rawValue]) => {
      let value = rawValue;

      if (typeof value === "string" && (value.includes("undefined") || value.trim() === "")) {
        value = undefined;
      }

      if (key.toLowerCase().includes("date")) {
        const raw = (value ?? "").toString().trim();
        
        if (isUndefinedValue(raw)) {
          acc[key] = "-";
        } else {
          acc[key] = formattedDate(raw);
        }
        return acc;
      }
      
      if (key.startsWith("_st_")) {
        const [, raw] = key.split("_st_");
        const optionsRaw = raw.split("_");
        const options = optionsRaw.map((opt) => opt.replace(/-/g, " "));
        const selectedValues = Array.isArray(value) ? value : [];
        acc[key] = selectedValues.length === 0 
          ? options.join(" / ") 
          : options.map((opt) => (selectedValues.includes(opt) ? opt : applyStrikethrough(opt))).join(" / ");
        return acc;
      }

      if (typeof value === "boolean") {
        acc[key] = value ? "\u2611" : "\u2612";
        return acc;
      }

      if (typeof value === "string") {
        const trimmed = value.trim();
        if (isUndefinedValue(trimmed)) {
          acc[key] = "-";
        } else {
          acc[key] = !trimmed ? "-" : trimmed;
        }
        return acc;
      }

      acc[key] = value ?? "-";
      return acc;
    }, {});

    const cleanedValues = Object.fromEntries(
      Object.entries(filledValues).map(([k, v]) => {
        if (v === undefined || v === null) return [k, "-"];
        if (typeof v === "string" && isUndefinedValue(v)) return [k, "-"];
        return [k, v];
      })
    );
    
    const payload = { ...cleanedValues, save: onSave };

    onSubmit(payload);

    if (shouldClose) {
      onClose();
      setFormData({});

    }
  };

  return { handleSubmit };
};
