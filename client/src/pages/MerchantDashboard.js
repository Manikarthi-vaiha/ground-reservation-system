import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Plus,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Edit,
  Trash2,
  Trophy,
  Image
} from 'lucide-react';
import AddGroundModal from '../components/AddGroundModal';
import GroundImageManager from '../components/GroundImageManager';

const MerchantDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [grounds, setGrounds] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddGroundModal, setShowAddGroundModal] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [selectedGround, setSelectedGround] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, groundsRes, bookingsRes, eventsRes] = await Promise.all([
        axios.get('/api/merchants/dashboard'),
        axios.get('/api/merchants/grounds'),
        axios.get('/api/merchants/bookings'),
        axios.get('/api/merchants/events')
      ]);

      setDashboardStats(statsRes.data);
      setGrounds(groundsRes.data);
      setBookings(bookingsRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await axios.put(`/api/merchants/bookings/${bookingId}/status`, { status });
      toast.success('Booking status updated successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const updateEventStatus = async (eventId, status) => {
    try {
      await axios.put(`/api/merchants/events/${eventId}/status`, { status });
      toast.success('Event status updated successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating event status:', error);
      toast.error('Failed to update event status');
    }
  };

  const deleteGround = async (groundId) => {
    if (!window.confirm('Are you sure you want to delete this ground?')) return;

    try {
      await axios.delete(`/api/merchants/grounds/${groundId}`);
      toast.success('Ground deleted successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting ground:', error);
      toast.error('Failed to delete ground');
    }
  };

  const handleAddGroundSuccess = () => {
    fetchDashboardData();
  };

  const handleManageImages = (ground) => {
    setSelectedGround(ground);
    setShowImageManager(true);
  };

  const handleImageManagerClose = () => {
    setShowImageManager(false);
    setSelectedGround(null);
  };

  const handleImageManagerSuccess = () => {
    fetchDashboardData();
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'grounds', label: 'My Grounds', icon: MapPin },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'events', label: 'Events', icon: Trophy }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Merchant Dashboard</h1>
          <p className="text-gray-600">Manage your grounds, bookings, and events</p>
        </div>

        {/* Stats Cards */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Grounds</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalGrounds}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{dashboardStats.totalRevenue}</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Bookings */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
                </div>
                <div className="p-6">
                  {bookings.slice(0, 5).length > 0 ? (
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{booking.ground?.name}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(booking.date)} • {booking.user?.name}
                            </p>
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
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Events */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
                </div>
                <div className="p-6">
                  {events.slice(0, 5).length > 0 ? (
                    <div className="space-y-4">
                      {events.slice(0, 5).map((event) => (
                        <div key={event._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{event.eventName}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(event.date)} • {event.user?.name}
                            </p>
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Grounds Tab */}
          {activeTab === 'grounds' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">My Grounds</h2>
                <button
                  onClick={() => setShowAddGroundModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ground
                </button>
              </div>
              <div className="p-6">
                {grounds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grounds.map((ground) => (
                      <div key={ground._id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{ground.name}</h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleManageImages(ground)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Manage Images"
                            >
                              <Image className="w-4 h-4" />
                            </button>
                            <button className="text-primary-600 hover:text-primary-700">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteGround(ground._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {/* Ground Images */}
                        {ground.images && ground.images.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Images ({ground.images.length})
                              </span>
                              {ground.images.length < 5 && (
                                <span className="text-xs text-red-600">
                                  Need {5 - ground.images.length} more
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {ground.images.slice(0, 3).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Ground ${index + 1}`}
                                  className="w-full h-16 object-cover rounded border"
                                />
                              ))}
                              {ground.images.length > 3 && (
                                <div className="w-full h-16 bg-gray-100 rounded border flex items-center justify-center">
                                  <span className="text-xs text-gray-600">
                                    +{ground.images.length - 3} more
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {ground.location}
                          </div>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ground.type === 'cricket'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {ground.type}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Weekday: ₹{ground.pricing?.weekday || 800}/hr</span>
                            <span>Weekend: ₹{ground.pricing?.weekend || 1000}/hr</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No grounds added yet</h3>
                    <p className="text-gray-600 mb-4">Add your first ground to start accepting bookings</p>
                    <button
                      onClick={() => setShowAddGroundModal(true)}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Add Ground
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">All Bookings</h2>
              </div>
              <div className="p-6">
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking._id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Calendar className="w-5 h-5 text-primary-600 mr-2" />
                              <h3 className="text-lg font-semibold text-gray-900">{booking.ground?.name}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                {booking.user?.name}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {formatDate(booking.date)} • {booking.startTime} - {booking.endTime}
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-2" />
                                ₹{booking.totalAmount}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 mt-4 md:mt-0">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            {booking.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                    <p className="text-gray-600">Bookings will appear here once customers start booking your grounds</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">All Events</h2>
              </div>
              <div className="p-6">
                {events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event._id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Trophy className="w-5 h-5 text-purple-600 mr-2" />
                              <h3 className="text-lg font-semibold text-gray-900">{event.eventName}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                {event.user?.name} • {event.guestCount} guests
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {formatDate(event.date)} • {event.startTime} - {event.endTime}
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-2" />
                                ₹{event.totalAmount}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              Type: {event.eventType} • Duration: {event.duration} hours
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 mt-4 md:mt-0">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                              {event.status}
                            </span>
                            {event.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => updateEventStatus(event._id, 'confirmed')}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => updateEventStatus(event._id, 'cancelled')}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
                    <p className="text-gray-600">Events will appear here once customers start booking events at your grounds</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Ground Modal */}
      <AddGroundModal
        isOpen={showAddGroundModal}
        onClose={() => setShowAddGroundModal(false)}
        onSuccess={handleAddGroundSuccess}
      />

      {/* Ground Image Manager */}
      {selectedGround && (
        <GroundImageManager
          ground={selectedGround}
          isOpen={showImageManager}
          onClose={handleImageManagerClose}
          onSuccess={handleImageManagerSuccess}
        />
      )}
    </div>
  );
};

export default MerchantDashboard;
