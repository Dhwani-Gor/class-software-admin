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
    if (fields && fields.length > 0) {
      const initialValues = {};
      fields.forEach((field) => {
        if (field.attribute.startsWith("_checkbox")) {
          if (reportDetails && reportDetails[field.attribute] === "\u2611") {
            initialValues[field.attribute] = true;
          } else {
            initialValues[field.attribute] = false;
          }
        } else if (field.attribute.startsWith("_st_")) {
          if (reportDetails && reportDetails[field.attribute]) {
            const parts = reportDetails[field.attribute].split(" / ").map((s) => s.trim());

            const selectedOptions = parts.filter((part) => !isStrikethroughText(part));
            initialValues[field.attribute] = selectedOptions;
          } else {
            initialValues[field.attribute] = [];
          }
        } else {
          if (reportDetails && reportDetails[field.attribute]) {
            initialValues[field.attribute] = reportDetails[field.attribute];
          } else {
            initialValues[field.attribute] = "";
          }
        }
      });
      setFormData(initialValues);
    }
  }, [fields, open, reportDetails]);

  return { formData, setFormData };
};

export const useCommonSubmit = (onSubmit, onClose, setFormData, onSave) => {
  const handleSubmit = (formData) => {
    const filledValues = Object.entries(formData).reduce((acc, [key, value]) => {
      if (typeof value === "string" && (value?.includes("undefined") || value.trim() === "")) {
        value = undefined;
      }

      if (key.startsWith("_st_")) {
        const [, raw] = key?.split("_st_");
        const optionsRaw = raw.split("_");
        const options = optionsRaw.map((opt) => opt.replace(/-/g, " "));

        const selectedValues = Array.isArray(value) ? value : [];

        if (selectedValues.length === 0) {
          acc[key] = options.join(" / ");
        } else {
          acc[key] = options.map((opt) => (selectedValues.includes(opt) ? opt : applyStrikethrough(opt))).join(" / ");
        }
      } else if (typeof value === "boolean") {
        acc[key] = value === true ? "\u2611" : "\u2612";
      } else if (key.includes("date")) {
        const raw = String(value ?? "").trim();
        if (!raw || /^\/*undefined$/i.test(raw)) {
          acc[key] = "-";
        } else {
          acc[key] = formattedDate(raw);
        }
      } else if (typeof value === "string" && value.trim()) {
        acc[key] = value;
      } else {
        acc[key] = "-";
      }
      return acc;
    }, {});
    const payload = { ...filledValues, save: onSave };

    onSubmit(payload);
    onClose();
    setFormData({});
  };

  return { handleSubmit };
};
