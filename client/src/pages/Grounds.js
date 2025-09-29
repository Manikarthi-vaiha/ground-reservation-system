import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MapPin, Clock, Users, Star, Filter, Search, Wifi, Car, Coffee, Shield, Eye } from 'lucide-react';

const Grounds = () => {
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    rates: {
      weeklyRate: 800,
      weekendRate: 1000,
      continuousBooking: 900,
      membership: 800
    }
  });
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    search: ''
  });

  useEffect(() => {
    fetchGrounds();
    fetchSettings();
  }, [filters]);

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

  const fetchGrounds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.location) params.append('location', filters.location);

      const response = await axios.get(`/api/grounds?${params.toString()}`);
      let filteredGrounds = response.data;

      if (filters.search) {
        filteredGrounds = filteredGrounds.filter(ground =>
          ground.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          ground.location.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setGrounds(filteredGrounds);
    } catch (error) {
      console.error('Error fetching grounds:', error);
      toast.error('Failed to load grounds');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sports Grounds</h1>
          <p className="text-gray-600">Find and book your perfect sports ground</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search grounds..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="cricket">Cricket</option>
              <option value="football">Football</option>
            </select>

            <input
              type="text"
              placeholder="Location..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />

            <button
              onClick={() => setFilters({ type: '', location: '', search: '' })}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Grounds Grid */}
        {grounds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grounds.map((ground) => (
              <div key={ground._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold">
                        {ground.type === 'cricket' ? '🏏' : '⚽'}
                      </span>
                    </div>
                    <p className="text-lg font-semibold">{ground.name}</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center mb-2">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">{ground.location}</span>
                  </div>

                  <div className="flex items-center mb-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      ground.type === 'cricket'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {ground.type.charAt(0).toUpperCase() + ground.type.slice(1)}
                    </span>
                  </div>

                  {ground.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {ground.description}
                    </p>
                  )}

                  {/* Facilities */}
                  {ground.facilities && ground.facilities.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {ground.facilities.slice(0, 4).map((facility) => {
                          const Icon = getFacilityIcon(facility);
                          return (
                            <span
                              key={facility}
                              className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                            >
                              <Icon className="w-3 h-3 mr-1" />
                              {facility.replace('_', ' ')}
                            </span>
                          );
                        })}
                        {ground.facilities.length > 4 && (
                          <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            +{ground.facilities.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      <p>Weekday: ₹{ground.pricing?.weekday || settings.rates.weeklyRate}/hr</p>
                      <p>Weekend: ₹{ground.pricing?.weekend || settings.rates.weekendRate}/hr</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-600">4.5 (24 reviews)</span>
                    </div>
                    <Link
                      to={`/grounds/${ground._id}/book`}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No grounds found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or check back later for new grounds.
            </p>
            <button
              onClick={() => setFilters({ type: '', location: '', search: '' })}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Grounds;
