import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from '@/delux/router';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import { DeluxLogo } from '../common/DeluxLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { Bell, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { AppNotification } from '../../types';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    api.getNotifications()
      .then(res => setNotifications(res.notifications))
      .catch(() => {});
  }, [location.pathname]);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const handleMarkAllRead = async () => {
    for (const notif of notifications) {
      if (!notif.read_at) {
        await api.markNotificationRead(notif.id).catch(() => {});
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
  };

  const isAssistantRoute = location.pathname.startsWith('/app/assistente');

  return (
    <div
      className={`bg-background  text-foreground  flex flex-col md:flex-row antialiased selection:bg-primary/15 transition-colors ${
        isAssistantRoute ? 'h-full w-full overflow-hidden' : 'min-h-full'
      }`}
    >
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-0 ${
          isAssistantRoute ? 'h-full overflow-hidden' : ''
        }`}
      >
        {/* Mobile Top App Bar (Hidden on Assistant page so it occupies the entire top space) */}
        {!isAssistantRoute && (
          <header className="md:hidden sticky top-0 z-30 bg-card/95  backdrop-blur-md border-b border-border  px-4 h-14 flex items-center justify-between transition-colors">
            <DeluxLogo size="sm" />

            <div className="flex items-center gap-2">
              <ThemeToggle variant="icon" size="sm" />

              <button
                onClick={() => navigate('/app/objetivos/novo')}
                aria-label="Novo objetivo"
                className="w-8 h-8 rounded-xl bg-gradient-to-r from-primary via-primary to-primary hover:from-primary hover:via-primary hover:to-primary text-primary-foreground flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm shadow-primary/30"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(prev => !prev)}
                  aria-label="Notificações"
                  className="w-8 h-8 rounded-lg bg-muted  border border-border  text-muted-foreground  flex items-center justify-center cursor-pointer relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-primary to-primary rounded-full ring-2 ring-card " />
                  )}
                </button>

                {/* Notification dropdown */}
                {showNotifMenu && (
                  <div className="absolute right-0 top-10 w-72 bg-card  rounded-2xl border border-border  shadow-xl p-3 z-50 animate-fadeIn">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border ">
                      <span className="text-xs font-bold text-foreground ">Notificações</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-primary  font-semibold hover:underline cursor-pointer"
                        >
                          Marcar lidas
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground  text-center py-4">
                        Tudo em dia! Nenhuma notificação.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl text-left transition-colors ${
                              n.read_at
                                ? 'bg-card  opacity-70 border border-transparent'
                                : 'bg-card  border border-border '
                            }`}
                          >
                            <p className="text-xs font-semibold text-foreground ">{n.title}</p>
                            <p className="text-[11px] text-muted-foreground  leading-tight mt-0.5">{n.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Content body with responsive padding */}
        <main
          className={`flex-1 min-h-0 flex flex-col ${
            isAssistantRoute
              ? 'p-0 m-0 h-full w-full overflow-hidden'
              : 'overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 md:pb-10 max-w-5xl w-full mx-auto'
          }`}
        >
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (Hidden on Assistant route so input composer is unobstructed) */}
        {!isAssistantRoute && <MobileBottomNavigation />}
      </div>
    </div>
  );
};
