import React, { useEffect, useRef, useState } from "react";

/**
 * Reusable Context Menu Component
 * @param {boolean} open - Whether menu is open
 * @param {function} onClose - Close handler
 * @param {Array} items - Menu items array with { icon, label, onClick, danger, divider }
 * @param {string} position - "top-right" | "bottom-right" | etc
 */
const ContextMenu = ({ open, onClose, items, position = "top-right" }) => {
  const menuRef = useRef(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !menuRef.current) return;

    // Adjust menu position to stay within viewport
    setTimeout(() => {
      const rect = menuRef.current?.getBoundingClientRect();
      if (!rect) return;

      let newPosition = position;

      // Check if menu goes off-screen to the right
      if (rect.right > window.innerWidth - 10) {
        newPosition = position.includes("right")
          ? position.replace("right", "left")
          : position;
      }

      // Check if menu goes off-screen to the bottom
      if (rect.bottom > window.innerHeight - 10) {
        newPosition = newPosition.includes("bottom")
          ? newPosition
          : newPosition.replace("top", "bottom");
      }

      // Check if menu goes off-screen to the top
      if (rect.top < 10) {
        newPosition = newPosition.replace("top", "bottom");
      }

      setAdjustedPosition(newPosition);
    }, 0);
  }, [open, position]);

  if (!open) return null;

  const positionClasses = {
    "top-right": "top-10 right-0",
    "bottom-right": "bottom-10 right-0",
    "top-left": "top-10 left-0",
    "bottom-left": "bottom-10 left-0",
  };

  return (
    <div
      ref={menuRef}
      className={`absolute ${positionClasses[adjustedPosition]} bg-white border border-gray-200 rounded-lg shadow-2xl z-[2147483647] min-w-[160px] max-w-[280px] max-h-[70vh] overflow-y-auto py-1.5`}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <div key={`divider-${index}`} className="h-px bg-gray-200 my-1" />
          );
        }

        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick(e);
              onClose();
            }}
            className={`flex items-center gap-2 w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors whitespace-nowrap ${
              item.danger
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {item.icon && (
              <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>
            )}
            <span className="font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
