import 'package:flutter/material.dart';
import 'screens/splash_screen.dart';
import 'screens/home_screen.dart';
import 'screens/admin/admin_login_screen.dart';
import 'screens/admin/admin_portal_screen.dart';
import 'screens/customer/customer_portal_screen.dart';

void main() {
  runApp(const SujaDeliveryApp());
}

class SujaDeliveryApp extends StatelessWidget {
  const SujaDeliveryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Suja Chick Delivery',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.teal,
          primary: Colors.teal,
        ),
        useMaterial3: true,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashScreen(),
        '/home': (context) => const HomeScreen(),
        '/admin-login': (context) => const AdminLoginScreen(),
        '/admin-portal': (context) => const AdminPortalScreen(),
        '/customer-portal': (context) => const CustomerPortalScreen(),
      },
    );
  }
}
