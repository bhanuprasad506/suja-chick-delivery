import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/delivery.dart';
import '../models/order.dart';

class ApiService {
  // Change this to your backend URL
  // For local development: 'http://10.0.2.2:4000' (Android emulator)
  // For production: your deployed backend URL
  static const String baseUrl = 'http://10.0.2.2:4000';

  // Deliveries
  Future<List<Delivery>> getDeliveries() async {
    final response = await http.get(Uri.parse('$baseUrl/deliveries'));
    if (response.statusCode == 200) {
      List<dynamic> data = json.decode(response.body);
      return data.map((json) => Delivery.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load deliveries');
    }
  }

  Future<Delivery> createDelivery(Delivery delivery) async {
    final response = await http.post(
      Uri.parse('$baseUrl/deliveries'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(delivery.toJson()),
    );
    if (response.statusCode == 201) {
      return Delivery.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to create delivery');
    }
  }

  Future<void> deleteDelivery(int id) async {
    final response = await http.delete(Uri.parse('$baseUrl/deliveries/$id'));
    if (response.statusCode != 200) {
      throw Exception('Failed to delete delivery');
    }
  }

  // Orders
  Future<List<Order>> getOrders() async {
    final response = await http.get(Uri.parse('$baseUrl/orders'));
    if (response.statusCode == 200) {
      List<dynamic> data = json.decode(response.body);
      return data.map((json) => Order.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load orders');
    }
  }

  Future<Order> createOrder(Order order) async {
    final response = await http.post(
      Uri.parse('$baseUrl/orders'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(order.toJson()),
    );
    if (response.statusCode == 201) {
      return Order.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to create order');
    }
  }

  Future<void> updateOrderStatus(int id, String status) async {
    final response = await http.put(
      Uri.parse('$baseUrl/orders/$id'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'status': status}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update order status');
    }
  }

  Future<void> deleteOrder(int id) async {
    final response = await http.delete(Uri.parse('$baseUrl/orders/$id'));
    if (response.statusCode != 200) {
      throw Exception('Failed to delete order');
    }
  }
}
