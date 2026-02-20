# Admin Authentication System

## 🔐 **Mobile Number + Password Authentication**

### **Overview**
The admin portal now uses both mobile number verification AND password authentication. Only 6 authorized admins with correct mobile number and password can access the admin portal.

### **Authorized Admin Mobile Numbers** (6 admins)
```
1. 8519984203
2. 9966345400
3. 9848214213
4. 9391275208
5. 9542961335
6. 9550784835
```

### **Admin Password**
```
suja123
```

### **Session Management**
- **Duration**: 1 week (7 days)
- **Persistence**: Admin stays logged in for 1 week after verification
- **Auto-logout**: Session expires after 1 week
- **Manual Logout**: Admin can logout anytime

### **Access Flow**

#### **From Customer Portal**
1. Customer sees "🔐 Admin Portal (Password Required)" link
2. Clicks the link
3. Redirected to admin login page
4. Must enter:
   - Authorized mobile number (one of 6)
   - Password: suja123
5. If both correct → Granted access for 1 week
6. If either incorrect → Error message

#### **From Direct URL**
1. Visit: http://localhost:3000/admin
2. Shows mobile number + password login form
3. Enter authorized mobile number
4. Enter password: suja123
5. Verify and access admin features

### **Customer Portal Behavior**
- **Every Visit**: Customer portal always shows login prompt when accessing admin
- **No Session**: Customer portal doesn't save admin session
- **Fresh Login**: Each time customer clicks admin link, must verify mobile number and password

### **Admin Portal Features**
After successful authentication, admins can:
- ✅ Add new deliveries
- ✅ Edit existing deliveries
- ✅ Delete deliveries (individual or bulk)
- ✅ View customer orders
- ✅ Process orders (confirm, deliver, cancel)
- ✅ Delete orders (individual or bulk)
- ✅ Logout (clears 1-week session)

### **Session Expiry**
- **Automatic**: Session expires after 7 days
- **Manual**: Click logout button to clear session immediately
- **Force Logout**: Visit `/admin?logout=true` to force logout

### **Security Features**
- ✅ **Mobile Number Verification**: Only 6 authorized numbers allowed
- ✅ **Password Protection**: Must enter correct password (suja123)
- ✅ **Session Expiry**: Automatic logout after 1 week
- ✅ **Persistent Session**: Stays logged in for convenience
- ✅ **Manual Logout**: Can logout anytime

### **Testing**

#### **Test Admin Access**
1. Go to: http://localhost:3000
2. Click "🔐 Admin Portal (Password Required)"
3. Enter mobile number: `8519984203`
4. Enter password: `suja123`
5. Click "🚪 Verify & Access Admin Portal"
6. Should see admin dashboard

#### **Test Session Persistence**
1. Login with authorized mobile number and password
2. Refresh page → Still logged in
3. Close browser and reopen → Still logged in (within 7 days)
4. After 7 days → Session expires, must login again

#### **Test Unauthorized Access**
1. Try mobile number: `1234567890` (not authorized)
2. Should see error: "Unauthorized mobile number!"
3. Try correct mobile but wrong password
4. Should see error: "Incorrect password!"

### **Admin Portal URL**
- **Direct Access**: http://localhost:3000/admin
- **Force Logout**: http://localhost:3000/admin?logout=true

### **Implementation Details**

#### **Storage**
- `suja_admin_auth`: Stores authentication status
- `suja_admin_expiry`: Stores session expiry timestamp (7 days from login)

#### **Validation**
- Mobile number must be one of 6 authorized numbers
- Password must be exactly: suja123
- Both must be correct for access

#### **Session Duration**
- 7 days = 604,800,000 milliseconds
- Calculated as: `Date.now() + (7 * 24 * 60 * 60 * 1000)`

### **Future Enhancements**
- Add more authorized admin numbers
- Implement SMS verification
- Add admin activity logging
- Implement role-based permissions
- Add two-factor authentication

---

**System is now live with mobile number + password authentication!** 🚀