import React from 'react';
import { NavLink, useNavigate } from '@/delux/router';
import { motion } from 'motion/react';
import { DeluxLogo } from '../common/DeluxLogo';
import { AssistantOrb } from '../assistant/AssistantOrb';
import { ThemeToggle } from '../common/ThemeToggle';
import { 
  Home, 
  Target, 
  CalendarDays, 
  Sparkles, 
  User, 
  Plus, 
  Crown, 
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  Route
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { playSelectSound } from '../../services/sound';

export const DesktopSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/app/inicio', label: 'Início', icon: Home },
    { to: '/app/objetivos', label: 'Mapas & Metas', icon: Route },
    { to: '/app/planejamento', label: 'Planejamento', icon: CalendarDays },
    { to: '/app/assistente', label: 'Assistente Delux', icon: Sparkles, badge: 'IA' },
    { to: '/app/perfil', label: 'Perfil & Rotina', icon: User }
  ];

  return (
    <aside className="delux-sidebar hidden md:flex flex-col w-64 lg:w-72 h-full bg-card  border-r border-border  p-5 shrink-0 select-none overflow-y-auto transition-colors">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 mb-2 border-b border-muted ">
        <NavLink to="/app/inicio" className="cursor-pointer">
          <DeluxLogo size="md" />
        </NavLink>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold tracking-normal uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-primary/15 via-primary/15 to-primary/15 text-primary  border border-primary/25">
            PRO
          </span>
          <ThemeToggle variant="icon" size="sm" />
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="mb-6">
        <motion.button
          onClick={() => navigate('/app/objetivos/novo')}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="delux-primary-button w-full h-12 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer "
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Objetivo</span>
        </motion.button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isAssistant = item.to === '/app/assistente';

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => playSelectSound()}
              className={({ isActive }) => {
                if (isAssistant) {
                  return `delux-nav-item flex items-center justify-between px-3.5 py-3 rounded-xl text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary/15 via-primary/15 to-primary/15   border border-primary/30 text-primary  font-bold shadow-xs'
                      : 'text-muted-foreground  hover:bg-accent  hover:text-foreground  font-medium'
                  }`;
                }
                return `delux-nav-item flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-accent  text-primary  font-semibold'
                    : 'text-muted-foreground  hover:bg-background  hover:text-foreground '
                }`;
              }}
            >
              <div className="flex items-center gap-3">
                {isAssistant ? (
                  <AssistantOrb size="xs" />
                ) : (
                  <Icon className="w-5 h-5 shrink-0" />
                )}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isAssistant
                      ? 'bg-gradient-to-r from-primary to-primary text-primary-foreground shadow-xs'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Theme Quick Switch in Sidebar */}
      <div className="mb-4 pt-3 border-t border-muted  flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground ">Tema do App</span>
        <ThemeToggle variant="segmented" />
      </div>

      {/* User profile capsule */}
      <div className="pt-3 border-t border-muted  flex items-center justify-between">
        <div 
          onClick={() => navigate('/app/perfil')}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-accent text-primary font-bold text-xs flex items-center justify-center shrink-0">
            {user?.full_name?.trim() ? (
              user.full_name.trim().charAt(0).toUpperCase()
            ) : (
              <User className="w-4 h-4 text-primary-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground  truncate leading-tight">
              {user?.full_name?.trim() || 'Minha Conta'}
            </p>
            <p className="text-[11px] text-muted-foreground  truncate">
              {user?.email || 'conta@delux.app'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          title="Sair da conta"
          className="p-2 text-muted-foreground  hover:text-destructive  hover:bg-destructive-subtle  rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
