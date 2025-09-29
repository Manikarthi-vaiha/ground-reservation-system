import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Gamepad2, Clock, Users, Star, Calendar, CreditCard } from 'lucide-react';

const PS5Booking = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    duration: 1,
    playerType: 'single'
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [showEstimate, setShowEstimate] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDurationChange = (e) => {
    const duration = parseInt(e.target.value);
    setFormData(prev => ({
      ...prev,
      duration,
      endTime: calculateEndTime(prev.startTime, duration)
    }));
  };

  const calculateEndTime = (startTime, duration) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + duration;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleStartTimeChange = (e) => {
    const startTime = e.target.value;
    setFormData(prev => ({
      ...prev,
      startTime,
      endTime: calculateEndTime(startTime, prev.duration)
    }));
  };

  const fetchAvailableSlots = async () => {
    if (!formData.date) return;

    try {
      const response = await axios.get(`/api/ps5/availability/${formData.date}`);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast.error('Failed to load available slots');
    }
  };

  const getEstimate = async () => {
    if (!formData.duration || !formData.playerType) return;

    try {
      const response = await axios.post('/api/ps5/estimate', {
        duration: formData.duration,
        playerType: formData.playerType
      });
      setEstimate(response.data);
      setShowEstimate(true);
    } catch (error) {
      console.error('Error getting estimate:', error);
      toast.error('Failed to get pricing estimate');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/ps5', formData);
      toast.success('PS5 booking created successfully!');
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        duration: 1,
        playerType: 'single'
      });
      setEstimate(null);
      setShowEstimate(false);
    } catch (error) {
      console.error('Error creating PS5 booking:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableSlots();
  }, [formData.date]);

  useEffect(() => {
    if (formData.duration && formData.playerType) {
      getEstimate();
    }
  }, [formData.duration, formData.playerType]);

  const isSlotAvailable = (startTime) => {
    return availableSlots.some(slot => slot.startTime === startTime && slot.available);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 10; hour < 22; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PS5 Gaming Booking</h1>
          <p className="text-gray-600">Book your PS5 gaming session and enjoy the latest games</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Book Your Session</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.playerType === 'single'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="playerType"
                      value="single"
                      checked={formData.playerType === 'single'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      <p className="font-medium">Single Player</p>
                      <p className="text-sm text-gray-600">₹100/hour</p>
                    </div>
                  </label>

                  <label className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.playerType === 'double'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="playerType"
                      value="double"
                      checked={formData.playerType === 'double'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      <p className="font-medium">Double Player</p>
                      <p className="text-sm text-gray-600">₹150/hour</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Hours)
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleDurationChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <select
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleStartTimeChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select start time</option>
                  {generateTimeSlots().map(time => (
                    <option
                      key={time}
                      value={time}
                      disabled={!isSlotAvailable(time)}
                    >
                      {time} {!isSlotAvailable(time) ? '(Not Available)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {formData.startTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={formData.endTime}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !formData.date || !formData.startTime}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Booking...' : 'Book PS5 Session'}
              </button>
            </form>
          </div>

          {/* Pricing & Info */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-gray-700">Single Player</span>
                  </div>
                  <span className="font-semibold text-gray-900">₹100/hour</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-gray-700">Double Player</span>
                  </div>
                  <span className="font-semibold text-gray-900">₹150/hour</span>
                </div>
              </div>
            </div>

            {/* Estimate Card */}
            {showEstimate && estimate && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Estimate</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formData.duration} hour(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-medium">₹{estimate.hourlyRate}/hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-semibold text-lg">₹{estimate.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credit Points Earned:</span>
                    <span className="font-medium text-primary-600">{estimate.creditPointsEarned} points</span>
                  </div>
                </div>
              </div>
            )}

            {/* User Credit Points */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Credit Points</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="w-6 h-6 text-yellow-500 mr-2" />
                  <span className="text-gray-700">Available Points</span>
                </div>
                <span className="text-2xl font-bold text-primary-600">{user?.creditPoints || 0}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Earn 1 point for every ₹10 spent. Get 1 hour free when you reach 100 points!
              </p>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 text-green-500 mr-2" />
                  Latest PS5 games library
                </li>
                <li className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 text-green-500 mr-2" />
                  High-quality gaming setup
                </li>
                <li className="flex items-center text-gray-600">
                  <Star className="w-4 h-4 text-green-500 mr-2" />
                  Credit points on every booking
                </li>
                <li className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 text-green-500 mr-2" />
                  Flexible booking times
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PS5Booking;
