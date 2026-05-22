import React from "react";
import { X } from "lucide-react";

export const GalleryModals = ({
  showPinModal,
  setShowPinModal,
  pinInput,
  setPinInput,
  pinError,
  setPinError,
  setPendingDownloadAction,
  setPendingFavoriteAction,
  handleClientPasswordVerification,
  showEmailModal,
  setShowEmailModal,
  emailInput,
  setEmailInput,
  emailError,
  setEmailError,
  handleEmailSubmit,
  showDownloadQualityModal,
  setShowDownloadQualityModal,
  handleQualitySelection,
  selectedQuality,
  setSelectedQuality,
  downloadTarget,
  clientEmail,
}) => {
  return (
    <>
      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Enter PIN</h2>
                <button
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput("");
                    setPinError("");
                    setPendingDownloadAction(null);
                    setPendingFavoriteAction(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <p className="text-gray-600">
                Enter the PIN provided by your photographer to download and
                favorite images.
              </p>
            </div>

            {/* Input Section */}
            <div className="px-8 pb-8">
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={pinInput}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4);
                      setPinInput(value);
                      setPinError("");
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleClientPasswordVerification();
                      }
                    }}
                    className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all text-center text-3xl font-bold tracking-[0.5em] ${
                      pinError
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-gray-900"
                    }`}
                    placeholder="••••"
                    maxLength={4}
                    autoFocus
                  />
                  {pinError && (
                    <div className="flex items-center gap-2 mt-2 text-red-600">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm font-medium">{pinError}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowPinModal(false);
                      setPinInput("");
                      setPinError("");
                      setPendingDownloadAction(null);
                       setPendingFavoriteAction(null);
                    }}
                    className="flex-1 px-6 py-3.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClientPasswordVerification}
                    disabled={!pinInput.trim()}
                    className="flex-1 px-6 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verify PIN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Collection Modal */}
      {/* MODERN EMAIL COLLECTION MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Favorites</h2>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailInput("");
                    setEmailError("");
                    setPendingFavoriteAction(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Save your favorite photos and revisit them at anytime using your
                email address. You can share this list with your photographer,
                family and friends.
              </p>
            </div>

            {/* Input Section */}
            <div className="px-8 pb-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setEmailError("");
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleEmailSubmit();
                      }
                    }}
                    className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all ${
                      emailError
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-gray-900"
                    }`}
                    placeholder="your.email@example.com"
                    autoFocus
                  />
                  {emailError && (
                    <div className="flex items-center gap-2 mt-2 text-red-600">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm font-medium">{emailError}</p>
                    </div>
                  )}
                </div>

                {/* Info Box - Like Screenshot */}

                {/* Action Button */}
                <button
                  onClick={handleEmailSubmit}
                  disabled={!emailInput.trim()}
                  className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Quality Modal */}
      {showDownloadQualityModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col items-center pt-8 pb-10 px-8">
            <h2 className="text-xl font-medium text-gray-800 flex items-center gap-2 mb-8 tracking-wide" style={{ fontFamily: "'Jost', sans-serif" }}>
              Choose Image Quality
              <span className="text-gray-500 rounded-full border border-gray-500 w-[18px] h-[18px] flex items-center justify-center text-[11px] cursor-help" title="High-Res for printing, Web-Size for social media">?</span>
            </h2>

            <div className="flex w-full border border-gray-200 rounded-sm overflow-hidden">
              <button
                onClick={() => setSelectedQuality("high")}
                className={`flex-1 py-4 text-center text-[15px] font-medium transition-colors flex items-center justify-center gap-2 ${
                  selectedQuality === "high" ? "bg-gray-100 text-gray-800" : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {selectedQuality === "high" && <span className="text-gray-600"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>}
                High-Res
              </button>
              <div className="w-[1px] bg-gray-200"></div>
              <button
                onClick={() => setSelectedQuality("web")}
                className={`flex-1 py-4 text-center text-[15px] font-medium transition-colors flex items-center justify-center gap-2 ${
                  selectedQuality === "web" ? "bg-gray-100 text-gray-800" : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {selectedQuality === "web" && <span className="text-gray-600"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>}
                Web-Size
              </button>
            </div>

            <div className="w-full flex gap-3 mt-8 flex-col sm:flex-row">
               <button
                  onClick={() => setShowDownloadQualityModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700 uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <div className="flex-[2] flex gap-3 flex-col sm:flex-row">
                  <button
                    onClick={handleQualitySelection}
                    className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-all font-medium uppercase tracking-widest text-xs shadow-sm"
                  >
                    Download
                  </button>
       
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
