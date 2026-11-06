import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Notification({ notification, onClose }) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const { type = 'info', message, details } = notification;

  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    error: {
      bg: 'bg-[#FAF0F1] border-[#6C151E]/30 text-[#6C151E]',
      icon: <AlertCircle className="w-5 h-5 text-[#6C151E] shrink-0" />,
    },
    info: {
      bg: 'bg-[#FBF2E8] border-[#E2C19E] text-stone-800',
      icon: <Info className="w-5 h-5 text-[#6C151E] shrink-0" />,
    },
  }[type] || styles.info;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in shadow-lg">
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${styles.bg}`}>
        {styles.icon}
        <div className="flex-1 text-sm">
          <p className="font-semibold">{message}</p>
          {details && <p className="mt-1 text-xs opacity-90">{details}</p>}
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 transition p-0.5 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

