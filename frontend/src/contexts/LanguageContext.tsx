import React, { createContext, useState, useContext } from 'react';

type Language = 'en' | 'hi' | 'te';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Common
    'app.title': 'Suja Chick Delivery',
    'app.subtitle': 'Delivery Management System',
    'btn.logout': 'Logout',
    'btn.back': 'Back',
    'btn.cancel': 'Cancel',
    'btn.close': 'Close',
    'btn.delete': 'Delete',
    'btn.edit': 'Edit',
    'btn.save': 'Save',
    'btn.submit': 'Submit',
    'btn.refresh': 'Refresh',
    
    // Admin Portal
    'admin.title': 'Admin Portal',
    'admin.login': 'Admin Login',
    'admin.mobile': 'Admin Mobile Number',
    'admin.password': 'Password',
    'admin.verify': 'Verify & Access Admin Portal',
    'admin.newDelivery': 'New Delivery',
    'admin.addDelivery': 'Add Delivery',
    'admin.recentDeliveries': 'Recent Deliveries',
    'admin.customerOrders': 'Customer Orders',
    'admin.deleteOptions': 'Delete Options',
    'admin.deleteAll': 'Delete All',
    'admin.deleteByDate': 'Delete by Date',
    
    // Delivery Form
    'form.customerName': 'Customer Name',
    'form.chickType': 'Chick Type',
    'form.loadedWeight': 'Loaded Box Weight (kg)',
    'form.emptyWeight': 'Empty Box Weight (kg)',
    'form.numberOfBoxes': 'Number of Boxes',
    'form.notes': 'Notes',
    'form.addWeight': 'Add Weight',
    'form.submitDelivery': 'Submit Delivery',
    
    // Delivery Details
    'delivery.details': 'Delivery Details',
    'delivery.netWeight': 'Net Weight',
    'delivery.totalLoaded': 'Total Loaded Weight',
    'delivery.totalEmpty': 'Total Empty Weight',
    'delivery.grandTotal': 'Grand Total',
    'delivery.measurements': 'measurements',
    'delivery.shareWhatsApp': 'Share on WhatsApp',
    'delivery.copyDetails': 'Copy Details',
    'delivery.tapForDetails': 'Tap for detailed view',
    
    // Orders
    'order.details': 'Order Details',
    'order.status': 'Order Status',
    'order.pending': 'Pending',
    'order.confirmed': 'Confirmed',
    'order.delivered': 'Delivered',
    'order.cancelled': 'Cancelled',
    'order.confirmOrder': 'Confirm Order',
    'order.cancelOrder': 'Cancel Order',
    'order.markDelivered': 'Mark as Delivered',
    'order.deleteOrder': 'Delete Order',
    'order.sendMessage': 'Send Message to Customer',
    'order.whatsappMessage': 'WhatsApp Message',
    'order.smsMessage': 'SMS Message',
    
    // Customer Portal
    'customer.title': 'Customer Portal',
    'customer.findDeliveries': 'Find Your Deliveries',
    'customer.placeOrder': 'Place New Order',
    'customer.allDeliveries': 'All Deliveries',
    'customer.doneDeliveries': 'Done Deliveries',
    'customer.adminPortal': 'Admin Portal (Password Required)',
    'customer.orderForm': 'Order Details',
    'customer.yourName': 'Your Name',
    'customer.phoneNumber': 'Phone Number',
    'customer.specialRequirements': 'Special Requirements / Notes',
    'customer.placeOrderBtn': 'Place Order',
    
    // Summary
    'summary.totalDeliveries': 'Total Deliveries',
    'summary.totalLoaded': 'Total Loaded Weight',
    'summary.totalEmpty': 'Total Empty Weight',
    'summary.grandTotal': 'Grand Total',
    'summary.averageWeight': 'Average Weight',
    
    // Messages
    'msg.noDeliveries': 'No deliveries found.',
    'msg.noOrders': 'No customer orders yet.',
    'msg.orderSuccess': 'Order submitted successfully!',
    'msg.copied': 'Detailed delivery information copied to clipboard!',
  },
  hi: {
    // Common
    'app.title': 'सुजा चिक डिलीवरी',
    'app.subtitle': 'डिलीवरी प्रबंधन प्रणाली',
    'btn.logout': 'लॉगआउट',
    'btn.back': 'वापस',
    'btn.cancel': 'रद्द करें',
    'btn.close': 'बंद करें',
    'btn.delete': 'हटाएं',
    'btn.edit': 'संपादित करें',
    'btn.save': 'सहेजें',
    'btn.submit': 'जमा करें',
    'btn.refresh': 'ताज़ा करें',
    
    // Admin Portal
    'admin.title': 'एडमिन पोर्टल',
    'admin.login': 'एडमिन लॉगिन',
    'admin.mobile': 'एडमिन मोबाइल नंबर',
    'admin.password': 'पासवर्ड',
    'admin.verify': 'सत्यापित करें और एडमिन पोर्टल तक पहुंचें',
    'admin.newDelivery': 'नई डिलीवरी',
    'admin.addDelivery': 'डिलीवरी जोड़ें',
    'admin.recentDeliveries': 'हाल की डिलीवरी',
    'admin.customerOrders': 'ग्राहक आदेश',
    'admin.deleteOptions': 'विकल्प हटाएं',
    'admin.deleteAll': 'सभी हटाएं',
    'admin.deleteByDate': 'तारीख के अनुसार हटाएं',
    
    // Delivery Form
    'form.customerName': 'ग्राहक का नाम',
    'form.chickType': 'चिक का प्रकार',
    'form.loadedWeight': 'लोडेड बॉक्स वजन (किग्रा)',
    'form.emptyWeight': 'खाली बॉक्स वजन (किग्रा)',
    'form.numberOfBoxes': 'बॉक्स की संख्या',
    'form.notes': 'नोट्स',
    'form.addWeight': 'वजन जोड़ें',
    'form.submitDelivery': 'डिलीवरी जमा करें',
    
    // Delivery Details
    'delivery.details': 'डिलीवरी विवरण',
    'delivery.netWeight': 'शुद्ध वजन',
    'delivery.totalLoaded': 'कुल लोडेड वजन',
    'delivery.totalEmpty': 'कुल खाली वजन',
    'delivery.grandTotal': 'कुल योग',
    'delivery.measurements': 'माप',
    'delivery.shareWhatsApp': 'व्हाट्सएप पर साझा करें',
    'delivery.copyDetails': 'विवरण कॉपी करें',
    'delivery.tapForDetails': 'विस्तृत दृश्य के लिए टैप करें',
    
    // Orders
    'order.details': 'आदेश विवरण',
    'order.status': 'आदेश स्थिति',
    'order.pending': 'लंबित',
    'order.confirmed': 'पुष्टि की गई',
    'order.delivered': 'डिलीवर किया गया',
    'order.cancelled': 'रद्द किया गया',
    'order.confirmOrder': 'आदेश की पुष्टि करें',
    'order.cancelOrder': 'आदेश रद्द करें',
    'order.markDelivered': 'डिलीवर किए गए के रूप में चिह्नित करें',
    'order.deleteOrder': 'आदेश हटाएं',
    'order.sendMessage': 'ग्राहक को संदेश भेजें',
    'order.whatsappMessage': 'व्हाट्सएप संदेश',
    'order.smsMessage': 'एसएमएस संदेश',
    
    // Customer Portal
    'customer.title': 'ग्राहक पोर्टल',
    'customer.findDeliveries': 'अपनी डिलीवरी खोजें',
    'customer.placeOrder': 'नया आदेश दें',
    'customer.allDeliveries': 'सभी डिलीवरी',
    'customer.doneDeliveries': 'पूर्ण डिलीवरी',
    'customer.adminPortal': 'एडमिन पोर्टल (पासवर्ड आवश्यक)',
    'customer.orderForm': 'आदेश विवरण',
    'customer.yourName': 'आपका नाम',
    'customer.phoneNumber': 'फोन नंबर',
    'customer.specialRequirements': 'विशेष आवश्यकताएं / नोट्स',
    'customer.placeOrderBtn': 'आदेश दें',
    
    // Summary
    'summary.totalDeliveries': 'कुल डिलीवरी',
    'summary.totalLoaded': 'कुल लोडेड वजन',
    'summary.totalEmpty': 'कुल खाली वजन',
    'summary.grandTotal': 'कुल योग',
    'summary.averageWeight': 'औसत वजन',
    
    // Messages
    'msg.noDeliveries': 'कोई डिलीवरी नहीं मिली।',
    'msg.noOrders': 'अभी तक कोई ग्राहक आदेश नहीं।',
    'msg.orderSuccess': 'आदेश सफलतापूर्वक जमा किया गया!',
    'msg.copied': 'डिलीवरी विवरण क्लिपबोर्ड पर कॉपी किया गया!',
  },
  te: {
    // Common
    'app.title': 'సుజ చిక్ డెలివరీ',
    'app.subtitle': 'డెలివరీ నిర్వహణ వ్యవస్థ',
    'btn.logout': 'లాగ్‌అవుట్',
    'btn.back': 'వెనుకకు',
    'btn.cancel': 'రద్దు చేయి',
    'btn.close': 'మూసివేయి',
    'btn.delete': 'తొలగించు',
    'btn.edit': 'సవరించు',
    'btn.save': 'సేవ్ చేయి',
    'btn.submit': 'సమర్పించు',
    'btn.refresh': 'రిఫ్రెష్ చేయి',
    
    // Admin Portal
    'admin.title': 'అడ్మిన్ పోర్టల్',
    'admin.login': 'అడ్మిన్ లాగిన్',
    'admin.mobile': 'అడ్మిన్ మొబైల్ నంబర్',
    'admin.password': 'పాస్‌వర్డ్',
    'admin.verify': 'ధృవీకరించండి మరియు అడ్మిన్ పోర్టల్‌కు ప్రవేశించండి',
    'admin.newDelivery': 'కొత్త డెలివరీ',
    'admin.addDelivery': 'డెలివరీ జోడించు',
    'admin.recentDeliveries': 'ఇటీవలి డెలివరీలు',
    'admin.customerOrders': 'కస్టమర్ ఆర్డర్‌లు',
    'admin.deleteOptions': 'ఎంపికలను తొలగించు',
    'admin.deleteAll': 'అన్నీ తొలగించు',
    'admin.deleteByDate': 'తేదీ ద్వారా తొలగించు',
    
    // Delivery Form
    'form.customerName': 'కస్టమర్ పేరు',
    'form.chickType': 'చిక్ రకం',
    'form.loadedWeight': 'లోడ్ చేసిన బాక్స్ బరువు (కిలోలు)',
    'form.emptyWeight': 'ఖాళీ బాక్స్ బరువు (కిలోలు)',
    'form.numberOfBoxes': 'బాక్సుల సంఖ్య',
    'form.notes': 'గమనికలు',
    'form.addWeight': 'బరువు జోడించు',
    'form.submitDelivery': 'డెలివరీ సమర్పించు',
    
    // Delivery Details
    'delivery.details': 'డెలివరీ వివరాలు',
    'delivery.netWeight': 'నికర బరువు',
    'delivery.totalLoaded': 'మొత్తం లోడ్ చేసిన బరువు',
    'delivery.totalEmpty': 'మొత్తం ఖాళీ బరువు',
    'delivery.grandTotal': 'గ్రాండ్ టోటల్',
    'delivery.measurements': 'కొలతలు',
    'delivery.shareWhatsApp': 'WhatsApp లో షేర్ చేయి',
    'delivery.copyDetails': 'వివరాలను కాపీ చేయి',
    'delivery.tapForDetails': 'వివరణాత్మక వీక్ష్యం కోసం ట్యాప్ చేయి',
    
    // Orders
    'order.details': 'ఆర్డర్ వివరాలు',
    'order.status': 'ఆర్డర్ స్థితి',
    'order.pending': 'పెండింగ్',
    'order.confirmed': 'నిర్ధారించారు',
    'order.delivered': 'డెలివర్ చేయబడింది',
    'order.cancelled': 'రద్దు చేయబడింది',
    'order.confirmOrder': 'ఆర్డర్‌ను నిర్ధారించండి',
    'order.cancelOrder': 'ఆర్డర్‌ను రద్దు చేయండి',
    'order.markDelivered': 'డెలివర్ చేయబడినట్లు గుర్తించండి',
    'order.deleteOrder': 'ఆర్డర్‌ను తొలగించు',
    'order.sendMessage': 'కస్టమర్‌కు సందేశం పంపండి',
    'order.whatsappMessage': 'WhatsApp సందేశం',
    'order.smsMessage': 'SMS సందేశం',
    
    // Customer Portal
    'customer.title': 'కస్టమర్ పోర్టల్',
    'customer.findDeliveries': 'మీ డెలివరీలను కనుగొనండి',
    'customer.placeOrder': 'కొత్త ఆర్డర్ ఇవ్వండి',
    'customer.allDeliveries': 'అన్ని డెలివరీలు',
    'customer.doneDeliveries': 'పూర్తి డెలివరీలు',
    'customer.adminPortal': 'అడ్మిన్ పోర్టల్ (పాస్‌వర్డ్ అవసరం)',
    'customer.orderForm': 'ఆర్డర్ వివరాలు',
    'customer.yourName': 'మీ పేరు',
    'customer.phoneNumber': 'ఫోన్ నంబర్',
    'customer.specialRequirements': 'ప్రత్యేక అవసరాలు / గమనికలు',
    'customer.placeOrderBtn': 'ఆర్డర్ ఇవ్వండి',
    
    // Summary
    'summary.totalDeliveries': 'మొత్తం డెలివరీలు',
    'summary.totalLoaded': 'మొత్తం లోడ్ చేసిన బరువు',
    'summary.totalEmpty': 'మొత్తం ఖాళీ బరువు',
    'summary.grandTotal': 'గ్రాండ్ టోటల్',
    'summary.averageWeight': 'సగటు బరువు',
    
    // Messages
    'msg.noDeliveries': 'డెలివరీలు కనుగొనబడలేదు.',
    'msg.noOrders': 'ఇంకా కస్టమర్ ఆర్డర్‌లు లేవు.',
    'msg.orderSuccess': 'ఆర్డర్ విజయవంతంగా సమర్పించబడింది!',
    'msg.copied': 'డెలివరీ వివరాలు క్లిప్‌బోర్డ్‌కు కాపీ చేయబడ్డాయి!',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('suja_language');
    return (saved as Language) || 'en';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('suja_language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
