# Suja Chick Delivery - Quick Start Guide

## 🚀 **Application URLs**

### **Customer Portal**
- **URL**: http://localhost:3000
- **Features**: 
  - Search deliveries
  - Place orders
  - Share on WhatsApp
  - Access admin portal (with mobile verification)

### **Admin Portal**
- **URL**: http://localhost:3000/admin
- **Access**: Requires authorized mobile number
- **Features**:
  - Add/edit/delete deliveries
  - View customer orders
  - Process orders
  - Bulk delete options

---

## 🔐 **Admin Access**

### **Authorized Mobile Numbers** (6 admins)
```
9876543210
8765432109
7654321098
6543210987
5432109876
4321098765
```

### **Session Duration**
- **1 Week** (7 days) after successful login
- Auto-logout after 1 week
- Manual logout available

### **How to Access Admin Portal**

#### **Method 1: From Customer Portal**
1. Go to http://localhost:3000
2. Click "🔐 Admin Portal (Password Required)"
3. Enter authorized mobile number
4. Click "🚪 Verify & Access Admin Portal"

#### **Method 2: Direct URL**
1. Go to http://localhost:3000/admin
2. Enter authorized mobile number
3. Click verify button

#### **Method 3: Force Logout**
1. Visit: http://localhost:3000/admin?logout=true
2. This clears session and shows login screen

---

## 📱 **Customer Portal Features**

### **Search Deliveries**
- Search by customer name
- Search by phone number
- Search by chick type
- Search by weight
- Search by date

### **View Delivery Details**
- Tap any delivery to see full details
- View weight measurements
- See delivery date and time
- Read notes

### **Place Orders**
- Click "🛒 Place New Order"
- Select chick type
- Enter quantity
- Provide contact details
- Add special requirements
- Submit order

### **Share Deliveries**
- Click "📱 WhatsApp" on any delivery
- Detailed delivery information sent to WhatsApp
- Includes all weight measurements
- Professional formatting

---

## 🛠️ **Admin Portal Features**

### **Delivery Management**
- **Add Delivery**: Enter customer details and weights
- **Edit Delivery**: Modify existing delivery records
- **Delete Delivery**: Remove single delivery
- **Bulk Delete**: Delete all deliveries or by date

### **Order Management**
- **View Orders**: See all customer orders
- **Process Orders**: Confirm, deliver, or cancel
- **Delete Orders**: Remove individual or bulk orders
- **Track Status**: Pending → Confirmed → Delivered

### **Tabs**
- **Deliveries Tab**: Manage all deliveries
- **Customer Orders Tab**: Process customer orders

---

## 📊 **Current Data**

### **Sample Deliveries**
- 4 deliveries already in system
- Ready for testing

### **Sample Orders**
- 3 orders ready for processing
- Test order workflow

---

## 🔧 **Server Status**

### **Backend**
- **Port**: 4000
- **Status**: Running
- **Health Check**: http://localhost:4000/health

### **Frontend**
- **Port**: 3000
- **Status**: Running
- **Network Access**: http://10.76.154.83:3000

---

## 🧪 **Testing Checklist**

### **Customer Portal**
- [ ] Search for deliveries
- [ ] View delivery details
- [ ] Place new order
- [ ] Share on WhatsApp
- [ ] Access admin portal link

### **Admin Portal**
- [ ] Login with authorized mobile number
- [ ] View deliveries
- [ ] Add new delivery
- [ ] Edit delivery
- [ ] Delete delivery
- [ ] View customer orders
- [ ] Process orders
- [ ] Logout

### **Security**
- [ ] Try unauthorized mobile number (should fail)
- [ ] Verify 1-week session persistence
- [ ] Test manual logout
- [ ] Test force logout URL

---

## 📞 **Support**

### **Issues?**
1. Check server status: http://localhost:4000/health
2. Verify mobile number is authorized
3. Clear browser cache if needed
4. Check browser console for errors

### **Reset Admin Session**
- Visit: http://localhost:3000/admin?logout=true
- This will clear any existing session

---

**System is ready to use!** 🎉