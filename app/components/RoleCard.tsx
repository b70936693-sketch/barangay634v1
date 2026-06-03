"use client";

import Link from 'next/link';
import { ArrowRight, Briefcase, Users, Shield } from 'lucide-react';

interface RoleCardProps {
  role: 'applicant' | 'employer' | 'admin';
  title: string;
  description: string;
  keyword: string;
}

export function RoleCard({ role, title, description, keyword }: RoleCardProps) {
  const getColor = (r: string) => {
    switch (r) {
      case 'employer': return 'from-orange-500 to-yellow-500';
      case 'applicant': return 'from-blue-500 to-indigo-500';
      case 'admin': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <Link 
      href={`/?role=${role}&keyword=${keyword}`}
      className="group relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 border border-white/30 h-64 flex flex-col p-8 hover:bg-white/90"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br group-hover:scale-110 transition-transform duration-500 opacity-0 group-hover:opacity-100 ${getColor(role)}`}
        style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` } as any}
      />
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
          {role === 'employer' && <Briefcase className="h-8 w-8 text-orange-600" />}
          {role === 'applicant' && <Users className="h-8 w-8 text-blue-600" />}
          {role === 'admin' && <Shield className="h-8 w-8 text-purple-600" />}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-700">{title}</h3>
        <p className="text-gray-600 mb-6 flex-1">{description}</p>
        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity font-medium text-gray-800">
          <span>Enter "{keyword}"</span>
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

