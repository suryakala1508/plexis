import { useEffect, useRef, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./TourGuide.css";

/**
 * TourGuide - Reusable component for guided tours using Driver.js
 * 
 * @param {Array} steps - Array of tour step objects with format:
 *   {
 *     element: string (CSS selector),
 *     popover: {
 *       title: string,
 *       description: string,
 *       side?: "top" | "right" | "bottom" | "left",
 *       align?: "start" | "center" | "end"
 *     }
 *   }
 * @param {string} tourKey - Unique identifier for this tour (e.g., 'inventory-tour')
 * @param {boolean} autoStart - Whether to auto-start the tour on first visit (default: true)
 * @param {Object} config - Additional Driver.js config options to override defaults
 * @param {Function} onComplete - Callback when tour completes
 * @param {Function} onExit - Callback when tour is skipped/exited
 */
export const TourGuide = ({ 
  steps = [], 
  tourKey = "default-tour",
  autoStart = false,
  // IMPORTANT: don't default to `{}` here.
  // A new object each render would retrigger the effect and destroy the tour mid-run.
  config,
  onComplete,
  onExit,
  onStartTour // Callback to expose start method
}) => {
  const driverRef = useRef(null);
  const currentStepRef = useRef(0); // Track current step manually
  const individualSectionRef = useRef(false); // Individual section tour (no chain, no sessionStorage)
  const onCompleteRef = useRef(onComplete);
  const onExitRef = useRef(onExit);
  const onStartTourRef = useRef(onStartTour);

  // Keep latest callbacks without forcing driver re-init
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    onStartTourRef.current = onStartTour;
  }, [onStartTour]);

  useEffect(() => {
    if (!steps || steps.length === 0) return;

    const tourStatus = sessionStorage.getItem(`tour-${tourKey}`);
    
    // Auto start only if not completed/skipped AND autoStart flag is true
    const shouldStart = autoStart && !tourStatus;

    const defaultConfig = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      overlayColor: 'rgba(0, 0, 0, 0.92)',
      smoothScroll: true,
      animate: true,
     allowClose: true,  
  overlayClickBehavior: 'none',  //  changes overlay click to go to next instead of close
      popoverClass: 'plexis-tour-popover',
        disableActiveInteraction: true,  
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Finish',
      progressText: '{{current}} of {{total}}',
      
      // Track step changes
      onHighlightStarted: (element, step, options) => {
        currentStepRef.current = options.state.activeIndex;
        if (element) {
          element.classList.add('plexis-tour-highlight');
        }
      },
      
      onDeselected: (element) => {
        if (element) {
          element.classList.remove('plexis-tour-highlight');
        }
      },
      
      // Use onDestroyed instead of onDestroyStarted
      onDestroyed: () => {
        const isIndividual = individualSectionRef.current;
        // Relax check for studio-profile-tour: last step (#studio-profile-delete) may be missing for non-owners
        const isLastStep = currentStepRef.current === steps.length - 1
          || (tourKey === 'studio-profile-tour' && currentStepRef.current >= Math.max(0, steps.length - 2));

        // Add small delay before dispatching to allow DOM to settle
        setTimeout(() => {
          if (isIndividual) {
            // Individual section: no sessionStorage
            if (!isLastStep) {
              onExitRef.current?.(); // Skipped early
            } else if (['leads-tour', 'projects-tour'].includes(tourKey)) {
              // Leads/Projects: still call onComplete to go inside demo, pass flag for return
              onCompleteRef.current?.({ isIndividualSection: true });
            }
            window.dispatchEvent(
              new CustomEvent("plexis-tour-finished", { detail: { tourKey } })
            );
          } else {
            // Chain or auto-start: persist to sessionStorage, call onComplete when done
            if (isLastStep) {
              sessionStorage.setItem(`tour-${tourKey}`, "completed");
              onCompleteRef.current?.();
              window.dispatchEvent(
                new CustomEvent("plexis-tour-finished", { detail: { tourKey } })
              );
            } else {
              sessionStorage.setItem(`tour-${tourKey}`, "skipped");
              onExitRef.current?.();
              
              // If user manually closes/skips, mark as done in backend too (per user request)
              // This prevents the banner from showing up again
              import('../../services/studioService').then(({ completeTour }) => {
                completeTour().catch(err => console.error('Failed to persist tour skip:', err));
              });
            }
          }
          currentStepRef.current = 0;
          individualSectionRef.current = false;
        }, 100);
      },
      
      ...(config ?? {}),
      steps: steps
    };

    driverRef.current = driver(defaultConfig);

    // Expose startTour method to parent after driver is initialized
    if (onStartTourRef.current) {
      const startTourFn = () => {
        if (driverRef.current && steps && steps.length > 0) {
          driverRef.current.drive();
        }
      };
      onStartTourRef.current(startTourFn);
    }

    let timer = null;
    if (shouldStart) {
      timer = setTimeout(() => {
        driverRef.current?.drive();
      }, 500);
    }

    // Event listener for sidebar or global "start tour" trigger
    const handleStartTourEvent = (e) => {
  if (e.detail?.tourKey === tourKey) {
    individualSectionRef.current = !!e.detail?.individualSection;

    // Check if first step element exists before starting
    if (steps && steps.length > 0) {
      const firstElement = document.querySelector(steps[0].element);
      if (!firstElement) {
        console.warn('⚠️ First element not found:', steps[0].element, '- retrying in 500ms');
        setTimeout(() => {
          const retryElement = document.querySelector(steps[0].element);
          if (retryElement) {
            driverRef.current?.drive();
          } else {
            console.error('❌ Element still not found after retry');
          }
        }, 500);
        return;
      }
    }
    
    driverRef.current?.drive();
  }
};

    const handleNextStep = () => {
        // slight delay to allow UI to update if needed
        setTimeout(() => {
            driverRef.current?.moveNext();
        }, 100);
    };

    const handlePrevStep = () => {
         setTimeout(() => {
            driverRef.current?.movePrevious();
        }, 100);
    };

    window.addEventListener('plexis-start-tour', handleStartTourEvent);
    window.addEventListener('plexis-tour-next', handleNextStep);
    window.addEventListener('plexis-tour-prev', handlePrevStep);

    return () => {
      window.removeEventListener('plexis-start-tour', handleStartTourEvent);
      window.removeEventListener('plexis-tour-next', handleNextStep);
      window.removeEventListener('plexis-tour-prev', handlePrevStep);
      if (timer) clearTimeout(timer);
      if (driverRef.current) {
        try {
          driverRef.current.destroy();
        } catch (e) {
          // Already destroyed
        }
      }
    };
  }, [steps, tourKey, autoStart, config]);

  return null;
};

