import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Trophy, Calendar, Users, MapPin, Clock, Star, Plus } from 'lucide-react';

const Events = () => {
  const { user } = useAuth();
  const [grounds, setGrounds] = useState([]);
  const [formData, setFormData] = useState({
    groundId: '',
    eventType: 'birthday',
    eventName: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: 2,
    guestCount: 10,
    specialRequirements: '',
    catering: false,
    decorations: false,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [showEstimate, setShowEstimate] = useState(false);

  useEffect(() => {
    fetchGrounds();
  }, []);

  useEffect(() => {
    if (formData.groundId && formData.date && formData.duration && formData.guestCount) {
      getEstimate();
    }
  }, [formData.groundId, formData.date, formData.duration, formData.guestCount, formData.catering, formData.decorations]);

  const fetchGrounds = async () => {
    try {
      const response = await axios.get('/api/grounds');
      setGrounds(response.data);
    } catch (error) {
      console.error('Error fetching grounds:', error);
      toast.error('Failed to load grounds');
    }
  };

  const getEstimate = async () => {
    try {
      const response = await axios.post('/api/events/estimate', {
        groundId: formData.groundId,
        date: formData.date,
        duration: formData.duration,
        guestCount: formData.guestCount,
        catering: formData.catering,
        decorations: formData.decorations
      });
      setEstimate(response.data);
      setShowEstimate(true);
    } catch (error) {
      console.error('Error getting estimate:', error);
      toast.error('Failed to get pricing estimate');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/events', formData);
      toast.success('Event booking created successfully!');
      setFormData({
        groundId: '',
        eventType: 'birthday',
        eventName: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: 2,
        guestCount: 10,
        specialRequirements: '',
        catering: false,
        decorations: false,
        notes: ''
      });
      setEstimate(null);
      setShowEstimate(false);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error.response?.data?.message || 'Failed to create event booking');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Booking</h1>
          <p className="text-gray-600">Plan your perfect birthday party, corporate event, or tournament</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Details</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Ground
                </label>
                <select
                  name="groundId"
                  value={formData.groundId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Choose a ground</option>
                  {grounds.map(ground => (
                    <option key={ground._id} value={ground._id}>
                      {ground.name} - {ground.location} ({ground.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="birthday">Birthday Party</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="tournament">Tournament</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., John's 25th Birthday Party"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
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
                    Guest Count
                  </label>
                  <input
                    type="number"
                    name="guestCount"
                    value={formData.guestCount}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
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
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={5}>5 Hours</option>
                  <option value={6}>6 Hours</option>
                  <option value={8}>8 Hours</option>
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
                    <option key={time} value={time}>{time}</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requirements
                </label>
                <textarea
                  name="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Any special requirements or requests..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="catering"
                    checked={formData.catering}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Catering (₹200 per person)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="decorations"
                    checked={formData.decorations}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Decorations (₹1000)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Any additional information..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !formData.groundId || !formData.date || !formData.startTime}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Event...' : 'Book Event'}
              </button>
            </form>
          </div>

          {/* Pricing & Info */}
          <div className="space-y-6">
            {/* Estimate Card */}
            {showEstimate && estimate && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Estimate</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Rate:</span>
                    <span className="font-medium">₹{estimate.pricing.baseRate}/hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formData.duration} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Amount:</span>
                    <span className="font-medium">₹{estimate.pricing.baseRate * formData.duration}</span>
                  </div>
                  {estimate.pricing.catering > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Catering:</span>
                      <span className="font-medium">₹{estimate.pricing.catering}</span>
                    </div>
                  )}
                  {estimate.pricing.decorations > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Decorations:</span>
                      <span className="font-medium">₹{estimate.pricing.decorations}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-semibold">Total Amount:</span>
                      <span className="font-bold text-lg">₹{estimate.totalAmount}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credit Points Earned:</span>
                    <span className="font-medium text-primary-600">{estimate.creditPointsEarned} points</span>
                  </div>
                </div>
              </div>
            )}

            {/* Event Types */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Types</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Trophy className="w-5 h-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Birthday Party</p>
                    <p className="text-sm text-gray-600">Perfect for celebrations with friends and family</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Corporate Event</p>
                    <p className="text-sm text-gray-600">Team building and corporate gatherings</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Trophy className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Tournament</p>
                    <p className="text-sm text-gray-600">Competitive sports tournaments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <Plus className="w-4 h-4 text-green-500 mr-2" />
                  Full ground access for the duration
                </li>
                <li className="flex items-center text-gray-600">
                  <Plus className="w-4 h-4 text-green-500 mr-2" />
                  Basic sports equipment
                </li>
                <li className="flex items-center text-gray-600">
                  <Plus className="w-4 h-4 text-green-500 mr-2" />
                  Parking facilities
                </li>
                <li className="flex items-center text-gray-600">
                  <Plus className="w-4 h-4 text-green-500 mr-2" />
                  Restroom facilities
                </li>
                <li className="flex items-center text-gray-600">
                  <Plus className="w-4 h-4 text-green-500 mr-2" />
                  Credit points on booking
                </li>
              </ul>
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
