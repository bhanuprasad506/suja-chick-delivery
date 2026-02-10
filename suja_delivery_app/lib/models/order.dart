class Order {
  final int id;
  final String chickType;
  final int quantity;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final String notes;
  final String status; // 'pending', 'confirmed', 'delivered', 'cancelled'
  final String createdAt;
  final String updatedAt;

  Order({
    required this.id,
    required this.chickType,
    required this.quantity,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
    required this.notes,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      chickType: json['chickType'],
      quantity: json['quantity'],
      customerName: json['customerName'],
      customerEmail: json['customerEmail'] ?? '',
      customerPhone: json['customerPhone'],
      notes: json['notes'] ?? '',
      status: json['status'],
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'chickType': chickType,
      'quantity': quantity,
      'customerName': customerName,
      'customerEmail': customerEmail,
      'customerPhone': customerPhone,
      'notes': notes,
    };
  }
}