/**
 * Hook for manual tour control and tour status management
 * 
 * @param {string} tourKey - The unique tour identifier
 * @returns {Object} - Tour control methods
 */
const useTourGuide = (tourKey) => {
  const [driverInstance, setDriverInstance] = useState(null);

  /**
   * Start or restart the tour manually
   * @param {Array} steps - Optional steps array if not using TourGuide component
   * @param {Object} config - Optional config object
   */
  const startTour = (steps = null, config = {}) => {
    if (steps) {
      const driverObj = driver({
        showProgress: true,
        popoverClass: 'plexis-tour-popover',
        overlayColor: 'rgba(0, 0, 0, 0.92)',
        smoothScroll: true,
        animate: true,
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: '🎉 Finish',
        progressText: '{{current}} of {{total}}',
        ...config,
        steps: steps
      });
      
      setDriverInstance(driverObj);
      driverObj.drive();
    }
  };

  /**
   * Reset tour status in session storage (allows tour to show again)
   */
  const resetTour = () => {
    sessionStorage.removeItem(`tour-${tourKey}`);
  };

  /**
   * Skip tour permanently (stores in localStorage)
   */
  const skipTourForever = () => {
    localStorage.setItem(`tour-${tourKey}`, "skipped-forever");
    sessionStorage.setItem(`tour-${tourKey}`, "skipped");
  };

  /**
   * Check if tour has been completed or skipped
   * @returns {boolean}
   */
  const hasTourBeenCompleted = () => {
    const session = sessionStorage.getItem(`tour-${tourKey}`);
    const local = localStorage.getItem(`tour-${tourKey}`);
    return session === "completed" || local === "skipped-forever";
  };

  /**
   * Check if tour is currently active
   * @returns {boolean}
   */
  const isTourActive = () => {
    // driver.js v1 doesn't expose a simple property, using existence of instance as proxy
    return !!driverInstance;
  };

  /**
   * Move to next step
   */
  const moveNext = () => {
    if (driverInstance) {
      driverInstance.moveNext();
    }
  };

  /**
   * Move to previous step
   */
  const movePrevious = () => {
    if (driverInstance) {
      driverInstance.movePrevious();
    }
  };

  /**
   * Move to specific step
   * @param {number} index - Step index (0-based)
   */
  const moveTo = (index) => {
    if (driverInstance) {
      driverInstance.moveTo(index);
    }
  };

  /**
   * Destroy/close the tour
   */
  const destroyTour = () => {
    if (driverInstance) {
      try {
        driverInstance.destroy();
      } catch (e) {
        // Ignore
      }
    }
  };

  return {
    startTour,
    resetTour,
    skipTourForever,
    hasTourBeenCompleted,
    isTourActive,
    moveNext,
    movePrevious,
    moveTo,
    destroyTour,
    driverInstance
  };
};

/**
 * Example usage:
 * 
 * // In your component:
 * import { TourGuide } from './TourGuide';
 * 
 * const steps = [
 *   {
 *     element: '.header-section',
 *     popover: {
 *       title: 'Welcome to Inventory',
 *       description: 'This section shows your product inventory details.',
 *       side: 'bottom',
 *       align: 'start'
 *     }
 *   },
 *   {
 *     element: '#search-bar',
 *     popover: {
 *       title: 'Search Products',
 *       description: 'Use this search bar to quickly find products.',
 *       side: 'bottom'
 *     }
 *   }
 * ];
 * 
 * function InventoryPage() {
 *   return (
 *     <>
 *       <TourGuide 
 *         steps={steps} 
 *         tourKey="inventory-tour" 
 *         autoStart={true}
 *       />
 *       {/* Your page content *\/}
 *     </>
 *   );
 * }
 * 
 * // For manual control:
 * const { startTour, resetTour } = useTourGuide('inventory-tour');
 * 
 * // Trigger tour manually
 * <button onClick={() => { resetTour(); startTour(steps); }}>
 *   Start Tour
 * </button>
 */

export default TourGuide;