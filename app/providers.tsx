"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "next-themes";
import { useMemo, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - giảm refetch không cần thiết
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Không refetch khi mount lại nếu data còn fresh
            retry: 1, // Giảm số lần retry để fail nhanh hơn
          },
        },
      })
  );

  const googleClientId = useMemo(
    () => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
    []
  );

  if (!googleClientId && process.env.NODE_ENV === "development") {
    console.warn(
      "Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID. Google login will not work."
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

