import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles, Shield, Users, Briefcase } from "lucide-react";
import { verifyInvite } from "@/services/crewService";
import { setInvitePassword } from "@/services/crewService";

const InviteFlow = () => {
    const [step, setStep] = useState(1);
    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    let token = searchParams.get("token");
    let ref = searchParams.get("ref");

    // Fallback for when email clients (like Gmail) mistakenly URL-encode the query string
    if (!token || !ref) {
        try {
            // e.g., ?token%3D123%26ref%3Dabc -> ?token=123&ref=abc
            const decodedSearch = decodeURIComponent(window.location.search);
            const fallbackParams = new URLSearchParams(decodedSearch);
            token = token || fallbackParams.get("token") || fallbackParams.get("?token");
            ref = ref || fallbackParams.get("ref");
        } catch (e) {
            console.error("Failed to decode search params", e);
        }
    }

    useEffect(() => {
        if (!token || !ref) {
            setError("Missing invite parameters.");
            setLoading(false);
            return;
        }

        const fetchInvite = async () => {
            try {
                const data = await verifyInvite({ token, ref });
                setInviteData(data);
            } catch (err) {
                setError(err.response?.data?.message || "Invalid or expired invite link.");
            } finally {
                setLoading(false);
            }
        };

        fetchInvite();
    }, [token, ref]);

    const handleAccept = () => {
        setStep(2);
        setError("");
    };

    const handlePasswordSetup = async () => {
        setError("");
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setSubmitting(true);
        try {
            await setInvitePassword({ token, ref, password });

            setSuccess(true);
            // Navigate to login after password is set, but don't redirect immediately
            // Let the user see the success message first
            setTimeout(() => {
              // Store a flag that user just set password
              localStorage.setItem('justSetPassword', 'true');
              navigate(`/login`);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to set password. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const requirements = [
        { label: "At least 8 characters", valid: password.length >= 8 },
        { label: "At least 1 letter", valid: /[a-zA-Z]/.test(password) },
        { label: "At least 1 number or special character", valid: /[0-9!@#$%^&*]/.test(password) },
    ];

    const passwordStrength = (() => {
        let score = 0;
        requirements.forEach((r) => r.valid && score++);
        return (score / requirements.length) * 100;
    })();

    const getStrengthColor = () => {
        if (passwordStrength < 40) return "bg-gradient-to-r from-red-500 to-red-600";
        if (passwordStrength < 80) return "bg-gradient-to-r from-amber-500 to-orange-500";
        return "bg-gradient-to-r from-emerald-500 to-green-500";
    };

    const getStrengthLabel = () => {
        if (passwordStrength < 40) return "Weak";
        if (passwordStrength < 80) return "Good";
        return "Strong";
    };

    const LoadingSpinner = () => (
        <motion.div
            className="flex flex-col items-center justify-center min-h-[200px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.div className="relative w-20 h-20">
                <motion.div
                    className="absolute inset-0 border-4 border-gray-200 border-t-[#9916B1] rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute inset-2 border-4 border-gray-100 border-t-[#9916B1]/70 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>
            <motion.p
                className="text-gray-600 font-medium mt-6 text-base"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                Loading invitation...
            </motion.p>
        </motion.div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#9916B1_0%,_transparent_50%)] opacity-5"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#9916B1_0%,_transparent_50%)] opacity-5"></div>
                <motion.div
                    className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 relative z-10"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <LoadingSpinner />
                </motion.div>
            </div>
        );
    }

    if (error && !inviteData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50 px-4 relative overflow-hidden">
                <motion.div
                    className="text-center max-w-md mx-auto relative z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <motion.div
                        className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-200"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <AlertCircle className="text-red-500" size={48} strokeWidth={1.5} />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Oops! Something went wrong
                    </h3>
                    <p className="text-gray-600 text-base">{error}</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-gray-50 px-4 py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#9916B1_0%,_transparent_50%)] opacity-10"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#9916B1_0%,_transparent_50%)] opacity-10"></div>

            <motion.div
                className="w-full max-w-lg bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 relative z-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <AnimatePresence mode="wait">
                    {/* STEP 1: Invitation */}
                    {step === 1 && inviteData && !success && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <motion.div
                                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9916B1] to-[#7a11a3] flex items-center justify-center shadow-lg shadow-[#9916B1]/30"
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    <Sparkles className="text-white" size={24} />
                                </motion.div>
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-[#9916B1] to-[#c420e6] bg-clip-text text-transparent">
                                    You're Invited!
                                </h2>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-[#9916B1]/20 mb-6 shadow-sm">
                                <div className="flex items-start gap-3 mb-5 pb-5 border-b border-gray-200">
                                    <div className="w-10 h-10 rounded-xl bg-[#9916B1] flex items-center justify-center shadow-md">
                                        <Users className="text-white" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 font-medium mb-1">Studio</p>
                                        <p className="text-xl font-bold text-gray-900">{inviteData.studioName}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9916B1]/20 to-[#9916B1]/10 flex items-center justify-center border border-[#9916B1]/20">
                                            <span className="text-[#9916B1] font-bold text-sm">
                                                {inviteData.name?.charAt(0)?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Name</p>
                                            <p className="text-gray-900 font-semibold">{inviteData.name}</p>
                                        </div>
                                    </div>

                                    {Array.isArray(inviteData.roles) ? (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9916B1]/20 to-[#9916B1]/10 flex items-center justify-center border border-[#9916B1]/20">
                                                <Shield className="text-[#9916B1]" size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 font-medium mb-2">Role</p>
                                                <p className="text-gray-900 font-semibold">{inviteData.role}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9916B1]/20 to-[#9916B1]/10 flex items-center justify-center border border-[#9916B1]/20">
                                                <Shield className="text-[#9916B1]" size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Role</p>
                                                <p className="text-gray-900 font-semibold">{inviteData.role}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9916B1]/20 to-[#9916B1]/10 flex items-center justify-center border border-[#9916B1]/20">
                                            <Briefcase className="text-[#9916B1]" size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Position</p>
                                            <p className="text-gray-900 font-semibold">{inviteData.department}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {inviteData.notes && (
                                <motion.div
                                    className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-sm mb-6"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <p className="font-semibold mb-2 text-gray-900 flex items-center gap-2">
                                        <span className="text-lg">💬</span>
                                        Personal Note
                                    </p>
                                    <p className="text-gray-700 leading-relaxed">{inviteData.notes}</p>
                                </motion.div>
                            )}

                            <motion.button
                                onClick={handleAccept}
                                className="w-full mt-4 bg-gradient-to-r from-[#9916B1] to-[#7a11a3] hover:from-[#7a11a3] hover:to-[#5c0d7f] text-white transition-all duration-300 rounded-2xl py-4 font-semibold shadow-lg shadow-[#9916B1]/30 hover:shadow-xl hover:shadow-[#9916B1]/40 text-lg"
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Accept Invitation
                            </motion.button>
                        </motion.div>
                    )}

                    {/* STEP 2: Password Setup */}
                    {step === 2 && !success && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9916B1] to-[#7a11a3] flex items-center justify-center shadow-lg shadow-[#9916B1]/30">
                                    <Shield className="text-white" size={24} />
                                </div>
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-[#9916B1] to-[#c420e6] bg-clip-text text-transparent">
                                    Secure Your Account
                                </h2>
                            </div>

                            <div className="space-y-5">
                                {/* Password Field */}
                                <div>
                                    <label className="mb-2 text-gray-700 font-semibold block text-sm">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            className="w-full p-4 pr-12 rounded-xl text-gray-900 bg-white border-2 border-gray-200 focus:outline-none focus:border-[#9916B1] transition-all placeholder:text-gray-400"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={submitting}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((s) => !s)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#9916B1] transition-colors"
                                        >
                                            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="mb-2 text-gray-700 font-semibold block text-sm">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="Confirm your password"
                                            className="w-full p-4 pr-12 rounded-xl text-gray-900 bg-white border-2 border-gray-200 focus:outline-none focus:border-[#9916B1] transition-all placeholder:text-gray-400"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            disabled={submitting}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm((s) => !s)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#9916B1] transition-colors"
                                        >
                                            {showConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Strength bar */}
                            {password && (
                                <motion.div
                                    className="mt-6"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600 font-medium">Password Strength</span>
                                        <span className={`text-sm font-bold ${passwordStrength < 40 ? 'text-red-500' :
                                            passwordStrength < 80 ? 'text-amber-500' :
                                                'text-emerald-500'
                                            }`}>
                                            {getStrengthLabel()}
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full ${getStrengthColor()} shadow-md`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${passwordStrength}%` }}
                                            transition={{ duration: 0.3 }}
                                        ></motion.div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Requirements */}
                            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-5">
                                <p className="text-sm font-semibold text-gray-900 mb-3">Password must contain:</p>
                                <ul className="space-y-2.5">
                                    {requirements.map((req, i) => (
                                        <motion.li
                                            key={i}
                                            className="flex items-center gap-3 text-sm"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-all ${req.valid
                                                ? 'bg-emerald-500 shadow-sm'
                                                : 'bg-gray-300'
                                                }`}>
                                                {req.valid ? (
                                                    <CheckCircle2 className="text-white" size={14} strokeWidth={3} />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                                )}
                                            </div>
                                            <span className={req.valid ? "text-gray-900 font-medium" : "text-gray-500"}>
                                                {req.label}
                                            </span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>

                            {error && (
                                <motion.div
                                    className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mt-5"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="text-red-500" size={20} />
                                    <p className="text-red-700 text-sm font-medium">{error}</p>
                                </motion.div>
                            )}

                            <motion.button
                                onClick={handlePasswordSetup}
                                disabled={!requirements.every((r) => r.valid) || submitting}
                                className={`w-full mt-6 py-4 rounded-2xl font-semibold transition-all duration-300 text-lg shadow-lg ${requirements.every((r) => r.valid)
                                    ? "bg-gradient-to-r from-[#9916B1] to-[#7a11a3] hover:from-[#7a11a3] hover:to-[#5c0d7f] shadow-[#9916B1]/30 hover:shadow-xl hover:shadow-[#9916B1]/40 text-white"
                                    : "bg-gray-200 cursor-not-allowed text-gray-400 border border-gray-300"
                                    }`}
                                whileHover={requirements.every((r) => r.valid) ? { scale: 1.02, y: -2 } : {}}
                                whileTap={requirements.every((r) => r.valid) ? { scale: 0.98 } : {}}
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <motion.div
                                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        />
                                        Setting Password...
                                    </span>
                                ) : (
                                    "Set Password & Continue"
                                )}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Success screen */}
                    {success && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-200"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.5 }}
                            >
                                <CheckCircle2 className="text-emerald-500" size={48} strokeWidth={2.5} />
                            </motion.div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
                                Welcome Aboard!
                            </h2>
                            <p className="text-gray-600 font-medium mb-2">Password set successfully!</p>
                            <p className="text-sm text-gray-500">You will be redirected to the login page to sign in with your new password.</p>
                            <motion.div
                                className="flex justify-center gap-2 mt-6"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2.5 h-2.5 bg-[#9916B1] rounded-full"
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                ))}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default InviteFlow;