import React from 'react';

type BadgeVariant = 
  | 'ACTIVE' | 'INACTIVE' | 'OPEN' | 'CLOSED' | 'DRAFT' 
  | 'NEW' | 'HIRED' | 'REJECTED' | 'ADMIN' | 'RECRUITER' 
  | 'Applied' | 'Screening' | 'Interview' | 'Technical Round' | 'HR Round' | 'Offer'
  | 'default';

interface BadgeProps {
  variant?: BadgeVariant | string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '', size = 'sm' }) => {
  let styleClasses = 'bg-slate-100 text-slate-700 border border-slate-200';

  const v = variant.toUpperCase();

  if (v === 'ACTIVE' || v === 'OPEN' || v === 'HIRED') {
    styleClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium';
  } else if (v === 'INACTIVE' || v === 'CLOSED' || v === 'REJECTED') {
    styleClasses = 'bg-rose-50 text-rose-700 border border-rose-200/80 font-medium';
  } else if (v === 'NEW' || v === 'DRAFT' || v === 'APPLIED') {
    styleClasses = 'bg-sky-50 text-sky-700 border border-sky-200/80 font-medium';
  } else if (v === 'ADMIN') {
    styleClasses = 'bg-amber-50 text-amber-800 border border-amber-200/80 font-medium';
  } else if (v === 'RECRUITER') {
    styleClasses = 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium';
  } else if (v === 'SCREENING' || v === 'INTERVIEW' || v === 'TECHNICAL ROUND' || v === 'HR ROUND' || v === 'OFFER') {
    styleClasses = 'bg-purple-50 text-purple-700 border border-purple-200/80 font-medium';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-md font-sans tracking-tight transition-colors ${sizeClasses} ${styleClasses} ${className}`}
    >
      {children}
    </span>
  );
};
