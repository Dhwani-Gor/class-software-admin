"use client";

import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Loader from "@/components/Loader";
import { logout } from "@/redux/slice/authSlice";

const AuthWrapper = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, userInfo } = useSelector((state) => state.auth);
  const router = useRouter();
  const currentPath = usePathname();
  const dispatch = useDispatch();

  useEffect(() => {
    const checkTokenExpiry = () => {
      if (userInfo?.token) {
        try {
          const decodedToken = jwtDecode(userInfo.token);
          const currentTime = Date.now() / 1000;
          if (decodedToken.exp < currentTime) {
            dispatch(logout());
            router.push("/login");
            return false;
          }
        } catch (error) {
          dispatch(logout());
          router.push("/login");
          return false;
        }
      }
      return true;
    };

    const isTokenValid = checkTokenExpiry();

    if (!isAuthenticated && currentPath !== "/login") {
      router.push("/login");
    } else if (isAuthenticated && currentPath === "/login") {
      router.push("/dashboard");
    } else if (isTokenValid) {
      setIsLoading(false);
    }
  }, [isAuthenticated, userInfo, router, currentPath, dispatch]);

  if (isLoading) {
    return <Loader />;
  }

  return <>{children}</>;
};

export default AuthWrapper;
