"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "../api/client";
import type { UserDto } from "../api/types";

export function useAuth() {
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData<UserDto>(["user"]);
  const accessToken = apiClient.getAccessToken();

  useEffect(() => {
    // Initialize token from localStorage on mount
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        apiClient.setAccessToken(token);
      }
    }
  }, []);

  const isAuthenticated = !!accessToken && !!user;
  const isAdmin = user?.role === "Admin" || user?.role === "2";

  return {
    user,
    isAuthenticated,
    isAdmin,
    accessToken,
  };
}

