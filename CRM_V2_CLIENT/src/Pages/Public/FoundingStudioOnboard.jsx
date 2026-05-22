import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitFoundingStudioForm } from '../../services/foundingStudioService'
import { SuccessAnimation } from '../../Components/SuccessAnimation'
import { FormError } from '../../Components/FormError'
import { AlertCircle, Loader } from 'lucide-react'

export const FoundingStudioOnboard = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    studioName: '',
    email: '',
    phone: '',
    location: '',
    instagramHandle: '',
    demoCallOptIn: false,
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [generalError, setGeneralError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let updatedValue = type === 'checkbox' ? checked : value

    if (name === 'phone') {
      updatedValue = value.replace(/\D/g, '').slice(0, 10)
    }

    setFormData(prev => ({ ...prev, [name]: updatedValue }))

    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.studioName.trim()) {
      newErrors.studioName = 'Studio Name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (formData.phone.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')

    if (!validateForm()) return

    setLoading(true)

    try {
      await submitFoundingStudioForm(formData)
      setShowSuccess(true)
      setFormData({
        studioName: '',
        email: '',
        phone: '',
        location: '',
        instagramHandle: '',
        demoCallOptIn: false,
      })
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit form. Please try again.'
      setGeneralError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <>
      {showSuccess && (
        <SuccessAnimation
          message="Thank you! Our team will reach you"
          onComplete={() => {
            setTimeout(() => navigate('/'), 1000)
          }}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap');

        html, body, #root {
          height: 100%;
          overflow: hidden;
        }

        .fso-root {
          font-family: 'DM Sans', sans-serif;
          height: 100vh;
          width: 100%;
          background-color: #f4f6f9;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1rem;
          box-sizing: border-box;
          overflow: hidden;
        }

        .fso-card {
          background: #ffffff;
          border: 1px solid #e2e6ed;
          border-radius: 4px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
          width: 100%;
          max-width: 960px;
          height: 100%;
          max-height: 680px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr;
        }

        @media (min-width: 768px) {
          .fso-card {
            grid-template-columns: 300px 1fr;
          }
        }

        /* ── Left panel ── */
        .fso-panel-left {
          display: none;
          flex-direction: column;
          justify-content: flex-start;
          background-color: var(--color-primary-dark, #9916b1);
          padding: 2.5rem 2.25rem;
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .fso-panel-left {
            display: flex;
          }
        }

        .fso-panel-left::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 220px;
          height: 220px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 50%;
        }

        .fso-panel-left::after {
          content: '';
          position: absolute;
          bottom: -80px;
          left: -40px;
          width: 260px;
          height: 260px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 50%;
        }

        .fso-logo-wrap {
          z-index: 1;
          flex-shrink: 0;
        }

        .fso-logo-wrap img {
          width: 110px;
          height: auto;
          object-fit: contain;
          filter: none;
          opacity: 1;
        }

        .fso-panel-bottom {
          z-index: 1;
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .fso-panel-tagline {
          z-index: 1;
        }

        .fso-panel-tagline h2 {
          font-family: 'DM Serif Display', serif;
          color: #ffffff;
          font-size: 1.4rem;
          line-height: 1.45;
          margin: 0 0 0.65rem 0;
          font-weight: 400;
        }

        .fso-panel-tagline p {
          color: rgba(255,255,255,0.75);
          font-size: 0.78rem;
          line-height: 1.65;
          margin: 0;
          font-weight: 300;
          letter-spacing: 0.01em;
        }

        .fso-panel-points {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .fso-panel-points li {
          color: rgba(255,255,255,0.82);
          font-size: 0.78rem;
          line-height: 1.5;
          font-weight: 300;
          letter-spacing: 0.01em;
          position: relative;
          padding-left: 0.9rem;
        }

        .fso-panel-points li::before {
          content: '•';
          position: absolute;
          left: 0;
          top: 0;
          color: rgba(255,255,255,0.95);
          font-weight: 600;
        }

        .fso-panel-badge {
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 2px;
          padding: 0.4rem 0.75rem;
          width: fit-content;
        }

        .fso-panel-badge span {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.85);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
        }

        .fso-panel-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ffffff;
          flex-shrink: 0;
        }

        /* ── Right panel (form) ── */
        .fso-panel-right {
          padding: 1.75rem 1.75rem;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 768px) {
          .fso-panel-right {
            padding: 2rem 2.5rem;
          }
        }

        /* Top bar with step indicator */
        .fso-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid #eef0f4;
          flex-shrink: 0;
        }

        .fso-heading {
          margin: 0;
        }

        .fso-heading-label {
          display: block;
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-primary-dark, #9916b1);
          font-weight: 600;
          margin-bottom: 0.3rem;
        }

        .fso-heading h1 {
          font-size: 1.4rem;
          font-weight: 600;
          color: #0f1b2d;
          margin: 0;
          line-height: 1.2;
        }

        .fso-step-pill {
          font-size: 0.72rem;
          color: #8892a4;
          background: #f4f6f9;
          border: 1px solid #e2e6ed;
          border-radius: 100px;
          padding: 0.3rem 0.8rem;
          white-space: nowrap;
          font-weight: 500;
        }

        /* Field groups in a 2-col grid on wider screens */
        .fso-form {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .fso-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 540px) {
          .fso-row {
            grid-template-columns: 1fr 1fr;
          }
        }

        .fso-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .fso-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .fso-required {
          color: #ef4444;
          margin-left: 2px;
        }

        .fso-input {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: #0f1b2d;
          background: #f9fafb;
          border: 1px solid #d1d8e2;
          border-radius: 3px;
          padding: 0.65rem 0.9rem;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          outline: none;
        }

        .fso-input::placeholder {
          color: #aab2bf;
          font-weight: 300;
        }

        .fso-input:focus {
          border-color: var(--color-primary-dark, #9916b1);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(153,22,177,0.1);
        }

        .fso-input.error {
          border-color: #ef4444;
          background: #fff8f8;
        }

        .fso-input.error:focus {
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
        }

        .fso-error-msg {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.72rem;
          color: #ef4444;
          font-weight: 500;
        }

        /* Divider */
        .fso-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0.25rem 0;
        }

        .fso-divider-line {
          flex: 1;
          height: 1px;
          background: #eef0f4;
        }

        .fso-divider-text {
          font-size: 0.68rem;
          color: #aab2bf;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
          white-space: nowrap;
        }

        .fso-checkbox-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          background: #f9fafb;
          border: 1px solid #e2e6ed;
          border-radius: 3px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }

        .fso-checkbox-row input[type='checkbox'] {
          width: 16px;
          height: 16px;
          accent-color: var(--color-primary-dark, #9916b1);
          cursor: pointer;
          flex-shrink: 0;
        }

        .fso-checkbox-row:hover {
          background: #fdf4ff;
          border-color: #e0a8ef;
        }

        .fso-checkbox-label {
          font-size: 0.82rem;
          color: #374151;
          font-weight: 500;
          cursor: pointer;
          line-height: 1.4;
        }

        /* Submit button */
        .fso-submit-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #ffffff;
          background: var(--color-primary-dark, #9916b1);
          border: none;
          border-radius: 3px;
          padding: 0.85rem 1.5rem;
          width: 100%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background 0.15s, box-shadow 0.15s;
          margin-top: 1.2rem;
        }

        .fso-submit-btn:hover:not(:disabled) {
          background: var(--color-primary-dark, #7b0a8c);
          box-shadow: 0 4px 14px rgba(153,22,177,0.3);
        }

        .fso-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* Footer note */
        .fso-footer-note {
          text-align: center;
          font-size: 0.7rem;
          color: #aab2bf;
          margin-top: 1.8rem;
          letter-spacing: 0.01em;
        }
      `}</style>

      <div className="fso-root">
        <div className="fso-card">

          {/* ── Left Panel ── */}
          <div className="fso-panel-left">
            <div className="fso-logo-wrap">
              <img src="/logo_light.png" alt="PLEXIS Logo" />
            </div>

            <div className="fso-panel-bottom">
              <div className="fso-panel-tagline">
                <h2>Join as a Founding Studio Partner</h2>
                <ul className="fso-panel-points">
                  <li>Priority onboarding with dedicated team support</li>
                  <li>Feature-first access before public rollout</li>
                  <li>Direct input to shape product roadmap</li>
                </ul>
              </div>

              <div className="fso-panel-badge">
                <div className="fso-panel-badge-dot" />
                <span>Accepting Applications</span>
              </div>
            </div>
          </div>

          {/* ── Right Panel (Form) ── */}
          <div className="fso-panel-right">
            <div className="fso-top-bar">
              <div className="fso-heading">
                <h1>Founding Studio Onboard</h1>
              </div>
            </div>

            {generalError && <FormError message={generalError} />}

            <form onSubmit={handleSubmit} className="fso-form" noValidate>

              {/* Studio Name — full width */}
              <div className="fso-field">
                <label htmlFor="studioName" className="fso-label">
                  Studio Name <span className="fso-required">*</span>
                </label>
                <input
                  type="text"
                  id="studioName"
                  name="studioName"
                  value={formData.studioName}
                  onChange={handleChange}
                  placeholder="Enter your studio name"
                  className={`fso-input${errors.studioName ? ' error' : ''}`}
                />
                {errors.studioName && (
                  <p className="fso-error-msg">
                    <AlertCircle size={13} /> {errors.studioName}
                  </p>
                )}
              </div>

              {/* Email + Phone in a row */}
              <div className="fso-row">
                <div className="fso-field">
                  <label htmlFor="email" className="fso-label">
                    Email <span className="fso-required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`fso-input${errors.email ? ' error' : ''}`}
                  />
                  {errors.email && (
                    <p className="fso-error-msg">
                      <AlertCircle size={13} /> {errors.email}
                    </p>
                  )}
                </div>

                <div className="fso-field">
                  <label htmlFor="phone" className="fso-label">
                    Phone Number <span className="fso-required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    maxLength="10"
                    className={`fso-input${errors.phone ? ' error' : ''}`}
                  />
                  {errors.phone && (
                    <p className="fso-error-msg">
                      <AlertCircle size={13} /> {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Location + Instagram in a row */}
              <div className="fso-row">
                <div className="fso-field">
                  <label htmlFor="location" className="fso-label">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City or region"
                    className="fso-input"
                  />
                </div>

                <div className="fso-field">
                  <label htmlFor="instagramHandle" className="fso-label">Instagram Handle</label>
                  <input
                    type="text"
                    id="instagramHandle"
                    name="instagramHandle"
                    value={formData.instagramHandle}
                    onChange={handleChange}
                    placeholder="@yourhandle"
                    className="fso-input"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="fso-divider">
                <div className="fso-divider-line" />
                <span className="fso-divider-text">Optional</span>
                <div className="fso-divider-line" />
              </div>

              {/* Demo call checkbox */}
              <label className="fso-checkbox-row" htmlFor="demoCallOptIn">
                <input
                  type="checkbox"
                  id="demoCallOptIn"
                  name="demoCallOptIn"
                  checked={formData.demoCallOptIn}
                  onChange={handleChange}
                />
                <span className="fso-checkbox-label">
                  I'm interested in scheduling a demo call with the PLEXIS 
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="fso-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Submitting Application…
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>

              <p className="fso-footer-note">
                By submitting, you agree to be contacted by the PLEXIS team regarding your application.
              </p>
            </form>
          </div>

        </div>
      </div>
    </>
  )
}