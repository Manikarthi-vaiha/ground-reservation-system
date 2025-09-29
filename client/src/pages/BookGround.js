import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MapPin, Clock, Star, Calendar, CreditCard, Users, Wifi, Car, Coffee, Shield, Eye } from 'lucide-react';

const BookGround = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ground, setGround] = useState(null);
  const [settings, setSettings] = useState({
    rates: {
      weeklyRate: 800,
      weekendRate: 1000,
      continuousBooking: 900,
      membership: 800
    }
  });
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    duration: 1
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [showEstimate, setShowEstimate] = useState(false);

  useEffect(() => {
    fetchGround();
    fetchSettings();
  }, [id]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/public/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    if (formData.date) {
      fetchAvailableSlots();
    }
  }, [formData.date, id]);

  useEffect(() => {
    if (formData.date && formData.duration) {
      getEstimate();
    }
  }, [formData.date, formData.duration]);

  const fetchGround = async () => {
    try {
      const response = await axios.get(`/api/grounds/${id}`);
      setGround(response.data);
    } catch (error) {
      console.error('Error fetching ground:', error);
      toast.error('Failed to load ground details');
      navigate('/grounds');
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await axios.get(`/api/grounds/${id}/slots/${formData.date}`);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast.error('Failed to load available slots');
    }
  };

  const getEstimate = async () => {
    try {
      const response = await axios.post('/api/bookings/estimate', {
        groundId: id,
        date: formData.date,
        duration: formData.duration
      });
      setEstimate(response.data);
      setShowEstimate(true);
    } catch (error) {
      console.error('Error getting estimate:', error);
      toast.error('Failed to get pricing estimate');
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/bookings', {
        groundId: id,
        ...formData
      });
      toast.success('Booking created successfully!');
      navigate('/my-bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const getFacilityIcon = (facility) => {
    const iconMap = {
      'parking': Car,
      'wifi': Wifi,
      'cafe': Coffee,
      'security': Shield,
      'equipment': Eye,
      'changing_room': Users,
      'water': Coffee,
      'lighting': Shield
    };
    return iconMap[facility] || Eye;
  };

  if (!ground) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Ground Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="h-48 bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold">
                      {ground.type === 'cricket' ? '🏏' : '⚽'}
                    </span>
                  </div>
                  <p className="text-lg font-semibold">{ground.name}</p>
                </div>
              </div>
            </div>

            <div className="md:w-2/3">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{ground.name}</h1>
              <div className="flex items-center mb-2">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{ground.location}</span>
              </div>

              <div className="flex items-center mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  ground.type === 'cricket'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {ground.type.charAt(0).toUpperCase() + ground.type.slice(1)} Ground
                </span>
              </div>

              {ground.description && (
                <p className="text-gray-600 mb-4">{ground.description}</p>
              )}

              {/* Facilities */}
              {ground.facilities && ground.facilities.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Facilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {ground.facilities.map((facility) => {
                      const Icon = getFacilityIcon(facility);
                      return (
                        <span
                          key={facility}
                          className="inline-flex items-center px-3 py-1 text-sm bg-primary-50 text-primary-700 rounded-full"
                        >
                          <Icon className="w-4 h-4 mr-1" />
                          {facility.replace('_', ' ')}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="text-sm text-gray-600">4.5 (24 reviews)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Book This Ground</h2>

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
                  <option value={5}>5 Hours</option>
                  <option value={6}>6 Hours</option>
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
                  {availableSlots.map(slot => (
                    <option key={slot.startTime} value={slot.startTime}>
                      {slot.startTime} - {slot.endTime}
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
                {loading ? 'Creating Booking...' : 'Book Ground'}
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
                    <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-gray-700">Weekday (Mon-Thu)</span>
                  </div>
                  <span className="font-semibold text-gray-900">₹{ground.pricing?.weekday || settings.rates.weeklyRate}/hour</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-gray-700">Weekend (Fri-Sun)</span>
                  </div>
                  <span className="font-semibold text-gray-900">₹{ground.pricing?.weekend || settings.rates.weekendRate}/hour</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-gray-700">Continuous (2+ hours)</span>
                  </div>
                  <span className="font-semibold text-gray-900">₹{ground.pricing?.continuous || settings.rates.continuousBooking}/hour</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-gray-700">Membership</span>
                  </div>
                  <span className="font-semibold text-gray-900">₹{ground.pricing?.membership || settings.rates.membership}/hour</span>
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
                    <span className="text-gray-600">Rate Type:</span>
                    <span className="font-medium">
                      {estimate.hasMembership ? 'Membership' :
                       estimate.isContinuous ? 'Continuous' :
                       new Date(formData.date).getDay() === 0 || new Date(formData.date).getDay() === 5 || new Date(formData.date).getDay() === 6 ? 'Weekend' : 'Weekday'}
                    </span>
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
                  Full ground access
                </li>
                <li className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 text-green-500 mr-2" />
                  Basic equipment provided
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

export default BookGround;
