"use client";
import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";

export default function NotFound() {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        bgcolor: "black",
        color: "white",
        px: 3,
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: 100, md: 150 },
          fontWeight: "bold",
          letterSpacing: 4,
          textShadow: "0px 0px 20px rgba(255,255,255,0.2)",
        }}
      >
        404
      </Typography>

      <Typography
        sx={{
          fontSize: { xs: 22, md: 32 },
          textTransform: "uppercase",
          mb: 2,
          letterSpacing: 2,
        }}
      >
        Page Not Found
      </Typography>

      <Typography
        sx={{
          fontSize: 16,
          color: "rgba(255,255,255,0.7)",
          maxWidth: 500,
          mb: 4,
        }}
      >
        The page you’re looking for may have sailed away or doesn’t exist. Please return to the dashboard to continue managing your vessel data.
      </Typography>

      <Link href="/dashboard" passHref>
        <Button
          variant="outlined"
          sx={{
            borderColor: "white",
            color: "white",
            px: 4,
            py: 1,
            fontSize: 16,
            borderRadius: "50px",
            textTransform: "none",
            "&:hover": {
              bgcolor: "white",
              color: "black",
              borderColor: "white",
            },
          }}
        >
          Return to Dashboard
        </Button>
      </Link>

      <Box
        component="span"
        sx={{
          position: "absolute",
          bottom: 20,
          fontSize: 12,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: 1,
        }}
      >
        © {new Date().getFullYear()} gambiaclass.org — Ship Data Management System
      </Box>
    </Box>
  );
}
