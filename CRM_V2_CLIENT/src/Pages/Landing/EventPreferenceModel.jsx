
import React, { useState } from 'react';
import { 
  Heart, 
  User, 
  Building, 
  PartyPopper, 
  Users, 
  Baby, 
  GraduationCap, 
  Camera, 
  Home, 
  Palette, 
  Gift,
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react';

const EventPreferenceModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const eventTypes = [
    { value: "wedding", label: "Wedding", icon: Heart, color: "text-red-500", bgColor: "bg-red-50 hover:bg-red-100 border-red-200" },
    { value: "portrait", label: "Portrait Session", icon: User, color: "text-indigo-500", bgColor: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200" },
    { value: "corporate", label: "Corporate Event", icon: Building, color: "text-blue-500", bgColor: "bg-blue-50 hover:bg-blue-100 border-blue-200" },
    { value: "birthday", label: "Birthday Party", icon: PartyPopper, color: "text-yellow-500", bgColor: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200" },
    { value: "engagement", label: "Engagement Shoot", icon: Heart, color: "text-pink-500", bgColor: "bg-pink-50 hover:bg-pink-100 border-pink-200" },
    { value: "family", label: "Family Photography", icon: Users, color: "text-green-500", bgColor: "bg-green-50 hover:bg-green-100 border-green-200" },
    { value: "baby-shower", label: "Baby Shower", icon: Baby, color: "text-purple-500", bgColor: "bg-purple-50 hover:bg-purple-100 border-purple-200" },
    { value: "graduation", label: "Graduation", icon: GraduationCap, color: "text-blue-600", bgColor: "bg-blue-50 hover:bg-blue-100 border-blue-200" },
    { value: "product", label: "Product Photography", icon: Camera, color: "text-orange-500", bgColor: "bg-orange-50 hover:bg-orange-100 border-orange-200" },
    { value: "real-estate", label: "Real Estate", icon: Home, color: "text-teal-500", bgColor: "bg-teal-50 hover:bg-teal-100 border-teal-200" },
    { value: "fashion", label: "Fashion Shoot", icon: Palette, color: "text-purple-600", bgColor: "bg-purple-50 hover:bg-purple-100 border-purple-200" },
    { value: "anniversary", label: "Anniversary", icon: Gift, color: "text-rose-500", bgColor: "bg-rose-50 hover:bg-rose-100 border-rose-200" },
  ];

  const handleNext = () => {
    if (selectedEvent) {
      setIsAnimating(true);
      // Here you would typically store in session storage and navigate
      setTimeout(() => {
        // sessionStorage.setItem('selectedEventType', selectedEvent);
        setIsOpen(false);
      }, 300);
    }
  };

  const handleSkip = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden
        transform transition-all duration-500 ease-out
        ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
      `}>
        
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-slate-50 to-white">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Find Your Perfect Studio</h2>
              <p className="text-gray-600 text-sm">Let's personalize your experience</p>
            </div>
          </div>
          
          <p className="text-gray-700">
            What type of event are you planning? This helps us recommend the best studios for you.
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eventTypes.map((event) => {
              const IconComponent = event.icon;
              return (
                <button
                  key={event.value}
                  onClick={() => setSelectedEvent(event.value)}
                  className={`
                    relative p-4 rounded-xl border-2 text-left transition-all duration-200 group
                    ${selectedEvent === event.value 
                      ? `${event.bgColor} border-current shadow-md scale-[1.02]` 
                      : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      p-2 rounded-lg transition-colors duration-200
                      ${selectedEvent === event.value 
                        ? `${event.color} bg-white shadow-sm` 
                        : `${event.color} bg-gray-100 group-hover:bg-white`
                      }
                    `}>
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <p className={`font-semibold transition-colors duration-200 ${
                        selectedEvent === event.value ? event.color : 'text-gray-900'
                      }`}>
                        {event.label}
                      </p>
                    </div>
                  </div>
                  
                  {selectedEvent === event.value && (
                    <div className="absolute top-2 right-2">
                      <div className={`w-3 h-3 rounded-full ${event.color.replace('text-', 'bg-')}`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 font-medium transition-colors duration-200"
          >
            Skip for now
          </button>
          
          <button
            onClick={handleNext}
            disabled={!selectedEvent}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200
              ${selectedEvent 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02]' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};