import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Users,
  Store,
  Settings,
  UserCheck,
  UserX,
  Trash2,
  Edit3,
  Save,
  X
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({
    siteTitle: '',
    siteDescription: '',
    contactInfo: {
      happyCustomers: '',
      sportsGrounds: '',
      successfulBookings: '',
      customerSupport: ''
    },
    rates: {
      weeklyRate: 0,
      weekendRate: 0,
      continuousBooking: 0,
      membership: 0
    }
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMerchants: 0,
    activeUsers: 0,
    activeMerchants: 0
  });
  const [loading, setLoading] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
      fetchSettings();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        toast.error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const updateSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Settings updated successfully');
        setEditingSettings(false);
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleSettingsChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users, merchants, and site settings</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Users & Merchants
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="inline-block w-4 h-4 mr-2" />
              Settings
            </button>
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Store className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Merchants</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalMerchants}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserCheck className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserCheck className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Merchants</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeMerchants}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Users & Merchants</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage user accounts and their status</p>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                  <li key={user._id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            user.role === 'merchant' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            <span className={`text-sm font-medium ${
                              user.role === 'merchant' ? 'text-blue-800' : 'text-green-800'
                            }`}>
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'merchant'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive !== false
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateUserStatus(user._id, user.isActive !== false ? false : true)}
                          className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded ${
                            user.isActive !== false
                              ? 'text-red-700 bg-red-100 hover:bg-red-200'
                              : 'text-green-700 bg-green-100 hover:bg-green-200'
                          }`}
                        >
                          {user.isActive !== false ? <UserX className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                          {user.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Site Settings</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Update site content and rates</p>
              </div>
              <button
                onClick={() => setEditingSettings(!editingSettings)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                {editingSettings ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                {editingSettings ? 'Cancel' : 'Edit Settings'}
              </button>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="space-y-6">
                {/* Site Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site Title</label>
                  <input
                    type="text"
                    value={settings.siteTitle}
                    onChange={(e) => handleSettingsChange('siteTitle', e.target.value)}
                    disabled={!editingSettings}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>

                {/* Site Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site Description</label>
                  <textarea
                    rows={3}
                    value={settings.siteDescription}
                    onChange={(e) => handleSettingsChange('siteDescription', e.target.value)}
                    disabled={!editingSettings}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Happy Customers</label>
                      <input
                        type="text"
                        value={settings.contactInfo.happyCustomers}
                        onChange={(e) => handleSettingsChange('contactInfo.happyCustomers', e.target.value)}
                        disabled={!editingSettings}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sports Grounds</label>
                      <input
                        type="text"
                        value={settings.contactInfo.sportsGrounds}
                        onChange={(e) => handleSettingsChange('contactInfo.sportsGrounds', e.target.value)}
                        disabled={!editingSettings}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Successful Bookings</label>
                      <input
                        type="text"
                        value={settings.contactInfo.successfulBookings}
                        onChange={(e) => handleSettingsChange('contactInfo.successfulBookings', e.target.value)}
                        disabled={!editingSettings}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Customer Support</label>
                      <input
                        type="text"
                        value={settings.contactInfo.customerSupport}
                        onChange={(e) => handleSettingsChange('contactInfo.customerSupport', e.target.value)}
                        disabled={!editingSettings}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Rates */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Rates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Weekly Rate</label>
                      <input
                        type="number"
                        value={settings.rates.weeklyRate}
                        onChange={(e) => handleSettingsChange('rates.weeklyRate', parseFloat(e.target.value) || 0)}
                        disabled={!editingSettings}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Weekend Rate</label>
                      <input
                        type="number"
                        value={settings.rates.weekendRate}
                        onChange={(e) => handleSettingsChange('rates.weekendRate', parseFloat(e.target.value) || 0)}
                        disabled={!editingSettings}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Continuous Booking Rate</label>
                      <input
                        type="number"
                        value={settings.rates.continuousBooking}
                        onChange={(e) => handleSettingsChange('rates.continuousBooking', parseFloat(e.target.value) || 0)}
                        disabled={!editingSettings}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Membership Rate</label>
                      <input
                        type="number"
                        value={settings.rates.membership}
                        onChange={(e) => handleSettingsChange('rates.membership', parseFloat(e.target.value) || 0)}
                        disabled={!editingSettings}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {editingSettings && (
                  <div className="flex justify-end">
                    <button
                      onClick={updateSettings}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
