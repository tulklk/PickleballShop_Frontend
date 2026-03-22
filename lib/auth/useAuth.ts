"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "../api/client";
import { useSession } from "../api/hooks";
import type { UserDto } from "../api/types";

/** Dùng sau login/register (response) — không dùng `useAuth().isAdmin` ngay trong cùng handler vì state chưa re-render. */
export function isAdminUser(
  user: { role?: string | number | null } | null | undefined
): boolean {
  const r = user?.role;
  if (r === null || r === undefined) return false;
  if (r === "Admin" || r === 2 || r === "2") return true;
  return String(r).toLowerCase() === "admin";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: sessionData } = useSession();
  const user = queryClient.getQueryData<UserDto>(["user"]) || sessionData?.user;
  const accessToken = apiClient.getAccessToken();

  useEffect(() => {
    // Initialize tokens from localStorage on mount
    if (typeof window !== "undefined") {
      const storedAccessToken = localStorage.getItem("accessToken");
      if (storedAccessToken) {
        apiClient.setAccessToken(storedAccessToken);
      }
    }
  }, []);

  const isAuthenticated = !!accessToken && !!user;
  const isAdmin = isAdminUser(user);

  return {
    user,
    isAuthenticated,
    isAdmin,
    accessToken,
  };
}

