"use client";
import React, { createContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathName = usePathname();

  const getAccessToken = () => localStorage.getItem("accessToken");
  const isCaptchaValid = () => localStorage.getItem("isCaptchaValid") === "true";

  console.log(getAccessToken, "getaccess token");
  

  useEffect(() => {
    const checkAuthStatus = () => {
      setIsLoading(true);
      const accessToken = getAccessToken();

      if (accessToken) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      if (accessToken && isCaptchaValid()) {
        if ([
          "/login",
        //   "/email",
        //   "/verify-email",
        //   "/forgot-password",
        //   "/new-password",
        //   "/password-link",
        ].includes(pathName)) {
          router.replace("/dashboard");
        }
      } else if (!accessToken) {
        setIsAuthenticated(false);
        if (![
          "/login",
        //   "/email",
        //   "/verify-email",
        //   "/forgot-password",
        //   "/new-password",
        //   "/password-link",
        ].includes(pathName)) {
          router.replace("/login");
        }
      }

      setIsLoading(false);
    };

    checkAuthStatus();
  }, [pathName, router]);

  const login = (isCaptchaValid) => {
    localStorage.setItem("isCaptchaValid", isCaptchaValid);
    setIsAuthenticated(true);
    router.replace("/clients");
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("isCaptchaValid");
    setIsAuthenticated(false);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {isLoading ? (
        <Box
          sx={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress sx={{ fontSize: "24px" }} />
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};