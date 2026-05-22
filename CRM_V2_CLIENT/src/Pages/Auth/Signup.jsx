import React, { useState } from 'react'
import { GoogleButton } from '../../Components/GoogleButton'
import { Link, useNavigate } from 'react-router-dom'
import { signupWithEmail, loginWithGoogle } from '../../services/authService'
import { useUser } from '../../contexts/UserContext'
import { useSession } from '../../contexts/SessionContext'
import { useCalendar } from '../../contexts/CalendarContext'
import { FormError } from '../../Components/FormError'
import { SuccessAnimation } from '../../Components/SuccessAnimation'

export const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const { reloadSession } = useSession();
  const { fetchEvents } = useCalendar();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== retypePassword) {
      setError('Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await signupWithEmail({ email, password });
      // console.log('Signup successful:', response);

      // Show success animation
      setShowSuccess(true);

      // Refresh user data in context after successful signup
      await refreshUser();
      await reloadSession();
      await fetchEvents(); // Pre-fetch calendar events
    } catch (err) {
      console.error('Signup error:', err);
      // Display the actual error message from backend if available
      const backendMessage = err.response?.data?.message || err.response?.data?.error;
      // If it's a 400 error and we have a message, use it. Otherwise fall back to generic or err.message
      setError(backendMessage || err.message || 'Signup failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setError('');
    setLoading(true);

    try {
      const response = await loginWithGoogle(credential);

      // Show success animation
      setShowSuccess(true);

      // Refresh user data in context after successful signup
      await refreshUser();
      await reloadSession();
      await fetchEvents(); // Pre-fetch calendar events
    } catch (err) {
      console.error('Google signup error:', err);
      const backendMessage = err.response?.data?.message || err.response?.data?.error;
      setError(backendMessage || err.message || 'Google signup failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google signup failed. Please try again.');
    setLoading(false);
  };

  return (
    <>
      {showSuccess && (
        <SuccessAnimation
          message='Account created successfully!'
          onComplete={() => {
            // Check if user has completed onboarding
            // Navigate to onboarding if not completed, otherwise to dashboard
            if (user?.isOnboarded || user?.isOnboared) {
              navigate('/dashboard');
            } else {
              navigate('/onboarding');
            }
          }}
        />
      )}
    <div className='w-full min-h-screen flex flex-col md:flex-row overflow-hidden shadow-2xl'>

      <div className='w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-8 md:px-12 py-8 md:py-0 bg-linear-to-br from-white to-mint-cream/30'>
        <div className='max-w-sm w-full mx-auto'>
          {/* Header */}
          <div className='mb-7'>
            <h1 className='text-2xl sm:text-3xl font-bold text-primary-dark mb-2 tracking-tight'>
              Create Account
            </h1>
            <p className='text-text-muted text-sm'>
              Sign up to get started with your studio
            </p>
          </div>

          {/* Google Sign Up Button */}
          <GoogleButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text='Sign up with Google'
            loading={loading}
          />

          {/* Divider */}
          <div className='relative my-6'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-300'></div>
            </div>
            <div className='relative flex justify-center text-xs'>
              <span className='px-3 bg-linear-to-br from-white to-mint-cream/50 text-text-muted font-medium'>
                Or sign up with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSignup} className='space-y-4'>
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

            {/* Password Input */}
            <div>
              <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
                Password
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Create a strong password'
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

            {/* Retype Password Input */}
            <div>
              <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
                Retype Password
              </label>
              <div className='relative'>
                <input
                  type={showRetypePassword ? 'text' : 'password'}
                  value={retypePassword}
                  onChange={(e) => setRetypePassword(e.target.value)}
                  placeholder='Confirm your password'
                  className='w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-gray-300 pr-11'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowRetypePassword(!showRetypePassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors bg-transparent p-0'
                >
                  {showRetypePassword ? (
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

            {/* Create Account Button */}
            <button
              type='submit'
              disabled={loading}
              className='w-full bg-[#7a0d92] hover:bg-[#5a0a6d] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 text-sm rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 shadow-lg hover:shadow-xl mt-5'
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <p className='text-center text-xs text-text-muted mt-6'>
            Already have an account?{' '}
            <Link to='/login' className='text-black hover:text-primary-dark font-semibold transition-colors hover:underline'>
              Sign in
            </Link>
          </p>
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
    </>
  )
}

