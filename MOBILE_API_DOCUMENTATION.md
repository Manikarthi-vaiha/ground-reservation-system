# Mobile API Documentation

This document describes the REST APIs available for mobile applications. The mobile APIs are designed with specific restrictions to ensure proper access control.

## Base URL
```
http://localhost:5001/api/mobile
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 1. User Registration
**POST** `/auth/register`

Register a new user account. Only 'user' role is allowed for registration.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "user",
      "creditPoints": 0,
      "membership": "none"
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Name must be at least 2 characters",
      "param": "name"
    }
  ]
}
```

### 2. User Login
**POST** `/auth/login`

Login for users and merchants. Admin users are blocked from mobile login.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "user",
      "creditPoints": 0,
      "membership": "none",
      "membershipExpiry": null
    }
  }
}
```

### 3. Merchant Login Only
**POST** `/auth/merchant/login`

Login specifically for merchants. Only users with 'merchant' role can use this endpoint.

**Request Body:**
```json
{
  "email": "merchant@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Merchant login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "merchant_id",
      "name": "Merchant Name",
      "email": "merchant@example.com",
      "phone": "1234567890",
      "role": "merchant",
      "creditPoints": 0
    }
  }
}
```

### 4. Get User Profile
**GET** `/auth/profile`

Get the current user's profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "user",
      "creditPoints": 0,
      "membership": "none",
      "membershipExpiry": null,
      "isActive": true
    }
  }
}
```

### 5. Update User Profile
**PUT** `/auth/profile`

Update user profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "0987654321"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "0987654321",
      "role": "user",
      "creditPoints": 0,
      "membership": "none",
      "membershipExpiry": null
    }
  }
}
```

### 6. Change Password
**PUT** `/auth/change-password`

Change user password.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 7. Logout
**POST** `/auth/logout`

Logout user (client-side token removal).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Error message",
      "param": "field_name"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Admin registration is not allowed through mobile API"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error during registration"
}
```

## Security Features

1. **Admin Access Blocked**: Admin users cannot register or login through mobile APIs
2. **Role-based Access**: Merchants can only login through the merchant-specific endpoint
3. **JWT Authentication**: All protected endpoints require valid JWT tokens
4. **Input Validation**: All inputs are validated using express-validator
5. **Password Hashing**: Passwords are automatically hashed using bcrypt
6. **Mobile App Detection**: Admin endpoints are blocked for mobile user agents

## Usage Examples

### JavaScript/Fetch Example
```javascript
// Register a new user
const registerUser = async (userData) => {
  const response = await fetch('http://localhost:5001/api/mobile/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });

  const result = await response.json();
  return result;
};

// Login user
const loginUser = async (credentials) => {
  const response = await fetch('http://localhost:5001/api/mobile/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials)
  });

  const result = await response.json();
  return result;
};

// Get user profile
const getUserProfile = async (token) => {
  const response = await fetch('http://localhost:5000/api/mobile/auth/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  const result = await response.json();
  return result;
};
```

