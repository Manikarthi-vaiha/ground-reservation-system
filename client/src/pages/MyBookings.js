import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, Clock, MapPin, Star, X, Eye, Trophy, Gamepad2 } from 'lucide-react';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [ps5Bookings, setPs5Bookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grounds');

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const fetchAllBookings = async () => {
    try {
      const [bookingsRes, eventsRes, ps5Res] = await Promise.all([
        axios.get('/api/bookings/my-bookings'),
        axios.get('/api/events/my-events'),
        axios.get('/api/ps5/my-bookings')
      ]);

      setBookings(bookingsRes.data);
      setEvents(eventsRes.data);
      setPs5Bookings(ps5Res.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId, type) => {
    try {
      const endpoint = type === 'ground' ? '/api/bookings' :
                     type === 'event' ? '/api/events' : '/api/ps5';

      await axios.put(`${endpoint}/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchAllBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'grounds', label: 'Ground Bookings', count: bookings.length, icon: Calendar },
    { id: 'events', label: 'Events', count: events.length, icon: Trophy },
    { id: 'ps5', label: 'PS5 Sessions', count: ps5Bookings.length, icon: Gamepad2 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage all your bookings and reservations</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                    <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Ground Bookings */}
          {activeTab === 'grounds' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Ground Bookings</h2>
              </div>
              <div className="p-6">
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Calendar className="w-5 h-5 text-primary-600 mr-2" />
                              <h3 className="text-lg font-semibold text-gray-900">{booking.ground?.name}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2" />
                                {booking.ground?.location}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                {formatDate(booking.date)} • {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                              </div>
                              <div className="flex items-center">
                                <Star className="w-4 h-4 mr-2" />
                                {booking.duration} hour(s) • ₹{booking.totalAmount}
                              </div>
                            </div>
                            {booking.creditPointsEarned > 0 && (
                              <div className="mt-2 text-sm text-primary-600">
                                +{booking.creditPointsEarned} credit points earned
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 mt-4 md:mt-0">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            {booking.status === 'pending' && (
                              <button
                                onClick={() => cancelBooking(booking._id, 'ground')}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No ground bookings yet</h3>
                    <p className="text-gray-600 mb-4">Start by booking your first sports ground</p>
                    <a
                      href="/grounds"
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Browse Grounds
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Events */}
          {activeTab === 'events' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Event Bookings</h2>
              </div>
              <div className="p-6">
                {events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Trophy className="w-5 h-5 text-purple-600 mr-2" />
                              <h3 className="text-lg font-semibold text-gray-900">{event.eventName}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2" />
                                {event.ground?.location}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                {formatDate(event.date)} • {formatTime(event.startTime)} - {formatTime(event.endTime)}
                              </div>
                              <div className="flex items-center">
                                <Star className="w-4 h-4 mr-2" />
                                {event.guestCount} guests • ₹{event.totalAmount}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              Type: {event.eventType} • Duration: {event.duration} hours
                            </div>
                            {event.creditPointsEarned > 0 && (
                              <div className="mt-2 text-sm text-primary-600">
                                +{event.creditPointsEarned} credit points earned
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 mt-4 md:mt-0">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                              {event.status}
                            </span>
                            {event.status === 'pending' && (
                              <button
                                onClick={() => cancelBooking(event._id, 'event')}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No events booked yet</h3>
                    <p className="text-gray-600 mb-4">Plan your first birthday party or corporate event</p>
                    <a
                      href="/events"
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Plan Event
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PS5 Bookings */}
          {activeTab === 'ps5' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">PS5 Gaming Sessions</h2>
              </div>
              <div className="p-6">
                {ps5Bookings.length > 0 ? (
                  <div className="space-y-4">
                    {ps5Bookings.map((booking) => (
                      <div key={booking._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Gamepad2 className="w-5 h-5 text-orange-600 mr-2" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                PS5 {booking.playerType === 'single' ? 'Single Player' : 'Double Player'} Session
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {formatDate(booking.date)}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                              </div>
                              <div className="flex items-center">
                                <Star className="w-4 h-4 mr-2" />
                                {booking.duration} hour(s) • ₹{booking.totalAmount}
                              </div>
                            </div>
                            {booking.creditPointsEarned > 0 && (
                              <div className="mt-2 text-sm text-primary-600">
                                +{booking.creditPointsEarned} credit points earned
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 mt-4 md:mt-0">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            {booking.status === 'pending' && (
                              <button
                                onClick={() => cancelBooking(booking._id, 'ps5')}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No PS5 sessions booked yet</h3>
                    <p className="text-gray-600 mb-4">Book your first PS5 gaming session</p>
                    <a
                      href="/ps5"
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Book PS5 Session
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
