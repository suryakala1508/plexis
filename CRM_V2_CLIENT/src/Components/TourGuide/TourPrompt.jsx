import { useState, useEffect } from 'react';
import './TourPrompt.css';

/**
 * TourPrompt - Shows a small popup at top right asking if user wants a tour
 * Displays for 2 seconds, then auto-hides if not clicked
 * 
 * @param {Function} onStartTour - Callback when user clicks "Yes, show tour"
 * @param {Function} onDismiss - Callback when user dismisses or timeout
 * @param {string} tourKey - Unique identifier (not used for storage checks anymore)
 */
export const TourPrompt = ({ onStartTour, onDismiss, tourKey = "default-tour" }) => {
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Show prompt after a brief delay
    const showTimer = setTimeout(() => {
      setVisible(true);
    }, 300);

    // Auto-hide after 2 seconds if not hovered
    const hideTimer = setTimeout(() => {
      if (!isHovered) {
        setVisible(false);
        onDismiss?.();
      }
    }, 2300);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isHovered, onDismiss]);

  const handleStartTour = () => {
    setVisible(false);
    onStartTour?.();
  };

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div 
      className="tour-prompt-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="tour-prompt-content">
        <div className="tour-prompt-header">
          <div className="tour-prompt-icon">🎯</div>
          <p className="tour-prompt-question">Do you want a tour?</p>
        </div>
        <div className="tour-prompt-actions">
          <button 
            className="tour-prompt-btn tour-prompt-btn-primary"
            onClick={handleStartTour}
          >
            Yes
          </button>
          <button 
            className="tour-prompt-btn tour-prompt-btn-secondary"
            onClick={handleDismiss}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourPrompt;
