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
        const value = reportDetails?.data?.[attr] || reportDetails?.[attr];
        initialValues[attr] = value === "\u2611" ? true : false;

      } else if (attr.startsWith("_st_")) {
        const value = reportDetails?.data?.[attr] || reportDetails?.[attr];
        if (value && typeof value === 'string') {
          const parts = value.split(" / ").map((s) => s.trim());
          initialValues[attr] = parts.filter((p) => !isStrikethroughText(p));
        } else if (Array.isArray(value)) {
          initialValues[attr] = value;
        } else {
          initialValues[attr] = [];
        }

      } else {
        const value = reportDetails?.data?.[attr] || reportDetails?.[attr];
        if (value) {
          const val = String(value);
          if (attr.toLowerCase().includes("date") && (!val || val.toLowerCase().includes("undefined"))) {
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
  const handleSubmit = (formData, shouldClose = true) => {
    const filledValues = Object.entries(formData).reduce((acc, [key, rawValue]) => {
      let value = rawValue;

      if (typeof value === "string" && (value.includes("undefined") || value.trim() === "")) {
        value = undefined;
      }

      if (key.toLowerCase().includes("date")) {
        const raw = String(value ?? "").trim();
        acc[key] = !raw || raw.toLowerCase().includes("undefined") || raw === "//" || raw.includes("undefined") ? "-" : formattedDate(raw);
        return acc;
      }

      if (key.startsWith("_st_")) {
        const [, raw] = key.split("_st_");
        const optionsRaw = raw.split("_");
        const options = optionsRaw.map((opt) => opt.replace(/-/g, " "));
        const selectedValues = Array.isArray(value) ? value : [];
        acc[key] = selectedValues.length === 0 ? options.join(" / ") : options.map((opt) => (selectedValues.includes(opt) ? opt : applyStrikethrough(opt))).join(" / ");
        return acc;
      }

      if (typeof value === "boolean") {
        acc[key] = value ? "\u2611" : "\u2612";
        return acc;
      }

      if (typeof value === "string") {
        const trimmed = value.trim();
        acc[key] = !trimmed ? "-" : trimmed;
        return acc;
      }

      acc[key] = value ?? "-";
      return acc;
    }, {});

    const payload = { ...filledValues, save: onSave };

    onSubmit(payload);

    if (shouldClose) {
      onClose();
    }
    setFormData({});
  };

  return { handleSubmit };
};
