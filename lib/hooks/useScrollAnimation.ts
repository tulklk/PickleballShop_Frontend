import { useEffect, useRef, useState } from "react";

export function useScrollAnimation(options?: {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (options?.triggerOnce !== false) {
            observer.unobserve(element);
          }
        } else if (options?.triggerOnce === false) {
          setIsVisible(false);
        }
      },
      {
        threshold: options?.threshold || 0.1,
        rootMargin: options?.rootMargin || "0px",
      }
    );

    observer.observe(element);

    // Check if element is already in viewport after mount
    // Use multiple checks to handle browser scroll restoration
    const checkElement = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollY = window.scrollY || window.pageYOffset;
      
      // Check using both getBoundingClientRect and offsetTop for better reliability
      const isInViewportByRect = 
        rect.top < windowHeight &&
        rect.bottom > 0;
      
      // Also check using offsetTop - this is more reliable after browser scroll restoration
      const elementTop = element.offsetTop;
      const isInViewportByOffset = elementTop < (scrollY + windowHeight) && elementTop > (scrollY - element.offsetHeight);
      
      if (isInViewportByRect || isInViewportByOffset) {
        setIsVisible(true);
        if (options?.triggerOnce !== false) {
          observer.unobserve(element);
        }
      }
    };

    // Check multiple times to catch elements in different scenarios
    const rafId = requestAnimationFrame(() => {
      checkElement();
    });
    const timeoutId1 = setTimeout(checkElement, 100);
    const timeoutId2 = setTimeout(checkElement, 300);
    const timeoutId3 = setTimeout(checkElement, 500);
    const timeoutId4 = setTimeout(checkElement, 800);
    
    // Fallback: Force show content after 1.2 seconds if still not visible
    // This ensures content is always visible even if IntersectionObserver fails
    const fallbackTimeout = setTimeout(() => {
      setIsVisible(true);
      observer.disconnect();
    }, 1200);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      clearTimeout(timeoutId4);
      clearTimeout(fallbackTimeout);
      observer.disconnect();
    };
  }, [options?.threshold, options?.rootMargin, options?.triggerOnce]);

  return { ref, isVisible };
}

