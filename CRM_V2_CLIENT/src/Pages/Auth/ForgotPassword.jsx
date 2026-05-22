import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword } from '../../services/authService'
import { FormError } from '../../Components/FormError'
import { Mail, ArrowLeft } from 'lucide-react'

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full min-h-screen flex flex-col md:flex-row overflow-hidden shadow-2xl'>
      <div className='w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-8 md:px-12 py-8 md:py-0 bg-linear-to-br from-white to-mint-cream/30'>
        <div className='max-w-sm w-full mx-auto'>
          {/* Header */}
          <div className='mb-7'>
            <h1 className='text-2xl sm:text-3xl font-bold text-primary-dark mb-2 tracking-tight'>
              Forgot Password?
            </h1>
            <p className='text-text-muted text-sm'>
              {success 
                ? 'Check your email for a password reset link'
                : 'Enter your email address and we\'ll send you a link to reset your password'}
            </p>
          </div>

          {success ? (
            <div className='space-y-4'>
              <div className='bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3'>
                <Mail className='w-5 h-5 text-green-600 mt-0.5 flex-shrink-0' />
                <div>
                  <p className='text-sm text-green-800 font-medium'>
                    Reset link sent!
                  </p>
                  <p className='text-xs text-green-700 mt-1'>
                    If an account with that email exists, we've sent a password reset link. Please check your inbox and click the link to reset your password. The link will expire in 30 minutes.
                  </p>
                </div>
              </div>

              <div className='pt-4'>
                <Link
                  to='/login'
                  className='w-full bg-[#7a0d92] hover:bg-[#5a0a6d] text-white font-semibold py-3 text-sm rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center gap-2'
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              {/* Inline Error Message */}
              <FormError message={error} />

              {/* Email Input */}
              <div>
                <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
                  Email
                </label>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='studios@example.com'
                  className='w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-gray-300'
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type='submit'
                disabled={loading}
                className='w-full bg-[#7a0d92] hover:bg-[#5a0a6d] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 text-sm rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 shadow-lg hover:shadow-xl mt-5'
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          {!success && (
            <p className='text-center text-xs text-text-muted mt-6'>
              Remember your password?{' '}
              <Link to='/login' className='text-black hover:text-primary-dark font-semibold transition-colors hover:underline'>
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="hidden md:block relative w-full md:w-1/2">
        <div className="absolute inset-0 bg-cover bg-center bg-[url('/backgrounds/purple.jpg')]"></div>
        <div className="relative z-10 flex flex-col h-full items-center justify-center">
          <div className="absolute top-6 left-9 max-w">
            <h1 className="text-4xl font-bold text-white leading-tight drop-shadow-md">
              Manage Less. <span className="text-primary-dark">Create More.</span>
            </h1>
            <h2 className=' text-white mt-2 max-w-sm'>Your all in one AI studio management platform helps to boost efficiency and productivity</h2>
          </div>
          <div className="w-full h-full mt-20 bg-cover bg-center bg-[url('/backgrounds/dashboard_login.svg')]"></div>
        </div>
      </div>
    </div>
  )
}
