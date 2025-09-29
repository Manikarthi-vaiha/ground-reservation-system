import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Trophy,
  Gamepad2,
  Plus,
  Eye,
  X
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [ps5Bookings, setPs5Bookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [bookingsRes, eventsRes, ps5Res] = await Promise.all([
        axios.get('/api/bookings/my-bookings'),
        axios.get('/api/events/my-events'),
        axios.get('/api/ps5/my-bookings')
      ]);

      setBookings(bookingsRes.data.slice(0, 3));
      setEvents(eventsRes.data.slice(0, 3));
      setPs5Bookings(ps5Res.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your bookings and activities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Star className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Credit Points</p>
                <p className="text-2xl font-bold text-gray-900">{user?.creditPoints || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <Calendar className="w-6 h-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Events</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Gamepad2 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">PS5 Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{ps5Bookings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/grounds"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Plus className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Book Ground</h3>
                  <p className="text-sm text-gray-600">Find and book a sports ground</p>
                </div>
              </div>
            </Link>

            <Link
              to="/events"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Plan Event</h3>
                  <p className="text-sm text-gray-600">Book for birthday or corporate event</p>
                </div>
              </div>
            </Link>

            <Link
              to="/ps5"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Gamepad2 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">PS5 Gaming</h3>
                  <p className="text-sm text-gray-600">Book PS5 gaming session</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
                <Link
                  to="/my-bookings"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{booking.ground?.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(booking.date)} • {booking.startTime} - {booking.endTime}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No bookings yet</p>
                  <Link
                    to="/grounds"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Book your first ground
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
                <Link
                  to="/events"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Trophy className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{event.eventName}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(event.date)} • {event.guestCount} guests
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No events yet</p>
                  <Link
                    to="/events"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Plan your first event
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Membership Section */}
        {user?.membership === 'none' && (
          <div className="mt-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Upgrade to Membership</h3>
                <p className="text-primary-100">
                  Get flat ₹800/hour rate for all days and exclusive benefits
                </p>
              </div>
              <Link
                to="/dashboard"
                className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
