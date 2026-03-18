import { useCallback, useEffect, useId, useRef, useState } from "react";

interface HelperTooltipProps {
  content: string;
  placement?: "top" | "bottom";
  className?: string;
}

const HOVER_DELAY_MS = 350;

const HelperTooltip: React.FC<HelperTooltipProps> = ({ content, placement = "top", className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPlacement, setActualPlacement] = useState(placement);
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPointerInsideRef = useRef(false);

  const show = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setActualPlacement(rect.top < 80 ? "bottom" : placement);
    }
    setIsVisible(true);
  }, [placement]);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handlePointerEnter = useCallback(() => {
    isPointerInsideRef.current = true;
    clearHoverTimeout();
    hoverTimeoutRef.current = setTimeout(show, HOVER_DELAY_MS);
  }, [show, clearHoverTimeout]);

  const handlePointerLeave = useCallback(() => {
    isPointerInsideRef.current = false;
    clearHoverTimeout();
    // Small delay to allow moving from trigger to bubble
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isPointerInsideRef.current) {
        hide();
      }
    }, 100);
  }, [hide, clearHoverTimeout]);

  const handleFocus = useCallback(() => {
    show();
  }, [show]);

  const handleBlur = useCallback(() => {
    hide();
  }, [hide]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        hide();
      }
    },
    [hide],
  );

  // Touch: tap to toggle
  const handleClick = useCallback(() => {
    if (isVisible) {
      hide();
    } else {
      show();
    }
  }, [isVisible, show, hide]);

  // Close on outside click (touch devices)
  useEffect(() => {
    if (!isVisible) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        bubbleRef.current &&
        !bubbleRef.current.contains(target)
      ) {
        hide();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isVisible, hide]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <span className={`helper-tooltip ${className ?? ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className="helper-tooltip-trigger"
        aria-label="More info"
        aria-describedby={isVisible ? tooltipId : undefined}
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <text
            x="8"
            y="12"
            textAnchor="middle"
            fill="currentColor"
            fontSize="10"
            fontWeight="600"
            fontFamily="inherit"
          >
            ?
          </text>
        </svg>
      </button>
      {isVisible && (
        <div
          ref={bubbleRef}
          id={tooltipId}
          role="tooltip"
          className={`helper-tooltip-bubble helper-tooltip-${actualPlacement}`}
          onMouseEnter={handlePointerEnter}
          onMouseLeave={handlePointerLeave}
        >
          {content}
        </div>
      )}
    </span>
  );
};

export default HelperTooltip;
