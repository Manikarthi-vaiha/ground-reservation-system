import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut, Settings, Calendar, Gamepad2, Shield } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold text-gray-900">GroundBooking</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/grounds" className="text-gray-700 hover:text-primary-600 transition-colors">
              Grounds
            </Link>
            {isAuthenticated && (
              <>
                {user?.role !== 'merchant' && (
                  <>
                    <Link to="/my-bookings" className="text-gray-700 hover:text-primary-600 transition-colors">
                      My Bookings
                    </Link>
                    <Link to="/events" className="text-gray-700 hover:text-primary-600 transition-colors">
                      Events
                    </Link>
                    <Link to="/ps5" className="text-gray-700 hover:text-primary-600 transition-colors">
                      PS5 Gaming
                    </Link>
                  </>
                )}
                {user?.role === 'merchant' && (
                  <Link to="/merchant" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Merchant Dashboard
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Admin Dashboard
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleProfile}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>{user?.name}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    {user?.role !== 'merchant' && user?.role !== 'admin' && (
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                to="/grounds"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Grounds
              </Link>
              {isAuthenticated && (
                <>
                  {user?.role !== 'merchant' && (
                    <>
                      <Link
                        to="/my-bookings"
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My Bookings
                      </Link>
                      <Link
                        to="/events"
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Events
                      </Link>
                      <Link
                        to="/ps5"
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        PS5 Gaming
                      </Link>
                      <Link
                        to="/dashboard"
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                    </>
                  )}
                  {user?.role === 'merchant' && (
                    <Link
                      to="/merchant"
                      className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Merchant Dashboard
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </>
              )}
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
