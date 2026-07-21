import React, { useState, useEffect, useRef } from 'react';
import { LogOut, UserCheck, ShieldAlert, Bell, Activity, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../common/Badge.js';
import { api } from '../../services/api.js';
import { ActivityItem } from '../../types/index.js';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user, logout, switchQuickAccount, isAdmin } = useAuth();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadActivityFeed = async () => {
    setIsLoadingFeed(true);
    try {
      const data = await api.getActivityFeed(10);
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activity feed:', err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (showNotifications) {
      loadActivityFeed();
    }
  }, [showNotifications]);

  // Click outside listener for notifications popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 relative z-30">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Testing Role Switcher */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <span className="px-2 text-slate-500 text-[11px]">Test Role:</span>
          <button
            onClick={() => switchQuickAccount('RECRUITER')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              !isAdmin ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            Recruiter
          </button>
          <button
            onClick={() => switchQuickAccount('ADMIN')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              isAdmin ? 'bg-white text-amber-800 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            Admin
          </button>
        </div>

        {/* Notifications / Activity Bell */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-xl transition-all border ${
              showNotifications
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'text-slate-600 hover:bg-slate-100 border-slate-200'
            }`}
            title="Activity Notifications Feed"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white animate-pulse" />
          </button>

          {/* Activity Feed Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Live Pipeline Activity
                  </h3>
                </div>
                <button
                  onClick={loadActivityFeed}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                  title="Refresh activity feed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFeed ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {isLoadingFeed ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading activity feed...</div>
                ) : activities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No recent pipeline activity</div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="p-3 hover:bg-slate-50/80 transition-colors space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-indigo-700 tracking-tight">
                          {act.title}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-300" />
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">{act.description}</p>
                      <p className="text-[10px] text-slate-400 italic">By: {act.user}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Badge */}
        {user && (
          <Badge variant={user.role} size="md">
            {user.role}
          </Badge>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
