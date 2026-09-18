import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Mail,
  ClipboardCheck,
  UserPlus,
    CalendarCheck
} from "lucide-react";

export const navigation = [
  { path: "/", label: "Genel Bakış", icon: LayoutDashboard, category: "GENEL" },
  { path: "/adaylar", label: "Adaylar", icon: Users, category: "ADAY YÖNETİMİ" },
  { path: "/adaylar/yeni", label: "Aday Ekle", icon: UserPlus, category: "ADAY YÖNETİMİ" },
  { path: "/davetler", label: "Davetler", icon: Mail, category: "İŞE ALIM SÜRECİ" },
  { path: "/degerlendirmeler", label: "Değerlendirmeler", icon: ClipboardCheck, category: "İŞE ALIM SÜRECİ" },
  { path: "/takvim", label: "Takvim", icon: CalendarDays },
  { path: "/randevular", label: "Randevular", icon: CalendarCheck },
];
