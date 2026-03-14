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
      <div className="min-h-screen bg-white p-6 sm:p-8 md:p-10">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Overview</h1>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white px-5 py-2.5 text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
            >
              + Create event
            </button>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
            <StatBox label="Total registered" value={stats.total} />
            <StatBox label="Checked in" value={stats.checkedIn} />
            <StatBox label="Attendance" value={`${stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%`} />
          </div>

          {events.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-black mb-4">Events</h2>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event._id} className="border-2 border-neutral-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50">
                    <div>
                      <h3 className="font-semibold text-black">{event.title}</h3>
                      <p className="text-sm text-neutral-500">{event.attendees.length} attendees</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleExport(event._id, 'csv')}
                        disabled={exporting === event._id || event.attendees.length === 0}
                        className="px-3 py-1.5 text-sm font-medium border-2 border-neutral-800 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50"
                      >
                        CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport(event._id, 'json')}
                        disabled={exporting === event._id || event.attendees.length === 0}
                        className="px-3 py-1.5 text-sm font-medium border-2 border-neutral-800 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50"
                      >
                        JSON
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-black mb-4">Live entry logs</h2>
            <div className="border-2 border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-neutral-900 text-white">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Attendee</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {allAttendees.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-sm text-neutral-500">
                        No registrations yet. Students will appear here when they register.
                      </td>
                    </tr>
                  ) : (
                    allAttendees.map((a, idx) => (
                      <tr key={`${a._id}-${idx}`} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 text-sm text-neutral-800">{getAttendeeDisplay(a)}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600">{a.eventTitle}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-md ${a.checkedIn ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="create-event-title">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 border border-neutral-200">
            <h2 id="create-event-title" className="text-xl font-bold text-black mb-6">Create event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Title *</label>
                <input
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-3 text-base border-2 border-neutral-300 rounded-xl focus:border-black focus:ring-2 focus:ring-black/10 outline-none"
                  placeholder="Tech Workshop 2025"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 text-base border-2 border-neutral-300 rounded-xl focus:border-black focus:ring-2 focus:ring-black/10 outline-none resize-y"
                  placeholder="Optional"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Location *</label>
                <input
                  required
                  value={createForm.location}
                  onChange={(e) => setCreateForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-4 py-3 text-base border-2 border-neutral-300 rounded-xl focus:border-black focus:ring-2 focus:ring-black/10 outline-none"
                  placeholder="Main Hall"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Date *</label>
                  <input
                    required
                    type="date"
                    value={createForm.date}
                    onChange={(e) => setCreateForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-3 text-base border-2 border-neutral-300 rounded-xl focus:border-black focus:ring-2 focus:ring-black/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Time</label>
                  <input
                    type="time"
                    value={createForm.time}
                    onChange={(e) => setCreateForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-4 py-3 text-base border-2 border-neutral-300 rounded-xl focus:border-black focus:ring-2 focus:ring-black/10 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-base font-medium border-2 border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-black text-white text-base font-semibold rounded-xl hover:bg-neutral-800 disabled:opacity-60 transition-colors"
                >
                  {creating ? 'Creating…' : 'Create'}
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
    <div className="border-2 border-neutral-200 rounded-xl p-5 sm:p-6 bg-white">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-black tabular-nums">{value}</p>
    </div>
  );
}
