import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Users,
  Trophy,
  Gamepad2,
  Star,
  Clock,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState({
    siteTitle: 'Ground Booking',
    siteDescription: 'Your premier destination for cricket and football ground bookings. Book your favorite sports ground with ease and enjoy the best facilities.',
    contactInfo: {
      happyCustomers: 'happy customer',
      sportsGrounds: 'sports ground',
      successfulBookings: 'Successful Bookings',
      customerSupport: 'Customer Support'
    },
    rates: {
      weeklyRate: 800,
      weekendRate: 1000,
      continuousBooking: 900,
      membership: 800
    }
  });

  useEffect(() => {
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

    fetchSettings();
  }, []);

  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-primary-600" />,
      title: "Easy Booking",
      description: "Book your favorite ground in just a few clicks with our intuitive booking system."
    },
    {
      icon: <Clock className="w-8 h-8 text-primary-600" />,
      title: "Flexible Timing",
      description: "Choose from multiple time slots throughout the day to fit your schedule."
    },
    {
      icon: <Star className="w-8 h-8 text-primary-600" />,
      title: "Credit Points",
      description: "Earn points with every booking and get free hours when you reach 100 points."
    },
    {
      icon: <Users className="w-8 h-8 text-primary-600" />,
      title: "Event Booking",
      description: "Host birthday parties, corporate events, and tournaments with special packages."
    },
    {
      icon: <Gamepad2 className="w-8 h-8 text-primary-600" />,
      title: "PS5 Gaming",
      description: "Enjoy PS5 gaming sessions with single or double player options."
    },
    {
      icon: <Trophy className="w-8 h-8 text-primary-600" />,
      title: "Premium Facilities",
      description: "Access to well-maintained grounds with modern facilities and equipment."
    }
  ];

  const pricingPlans = [
    {
      name: "Weekday Rate",
      price: `₹${settings.rates.weeklyRate}`,
      period: "per hour",
      description: "Monday to Thursday",
      features: ["Standard booking", "All facilities included", "Credit points earned"]
    },
    {
      name: "Weekend Rate",
      price: `₹${settings.rates.weekendRate}`,
      period: "per hour",
      description: "Friday to Sunday",
      features: ["Premium weekend access", "All facilities included", "Credit points earned"]
    },
    {
      name: "Continuous Booking",
      price: `₹${settings.rates.continuousBooking}`,
      period: "per hour",
      description: "Multiple hours booking",
      features: ["Discounted rate", "2+ hours booking", "Priority support"]
    },
    {
      name: "Membership",
      price: `₹${settings.rates.membership}`,
      period: "per hour",
      description: "All days with membership",
      features: ["Flat rate all days", "Priority booking", "Exclusive benefits"]
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {settings.siteTitle}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              {settings.siteDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/grounds"
                className="bg-secondary-600 hover:bg-secondary-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                Browse Grounds
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose GroundBooking?
            </h2>
            <p className="text-xl text-gray-600">
              Experience the best in sports ground booking with our comprehensive platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold text-primary-600 mb-1">
                    {plan.price}
                  </div>
                  <div className="text-gray-500 mb-2">
                    {plan.period}
                  </div>
                  <p className="text-sm text-gray-600">
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-secondary-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Book Your Ground?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of satisfied customers and start booking today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/grounds"
              className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center"
            >
              Browse Available Grounds
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-gray-600">{settings.contactInfo.happyCustomers}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">50+</div>
              <div className="text-gray-600">{settings.contactInfo.sportsGrounds}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">1000+</div>
              <div className="text-gray-600">{settings.contactInfo.successfulBookings}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
              <div className="text-gray-600">{settings.contactInfo.customerSupport}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
