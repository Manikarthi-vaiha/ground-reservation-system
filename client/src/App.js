import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Grounds from './pages/Grounds';
import BookGround from './pages/BookGround';
import MyBookings from './pages/MyBookings';
import Events from './pages/Events';
import PS5Booking from './pages/PS5Booking';
import MerchantDashboard from './pages/MerchantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute, { MerchantRestrictedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={
                <MerchantRestrictedRoute>
                  <Dashboard />
                </MerchantRestrictedRoute>
              } />
              <Route path="/grounds" element={<Grounds />} />
              <Route path="/grounds/:id/book" element={
                <MerchantRestrictedRoute>
                  <BookGround />
                </MerchantRestrictedRoute>
              } />
              <Route path="/my-bookings" element={
                <MerchantRestrictedRoute>
                  <MyBookings />
                </MerchantRestrictedRoute>
              } />
              <Route path="/events" element={
                <MerchantRestrictedRoute>
                  <Events />
                </MerchantRestrictedRoute>
              } />
              <Route path="/ps5" element={
                <MerchantRestrictedRoute>
                  <PS5Booking />
                </MerchantRestrictedRoute>
              } />
              <Route path="/merchant" element={
                <ProtectedRoute allowedRoles={['merchant', 'admin']}>
                  <MerchantDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
