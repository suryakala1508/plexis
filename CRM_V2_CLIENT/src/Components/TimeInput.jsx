import React, { useState, useRef, useEffect } from 'react';

const TimeInput = ({ value = '', onChange, className = '' }) => {
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState('AM');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);
  const periodRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      const hour24 = parseInt(h, 10);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const newPeriod = hour24 >= 12 ? 'PM' : 'AM';
      
      setHours(String(hour12).padStart(2, '0'));
      setMinutes(m || '00');
      setPeriod(newPeriod);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          periodRef.current && !periodRef.current.contains(event.target)) {
        setShowPeriodDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateTime = (newHours, newMinutes, newPeriod) => {
    let hour24 = parseInt(newHours, 10);
    if (newPeriod === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (newPeriod === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    const time24 = `${String(hour24).padStart(2, '0')}:${newMinutes}`;
    onChange(time24);
  };

  const handleHoursChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    
    if (val.length === 0) {
      setHours('');
      return;
    }
    
    if (val.length === 2 || (val.length === 1 && parseInt(val) > 1)) {
      let num = parseInt(val);
      if (num > 12) num = 12;
      if (num === 0) num = 12;
      const formatted = String(num).padStart(2, '0');
      setHours(formatted);
      updateTime(formatted, minutes, period);
      minutesRef.current?.focus();
      minutesRef.current?.select();
    } else {
      setHours(val);
    }
  };

  const handleMinutesChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    
    if (val.length === 0) {
      setMinutes('');
      return;
    }
    
    if (val.length === 2 || (val.length === 1 && parseInt(val) > 5)) {
      let num = parseInt(val);
      if (num > 59) num = 59;
      const formatted = String(num).padStart(2, '0');
      setMinutes(formatted);
      updateTime(hours, formatted, period);
      setShowPeriodDropdown(true);
    } else {
      setMinutes(val);
    }
  };

  const handleHoursFocus = (e) => {
    e.target.select();
  };

  const handleMinutesFocus = (e) => {
    e.target.select();
  };

  const handleHoursBlur = () => {
    if (hours && hours.length === 1) {
      const formatted = hours.padStart(2, '0');
      setHours(formatted);
      updateTime(formatted, minutes, period);
    } else if (!hours) {
      setHours('12');
      updateTime('12', minutes, period);
    }
  };

  const handleMinutesBlur = () => {
    if (minutes && minutes.length === 1) {
      const formatted = minutes.padStart(2, '0');
      setMinutes(formatted);
      updateTime(hours, formatted, period);
    } else if (!minutes) {
      setMinutes('00');
      updateTime(hours, '00', period);
    }
  };

  const handlePeriodSelect = (newPeriod) => {
    setPeriod(newPeriod);
    updateTime(hours, minutes, newPeriod);
    setShowPeriodDropdown(false);
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
      if (field === 'hours') {
        e.preventDefault();
        minutesRef.current?.focus();
        minutesRef.current?.select();
      }
    } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
      if (field === 'minutes') {
        e.preventDefault();
        hoursRef.current?.focus();
        hoursRef.current?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (field === 'hours') {
        const newHours = parseInt(hours) === 12 ? '01' : String(parseInt(hours) + 1).padStart(2, '0');
        setHours(newHours);
        updateTime(newHours, minutes, period);
      } else if (field === 'minutes') {
        const newMinutes = String((parseInt(minutes) + 1) % 60).padStart(2, '0');
        setMinutes(newMinutes);
        updateTime(hours, newMinutes, period);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (field === 'hours') {
        const newHours = parseInt(hours) === 1 ? '12' : String(parseInt(hours) - 1).padStart(2, '0');
        setHours(newHours);
        updateTime(newHours, minutes, period);
      } else if (field === 'minutes') {
        const newMinutes = String(parseInt(minutes) === 0 ? 59 : parseInt(minutes) - 1).padStart(2, '0');
        setMinutes(newMinutes);
        updateTime(hours, newMinutes, period);
      }
    }
  };

  return (
    <div className="relative">
      <div className={`flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white ${className}`}>
        <input
          ref={hoursRef}
          type="text"
          value={hours}
          onChange={handleHoursChange}
          onFocus={handleHoursFocus}
          onBlur={handleHoursBlur}
          onKeyDown={(e) => handleKeyDown(e, 'hours')}
          className="w-7 text-center outline-none bg-transparent text-sm font-medium"
          placeholder="12"
          maxLength={2}
        />
        <span className="text-gray-400 text-sm font-medium">:</span>
        <input
          ref={minutesRef}
          type="text"
          value={minutes}
          onChange={handleMinutesChange}
          onFocus={handleMinutesFocus}
          onBlur={handleMinutesBlur}
          onKeyDown={(e) => handleKeyDown(e, 'minutes')}
          className="w-7 text-center outline-none bg-transparent text-sm font-medium"
          placeholder="00"
          maxLength={2}
        />
        <button
          ref={periodRef}
          type="button"
          onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
          className="ml-1 px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 hover:bg-gray-200 focus:bg-blue-100 focus:text-blue-700 outline-none transition-colors"
        >
          {period}
        </button>
      </div>

      {showPeriodDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-20 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
        >
          <button
            type="button"
            onClick={() => handlePeriodSelect('AM')}
            className={`w-full px-3 py-2 text-sm font-medium text-left hover:bg-blue-50 transition-colors ${
              period === 'AM' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handlePeriodSelect('PM')}
            className={`w-full px-3 py-2 text-sm font-medium text-left hover:bg-blue-50 transition-colors ${
              period === 'PM' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
            }`}
          >
            PM
          </button>
        </div>
      )}
    </div>
  );
};

export default TimeInput;