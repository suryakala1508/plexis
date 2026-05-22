"use client";
import React, { useState, useEffect } from "react";
import { MoveUp } from "lucide-react";
const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when scrolling down
  useEffect(() => {
    const toggleVisibility = () => {
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
    isVisible && (
      <div
        onClick={scrollToTop}
        className="fixed bottom-24 right-6 z-50 cursor-pointer rounded-full bg-purple-500 p-3 text-white shadow-lg hover:bg-purple-600 transition"
        aria-label="Scroll to top"
      >
        <MoveUp size={20} />
      </div>
    )
  );
};

export default ScrollToTop;