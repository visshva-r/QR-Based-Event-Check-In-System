'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/protected_route';

export default function AdminDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data);
        let total = 0, checked = 0;
        res.data.forEach((e: any) => {
          total += e.attendees.length;
          checked += e.attendees.filter((a: any) => a.checkedIn).length;
        });
        setStats({ total, checkedIn: checked });
      } catch (err) { console.error(err); }
    };
    fetchData();
    const inv = setInterval(fetchData, 5000);
    return () => clearInterval(inv);
  }, []);

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-white p-10">
        <div className="max-w-[1400px] mx-auto">
          
          <header className="mb-16">
            <h1 className="text-8xl font-black italic uppercase tracking-tighter text-black">Overview</h1>
            <div className="w-48 h-4 bg-black mt-2"></div>
          </header>

          {/* 3-COLUMN GRID: This fixes the "stretched" look */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
            <StatBox label="Total Registered" value={stats.total} />
            <StatBox label="Checked In" value={stats.checkedIn} />
            <StatBox label="Attendance %" value={`${stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%`} />
          </div>

          <section>
            <h2 className="text-3xl font-black uppercase mb-8 underline decoration-8">Live Entry Logs</h2>
            <div className="border-[6px] border-black rounded-3xl overflow-hidden shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full text-left">
                <thead className="bg-black text-white uppercase text-xs tracking-widest">
                  <tr>
                    <th className="p-6">User Hash ID</th>
                    <th className="p-6 text-right">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-black">
                  {events.flatMap(e => e.attendees).map((a: any) => (
                    <tr key={a._id} className="hover:bg-zinc-50 font-bold">
                      <td className="p-6 font-mono text-sm">{a.userId}</td>
                      <td className="p-6 text-right">
                        <span className={`px-4 py-2 border-4 border-black uppercase text-[10px] ${a.checkedIn ? 'bg-green-400' : 'bg-yellow-300'}`}>
                          {a.checkedIn ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatBox({ label, value }: any) {
  return (
    <div className="border-8 border-black p-10 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">{label}</h3>
      <p className="text-7xl font-black tracking-tighter">{value}</p>
    </div>
  );
}