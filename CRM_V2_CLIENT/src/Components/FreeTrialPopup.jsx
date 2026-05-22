import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'freeTrialPopupDismissed';

const FreeTrialPopup = ({ user }) => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user || sessionStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timer);
  }, [user]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleGetStarted = () => {
    dismiss();
    navigate('/signup');
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md rounded-2xl bg-white border border-purple-100 shadow-2xl shadow-purple-100/50 overflow-hidden pointer-events-auto"
              role="dialog"
              aria-label="Free trial offer"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-purple-600 to-violet-600 px-7 py-5">
                <button
                  onClick={dismiss}
                  aria-label="Dismiss"
                  className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X size={14} />
                </button>
                <p className="text-xs font-semibold uppercase tracking-widest text-purple-200 mb-1">
                  Try free for 7 days
                </p>
                <h2 className="text-xl font-bold text-white leading-snug">
                  Everything your studio needs, in one place.
                </h2>
              </div>

              {/* Body */}
              <div className="px-7 py-6">
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Plexis gives you everything you need to manage your studio, from bookings and contracts to client portals and album delivery — all in one seamless platform.
                </p>

                {/* CTA */}
                <button
                  onClick={handleGetStarted}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 transition-all duration-200 shadow-md shadow-purple-300/30"
                >
                  Start your free 7-day trial
                </button>
                <p className="text-xs text-center text-gray-400 mt-3">
                  No credit card · Cancel anytime
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FreeTrialPopup; 