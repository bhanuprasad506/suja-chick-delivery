# Suja Chick Delivery App

A comprehensive web application for managing chick deliveries with dual portal system - Admin management and Customer ordering.

## 🚀 New Features (v2.0)
- 🔐 **Dual Portal System**: Separate interfaces for admins and customers
- 👥 **Customer Portal**: Customers can view deliveries and place orders
- 🛠️ **Admin Portal**: Enhanced management with order processing
- 🔒 **Authentication**: Role-based access control
- 📱 **Order Management**: Complete workflow from order to delivery
- 🎨 **Enhanced UI/UX**: Professional design with improved navigation

## Features

### Admin Portal
- ✅ Full delivery management (add, edit, delete, bulk operations)
- ✅ Customer order processing and status management
- ✅ WhatsApp sharing with detailed delivery information
- ✅ Export and backup capabilities
- ✅ Tab-based navigation between deliveries and orders

### Customer Portal
- ✅ View personal delivery history
- ✅ Place new chick orders with detailed requirements
- ✅ Read-only access to delivery details
- ✅ Order tracking and status updates

### Core Features
- ✅ Track loaded/empty box weights with multiple measurements
- ✅ Calculate net weight automatically
- ✅ Mobile-responsive design
- ✅ PWA capabilities
- ✅ Data persistence (PostgreSQL + file storage fallback)

## 🔑 Access Credentials

### Admin Access
- **URL**: Your deployed URL
- **Email**: `admin@suja.com`
- **Password**: `admin123`

### Customer Access
- **Registration**: Create account with name, email, and password
- **Login**: Use registered email and password

## Quick Deploy (Choose One):

### 1. Render.com (Free - Recommended)
1. Fork this repository to your GitHub
2. Go to [render.com](https://render.com) and sign up
3. Click "New Web Service"
4. Connect your GitHub repo
5. Use these settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Plan**: Free
6. Add environment variable `DATABASE_URL` for PostgreSQL (optional)

### 2. Railway.app (Free)
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-deploy

### 3. Vercel (Frontend + Serverless)
```bash
npm install -g vercel
vercel --prod
```

## Local Development

### Prerequisites
- Node.js 16+ installed
- Git installed

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/suja-chick-delivery.git
cd suja-chick-delivery

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Start development servers
npm run dev        # Backend on port 4000
cd frontend && npm run dev  # Frontend on port 3000
```

### Development URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health**: http://localhost:4000/health

## 📱 Mobile Usage
1. Open the deployed URL in your mobile browser
2. Tap "Share" → "Add to Home Screen"
3. Now you have a native app experience!

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│   (React)       │◄──►│   (Express)     │
│   Port 3000     │    │   Port 4000     │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Customer       │    │   PostgreSQL    │
│  Portal         │    │   + File        │
│                 │    │   Storage       │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Admin          │
│  Portal         │
│                 │
└─────────────────┘
```

## 🔄 User Workflows

### Customer Workflow
1. **Register/Login** → Access customer portal
2. **View Deliveries** → See personal delivery history
3. **Place Orders** → Submit new chick orders
4. **Track Status** → Monitor order progress

### Admin Workflow
1. **Login** → Access admin portal
2. **Manage Deliveries** → Add/edit delivery records
3. **Process Orders** → Review and confirm customer orders
4. **Update Status** → Mark orders as confirmed/delivered
5. **Export Data** → Backup delivery records

## 🛠️ Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (production) + File storage (fallback)
- **Authentication**: Context-based with localStorage
- **Routing**: React Router DOM
- **PWA**: Service Worker + Manifest
- **Deployment**: Render/Railway/Vercel ready

## 📊 API Endpoints

### Deliveries
- `GET /deliveries` - List all deliveries
- `POST /deliveries` - Create delivery
- `PUT /deliveries/:id` - Update delivery
- `DELETE /deliveries/:id` - Delete delivery
- `DELETE /deliveries` - Delete all deliveries
- `DELETE /deliveries/date/:date` - Delete by date

### Orders
- `GET /orders` - List all orders
- `POST /orders` - Create order
- `PUT /orders/:id` - Update order status
- `DELETE /orders/:id` - Delete order

### System
- `GET /health` - Health check
- `GET /debug` - System status
- `GET /export` - Export data

## 🔧 Environment Variables

```bash
# Optional - for PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database

# Optional - for custom port
PORT=4000
```

## 📝 License
MIT License - feel free to use and modify for your needs.

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ for Suja Chick Delivery**