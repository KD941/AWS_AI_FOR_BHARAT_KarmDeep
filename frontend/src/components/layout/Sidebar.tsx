import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Package,
  FileText,
  ShoppingCart,
  Wrench,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['all'] },
  { name: 'Vendors', href: '/vendors', icon: Building2, roles: ['all'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['all'] },
  { name: 'Tenders', href: '/tenders', icon: FileText, roles: [UserRole.MANUFACTURER, UserRole.VENDOR, UserRole.ADMIN] },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ['all'] },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench, roles: [UserRole.ENGINEER, UserRole.ADMIN] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: [UserRole.ADMIN] },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();

  const filteredNavigation = navigation.filter(
    (item) => item.roles.includes('all') || (user && item.roles.includes(user.role))
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary-600">KarmDeep</h1>
      </div>
      <nav className="p-4 space-y-1">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
