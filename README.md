# LogiTrack - Smart Parcel Delivery and Tracking System

https://parcel-delivery-system-mongo-db-1do.vercel.app/

LogiTrack is a modern, full-stack logistics and parcel delivery tracking platform. It is designed to support real-time geolocation tracking, secure role-based dashboard access, and a dual shipment registration workflow that accommodates both offline walk-in bookings and online customer pickup requests.

---

## 🚀 Key Features

* **Dual Shipment Registration Workflows**:
  * **Option 1 (Walk-In Booking)**: Admin manually registers parcels directly on behalf of walk-in customers.
  * **Option 2 (Online Request)**: Customers submit booking requests online. Admin approves the requests and assigns drivers.
* **Pinpoint Geolocation Map Tracking**: Integrates Leaflet maps with Nominatim OpenStreetMap API to automatically convert human-readable location names (e.g. "Bangalore") into exact coordinate parameters (`Latitude`/`Longitude`).
* **Real-Time Map Updates**: Utilizes `Socket.io` WebSockets to instantly broadcast coordinates from the driver's device to active tracking maps without page reloads.
* **Role-Based Access Control (RBAC)**: Supports three secure user roles (Admin, Driver, Customer) protected by JSON Web Tokens (JWT) stored in session scopes.
* **Sensitive Data Protection**: Enforces strict database-level filtering so customers can *only* search and track parcels where they match the registered sender or receiver name.

---

## 🛠️ Technology Stack

* **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Leaflet (Map rendering)
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (Mongoose Object Modeling)
* **Real-time Engine**: Socket.io
* **Geocoding**: OpenStreetMap Nominatim API

---

## 📂 Project Structure

```
LogiTrack/
├── backend/
│   ├── models/            # Mongoose schemas (User, Parcel, Driver, Tracking)
│   ├── routes/            # Express routes (authRoutes, parcelRoutes, driverRoutes)
│   ├── middleware/        # Authentication & Role restrictions (authMiddleware)
│   ├── server.js          # Core Express server & Socket.io handling
│   ├── insertSamples.js   # Database seeder script
│   ├── queries.js         # Sample MongoDB lookup operations
│   ├── package.json
│   └── .env               # Local configuration & environment variables
├── frontend/
│   ├── index.html         # Login / Registration portal
│   ├── admin-dashboard.html
│   ├── customer-dashboard.html
│   ├── driver-dashboard.html
│   ├── parcel-list.html   # Admin list with Active/Requested tabs
│   ├── driver-management.html
│   ├── parcel-tracking.html
│   ├── css/
│   │   └── styles.css     # Clean glassmorphism styling rules
│   ├── js/
│   │   ├── app.js         # Core API fetching & tab toggling handlers
│   │   └── map.js         # Leaflet initialization & route polyline rendering
│   └── package.json       # Frontend local server configuration
└── README.md
```

---

## 📦 System Workflows

```
  [ Walk-In Customer ]                 [ Online Customer ]
          │                                     │
          ▼                                     ▼
   Admin Enters Details               Customer requests Pickup
   (Custom Parcel ID)                     (System ID: LP-XXXXXX)
          │                                     │
          │                                     ▼
          │                            Status: 'Requested'
          │                                     │
          │                                     ▼
          │                           Admin Approves & Assigns
          ▼                                     │
   Status: 'Pending' <──────────────────────────┘
          │
          ▼
   Driver Updates Status to 'In Transit'
          │
          ├─────────────────────────┐
          ▼                         ▼
   Updates Location           Broadcasts coordinates
   (Nominatim Geocoding)      (Socket.io WebSockets)
          │                         │
          ▼                         ▼
   Status: 'Delivered' ───> Customer Map moves live!
```

### Option 1: Walk-In Flow (Admin Registration)
1. Admin logs into the portal and navigates to **Add Parcel**.
2. Input fields (Sender, Receiver, Weight, Addresses, and a custom Parcel ID) are entered.
3. The shipment starts directly in the `'Pending'` state.
4. Admin assigns an available Driver to pick it up and deliver it.

### Option 2: Online Flow (Customer Booking Request)
1. Customer registers/logs in and goes to the **Book a Shipment** tab.
2. The customer provides the recipient name, weight, and addresses.
3. The backend generates a unique tracking ID starting with `LP-` (e.g. `LP-739201`) and sets the status to `'Requested'`.
4. Admin opens the **Parcel List** page under the **Pickup Requests** tab (which displays a red badge count of pending approvals).
5. Admin clicks **Approve & Assign** on the requested row, selecting a driver.
6. The parcel status is automatically promoted to `'Pending'` and it transfers to the **Active Shipments** list.

---

## 🛡️ Security Architecture

LogiTrack enforces a multi-layered security protocol protecting data integrity and user privacy:

