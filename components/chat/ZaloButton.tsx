"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import zaloIcon from "@/app/img/zalo_icon.png";

export function ZaloButton() {
  const handleZaloClick = () => {
    // Open Zalo in new tab
    window.open("https://zalo.me/0911.221.474", "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleZaloClick}
      className="fixed bottom-3 md:bottom-6 right-3 md:right-6 z-40 shadow-lg transition-all duration-300 hover:scale-110 bg-transparent hover:bg-transparent border-0 p-0 cursor-pointer inline-flex items-center justify-center"
      aria-label="Liên hệ Zalo"
    >
      <Image
        src={zaloIcon}
        alt="Zalo"
        width={48}
        height={48}
        className="w-12 h-12 md:w-14 md:h-14 object-contain rounded-lg"
        style={{ 
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
          WebkitFilter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
        }}
      />
    </button>
  );
}

