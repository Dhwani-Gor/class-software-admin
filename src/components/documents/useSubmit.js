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

      // ✅ Checkboxes
      if (attr.startsWith("_checkbox")) {
        initialValues[attr] = reportDetails && reportDetails[attr] === "\u2611" ? true : false;

        // ✅ Strikethrough multi-select
      } else if (attr.startsWith("_st_")) {
        if (reportDetails && reportDetails[attr]) {
          const parts = reportDetails[attr].split(" / ").map((s) => s.trim());
          initialValues[attr] = parts.filter((p) => !isStrikethroughText(p));
        } else {
          initialValues[attr] = [];
        }

        // ✅ Dates or regular fields
      } else {
        if (reportDetails && reportDetails[attr]) {
          const val = String(reportDetails[attr]);
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

/**
 * Prepare and submit payload.
 */
export const useCommonSubmit = (onSubmit, onClose, setFormData, onSave) => {
  const handleSubmit = (formData, shouldClose = true) => {
    const filledValues = Object.entries(formData).reduce((acc, [key, rawValue]) => {
      let value = rawValue;

      // ✅ Normalize "undefined" or empty strings to undefined
      if (typeof value === "string" && (value.includes("undefined") || value.trim() === "")) {
        value = undefined;
      }

      // --- Date fields ---
      if (key.toLowerCase().includes("date")) {
        const raw = String(value ?? "").trim();
        acc[key] = !raw || raw.toLowerCase().includes("undefined") || raw === "//" || raw.includes("undefined") ? "-" : formattedDate(raw);
        return acc;
      }

      // --- Strikethrough groups ---
      if (key.startsWith("_st_")) {
        const [, raw] = key.split("_st_");
        const optionsRaw = raw.split("_");
        const options = optionsRaw.map((opt) => opt.replace(/-/g, " "));
        const selectedValues = Array.isArray(value) ? value : [];
        acc[key] = selectedValues.length === 0 ? options.join(" / ") : options.map((opt) => (selectedValues.includes(opt) ? opt : applyStrikethrough(opt))).join(" / ");
        return acc;
      }

      // --- Booleans ---
      if (typeof value === "boolean") {
        acc[key] = value ? "\u2611" : "\u2612";
        return acc;
      }

      // --- Strings ---
      if (typeof value === "string") {
        const trimmed = value.trim();
        acc[key] = !trimmed ? "-" : trimmed;
        return acc;
      }

      // --- Fallback ---
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