### 1. Cryptographic Password Hashing (Salt & Hash)
* **Implementation:** [backend/models/User.js](file:///c:/Users/RAKSHA/Downloads/PARCEL/ParcelDeliverySystem/backend/models/User.js#L35-L46)
* **Mechanism:** Intercepts user schema save actions using a pre-save hook to hash raw passwords using `bcrypt` (10 rounds of salt generation). 
* **Security Goal:** Protects user password files. If the database leaks, user accounts cannot be breached as plain text passwords are not stored.

### 2. Token-Based Session Security (JWT)
* **Implementation:** [backend/middleware/authMiddleware.js](file:///c:/Users/RAKSHA/Downloads/PARCEL/ParcelDeliverySystem/backend/middleware/authMiddleware.js#L4-L35)
* **Mechanism:** Exchanges login credentials for a signed JSON Web Token (JWT) cryptographic string. The frontend automatically wraps API requests in the `Authorization: Bearer <token>` header.
* **Security Goal:** Eliminates cookie-jacking, prevents CSRF attacks, and validates requests statelessly.

### 3. Role-Based Access Control (RBAC)
* **Implementation:** [backend/middleware/authMiddleware.js](file:///c:/Users/RAKSHA/Downloads/PARCEL/ParcelDeliverySystem/backend/middleware/authMiddleware.js#L38-L47)
* **Mechanism:** Implements a `restrictTo(...roles)` router guard. 
* **Security Goal:** Limits endpoint execution boundary. E.g., customer or driver accounts are blocked from calling admin management routes (yields `403 Forbidden`).

### 4. Row-Level Query Isolation (Data Ownership Privacy)
* **Implementation:** [backend/routes/parcelRoutes.js](file:///c:/Users/RAKSHA/Downloads/PARCEL/ParcelDeliverySystem/backend/routes/parcelRoutes.js#L73-L81) and [tracking query check](file:///c:/Users/RAKSHA/Downloads/PARCEL/ParcelDeliverySystem/backend/routes/parcelRoutes.js#L290-L295)
* **Mechanism:** Dynamically appends a MongoDB `$or` filter to parcel fetches, ensuring customer requests *only* read documents matching their session username. The `/tracking/:parcelId` route enforces a manual check returning `403 Forbidden` if a customer tries to query coordinates of a parcel they did not send or receive.
* **Security Goal:** Ensures complete delivery privacy. Attackers cannot guess parcel IDs to track or inspect other clients' addresses.

---

## 🔌 API Documentation

### Authentication Routes (`/api/auth`)
* `POST /register` - Creates a user account (Admin, Driver, or Customer). Automatically instantiates a driver profile if the driver role is selected.
* `POST /login` - Validates credentials and yields a secure JWT token.
* `GET /profile` - Retreives details of the logged-in session user.

### Parcel Management Routes (`/api/parcels`)
* `GET /` - Fetches all parcels. Customers only receive items where they are the sender/receiver.
* `POST /add` - Admin-only route to create a walk-in parcel.
* `POST /book` - Customer-only route to request an online booking.
* `PUT /assign-driver/:parcelId` - Approves a request and assigns a driver.
* `PUT /update-status/:parcelId` - Transitions parcel statuses.
* `POST /update-location` - Logs a driver's coordinates and emits Socket.io updates.
* `GET /tracking/:parcelId` - Fetch the tracking coordinates path history.

---

## 💻 Local Setup Instructions

### Prerequisites
* **Node.js** (v14 or higher)
* **MongoDB** (Local instance or MongoDB Atlas Connection String)

### Step 1: Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables by copying `.env.example` or editing `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/parcel_delivery
   JWT_SECRET=your_super_secret_jwt_key
   ```
4. Seed mock database entries (Optional):
   ```bash
   node insertSamples.js
   ```
5. Start the API server in development mode:
   ```bash
   npm run dev
   ```

### Step 2: Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install local dependencies:
   ```bash
   npm install
   ```
3. Start the local server:
   ```bash
   npm start
   ```
4. Open your browser to `http://localhost:3000`.

---

## 🌐 Production Hosting & Deployment

To deploy LogiTrack online so it is accessible publicly, follow these steps:

### 1. Push to GitHub
1. Initialize git in the root folder (if not done already):
   ```bash
   git init
   ```
2. Create a `.gitignore` in the root (ignore `node_modules`, `.env`, and IDE config folders).
3. Stage and commit files:
   ```bash
   git add .
   git commit -m "feat: implement LogiTrack smart parcel workflows"
   ```
4. Create a new repository on [GitHub](https://github.com) and push your files:
   ```bash
   git remote add origin https://github.com/yourusername/logitrack.git
   git branch -M main
   git push -u origin main
   ```

### 2. Host the Backend API (Render / Railway)
1. Log in to [Render](https://render.com) or [Railway](https://railway.app).
2. Create a new **Web Service** and connect it to your GitHub repository.
3. Configure the service settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. In the service dashboard, add your **Environment Variables**:
   - `PORT` = `5000`
   - `JWT_SECRET` = (invent a strong random secret key string)
   - `MONGODB_URI` = (your cloud connection string from MongoDB Atlas)
5. Under MongoDB Atlas, ensure you have whitelisted all incoming IPs (`0.0.0.0/0`) so the Render server can establish database connections.

### 3. Host the Frontend (Vercel / Netlify)
1. Change the API URLs in the frontend code to match your live Render backend:
   - Open [frontend/js/auth.js](file:///c:/Users/RAKSHA/Downloads/PARCEL/ParcelDeliverySystem/frontend/js/auth.js) and update the `API_URL` variable to point to your live Render endpoint:
     ```javascript
     const API_URL = 'https://your-backend-app.onrender.com/api';
     ```
   - Open [frontend/js/app.js](file:///c:/Users/RAKSHA/Downloads/PARCEL/ParcelDeliverySystem/frontend/js/app.js) and update the `API_BASE_URL` and `socket` connection strings:
     ```javascript
     const API_BASE_URL = 'https://your-backend-app.onrender.com/api';
     // ... inside initSocket():
     socket = io('https://your-backend-app.onrender.com');
     ```
2. Log in to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
3. Connect your GitHub repository.
4. Select `frontend` as the **Root Directory**.
5. Set the build command to empty/blank and deploy. Vercel/Netlify will host the static frontend files and provide you with a public URL!
