"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when user scrolls down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <Button
          onClick={scrollToTop}
          className="fixed top-1/2 -translate-y-1/2 right-3 md:right-6 z-40 rounded-md w-9 h-9 md:w-10 md:h-10 p-0 shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 hover:scale-110 animate-in fade-in slide-in-from-bottom-4"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      )}
    </>
  );
}

