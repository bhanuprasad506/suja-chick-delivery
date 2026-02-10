class Delivery {
  final int id;
  final String customerName;
  final String? customerPhone;
  final String chickType;
  final double netWeight;
  final String createdAt;
  final String? notes;
  final double loadedBoxWeight;
  final double emptyBoxWeight;
  final int? numberOfBoxes;
  final List<double>? loadedWeightsList;
  final List<double>? emptyWeightsList;
  final int? orderId;

  Delivery({
    required this.id,
    required this.customerName,
    this.customerPhone,
    required this.chickType,
    required this.netWeight,
    required this.createdAt,
    this.notes,
    required this.loadedBoxWeight,
    required this.emptyBoxWeight,
    this.numberOfBoxes,
    this.loadedWeightsList,
    this.emptyWeightsList,
    this.orderId,
  });

  factory Delivery.fromJson(Map<String, dynamic> json) {
    return Delivery(
      id: json['id'],
      customerName: json['customerName'],
      customerPhone: json['customerPhone'],
      chickType: json['chickType'],
      netWeight: (json['netWeight'] as num).toDouble(),
      createdAt: json['createdAt'],
      notes: json['notes'],
      loadedBoxWeight: (json['loadedBoxWeight'] as num).toDouble(),
      emptyBoxWeight: (json['emptyBoxWeight'] as num).toDouble(),
      numberOfBoxes: json['numberOfBoxes'],
      loadedWeightsList: json['loadedWeightsList'] != null
          ? List<double>.from(json['loadedWeightsList'].map((x) => (x as num).toDouble()))
          : null,
      emptyWeightsList: json['emptyWeightsList'] != null
          ? List<double>.from(json['emptyWeightsList'].map((x) => (x as num).toDouble()))
          : null,
      orderId: json['orderId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'customerName': customerName,
      'customerPhone': customerPhone,
      'chickType': chickType,
      'loadedBoxWeight': loadedBoxWeight,
      'emptyBoxWeight': emptyBoxWeight,
      'numberOfBoxes': numberOfBoxes,
      'notes': notes,
      'loadedWeightsList': loadedWeightsList,
      'emptyWeightsList': emptyWeightsList,
      'orderId': orderId,
    };
  }
}
