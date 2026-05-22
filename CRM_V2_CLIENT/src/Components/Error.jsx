import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import React, { useEffect, useState } from "react";

export const Error = ({
  children,
  title,
  variant = "error",
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

  const variants = {
    error: {
      container: "bg-white border-l-4 border-l-red-500 text-gray-800 shadow-xl border-t border-r border-b border-gray-100",
      containerDark: "bg-red-600 border-red-700 text-white",
      icon: AlertCircle,
      iconColor: "text-red-500",
      iconColorDark: "text-white",
      hoverDark: "hover:bg-red-700",
    },
    success: {
      container: "bg-white border-l-4 border-l-green-500 text-gray-800 shadow-xl border-t border-r border-b border-gray-100",
      containerDark: "bg-green-600 border-green-700 text-white",
      icon: CheckCircle,
      iconColor: "text-green-500",
      iconColorDark: "text-white",
      hoverDark: "hover:bg-green-700",
    },
    warning: {
      container: "bg-white border-l-4 border-l-yellow-500 text-gray-800 shadow-xl border-t border-r border-b border-gray-100",
      containerDark: "bg-yellow-600 border-yellow-700 text-white",
      icon: AlertTriangle,
      iconColor: "text-yellow-500",
      iconColorDark: "text-white",
      hoverDark: "hover:bg-yellow-700",
    },
    info: {
      container: "bg-white border-l-4 border-l-blue-500 text-gray-800 shadow-xl border-t border-r border-b border-gray-100",
      containerDark: "bg-blue-600 border-blue-700 text-white",
      icon: Info,
      iconColor: "text-blue-500",
      iconColorDark: "text-white",
      hoverDark: "hover:bg-blue-700",
    },
  };

  const config = variants[variant] || variants.error;
  const IconComponent = CustomIcon || config.icon;

  return (
    <div
      className={`
        fixed top-4 right-4 z-[9999] max-w-md border rounded-xl p-4 flex items-start gap-3 shadow-lg
        transition-all duration-300 ease-in-out
        ${makeDarker ? config.containerDark : config.container}
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
      style={{
        animation: "slideInRight 0.3s ease-out",
      }}
    >
      <IconComponent
        className={`w-5 h-5 shrink-0 mt-0.5 ${makeDarker ? config.iconColorDark : config.iconColor
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
          className={`rounded p-1 transition-colors ${makeDarker ? config.hoverDark : ""
            }`}
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
