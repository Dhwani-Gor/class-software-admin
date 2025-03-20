import React from "react";
// import OutlinedInput from "@mui/material/OutlinedInput";
import  TextField  from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Box from "@mui/material/Box";

const CommonInput = ({
  label,
  value,
  onChange,
  placeholder,
  error = false,
  helperText = "",
  type = "text",
  inputProps = {},
  labelProps = {},
  helperTextProps = {},
  containerProps = {},
  ...props
}) => {
  return (
    <Box {...containerProps}>
      {label && (
        <InputLabel
          sx={{ mb: 1.5, fontWeight: "500", color: error ? "error.main" : "text.primary" }}
          {...labelProps}
          htmlFor="common-input"
        >
          {label}
        </InputLabel>
      )}
      <TextField
        id="common-input"
        type={type}
        value={value || ""} 
        onChange={onChange}
        placeholder={placeholder}
        error={error} 
        {...props}
        {...inputProps}
        sx={{
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: error ? "error.main" : "inherit",
          },
        }}
      />
      {helperText && (
        <FormHelperText
          {...helperTextProps}
          sx={{
            color: error ? "error.main" : "text.secondary",
            mt: 1,
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default CommonInput
