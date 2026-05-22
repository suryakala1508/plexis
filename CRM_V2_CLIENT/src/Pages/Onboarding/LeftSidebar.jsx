import React from 'react'
import { Check } from 'lucide-react'


const stepTimeEstimates = {
  1: '~1 min',
  2: '~2 min',
  3: '~1 min',
  4: '~1 min'
}

const stepHeadlines = {
  1: 'Tell us about you',
  2: 'Set up your studio',
  3: 'Show off your work',
  4: 'Customize your experience'
}

const stepValues = {
  1: 'This helps personalize your workspace.',
  2: 'We\'ll use this to set up your profile.',
  3: 'Build trust with potential clients.',
  4: 'Connect your favorite tools.'
}

export const LeftSidebar = ({ currentStep, steps }) => {
  const totalTime = '~5 minutes total'
  const progressPercent = ((currentStep - 1) / steps.length) * 100

  return (
    <div className='hidden md:block md:w-[35%] relative bg-primary-dark'>
      <div className="absolute inset-0 bg-cover bg-center bg-[url('/backgrounds/purple.jpg')] opacity-30"></div>
      <div className="absolute inset-0 bg-primary-dark/70"></div>
      
      <div className='relative z-10 h-full flex flex-col justify-between p-10'>
        <div>
          {/* Logo/Brand */}
          <div className='mb-10 flex items-center'>
            <img 
              src="logo_light.png" 
              alt="Plexis Logo" 
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Contextual Headline */}
          <div className='mb-12'>
            <h2 className='text-3xl font-bold text-white mb-3 leading-tight drop-shadow-md'>
              {stepHeadlines[currentStep]}
            </h2>
            <p className='text-sm text-white/95 leading-relaxed drop-shadow-sm'>
              {stepValues[currentStep]}
            </p>
          </div>

          {/* Progress Bar */}
          <div className='mb-8'>
            <div className='w-full h-1.5 bg-white/20 rounded-full overflow-hidden'>
              <div 
                className='h-full bg-white rounded-full transition-all duration-500 ease-out'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className='text-xs text-white/90 mt-2'>{totalTime}</p>
          </div>

          {/* Vertical Stepper */}
          <div className='space-y-5'>
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              const isUpcoming = currentStep < step.id

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 transition-all duration-300 ${
                    isActive ? 'opacity-100' : isCompleted ? 'opacity-80' : 'opacity-50'
                  }`}
                >
                  {/* Step Circle */}
                  <div className='relative shrink-0'>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'bg-white text-primary-dark shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-white/90 text-primary-dark'
                          : 'bg-white/20 text-white/60'
                      }`}
                      style={{
                        boxShadow: isActive ? '0 0 0 4px rgba(255, 255, 255, 0.2)' : 'none'
                      }}
                    >
                      {isCompleted ? (
                        <Check className='w-5 h-5' strokeWidth={3} />
                      ) : (
                        <Icon className={`w-5 h-5 ${isActive ? 'text-primary-dark' : ''}`} />
                      )}
                    </div>
                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute left-1/2 top-10 w-0.5 h-8 -translate-x-1/2 transition-all duration-300 ${
                          isCompleted ? 'bg-white/60' : 'bg-white/20'
                        }`}
                      />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className='pt-1.5 flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <h3 className={`font-semibold text-base transition-colors drop-shadow-sm ${
                        isActive ? 'text-white' : isCompleted ? 'text-white/95' : 'text-white/75'
                      }`}>
                        {step.title}
                      </h3>
                      {isActive && (
                        <span className='text-xs text-white/90 font-normal'>
                          {stepTimeEstimates[step.id]}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <p className='text-xs text-white/90 leading-relaxed'>
                        {step.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className='text-white/70 text-xs'>
          All rights reserved © Plexis 2025
        </div>
      </div>
    </div>
  )
}

