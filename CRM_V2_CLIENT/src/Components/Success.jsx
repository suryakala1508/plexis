import { X, CheckCircle } from "lucide-react";
import React, { useEffect, useState } from "react";

export const Success = ({
  children,
  title = "Success",
  onClose,
  dismissible = true,
  autoClose = true,
  autoCloseDelay = 3000,
  icon: CustomIcon,
  className = "",
  makeDarker = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const IconComponent = CustomIcon || CheckCircle;

  return (
    <div
      className={`
        fixed top-4 right-4 z-[999] max-w-md border rounded-xl p-4 flex items-start gap-3 shadow-lg
        transition-all duration-300 ease-in-out
        ${
          makeDarker
            ? "bg-green-600 border-green-700 text-white"
            : "bg-white border-l-4 border-l-green-500 text-gray-800 shadow-xl border-t border-r border-b border-gray-100"
        }
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
      style={{
        animation: "slideInRight 0.3s ease-out",
      }}
    >
      <IconComponent
        className={`w-5 h-5 shrink-0 mt-0.5 ${
          makeDarker ? "text-white" : "text-green-500"
        }`}
      />

      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="text-sm">{children}</div>
      </div>

      {dismissible && (
        <button
          onClick={handleClose}
          style={{ background: "transparent" }}
          className={`rounded p-1 transition-colors ${
            makeDarker ? "hover:bg-green-700" : "hover:bg-green-500/20"
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
