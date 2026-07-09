import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations = {
  en: {
    // Welcome page
    "welcome.title": "AI-Powered Market Analysis",
    "welcome.subtitle": "Get institutional-grade trading signals with advanced AI technology. Upload your charts and receive precise entry, stop loss, and take profit levels.",
    "welcome.getStarted": "Get Started",
    "welcome.feature1.title": "High-Probability Signals",
    "welcome.feature1.desc": "AI-generated buy/sell signals with confidence scoring",
    "welcome.feature2.title": "Institutional Analysis",
    "welcome.feature2.desc": "Professional-grade market structure analysis",
    "welcome.feature3.title": "24/7 Availability",
    "welcome.feature3.desc": "Analyze charts anytime, anywhere",
    
    // Auth page
    "auth.welcome": "Welcome Back",
    "auth.createAccount": "Create Account",
    "auth.signIn": "Sign In",
    "auth.signUp": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.fullName": "Full Name",
    "auth.phoneNumber": "Phone Number (Optional)",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.signingIn": "Signing in...",
    "auth.creatingAccount": "Creating account...",
    
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.analysesRemaining": "analyses remaining today",
    "dashboard.unlimited": "Unlimited analyses",
    "dashboard.dailyUsage": "Daily Usage",
    "dashboard.uploadChart": "Upload Chart Image",
    "dashboard.uploadHint": "Tap to select or drag and drop",
    "dashboard.analyzing": "Analyzing chart...",
    "dashboard.analysisResult": "Analysis Result",
    "dashboard.confidence": "Confidence",
    "dashboard.entry": "Entry",
    "dashboard.stopLoss": "Stop Loss",
    "dashboard.takeProfit": "Take Profit",
    "dashboard.emptyState": "Upload a chart to get AI-powered trading signals",
    "dashboard.limitReached": "Daily Limit Reached",
    "dashboard.upgradeHint": "Upgrade to Premium for unlimited analyses",
    
    // History
    "history.title": "Analysis History",
    "history.subtitle": "Your past trading signals",
    "history.noAnalyses": "No analyses yet",
    "history.startAnalyzing": "Start by uploading a chart on the Dashboard",
    "history.goToDashboard": "Go to Dashboard",
    
    // Plans
    "plans.title": "Choose Your Plan",
    "plans.subtitle": "Unlock the full potential of AI trading signals",
    "plans.free": "Free",
    "plans.premium": "Premium",
    "plans.currentPlan": "Current Plan",
    "plans.comingSoon": "Coming Soon",
    "plans.perDay": "per day",
    "plans.perMonth": "per month",
    "plans.feature.analyses5": "5 chart analyses per day",
    "plans.feature.unlimitedAnalyses": "Unlimited analyses",
    "plans.feature.basicSignals": "Basic signals (Entry, SL, TP1)",
    "plans.feature.extendedTargets": "Extended targets (TP1, TP2, TP3)",
    "plans.feature.standardSpeed": "Standard processing",
    "plans.feature.priorityProcessing": "Priority processing",
    "plans.feature.7dayHistory": "7-day history",
    "plans.feature.fullHistory": "Full analysis history",
    "plans.feature.advancedInsights": "Advanced market insights",
    
    // Contact
    "contact.title": "Get in Touch",
    "contact.subtitle": "Connect with us on social media or reach out via email",
    "contact.followUs": "Follow Us",
    "contact.emailUs": "Email Us",
    
    // Navigation
    "nav.home": "Home",
    "nav.analysis": "Analysis",
    "nav.history": "History",
    "nav.plans": "Plans",
    "nav.contact": "Contact",
    "nav.profile": "Profile",
    "nav.admin": "Admin",
    "nav.academy": "Academy",
    // Profile
    "profile.trader": "Trader",
    "profile.totalAnalyses": "Total Analyses",
    "profile.thisWeek": "This Week",
    "profile.plan": "Plan",
    "profile.upgradeBlurb": "Unlock unlimited analyses, extended TP1/TP2/TP3 targets and priority processing.",
    "profile.contactUpgrade": "Contact for Upgrade",
    "profile.preferences": "Preferences",
    "profile.language": "Language",
    "profile.history": "Analysis History",
    "profile.adminPanel": "Admin Panel",
    "profile.signOut": "Sign Out",
    
    // Admin
    "admin.title": "Admin Dashboard",
    "admin.subtitle": "Manage users and subscriptions",
    "admin.users": "Registered Users",
    "admin.name": "Name",
    "admin.email": "Email",
    "admin.tier": "Tier",
    "admin.joined": "Joined",
    "admin.actions": "Actions",
    "admin.free": "Free",
    "admin.unlimited": "Unlimited",
    "admin.noUsers": "No users found",
    "admin.unauthorized": "Unauthorized Access",
    "admin.unauthorizedDesc": "You don't have permission to access this page.",
    "admin.courseAccess": "Course Access",
    "admin.grantAccess": "Grant Access",
    "admin.revokeAccess": "Revoke",
    "admin.selectUser": "Select user by email",
    "admin.selectCourse": "Select course",
    "admin.backToHome": "Back to Home",
    "admin.logout": "Log Out",

    // Academy
    "academy.title": "Academy",
    "academy.subtitle": "Master trading with expert courses",
    "academy.locked": "Locked",
    "academy.enrolled": "Enrolled",
    "academy.upgradeToWatch": "Upgrade to watch or contact us on WhatsApp",
    "academy.upgradePlan": "Upgrade Plan",
    "academy.contactWhatsApp": "Contact on WhatsApp",
    "academy.backToAcademy": "Back to Academy",
    "academy.playlist": "Playlist",
    "academy.noVideos": "No videos available yet",
    "academy.noCourses": "No courses available yet",

    // Liveness
    "liveness.title": "Identity Verification",
    "liveness.subtitle": "Quick face check to secure your account",
    "liveness.loading": "Starting camera...",
    "liveness.positionFace": "Position your face in the frame",
    "liveness.submitting": "Verifying...",
    "liveness.successTitle": "Verified!",
    "liveness.successDesc": "Identity confirmed. Redirecting...",
    "liveness.retry": "Try Again",
    "liveness.blinks": "Blinks",
    "liveness.smile": "Smile",
    "liveness.looking": "Looking...",
    "liveness.detected": "Detected!",
    "liveness.privacy": "Your video is processed locally. We only store a SHA-256 hash for verification.",
    "liveness.cameraDenied": "Camera access is required for identity verification.",
    "liveness.loadingModel": "Loading face detection — first time may take a moment...",
    "liveness.slowLoad": "Still loading… this can take longer on slower connections.",
    "liveness.cameraUnsupported": "Your browser doesn't support camera access. Please use Chrome or Safari.",
    "liveness.instructions": "Blink twice, then smile 😊",
    "plans.requestUpgrade": "Request Upgrade",
    "plans.manualUpgradeNote": "Upgrades are reviewed and activated manually by our team within 24h.",

    "editProfile.title": "Personal Information",
    "editProfile.subtitle": "Update your name and contact details.",
    "editProfile.fullName": "Full Name",
    "editProfile.fullNamePlaceholder": "Your name",
    "editProfile.phone": "Phone Number",
    "editProfile.email": "Email",
    "editProfile.emailLocked": "Contact support to change your email address.",
    "editProfile.nameRequired": "Full name is required.",
    "editProfile.save": "Save Changes",
    "editProfile.saving": "Saving…",
    "editProfile.saved": "Saved",

    "changePassword.title": "Change Password",
    "changePassword.subtitle": "Choose a new password for your account.",
    "changePassword.newPassword": "New Password",
    "changePassword.confirmPassword": "Confirm New Password",
    "changePassword.tooShort": "Password must be at least 8 characters.",
    "changePassword.mismatch": "Passwords do not match.",
    "changePassword.save": "Update Password",
    "changePassword.saving": "Updating…",
    "changePassword.saved": "Password Updated",

    "deleteAccount.title": "Delete Account",
    "deleteAccount.whatHappens": "This action is permanent. Here's what happens:",
    "deleteAccount.point1": "Your profile, chart history and devices are permanently deleted",
    "deleteAccount.point2": "Your subscription is cancelled immediately",
    "deleteAccount.point3": "You will be signed out of all devices",
    "deleteAccount.point4": "This cannot be undone — there is no recovery period",
    "deleteAccount.continue": "Continue to Delete",
    "deleteAccount.typeToConfirm": "Type DELETE below to permanently delete your account.",
    "deleteAccount.cancel": "Cancel",
    "deleteAccount.confirmDelete": "Delete My Account",
    "deleteAccount.deleting": "Deleting…",
    "profile.deleteAccount": "Delete Account",
    "profile.deleteAccountSubtitle": "Permanently remove your account and data",
  },
  ar: {
    // Welcome page
    "welcome.title": "تحليل السوق بالذكاء الاصطناعي",
    "welcome.subtitle": "احصل على إشارات تداول احترافية باستخدام تقنية الذكاء الاصطناعي المتقدمة. قم بتحميل الرسوم البيانية واحصل على مستويات الدخول ووقف الخسارة وجني الأرباح.",
    "welcome.getStarted": "ابدأ الآن",
    "welcome.feature1.title": "إشارات عالية الدقة",
    "welcome.feature1.desc": "إشارات شراء/بيع مولدة بالذكاء الاصطناعي مع درجة الثقة",
    "welcome.feature2.title": "تحليل مؤسسي",
    "welcome.feature2.desc": "تحليل هيكل السوق بمستوى احترافي",
    "welcome.feature3.title": "متاح على مدار الساعة",
    "welcome.feature3.desc": "حلل الرسوم البيانية في أي وقت ومن أي مكان",
    
    // Auth page
    "auth.welcome": "مرحباً بعودتك",
    "auth.createAccount": "إنشاء حساب",
    "auth.signIn": "تسجيل الدخول",
    "auth.signUp": "إنشاء حساب",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.fullName": "الاسم الكامل",
    "auth.phoneNumber": "رقم الهاتف (اختياري)",
    "auth.noAccount": "ليس لديك حساب؟",
    "auth.hasAccount": "لديك حساب بالفعل؟",
    "auth.signingIn": "جاري تسجيل الدخول...",
    "auth.creatingAccount": "جاري إنشاء الحساب...",
    
    // Dashboard
    "dashboard.title": "لوحة التحكم",
    "dashboard.analysesRemaining": "تحليلات متبقية اليوم",
    "dashboard.unlimited": "تحليلات غير محدودة",
    "dashboard.dailyUsage": "الاستخدام اليومي",
    "dashboard.uploadChart": "تحميل صورة الرسم البياني",
    "dashboard.uploadHint": "انقر للاختيار أو اسحب وأفلت",
    "dashboard.analyzing": "جاري تحليل الرسم البياني...",
    "dashboard.analysisResult": "نتيجة التحليل",
    "dashboard.confidence": "نسبة الثقة",
    "dashboard.entry": "الدخول",
    "dashboard.stopLoss": "وقف الخسارة",
    "dashboard.takeProfit": "جني الأرباح",
    "dashboard.emptyState": "قم بتحميل رسم بياني للحصول على إشارات تداول بالذكاء الاصطناعي",
    "dashboard.limitReached": "تم الوصول للحد اليومي",
    "dashboard.upgradeHint": "قم بالترقية للباقة المميزة للحصول على تحليلات غير محدودة",
    
    // History
    "history.title": "سجل التحليلات",
    "history.subtitle": "إشارات التداول السابقة",
    "history.noAnalyses": "لا توجد تحليلات بعد",
    "history.startAnalyzing": "ابدأ بتحميل رسم بياني في لوحة التحكم",
    "history.goToDashboard": "الذهاب للوحة التحكم",
    
    // Plans
    "plans.title": "اختر خطتك",
    "plans.subtitle": "أطلق العنان لإمكانات إشارات التداول بالذكاء الاصطناعي",
    "plans.free": "مجاني",
    "plans.premium": "مميز",
    "plans.currentPlan": "الخطة الحالية",
    "plans.comingSoon": "قريباً",
    "plans.perDay": "يومياً",
    "plans.perMonth": "شهرياً",
    "plans.feature.analyses5": "5 تحليلات يومياً",
    "plans.feature.unlimitedAnalyses": "تحليلات غير محدودة",
    "plans.feature.basicSignals": "إشارات أساسية (الدخول، وقف الخسارة، TP1)",
    "plans.feature.extendedTargets": "أهداف ممتدة (TP1, TP2, TP3)",
    "plans.feature.standardSpeed": "معالجة قياسية",
    "plans.feature.priorityProcessing": "معالجة ذات أولوية",
    "plans.feature.7dayHistory": "سجل 7 أيام",
    "plans.feature.fullHistory": "سجل التحليلات الكامل",
    "plans.feature.advancedInsights": "رؤى سوقية متقدمة",
    
    // Contact
    "contact.title": "تواصل معنا",
    "contact.subtitle": "تابعنا على وسائل التواصل الاجتماعي أو راسلنا عبر البريد الإلكتروني",
    "contact.followUs": "تابعنا",
    "contact.emailUs": "راسلنا",
    
    // Navigation
    "nav.home": "الرئيسية",
    "nav.analysis": "التحليل",
    "nav.history": "السجل",
    "nav.plans": "الخطط",
    "nav.contact": "اتصل بنا",
    "nav.profile": "الملف",
    "nav.admin": "الإدارة",
    "nav.academy": "الأكاديمية",
    // Profile
    "profile.trader": "متداول",
    "profile.totalAnalyses": "إجمالي التحليلات",
    "profile.thisWeek": "هذا الأسبوع",
    "profile.plan": "الخطة",
    "profile.upgradeBlurb": "افتح تحليلات غير محدودة وأهداف TP1/TP2/TP3 الموسعة ومعالجة ذات أولوية.",
    "profile.contactUpgrade": "تواصل للترقية",
    "profile.preferences": "التفضيلات",
    "profile.language": "اللغة",
    "profile.history": "سجل التحليلات",
    "profile.adminPanel": "لوحة الإدارة",
    "profile.signOut": "تسجيل الخروج",
    
    // Admin
    "admin.title": "لوحة الإدارة",
    "admin.subtitle": "إدارة المستخدمين والاشتراكات",
    "admin.users": "المستخدمون المسجلون",
    "admin.name": "الاسم",
    "admin.email": "البريد الإلكتروني",
    "admin.tier": "الفئة",
    "admin.joined": "تاريخ الانضمام",
    "admin.actions": "الإجراءات",
    "admin.free": "مجاني",
    "admin.unlimited": "غير محدود",
    "admin.noUsers": "لا يوجد مستخدمون",
    "admin.unauthorized": "وصول غير مصرح",
    "admin.unauthorizedDesc": "ليس لديك صلاحية للوصول إلى هذه الصفحة.",
    "admin.courseAccess": "الوصول للدورات",
    "admin.grantAccess": "منح الوصول",
    "admin.revokeAccess": "إلغاء",
    "admin.selectUser": "اختر المستخدم بالبريد الإلكتروني",
    "admin.selectCourse": "اختر الدورة",
    "admin.backToHome": "العودة للرئيسية",
    "admin.logout": "تسجيل الخروج",

    // Academy
    "academy.title": "الأكاديمية",
    "academy.subtitle": "أتقن التداول مع دورات الخبراء",
    "academy.locked": "مغلق",
    "academy.enrolled": "مسجل",
    "academy.upgradeToWatch": "قم بالترقية للمشاهدة أو تواصل معنا على واتساب",
    "academy.upgradePlan": "ترقية الخطة",
    "academy.contactWhatsApp": "تواصل على واتساب",
    "academy.backToAcademy": "العودة للأكاديمية",
    "academy.playlist": "قائمة التشغيل",
    "academy.noVideos": "لا توجد فيديوهات بعد",
    "academy.noCourses": "لا توجد دورات بعد",

    // Liveness
    "liveness.title": "التحقق من الهوية",
    "liveness.subtitle": "فحص وجه سريع لتأمين حسابك",
    "liveness.loading": "جاري تشغيل الكاميرا...",
    "liveness.positionFace": "ضع وجهك في الإطار",
    "liveness.submitting": "جاري التحقق...",
    "liveness.successTitle": "تم التحقق!",
    "liveness.successDesc": "تم تأكيد الهوية. جاري التحويل...",
    "liveness.retry": "حاول مرة أخرى",
    "liveness.blinks": "الغمزات",
    "liveness.smile": "الابتسامة",
    "liveness.looking": "جاري البحث...",
    "liveness.detected": "تم اكتشافها!",
    "liveness.privacy": "يتم معالجة الفيديو محلياً. نحن نخزن فقط تجزئة SHA-256 للتحقق.",
    "liveness.cameraDenied": "يلزم الوصول إلى الكاميرا للتحقق من الهوية.",
    "liveness.loadingModel": "جاري تحميل نظام كشف الوجه — قد يستغرق وقتاً أطول أول مرة...",
    "liveness.slowLoad": "لا يزال التحميل جارياً… قد يستغرق وقتاً أطول مع اتصال أبطأ.",
    "liveness.cameraUnsupported": "متصفحك لا يدعم الوصول للكاميرا. يرجى استخدام Chrome أو Safari.",
    "liveness.instructions": "أرمش مرتين، ثم ابتسم 😊",
    "plans.requestUpgrade": "طلب الترقية",
    "plans.manualUpgradeNote": "تتم مراجعة وتفعيل الترقيات يدوياً من فريقنا خلال 24 ساعة.",

    "editProfile.title": "المعلومات الشخصية",
    "editProfile.subtitle": "حدّث اسمك وبيانات التواصل.",
    "editProfile.fullName": "الاسم الكامل",
    "editProfile.fullNamePlaceholder": "اسمك",
    "editProfile.phone": "رقم الهاتف",
    "editProfile.email": "البريد الإلكتروني",
    "editProfile.emailLocked": "تواصل مع الدعم لتغيير بريدك الإلكتروني.",
    "editProfile.nameRequired": "الاسم الكامل مطلوب.",
    "editProfile.save": "حفظ التغييرات",
    "editProfile.saving": "جارٍ الحفظ…",
    "editProfile.saved": "تم الحفظ",

    "changePassword.title": "تغيير كلمة المرور",
    "changePassword.subtitle": "اختر كلمة مرور جديدة لحسابك.",
    "changePassword.newPassword": "كلمة المرور الجديدة",
    "changePassword.confirmPassword": "تأكيد كلمة المرور الجديدة",
    "changePassword.tooShort": "يجب أن تكون كلمة المرور 8 أحرف على الأقل.",
    "changePassword.mismatch": "كلمتا المرور غير متطابقتين.",
    "changePassword.save": "تحديث كلمة المرور",
    "changePassword.saving": "جارٍ التحديث…",
    "changePassword.saved": "تم تحديث كلمة المرور",

    "deleteAccount.title": "حذف الحساب",
    "deleteAccount.whatHappens": "هذا الإجراء نهائي. هذا ما سيحدث:",
    "deleteAccount.point1": "سيتم حذف ملفك الشخصي وسجل الشارتات وأجهزتك نهائياً",
    "deleteAccount.point2": "سيتم إلغاء اشتراكك فوراً",
    "deleteAccount.point3": "سيتم تسجيل خروجك من جميع الأجهزة",
    "deleteAccount.point4": "لا يمكن التراجع عن هذا — لا توجد فترة استرجاع",
    "deleteAccount.continue": "متابعة للحذف",
    "deleteAccount.typeToConfirm": "اكتب DELETE بالأسفل لحذف حسابك نهائياً.",
    "deleteAccount.cancel": "إلغاء",
    "deleteAccount.confirmDelete": "حذف حسابي",
    "deleteAccount.deleting": "جارٍ الحذف…",
    "profile.deleteAccount": "حذف الحساب",
    "profile.deleteAccountSubtitle": "إزالة حسابك وبياناتك نهائياً",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  const isRTL = language === "ar";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
