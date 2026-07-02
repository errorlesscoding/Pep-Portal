import React from 'react';
import { ShieldCheck, Users, BarChart3, FileSpreadsheet } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Control Room</h1>
          <p className="text-muted-foreground mt-1">Supervise metrics, account listings, and resume assets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Total Registered', count: '142 users', icon: Users },
          { title: 'Scans Audited', count: '92 uploads', icon: FileSpreadsheet },
          { title: 'Interview Sessions', count: '344 rounds', icon: BarChart3 },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-6 border rounded-2xl bg-card space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">{item.title}</span>
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-2xl font-bold">{item.count}</h3>
            </div>
          );
        })}
      </div>

      <div className="p-12 border rounded-2xl bg-card text-center text-sm text-muted-foreground">
        Admin dashboard actions (User listings, auditing, and analytics) will be populated in Module 5.
      </div>
    </div>
  );
};

export default AdminDashboard;
