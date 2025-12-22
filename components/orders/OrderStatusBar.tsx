"use client";

import { 
  Package, 
  CheckCircle2, 
  Box, 
  Truck, 
  Home,
  XCircle
} from "lucide-react";
import { OrderStatus, normalizeOrderStatus, OrderStatusLabels } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface OrderStatusBarProps {
  orderStatus: OrderStatus | string | null;
}

interface StatusStep {
  status: OrderStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ORDER_STEPS: StatusStep[] = [
  {
    status: OrderStatus.Processing,
    label: OrderStatusLabels[OrderStatus.Processing],
    icon: Package,
  },
  {
    status: OrderStatus.Confirmed,
    label: OrderStatusLabels[OrderStatus.Confirmed],
    icon: CheckCircle2,
  },
  {
    status: OrderStatus.Prepared,
    label: OrderStatusLabels[OrderStatus.Prepared],
    icon: Box,
  },
  {
    status: OrderStatus.Shipped,
    label: OrderStatusLabels[OrderStatus.Shipped],
    icon: Truck,
  },
  {
    status: OrderStatus.Completed,
    label: OrderStatusLabels[OrderStatus.Completed],
    icon: Home,
  },
];

export function OrderStatusBar({ orderStatus }: OrderStatusBarProps) {
  if (!orderStatus) {
    return null;
  }

  const normalizedStatus = normalizeOrderStatus(orderStatus);
  
  // Nếu đơn hàng bị hủy, hiển thị thông báo hủy
  if (normalizedStatus === OrderStatus.Cancelled) {
    return (
      <div className="w-full py-6 px-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-center gap-3">
          <XCircle className="h-6 w-6 text-red-600" />
          <span className="text-lg font-semibold text-red-700">
            Đơn hàng đã bị hủy
          </span>
        </div>
      </div>
    );
  }

  // Tìm index của status hiện tại
  const currentStatusIndex = ORDER_STEPS.findIndex(
    (step) => step.status === normalizedStatus
  );

  // Nếu không tìm thấy status trong steps (có thể là status cũ), hiển thị Processing
  const activeIndex = currentStatusIndex >= 0 ? currentStatusIndex : 0;
  const stepPercent = 100 / (ORDER_STEPS.length - 1);
  // Kéo line tới giữa vòng tròn đang active, cắt max 100%
  const linePercent = Math.min(100, activeIndex * stepPercent + stepPercent / 2);

  return (
    <div className="w-full py-6 px-4">
      <div className="flex items-center justify-between relative">
        {/* Background line - aligned to pass through circle center */}
        <div className="absolute top-[42%] left-0 right-0 h-0.5 -translate-y-1/2 bg-gray-200 z-0" />
        
        {/* Active line with glow animation (same vertical position as background line) */}
        <div
          className="absolute top-[42%] left-0 h-1 -translate-y-1/2 bg-emerald-500/90 z-10 transition-all duration-500 overflow-hidden rounded-full"
          style={{
            width: `${linePercent}%`,
            boxShadow:
              "0 0 10px rgba(16,185,129,0.9), 0 0 22px rgba(16,185,129,0.6), 0 0 35px rgba(16,185,129,0.4)",
          }}
        >
          {/* Glow effect animation - moving from left to right */}
          <div
            className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-emerald-200 to-transparent animate-shimmer"
            style={{
              boxShadow:
                "0 0 18px rgba(16,185,129,1), 0 0 32px rgba(16,185,129,0.8), 0 0 50px rgba(16,185,129,0.5)",
              filter: "blur(0.5px)",
            }}
          />
        </div>

        {/* Steps */}
        {ORDER_STEPS.map((step, index) => {
          const isActive = index <= activeIndex;
          const StepIcon = step.icon;

          return (
            <div
              key={step.status}
              className="relative z-20 flex flex-col items-center flex-1"
            >
              {/* Circle with icon */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                  isActive
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-blue-300 text-blue-400"
                )}
              >
                <StepIcon className="h-6 w-6" />
              </div>

              {/* Label */}
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    "text-xs font-medium uppercase tracking-wide",
                    isActive ? "text-emerald-700" : "text-gray-500"
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
