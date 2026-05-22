import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../services/authService'
import { FormError } from '../../Components/FormError'
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react'

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className='w-full min-h-screen flex flex-col md:flex-row overflow-hidden shadow-2xl'>
        <div className='w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-8 md:px-12 py-8 md:py-0 bg-linear-to-br from-white to-mint-cream/30'>
          <div className='max-w-sm w-full mx-auto'>
            <div className='mb-7'>
              <h1 className='text-2xl sm:text-3xl font-bold text-primary-dark mb-2 tracking-tight'>
                Invalid Reset Link
              </h1>
              <p className='text-text-muted text-sm'>
                This password reset link is invalid or missing. Please request a new one.
              </p>
            </div>
            <FormError message={error} />
            <Link
              to='/forgot-password'
              className='w-full bg-[#7a0d92] hover:bg-[#5a0a6d] text-white font-semibold py-3 text-sm rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-4'
            >
              Request New Reset Link
            </Link>
            <Link
              to='/login'
              className='w-full mt-3 text-center text-sm text-text-muted hover:text-primary-dark font-semibold transition-colors hover:underline'
            >
              Back to Login
            </Link>
          </div>
        </div>
        <div className="hidden md:block relative w-full md:w-1/2">
          <div className="absolute inset-0 bg-cover bg-center bg-[url('/backgrounds/purple.jpg')]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full min-h-screen flex flex-col md:flex-row overflow-hidden shadow-2xl'>
      <div className='w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-8 md:px-12 py-8 md:py-0 bg-linear-to-br from-white to-mint-cream/30'>
        <div className='max-w-sm w-full mx-auto'>
          {/* Header */}
          <div className='mb-7'>
            <h1 className='text-3xl font-bold text-primary-dark mb-2 tracking-tight'>
              Reset Password
            </h1>
            <p className='text-text-muted text-sm'>
              {success 
                ? 'Password reset successful! Redirecting to login...'
                : 'Enter your new password below'}
            </p>
          </div>

          {success ? (
            <div className='space-y-4'>
              <div className='bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3'>
                <CheckCircle2 className='w-5 h-5 text-green-600 mt-0.5 flex-shrink-0' />
                <div>
                  <p className='text-sm text-green-800 font-medium'>
                    Password Reset Successful!
                  </p>
                  <p className='text-xs text-green-700 mt-1'>
                    Your password has been reset successfully. You will be redirected to the login page shortly.
                  </p>
                </div>
              </div>

              <Link
                to='/login'
                className='w-full bg-[#7a0d92] hover:bg-[#5a0a6d] text-white font-semibold py-3 text-sm rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center gap-2'
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              {/* Inline Error Message */}
              <FormError message={error} />

              {/* New Password Input */}
              <div>
                <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
                  New Password
                </label>
                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Enter your new password'
                    className='w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-gray-300 pr-11'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors bg-transparent p-0'
                  >
                    {showPassword ? (
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                      </svg>
                    ) : (
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
                  Confirm New Password
                </label>
                <div className='relative'>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder='Confirm your new password'
                    className='w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-gray-300 pr-11'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors bg-transparent p-0'
                  >
                    {showConfirmPassword ? (
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                      </svg>
                    ) : (
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type='submit'
                disabled={loading}
                className='w-full bg-[#7a0d92] hover:bg-[#5a0a6d] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 text-sm rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 shadow-lg hover:shadow-xl mt-5'
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
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
