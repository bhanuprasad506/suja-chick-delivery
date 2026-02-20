# Suja Chick Delivery - Flutter App

A Flutter mobile application for Suja Chick Delivery management system.

## Features

- **Customer Portal**: Place orders, view delivery history
- **Admin Portal**: Manage orders, create deliveries, view reports
- **Real-time Updates**: Connected to your existing Node.js backend
- **Offline Support**: Local caching with shared_preferences
- **WhatsApp Integration**: Share delivery details via WhatsApp

## Setup Instructions

### 1. Prerequisites
- Flutter SDK installed (already done ✓)
- Android Studio or VS Code with Flutter extensions
- Your backend server running

### 2. Configure Backend URL

Edit `lib/services/api_service.dart`:

```dart
// For local development (Android Emulator)
static const String baseUrl = 'http://10.0.2.2:4000';

// For local development (Physical Device - use your computer's IP)
static const String baseUrl = 'http://192.168.1.XXX:4000';

// For production
static const String baseUrl = 'https://your-backend-url.com';
```

### 3. Install Dependencies

```bash
cd suja_delivery_app
flutter pub get
```

### 4. Run the App

```bash
# Run on connected device/emulator
flutter run

# Run on specific device
flutter devices  # List devices
flutter run -d <device-id>
```

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── models/
│   ├── delivery.dart        # Delivery model
│   └── order.dart           # Order model
├── services/
│   └── api_service.dart     # API client
└── screens/
    ├── splash_screen.dart   # Splash screen (✓ Created)
    ├── home_screen.dart     # Home/Landing page
    ├── admin/
    │   ├── admin_login_screen.dart
    │   ├── admin_portal_screen.dart
    │   ├── customer_orders_screen.dart
    │   └── add_delivery_screen.dart
    └── customer/
        ├── customer_auth_screen.dart
        ├── customer_portal_screen.dart
        └── order_details_screen.dart
```

## Next Steps to Complete the App

### 1. Create Home Screen (`lib/screens/home_screen.dart`)
```dart
// Landing page with options:
// - Customer Portal
// - Admin Portal
```

### 2. Create Admin Screens
- **Admin Login**: Authenticate with mobile + password
- **Admin Portal**: Tabs for Customer Orders and Add Delivery
- **Customer Orders**: List orders, update status, submit delivery details
- **Add Delivery**: Manual delivery entry form

### 3. Create Customer Screens
- **Customer Auth**: Login/Register
- **Customer Portal**: Place orders, view delivery history
- **Order Details**: View order status and delivery information

### 4. Add State Management
Consider using Provider or Riverpod for better state management across screens.

### 5. Add Local Storage
Use shared_preferences to cache:
- Auth tokens
- User preferences
- Offline data

## Building for Production

### Android APK
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Android App Bundle (for Play Store)
```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

### iOS (requires Mac)
```bash
flutter build ios --release
```

## API Endpoints Used

- `GET /deliveries` - Get all deliveries
- `POST /deliveries` - Create delivery
- `DELETE /deliveries/:id` - Delete delivery
- `GET /orders` - Get all orders
- `POST /orders` - Create order
- `PUT /orders/:id` - Update order status
- `DELETE /orders/:id` - Delete order

## Features to Implement

- [ ] Push notifications for order updates
- [ ] Offline mode with local database
- [ ] Image upload for delivery proof
- [ ] PDF generation for delivery receipts
- [ ] Dark mode support
- [ ] Multi-language support (English, Telugu)
- [ ] Biometric authentication
- [ ] Real-time order tracking

## Testing

```bash
# Run tests
flutter test

# Run with coverage
flutter test --coverage
```

## Troubleshooting

### Cannot connect to backend
- Check if backend server is running
- Verify the baseUrl in api_service.dart
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use your computer's local IP address

### Build errors
```bash
flutter clean
flutter pub get
flutter run
```

## Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [Dart Documentation](https://dart.dev/guides)
- [Material Design](https://material.io/design)

## License

Private - Suja Chick Delivery
