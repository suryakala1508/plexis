import React, { useState } from "react";
import { ChevronDown, Loader2, Send } from "lucide-react";
import { post } from "../../services/api";
const serviceOptions = ["Studio Owner", "Photographers", "Printing Vendors", "Other"];

export default function ContactUsSection() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
    message: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelect = (option) => {
    setSelectedService(option);
    setFormData(prev => ({ ...prev, service: option }));
    setDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields and lengths
    if (!formData.firstName || formData.firstName.length < 2) {
      alert("First name is required and must be at least 2 characters.");
      return;
    }
    if (!formData.lastName || formData.lastName.length < 2) {
      alert("Last name is required and must be at least 2 characters.");
      return;
    }
    if (!formData.email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      alert("A valid email address is required.");
      return;
    }
    if (!formData.phone || formData.phone.length !== 10) {
      alert("Phone number is required and must be 10 digits.");
      return;
    }
    if (!formData.service) {
      alert("Service selection is required.");
      return;
    }
    if (!formData.message) {
      alert("Message is required and must be at least 10 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await post('contact/send-message', formData);

      if (result.success) {
        // Show success modal
        setShowModal(true);
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          service: "",
          message: ""
        });
        setSelectedService("");
      } else {
        // Show error message
        alert(result.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-violet-50">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Heading */}
          <div className="space-y-6">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-violet-600">
                Reach out today —
              </span>
              <br />
              <span className="text-gray-800">
                we're here to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  listen
                </span>
                ,
              </span>
              <br />
              <span className="text-gray-800">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-violet-600">
                  guide
                </span>
                , and{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  support
                </span>
                .
              </span>
            </h2>
            <p className="text-gray-600 text-lg max-w-xl">
              Have questions or ready to start your project? Drop us a message and our team will get back to you within 24 hours.
            </p>
          </div>

          {/* Right Side - Compact Form */}
          <div className="relative max-w-xl mx-auto lg:mx-0">
            <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/50 p-6 lg:p-8 relative overflow-hidden">
              {/* Glassmorphism gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-pink-100/20 to-transparent pointer-events-none"></div>

              <div className="relative space-y-4">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First Name *"
                      className="w-full rounded-xl px-4 py-2.5 border border-gray-200 outline-none transition-all duration-300 bg-white/90 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-gray-900 placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last Name *"
                      className="w-full rounded-xl px-4 py-2.5 border border-gray-200 outline-none transition-all duration-300 bg-white/90 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-gray-900 placeholder-gray-400 text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address *"
                  className="w-full rounded-xl px-4 py-2.5 border border-gray-200 outline-none transition-all duration-300 bg-white/90 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-gray-900 placeholder-gray-400 text-sm"
                />

                {/* Phone */}
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="Phone Number *"
                  maxLength={10}
                  inputMode="numeric"
                  className="w-full rounded-xl px-4 py-2.5 border border-gray-200 outline-none transition-all duration-300 bg-white/90 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-gray-900 placeholder-gray-400 text-sm"
                />

                {/* Service Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full rounded-xl px-4 py-2.5 border border-gray-200 outline-none transition-all duration-300 bg-white/90 hover:border-purple-400 text-gray-900 text-sm text-left flex items-center justify-between"
                  >
                    <span className={selectedService ? "text-gray-900" : "text-gray-400"}>
                      {selectedService || "Role in Studio *"}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-20 w-full mt-2 rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden">
                      {serviceOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleSelect(option)}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-colors duration-200"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message */}
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us about your project... *"
                  rows={3}
                  className="w-full rounded-xl px-4 py-2.5 border border-gray-200 outline-none transition-all duration-300 bg-white/90 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-gray-900 placeholder-gray-400 text-sm resize-none"
                />

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full rounded-xl text-white font-semibold px-6 py-3 transition-all duration-300 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-violet-600 hover:from-purple-700 hover:via-pink-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-2xl shadow-2xl px-6 sm:px-8 py-8 sm:py-10 max-w-sm w-full text-center border bg-white border-purple-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/30 to-pink-100/30 pointer-events-none"></div>

            <div className="mb-6 flex justify-center relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Message Received!
            </h3>
            <p className="mb-6 text-gray-600">
              Thank you for reaching out. We'll get back to you within 24 hours.
            </p>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-xl px-8 py-2.5 text-white font-semibold transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 20px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}