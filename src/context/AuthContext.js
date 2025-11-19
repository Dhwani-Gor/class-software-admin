"use client";
import React, { createContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roleId, setRoleId] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Module to route mapping
  const moduleRouteMapping = {
    Clients: ["/clients"],
    Users: ["/staff"],
    Journals: ["/journal"],
    Reporting: ["/reporting", "/survey-report", "/survey-status-report", "/narative-report", "/reset-password", "/machine-list"],
    IssuedDocument: ["/certificates"],
    SurveyType: ["/survey-types"],
    Documents: ["/documents"],
    SystemVariable: ["/system-variables"],
    Classification: ["/classification"],
    Settings: ["/settings"],
    AdditionalFields: ["/additional-fields"],
    Machinery: ["/machine-list"],
  };

  const publicRoutes = ["/login", "/digital-document", "/reset-password", "/forgot-password"];

  const getAllowedRoutes = (userPermissions, userData) => {
    let allowedRoutes = [];

    userPermissions.forEach((module) => {
      if (moduleRouteMapping[module]) {
        allowedRoutes = [...allowedRoutes, ...moduleRouteMapping[module]];
      }
    });

    if (userPermissions.includes("Clients") && userData?.dataEntryRights) {
      if (!allowedRoutes.includes("/clients")) {
        allowedRoutes.push("/clients");
      }
    }

    return [...new Set(allowedRoutes)];
  };

  const getDefaultRouteForUser = (userPermissions, userData) => {
    const allowedRoutes = getAllowedRoutes(userPermissions, userData);

    const routePriority = ["/clients", "/journal", "/reporting", "/certificates", "/settings"];

    for (const route of routePriority) {
      if (allowedRoutes.includes(route)) {
        return route;
      }
    }

    return allowedRoutes[0] || "/login";
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const storedRoleId = typeof window !== "undefined" ? localStorage.getItem("roleId") : null;
    const storedData = typeof window !== "undefined" ? localStorage.getItem("data") : null;

    if (token && storedData) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);
        const userData = JSON.parse(storedData);

        if (decodedToken.exp < currentTime) {
          toast.error("Session expired! Please log in again.");
          logout();
        } else {
          setIsAuthenticated(true);
          setRoleId(storedRoleId);
          setPermissions(userData.permissionModule || []);

          setTimeout(() => {
            toast.error("Session expired! Please log in again.");
            logout();
          }, (decodedToken.exp - currentTime) * 1000);
        }
      } catch (error) {
        console.error("Invalid Token:", error);
        toast.error("Invalid session! Please log in again.");
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    if (!isAuthenticated && !isLoading && !isPublicRoute) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  useEffect(() => {
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    if (isAuthenticated && permissions.length > 0 && !isPublicRoute) {
      const userData = JSON.parse(localStorage.getItem("data") || "{}");
      const allowedRoutes = getAllowedRoutes(permissions, userData);

      const isAllowedRoute = allowedRoutes.some((route) => pathname.startsWith(route) || pathname.includes(route));

      if (!isAllowedRoute) {
        const defaultRoute = getDefaultRouteForUser(permissions, userData);
        router.replace(defaultRoute);
      }
    }
  }, [isAuthenticated, permissions, pathname, router]);

  const login = (data) => {
    localStorage.setItem("token", data?.token);
    localStorage.setItem("roleId", data?.roleId);
    localStorage.setItem("data", JSON.stringify(data));
    setIsAuthenticated(true);
    setRoleId(data?.roleId);
    setPermissions(data?.permissionModule || []);

    const defaultRoute = getDefaultRouteForUser(data?.permissionModule || [], data);
    router.replace(defaultRoute);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roleId");
    localStorage.removeItem("data");
    setIsAuthenticated(false);
    setRoleId(null);
    setPermissions([]);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        roleId,
        permissions,
        isLoading,
        login,
        logout,
        getAllowedRoutes: () => {
          const userData = JSON.parse(localStorage.getItem("data") || "{}");
          return getAllowedRoutes(permissions, userData);
        },
      }}
    >
      <ToastContainer position="top-right" autoClose={3000} />
      {isLoading ? (
        <Box
          sx={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
