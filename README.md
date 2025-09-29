# GroundBooking - Sports Ground Booking Platform

A comprehensive web application for booking cricket and football grounds, PS5 gaming sessions, and events. Built with React frontend and Node.js backend.

## Features

### User Features
- **User Registration & Login** - Secure authentication system
- **Ground Booking** - Book cricket and football grounds with flexible timing
- **Event Booking** - Plan birthday parties, corporate events, and tournaments
- **PS5 Gaming** - Book PS5 gaming sessions (single/double player)
- **Credit Points System** - Earn points with every booking, get free hours at 100 points
- **Membership Benefits** - Flat ₹800/hour rate for all days with membership

### Merchant Features
- **Merchant Dashboard** - Manage grounds, bookings, and events
- **Ground Management** - Add, edit, and delete grounds
- **Booking Management** - View and manage all bookings
- **Event Management** - Handle event bookings and special requirements
- **Revenue Tracking** - Monitor earnings and booking statistics

### Pricing Structure
- **Weekday Rate**: ₹800/hour (Monday to Thursday)
- **Weekend Rate**: ₹1000/hour (Friday to Sunday)
- **Continuous Booking**: ₹900/hour (2+ hours)
- **Membership Rate**: ₹800/hour (all days)
- **PS5 Single Player**: ₹100/hour
- **PS5 Double Player**: ₹150/hour

## Screenshots

### User Interface

#### Login & Authentication
![User Login](screenshots/user/screencapture-localhost-3000-login-2025-09-29-11_58_01.png)

#### Ground Booking
![Grounds List](screenshots/user/screencapture-localhost-3000-grounds-2025-09-29-12_04_05.png)
![Ground Booking Form](screenshots/user/screencapture-localhost-3000-grounds-68da258cedb92c65bcb65c4a-book-2025-09-29-12_04_16.png)
![Booking Confirmation](screenshots/user/screencapture-localhost-3000-grounds-68da258cedb92c65bcb65c4a-book-2025-09-29-12_04_37.png)

#### My Bookings
![My Bookings List](screenshots/user/screencapture-localhost-3000-my-bookings-2025-09-29-12_04_46.png)
![Booking Details](screenshots/user/screencapture-localhost-3000-my-bookings-2025-09-29-12_05_00.png)
![Booking Management](screenshots/user/screencapture-localhost-3000-my-bookings-2025-09-29-12_07_04.png)

#### Events & PS5 Booking
![Events Page](screenshots/user/screencapture-localhost-3000-events-2025-09-29-12_05_49.png)
![PS5 Booking](screenshots/user/screencapture-localhost-3000-ps5-2025-09-29-12_06_31.png)

#### User Dashboard
![User Dashboard](screenshots/user/screencapture-localhost-3000-dashboard-2025-09-29-12_06_43.png)

### Merchant Interface

#### Merchant Dashboard
![Merchant Dashboard](screenshots/merchant/screencapture-localhost-3000-merchant-2025-09-29-11_58_42.png)
![Merchant Overview](screenshots/merchant/screencapture-localhost-3000-merchant-2025-09-29-11_58_54.png)

#### Ground Management
![Ground Management](screenshots/merchant/screencapture-localhost-3000-merchant-2025-09-29-11_59_07.png)
![Add Ground](screenshots/merchant/screencapture-localhost-3000-merchant-2025-09-29-11_59_27.png)

#### Booking Management
![Booking Management](screenshots/merchant/screencapture-localhost-3000-merchant-2025-09-29-11_59_34.png)
![Booking Details](screenshots/merchant/screencapture-localhost-3000-merchant-2025-09-29-11_59_59.png)

#### Event Management
![Event Management](screenshots/merchant/screencapture-localhost-3000-merchant-2025-09-29-12_00_07.png)

### Admin Interface

#### Admin Dashboard
![Admin Dashboard](screenshots/admin/screencapture-localhost-3000-dashboard-2025-09-29-12_11_11.png)
![Admin Panel](screenshots/admin/screencapture-localhost-3000-admin-2025-09-29-12_11_39.png)
![Admin Management](screenshots/admin/screencapture-localhost-3000-admin-2025-09-29-12_11_45.png)
![Admin Settings](screenshots/admin/screencapture-localhost-3000-admin-2025-09-29-12_11_54.png)

## Technology Stack

### Frontend
- React 18
- React Router DOM
- Tailwind CSS
- Lucide React (Icons)
- Axios (HTTP Client)
- React Toastify (Notifications)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Bcryptjs (Password Hashing)
- Express Validator

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ground_booking
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The client will run on `http://localhost:3000`

### Full Application Setup

From the root directory, you can install all dependencies and start both servers:

```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/membership` - Update membership

### Grounds
- `GET /api/grounds` - Get all grounds
- `GET /api/grounds/:id` - Get single ground
- `GET /api/grounds/:id/availability` - Check availability
- `GET /api/grounds/:id/slots/:date` - Get available time slots

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get single booking
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/estimate` - Get pricing estimate

### Events
- `POST /api/events` - Create event booking
- `GET /api/events/my-events` - Get user's events
- `GET /api/events/:id` - Get single event
- `PUT /api/events/:id/cancel` - Cancel event
- `POST /api/events/estimate` - Get event pricing estimate

### PS5 Bookings
- `POST /api/ps5` - Create PS5 booking
- `GET /api/ps5/my-bookings` - Get user's PS5 bookings
- `GET /api/ps5/:id` - Get single PS5 booking
- `PUT /api/ps5/:id/cancel` - Cancel PS5 booking
- `GET /api/ps5/availability/:date` - Get PS5 availability
- `POST /api/ps5/estimate` - Get PS5 pricing estimate

### Merchant
- `GET /api/merchants/grounds` - Get merchant's grounds
- `POST /api/merchants/grounds` - Create new ground
- `PUT /api/merchants/grounds/:id` - Update ground
- `DELETE /api/merchants/grounds/:id` - Delete ground
- `GET /api/merchants/bookings` - Get merchant's bookings
- `PUT /api/merchants/bookings/:id/status` - Update booking status
- `GET /api/merchants/events` - Get merchant's events
- `PUT /api/merchants/events/:id/status` - Update event status
- `GET /api/merchants/dashboard` - Get dashboard statistics

## Database Models

### User
- Personal information (name, email, phone)
- Authentication (password, role)
- Credit points and membership details

### Ground
- Ground details (name, type, location, description)
- Pricing information
- Merchant association

### Booking
- User and ground references
- Date, time, and duration
- Pricing and payment status
- Credit points earned/used

### Event
- Event details (type, name, guest count)
- Special requirements and services
- Pricing and payment status

### PS5Booking
- User reference
- Date, time, and duration
- Player type (single/double)
- Pricing and payment status

## Business Logic

### Pricing Calculation
- Weekday: ₹800/hour (Monday-Thursday)
- Weekend: ₹1000/hour (Friday-Sunday)
- Continuous: ₹900/hour (2+ hours)
- Membership: ₹800/hour (all days)

### Credit Points System
- Earn 1 point for every ₹10 spent
- Get 1 hour free when reaching 100 points
- Points can be used for future bookings

### Event Pricing
- Base rate: ₹1000/hour (weekday) / ₹1200/hour (weekend)
- Catering: ₹200 per person
- Decorations: ₹1000 fixed charge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
