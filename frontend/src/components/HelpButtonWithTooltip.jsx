import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";

export const HelpButtonWithTooltip = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  const tooltipContent = `Hotkeys:
• Ctrl + Mouse Wheel - Zoom (focus on cursor)
• Shift + Mouse Wheel - Horizontal scroll
• Mouse Wheel - Vertical scroll
• Double click - Add element at click position
• Ctrl + C - Copy
• Ctrl + V - Paste
• Ctrl + B - Split
• Del/Backspace - Delete
• + - Zoom in
• - - Zoom out
• 0 - Reset zoom

Smart placement:
• Video → Main track
• Audio → Audio track  
• Images/Text → Overlay track
• Automatically finds the best position
• Places element at current time or after the last item`;

  const updateTooltipPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }
  };

  const handleMouseEnter = () => {
    updateTooltipPosition();
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (showTooltip) {
        updateTooltipPosition();
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [showTooltip]);

  const tooltip = showTooltip && (
    <div
      className="fixed z-[9999] p-6 w-[400px] pointer-events-none"
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        transform: "translate(-80%, -100%)",
      }}
    >
      <div className="bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl max-w-md whitespace-pre-line">
        {tooltipContent}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        <HelpCircle size={16} />
      </button>

      {typeof document !== "undefined" && createPortal(tooltip, document.body)}
    </>
  );
};
