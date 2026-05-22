import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink, CheckCircle } from "lucide-react"
import { Button } from "@/Components/ui/button"

export const QuickActionModal = ({
  isOpen,
  onClose,
  title,
  description,
  content
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal - Centered */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-[#9916b1]/5 to-[#9916b1]/10">
                <div className="flex-1 pr-4">
                  <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{description}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </motion.button>
              </div>

              {/* Scrollable Content */}
              <div className="max-h-[50vh] overflow-y-auto">
                <div className="p-5 space-y-5">
                  {/* Steps */}
                  {content.steps && content.steps.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#9916b1] flex items-center justify-center shadow-md">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </span>
                        Step-by-step guide
                      </h4>
                      <ol className="space-y-3">
                        {content.steps.map((step, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            className="flex gap-3 group"
                          >
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#9916b1] text-white text-xs font-bold shrink-0 shadow-md group-hover:scale-110 transition-transform">
                              {index + 1}
                            </span>
                            <span className="text-sm text-slate-700 pt-1 leading-relaxed">
                              {step}
                            </span>
                          </motion.li>
                        ))}
                      </ol>
                    </motion.div>
                  )}

                  {/* Image */}
                  {content.imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                    >
                      <img
                        src={content.imageUrl}
                        alt={title}
                        className="w-full h-48 object-cover"
                      />
                    </motion.div>
                  )}

                  {/* Tips */}
                  {content.tips && content.tips.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-4 rounded-xl bg-amber-50 border border-amber-200"
                    >
                      <h4 className="text-sm font-bold text-amber-900 mb-2">
                        💡 Pro Tips
                      </h4>
                      <ul className="space-y-2">
                        {content.tips.map((tip, index) => (
                          <li
                            key={index}
                            className="text-sm text-amber-800 flex gap-2"
                          >
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Note */}
                  {content.note && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="p-3 rounded-lg bg-blue-50 border border-blue-200"
                    >
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold text-blue-900">
                          Note:{" "}
                        </span>
                        {content.note}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-200 bg-slate-50">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
