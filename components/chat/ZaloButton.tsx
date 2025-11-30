"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import zaloIcon from "@/app/img/zalo_icon.png";

export function ZaloButton() {
  const handleZaloClick = () => {
    // Open Zalo in new tab
    window.open("https://zalo.me/0911.221.474", "_blank");
  };

  return (
    <Button
      onClick={handleZaloClick}
      className="fixed bottom-3 md:bottom-6 right-3 md:right-6 z-50 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 bg-blue-500 hover:bg-blue-600"
      size="icon"
      aria-label="Liên hệ Zalo"
    >
      <Image
        src={zaloIcon}
        alt="Zalo"
        width={28}
        height={28}
        className="object-contain md:w-8 md:h-8"
      />
    </Button>
  );
}

