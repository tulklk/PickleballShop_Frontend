"use client";

import { useState, useEffect } from "react";

interface TypingTextProps {
  text: string;
  speed?: number;
  deleteSpeed?: number;
  pauseTime?: number;
  className?: string;
  showCursor?: boolean;
  loop?: boolean;
  onComplete?: () => void;
}

export function TypingText({ 
  text, 
  speed = 100,
  deleteSpeed = 50,
  pauseTime = 2000,
  className = "",
  showCursor = true,
  loop = false,
  onComplete
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Typing phase: từ trái sang phải
    if (isTyping && !isPaused && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
    
    // Pause phase: dừng lại sau khi gõ xong
    else if (isTyping && !isPaused && currentIndex >= text.length) {
      const timeout = setTimeout(() => {
        setIsPaused(true);
        if (loop) {
          // Sau khi pause, bắt đầu xóa
          setTimeout(() => {
            setIsTyping(false);
            setIsPaused(false);
          }, pauseTime);
        } else {
          setIsComplete(true);
          if (onComplete) {
            onComplete();
          }
        }
      }, pauseTime);

      return () => clearTimeout(timeout);
    }
    
    // Deleting phase: từ phải sang trái
    else if (!isTyping && !isPaused && currentIndex > 0) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev.slice(0, -1));
        setCurrentIndex((prev) => prev - 1);
      }, deleteSpeed);

      return () => clearTimeout(timeout);
    }
    
    // Reset phase: bắt đầu lại từ đầu (nếu loop)
    else if (!isTyping && !isPaused && currentIndex === 0 && loop) {
      setIsTyping(true);
      setDisplayedText("");
    }
  }, [currentIndex, text, speed, deleteSpeed, pauseTime, isTyping, isPaused, loop, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && (
        <span className="typing-cursor">|</span>
      )}
    </span>
  );
}

