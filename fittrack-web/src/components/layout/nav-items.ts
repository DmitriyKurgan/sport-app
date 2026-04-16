import {
  Activity,
  Bell,
  Dumbbell,
  LayoutDashboard,
  LineChart,
  Settings,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { ComponentType } from 'react';

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/training', label: 'Тренировки', icon: Dumbbell },
  { href: '/nutrition', label: 'Питание', icon: UtensilsCrossed },
  { href: '/progress', label: 'Прогресс', icon: LineChart },
  { href: '/avatar', label: 'Аватар', icon: Sparkles },
  { href: '/alerts', label: 'Алерты', icon: Bell },
  { href: '/settings', label: 'Настройки', icon: Settings },
];

/** Подмножество для bottom-nav на мобилке (5 ключевых). */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Главная', icon: LayoutDashboard },
  { href: '/training', label: 'План', icon: Dumbbell },
  { href: '/progress', label: 'Прогресс', icon: Activity },
  { href: '/nutrition', label: 'Еда', icon: UtensilsCrossed },
  { href: '/settings', label: 'Меню', icon: Settings },
];
