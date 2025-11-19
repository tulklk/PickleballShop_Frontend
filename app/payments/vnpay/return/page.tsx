"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

export default function VNPayReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    // The backend will handle the payment verification
    // This page just shows the result
    const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
    if (vnp_ResponseCode === "00") {
      setStatus("success");
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "loading" && "Processing Payment..."}
            {status === "success" && "Payment Successful"}
            {status === "error" && "Payment Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-muted-foreground">
                Your payment has been processed successfully.
              </p>
              <Link href="/account/orders">
                <Button>View Orders</Button>
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <p className="text-muted-foreground">
                Your payment could not be processed. Please try again.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/checkout">
                  <Button>Try Again</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">Go Home</Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

