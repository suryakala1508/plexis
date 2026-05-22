import React, { useState, useEffect } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { DatePicker, TimePicker } from "antd";
import dayjs from "dayjs";
import { EVENT_OPTIONS } from "../../../types/StudioConfig";

export const EventModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedTimeSlot,
  editEvent = null,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    color: "blue",
    description: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    attendees: "",
    eventType: "",
  });

  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customEventType, setCustomEventType] = useState("");

  // Helper function to format time as HH:mm in local time
  const formatTimeLocal = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Helper function to parse date and time strings to Date object in local time
  const parseDateTimeLocal = (dayjsDate, timeStr) => {
    if (!dayjsDate || !timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return dayjsDate.hour(hours).minute(minutes).second(0).millisecond(0).toDate();
  };

  useEffect(() => {
    if (editEvent) {
      // Convert string dates to Date objects if needed
      const startDate =
        editEvent.start instanceof Date
          ? editEvent.start
          : new Date(editEvent.start);
      const endDate =
        editEvent.end instanceof Date ? editEvent.end : new Date(editEvent.end);

      setFormData({
        title: editEvent.title || "",
        color: editEvent.color || "blue",
        description: editEvent.description || "",
        location: editEvent.location || "",
        startDate: dayjs(startDate),
        startTime: formatTimeLocal(startDate),
        endDate: dayjs(endDate),
        endTime: formatTimeLocal(endDate),
        attendees: editEvent.attendees || "",
        eventType: editEvent.eventType || "",
      });
    } else if (selectedTimeSlot) {
      const endTime = new Date(selectedTimeSlot);
      endTime.setHours(endTime.getHours() + 1);

      setFormData({
        title: "",
        color: "blue",
        description: "",
        location: "",
        startDate: dayjs(selectedTimeSlot),
        startTime: formatTimeLocal(selectedTimeSlot),
        endDate: dayjs(endTime),
        endTime: formatTimeLocal(endTime),
        attendees: "",
        eventType: "",
      });
    } else {
      const now = new Date();
      const later = new Date(now.getTime() + 60 * 60 * 1000);

      setFormData({
        title: "",
        color: "blue",
        description: "",
        location: "",
        startDate: dayjs(now),
        startTime: formatTimeLocal(now),
        endDate: dayjs(later),
        endTime: formatTimeLocal(later),
        attendees: "",
        eventType: "",
      });
    }
  }, [selectedTimeSlot, editEvent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Event title is required";

    if (!formData.startDate || !formData.startTime) {
      newErrors.time = "Start date and time are required";
    }

    if (!formData.endDate || !formData.endTime) {
      newErrors.time = "End date and time are required";
    }

    if (
      formData.startDate &&
      formData.startTime &&
      formData.endDate &&
      formData.endTime
    ) {
      const startDateTime = parseDateTimeLocal(formData.startDate, formData.startTime);
      const endDateTime = parseDateTimeLocal(formData.endDate, formData.endTime);

      if (endDateTime <= startDateTime) {
        newErrors.time = "End must be after start";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const startDateTime = parseDateTimeLocal(formData.startDate, formData.startTime);
    const endDateTime = parseDateTimeLocal(formData.endDate, formData.endTime);

    const eventData = {
      id: editEvent?.id || editEvent?._id || Date.now(),
      _id: editEvent?._id || editEvent?.id,
      title: formData.title,
      start: startDateTime,
      end: endDateTime,
      color: formData.color,
      description: formData.description,
      location: formData.location,
      attendees: formData.attendees ? parseInt(formData.attendees) : 0,
      eventType: formData.eventType || "",
    };

    onSave(eventData);
    setFormData({
      title: "",
      color: "blue",
      description: "",
      location: "",
      startDate: null,
      startTime: "",
      endDate: null,
      endTime: "",
      attendees: "",
      eventType: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Event Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <div className="flex items-center justify-center min-h-screen p-3">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-primary-dark">
                {editEvent ? "Edit Event" : "Add Event or Reminder"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-4">
              <div className="space-y-2.5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter title"
                    className={`w-full px-2 py-1.5 text-sm border ${errors.title ? "border-red-500" : "border-gray-300"
                      } rounded-lg`}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Date/Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Start <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <DatePicker
                        value={formData.startDate}
                        onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                        format="DD/MM/YYYY"
                        placeholder="dd-mm-yyyy"
                        minDate={dayjs()}
                        className="w-full sm:flex-1"
                        style={{ height: '34px' }}
                        classNames={{ popup: { root: 'small-calendar' } }}
                      />
                      <TimePicker
                        value={formData.startTime ? dayjs().hour(parseInt(formData.startTime.split(':')[0])).minute(parseInt(formData.startTime.split(':')[1])) : null}
                        onChange={(time) => setFormData(prev => ({ ...prev, startTime: time ? time.format('HH:mm') : '' }))}
                        use12Hours
                        format="h:mm a"
                        allowClear={false}
                        className="w-full sm:w-32"
                        placeholder="Select time"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      End <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <DatePicker
                        value={formData.endDate}
                        onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                        format="DD/MM/YYYY"
                        placeholder="dd-mm-yyyy"
                        minDate={formData.startDate || dayjs()}
                        className="w-full sm:flex-1"
                        style={{ height: '34px' }}
                        disabledDate={(current) => {
                          const today = dayjs().startOf('day');
                          if (!formData.startDate) return current && current.isBefore(today, 'day');
                          const start = formData.startDate.startOf('day');
                          return current && (current.isBefore(today, 'day') || current.isBefore(start, 'day'));
                        }}
                      />
                      <TimePicker
                        value={formData.endTime ? dayjs().hour(parseInt(formData.endTime.split(':')[0])).minute(parseInt(formData.endTime.split(':')[1])) : null}
                        onChange={(time) => setFormData(prev => ({ ...prev, endTime: time ? time.format('HH:mm') : '' }))}
                        use12Hours
                        format="h:mm a"
                        allowClear={false}
                        className="w-full sm:w-32"
                        placeholder="Select time"
                      />
                    </div>
                  </div>
                </div>

                {errors.time && (
                  <p className="text-red-500 text-xs">{errors.time}</p>
                )}

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Add location"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Event Type
                  </label>
                  <select
                    name="eventType"
                    value={formData.eventType && !EVENT_OPTIONS.includes(formData.eventType) ? "Other" : formData.eventType}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                  >
                    <option value="">Select event type</option>
                    {EVENT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  {/* Custom Event Type Input - Shows when "Other" is selected */}
                  {(formData.eventType === "Other" || (formData.eventType && !EVENT_OPTIONS.includes(formData.eventType))) && (
                    <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input
                        type="text"
                        value={customEventType || (formData.eventType && !EVENT_OPTIONS.includes(formData.eventType) ? formData.eventType : "")}
                        onChange={(e) => {
                          setCustomEventType(e.target.value);
                          setFormData((prev) => ({ ...prev, eventType: e.target.value }));
                        }}
                        placeholder="Enter custom event type (e.g., Product Launch, Workshop)"
                        className="w-full px-3 py-2 text-sm border border-primary focus:ring-2 focus:ring-primary focus:border-primary rounded-lg"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Custom event type will be saved
                      </p>
                    </div>
                  )}
                </div>

                {/* Attendees */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Attendees
                  </label>
                  <input
                    type="number"
                    name="attendees"
                    value={formData.attendees}
                    onChange={handleChange}
                    min="0"
                    placeholder="Number of attendees"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Event Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { name: "blue", class: "bg-blue-500" },
                      { name: "purple", class: "bg-purple-500" },
                      { name: "green", class: "bg-green-500" },
                      { name: "orange", class: "bg-orange-500" },
                      { name: "red", class: "bg-red-500" },
                      { name: "indigo", class: "bg-indigo-500" },
                      { name: "pink", class: "bg-pink-500" },
                      { name: "yellow", class: "bg-yellow-500" },
                    ].map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, color: color.name }))
                        }
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${color.class} ${formData.color === color.name ? "ring-2 ring-primary-dark" : ""
                          }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add details…"
                    rows="2"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-2 py-2 text-sm bg-primary-dark text-white rounded-lg hover:bg-primary"
                >
                  {editEvent ? "Update" : "Create"}
                </button>
                {editEvent && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 px-2 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
                    title="Delete event"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - Rendered as sibling to prevent scroll issues */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />

          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Warning Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Delete Event?
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete "<span className="font-semibold">{editEvent?.title}</span>"? This action cannot be undone.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(editEvent._id || editEvent.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};