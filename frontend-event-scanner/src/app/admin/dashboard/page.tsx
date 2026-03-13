'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/protected_route';
import toast, { Toaster } from 'react-hot-toast';

interface Attendee {
  _id: string;
  userId: string | { _id: string; name: string; email: string; studentId?: string };
  checkedIn: boolean;
}

interface EventWithAttendees {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  date?: string;
  time?: string;
  attendees: Attendee[];
}

export default function AdminDashboard() {
  const [events, setEvents] = useState<EventWithAttendees[]>([]);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', location: '', date: '', time: '' });
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/events');
      setEvents(res.data);
      let total = 0, checked = 0;
      res.data.forEach((e: EventWithAttendees) => {
        total += e.attendees.length;
        checked += e.attendees.filter((a: Attendee) => a.checkedIn).length;
      });
      setStats({ total, checkedIn: checked });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard');
    }
  };

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 5000);
    return () => clearInterval(inv);
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/create', createForm);
      toast.success('Event created!');
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', location: '', date: '', time: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleExport = async (eventId: string, format: 'csv' | 'json') => {
    setExporting(eventId);
    try {
      if (format === 'csv') {
        const res = await api.get(`/admin/export/${eventId}`, { responseType: 'blob' });
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `event-attendees.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const res = await api.get(`/events/export/${eventId}`);
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event-attendees.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  };

  const getAttendeeDisplay = (a: Attendee) => {
    const u = a.userId;
    if (typeof u === 'object' && u !== null && 'name' in u) {
      return `${u.name} (${u.email})`;
    }
    return String(u);
  };

  const allAttendees = events.flatMap(e => e.attendees.map(a => ({ ...a, eventTitle: e.title })));

  return (
    <ProtectedRoute requireAdmin={true}>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-white p-10">
        <div className="max-w-[1400px] mx-auto">
          
          <header className="mb-16 flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1 className="text-8xl font-black italic uppercase tracking-tighter text-black">Overview</h1>
              <div className="w-48 h-4 bg-black mt-2"></div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white px-8 py-4 font-black uppercase text-sm hover:bg-zinc-800 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]"
            >
              + Create Event
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
            <StatBox label="Total Registered" value={stats.total} />
            <StatBox label="Checked In" value={stats.checkedIn} />
            <StatBox label="Attendance %" value={`${stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%`} />
          </div>

          {/* Events list with export */}
          {events.length > 0 && (
            <section className="mb-16">
              <h2 className="text-3xl font-black uppercase mb-6 underline decoration-8">Events</h2>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event._id} className="border-[4px] border-black p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{event.title}</h3>
                      <p className="text-sm text-zinc-600">{event.attendees.length} attendees</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleExport(event._id, 'csv')}
                        disabled={exporting === event._id || event.attendees.length === 0}
                        className="px-4 py-2 border-2 border-black font-bold text-sm uppercase hover:bg-black hover:text-white transition-all disabled:opacity-50"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={() => handleExport(event._id, 'json')}
                        disabled={exporting === event._id || event.attendees.length === 0}
                        className="px-4 py-2 border-2 border-black font-bold text-sm uppercase hover:bg-black hover:text-white transition-all disabled:opacity-50"
                      >
                        Export JSON
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-3xl font-black uppercase mb-8 underline decoration-8">Live Entry Logs</h2>
            <div className="border-[6px] border-black rounded-3xl overflow-hidden shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full text-left">
                <thead className="bg-black text-white uppercase text-xs tracking-widest">
                  <tr>
                    <th className="p-6">Attendee</th>
                    <th className="p-6">Event</th>
                    <th className="p-6 text-right">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-black">
                  {allAttendees.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-zinc-500 font-bold">
                        No registrations yet. Students will appear here when they register.
                      </td>
                    </tr>
                  ) : (
                    allAttendees.map((a, idx) => (
                      <tr key={`${a._id}-${idx}`} className="hover:bg-zinc-50 font-bold">
                        <td className="p-6 text-sm">{getAttendeeDisplay(a)}</td>
                        <td className="p-6 text-sm text-zinc-600">{a.eventTitle}</td>
                        <td className="p-6 text-right">
                          <span className={`px-4 py-2 border-4 border-black uppercase text-[10px] ${a.checkedIn ? 'bg-green-400' : 'bg-yellow-300'}`}>
                            {a.checkedIn ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-[6px] border-black rounded-3xl shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-10">
            <h2 className="text-2xl font-black uppercase mb-6">Create Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Title *</label>
                <input
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold"
                  placeholder="Tech Workshop 2025"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2">Location *</label>
                <input
                  required
                  value={createForm.location}
                  onChange={(e) => setCreateForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold"
                  placeholder="Main Hall"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2">Date *</label>
                  <input
                    required
                    type="date"
                    value={createForm.date}
                    onChange={(e) => setCreateForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2">Time</label>
                  <input
                    type="time"
                    value={createForm.time}
                    onChange={(e) => setCreateForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 border-4 border-black font-black uppercase hover:bg-zinc-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-black text-white font-black uppercase rounded-xl hover:bg-zinc-800 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-8 border-black p-10 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">{label}</h3>
      <p className="text-7xl font-black tracking-tighter">{value}</p>
    </div>
  );
}