### cURL Examples
```bash
# Register user
curl -X POST http://localhost:5001/api/mobile/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'

# Login user
curl -X POST http://localhost:5001/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get profile
curl -X GET http://localhost:5000/api/mobile/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## User APIs (Beyond Authentication)

### Base URL for User APIs
```
http://localhost:5001/api/mobile/user
```

### Ground Management APIs

#### Get All Grounds
**GET** `/grounds`

**Query Parameters:**
- `type` (optional): Filter by ground type (cricket, football)
- `location` (optional): Filter by location
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Grounds retrieved successfully",
  "data": {
    "grounds": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalGrounds": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Get Single Ground
**GET** `/grounds/:id`

#### Check Ground Availability
**GET** `/grounds/:id/availability?date=2024-01-15&startTime=10:00&endTime=12:00`

#### Get Available Time Slots
**GET** `/grounds/:id/slots/:date`

### Booking Management APIs

#### Create Booking
**POST** `/bookings`

**Request Body:**
```json
{
  "groundId": "ground_id_here",
  "date": "2024-01-15",
  "startTime": "10:00",
  "endTime": "12:00",
  "duration": 2,
  "creditPointsUsed": 0
}
```

#### Get My Bookings
**GET** `/bookings/my-bookings`

**Query Parameters:**
- `page`, `limit`: Pagination
- `status` (optional): Filter by status

#### Get Single Booking
**GET** `/bookings/:id`

#### Cancel Booking
**PUT** `/bookings/:id/cancel`

#### Get Booking Estimate
**POST** `/bookings/estimate`

### Event Management APIs

#### Create Event
**POST** `/events`

**Request Body:**
```json
{
  "groundId": "ground_id_here",
  "eventType": "birthday",
  "eventName": "Birthday Party",
  "date": "2024-01-15",
  "startTime": "10:00",
  "endTime": "18:00",
  "duration": 8,
  "guestCount": 50,
  "catering": true,
  "decorations": true,
  "specialRequirements": "Need sound system",
  "notes": "Additional notes"
}
```

#### Get My Events
**GET** `/events/my-events`

#### Get Single Event
**GET** `/events/:id`

#### Cancel Event
**PUT** `/events/:id/cancel`

#### Get Event Estimate
**POST** `/events/estimate`

### PS5 Booking APIs

#### Create PS5 Booking
**POST** `/ps5/bookings`

**Request Body:**
```json
{
  "date": "2024-01-15",
  "startTime": "10:00",
  "endTime": "12:00",
  "duration": 2,
  "playerType": "single",
  "creditPointsUsed": 0
}
```

#### Get My PS5 Bookings
**GET** `/ps5/my-bookings`

#### Get PS5 Availability
**GET** `/ps5/availability/:date`

#### Get PS5 Estimate
**POST** `/ps5/estimate`

### User Dashboard
**GET** `/dashboard`

## Merchant APIs

### Base URL for Merchant APIs
```
http://localhost:5001/api/mobile/merchant
```

### Ground Management APIs

#### Get My Grounds
**GET** `/grounds`

#### Create Ground
**POST** `/grounds`

**Request Body:**
```json
{
  "name": "Cricket Ground 1",
  "type": "cricket",
  "location": "Mumbai",
  "description": "Premium cricket ground",
  "capacity": 22,
  "amenities": ["parking", "washroom", "canteen"]
}
```

#### Update Ground
**PUT** `/grounds/:id`

#### Delete Ground
**DELETE** `/grounds/:id`

#### Upload Ground Images
**POST** `/grounds/:id/images`

**Content-Type:** `multipart/form-data`
**Body:** `images` (array of image files, minimum 5 required)

#### Delete Ground Image
**DELETE** `/grounds/:id/images/:imageIndex`

### Booking Management APIs

#### Get My Bookings
**GET** `/bookings`

**Query Parameters:**
- `page`, `limit`: Pagination
- `status` (optional): Filter by status
- `groundId` (optional): Filter by ground

#### Get Single Booking
**GET** `/bookings/:id`

#### Update Booking Status
**PUT** `/bookings/:id/status`

**Request Body:**
```json
{
  "status": "confirmed"
}
```

### Event Management APIs

#### Get My Events
**GET** `/events`

#### Get Single Event
**GET** `/events/:id`

#### Update Event Status
**PUT** `/events/:id/status`

### Merchant Dashboard
**GET** `/dashboard`

**Response:**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "merchant": {...},
    "stats": {
      "totalGrounds": 5,
      "totalBookings": 150,
      "confirmedBookings": 120,
      "totalEvents": 25,
      "confirmedEvents": 20,
      "totalRevenue": 50000
    },
    "groundStats": [...],
    "recentBookings": [...],
    "recentEvents": [...]
  }
}
```

### Analytics
**GET** `/analytics?period=30`

## Common Response Format

All mobile APIs return responses in this format:
```json
{
  "success": true/false,
  "message": "descriptive message",
  "data": { /* response data */ }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Error message",
      "param": "field_name"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error while processing request"
}
```

## Notes

- All timestamps are in ISO format
- JWT tokens expire after 7 days
- Phone numbers should be at least 10 characters
- Passwords must be at least 6 characters
- Email addresses are automatically normalized to lowercase
- Admin access is completely blocked from mobile applications
- All APIs include pagination for list endpoints
- Image uploads are limited to 5MB per file
- Ground images require minimum 5 images
- Credit points are earned at 1 point per 10 rupees spent
- All booking/event operations include availability checking
