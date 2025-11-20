"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

function VNPayReturnContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
    if (vnp_ResponseCode === "00") {
      setStatus("success");
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "loading" && "Processing Payment..."}
            {status === "success" && "Payment Successful"}
            {status === "error" && "Payment Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === "loading" && (
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
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
              <XCircle className="mx-auto h-16 w-16 text-destructive" />
              <p className="text-muted-foreground">
                Your payment could not be processed. Please try again.
              </p>
              <div className="flex justify-center gap-4">
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

export default function VNPayReturnPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center">Processing payment...</div>}>
      <VNPayReturnContent />
    </Suspense>
  );
}

