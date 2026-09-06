'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/protected_route';
import toast, { Toaster } from 'react-hot-toast';
import { getSocket } from '@/lib/socket';
import { formatEventWhen } from '@/lib/format';

interface AdminEvent {
  _id: string;
  title: string;
  location?: string;
  date?: string;
  time?: string;
  capacity: number;
  registeredCount: number;
  checkedInCount: number;
  waitlistCount: number;
  seatsRemaining: number;
  checkInPercent: number;
}

interface CheckInLog {
  _id: string;
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [logs, setLogs] = useState<CheckInLog[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', location: '', date: '', time: '', capacity: '100' });
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [eventsRes, logsRes] = await Promise.all([
        api.get('/admin/events'),
        api.get('/admin/logs?limit=40'),
      ]);
      setEvents(eventsRes.data);
      setLogs(logsRes.data);
    } catch {
      toast.error('Could not load the desk');
    }
  }, []);

  useEffect(() => {
    fetchData();
    const socket = getSocket();
    if (!socket) return;
    const onCheckin = (log: CheckInLog) => {
      setLogs((prev) => [log, ...prev.filter((l) => l._id !== log._id)].slice(0, 40));
    };
    const onUpdated = () => { fetchData(); };
    socket.on('checkin', onCheckin);
    socket.on('event-updated', onUpdated);
    return () => {
      socket.off('checkin', onCheckin);
      socket.off('event-updated', onUpdated);
    };
  }, [fetchData]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/create', { ...createForm, capacity: Number(createForm.capacity) });
      toast.success('Event is live');
      setShowCreate(false);
      setCreateForm({ title: '', description: '', location: '', date: '', time: '', capacity: '100' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not create event');
    } finally {
      setCreating(false);
    }
  };

  const totals = events.reduce(
    (acc, e) => {
      acc.registered += e.registeredCount;
      acc.checkedIn += e.checkedInCount;
      acc.waitlisted += e.waitlistCount;
      return acc;
    },
    { registered: 0, checkedIn: 0, waitlisted: 0 }
  );

  const field = 'w-full px-3 py-2 bg-white border border-neutral-300 outline-none focus:border-neutral-900';

  return (
    <ProtectedRoute requireAdmin={true}>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-neutral-100 text-neutral-900 px-5 sm:px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] tracking-[0.18em] text-neutral-500">STAFF DESK</p>
              <h1 className="text-3xl font-semibold tracking-tight mt-1">Tonight’s door</h1>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 text-sm bg-neutral-950 text-white hover:bg-neutral-800"
            >
              New event
            </button>
          </header>

          <div className="grid grid-cols-3 gap-px bg-neutral-300 border border-neutral-300 mb-10">
            <Stat label="Registered" value={totals.registered} />
            <Stat label="Through the door" value={totals.checkedIn} />
            <Stat label="Waitlist" value={totals.waitlisted} />
          </div>

          <section className="mb-12">
            <h2 className="text-sm font-medium text-neutral-500 mb-3">Events</h2>
            {events.length === 0 ? (
              <p className="text-sm text-neutral-500 border border-dashed border-neutral-400 px-4 py-8">
                No events on the board. Add one before doors open.
              </p>
            ) : (
              <div className="border border-neutral-300 bg-white overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-950 text-white font-mono text-[11px] tracking-wider">
                    <tr>
                      <th className="px-4 py-2 font-medium">Event</th>
                      <th className="px-4 py-2 font-medium">Seats</th>
                      <th className="px-4 py-2 font-medium text-right">In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {events.map((event) => (
                      <tr
                        key={event._id}
                        className="hover:bg-neutral-50 cursor-pointer"
                        onClick={() => router.push(`/admin/events/${event._id}`)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-neutral-500 text-xs mt-0.5">
                            {event.location} · {formatEventWhen(event.date, event.time)}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                          {event.registeredCount}/{event.capacity}
                          {event.waitlistCount ? ` · +${event.waitlistCount} wait` : ''}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">{event.checkInPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-medium text-neutral-500 mb-3">Live log</h2>
            <div className="border border-neutral-300 bg-white overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-950 text-white font-mono text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Event</th>
                    <th className="px-4 py-2 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-neutral-500">
                        Nothing yet. Door scans show up here as they happen.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id}>
                        <td className="px-4 py-2.5">
                          {log.attendeeName}
                          <span className="block text-xs text-neutral-500">{log.attendeeEmail}</span>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600">{log.eventTitle}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-neutral-500">
                          {new Date(log.createdAt).toLocaleTimeString()}
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

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white max-w-md w-full p-6 border border-neutral-300">
            <h2 className="text-lg font-semibold mb-5">New event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <input required value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))} className={field} placeholder="Title" />
              <textarea value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} className={field} placeholder="What it is (optional)" rows={2} />
              <input required value={createForm.location} onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))} className={field} placeholder="Hall / lawn / lab" />
              <div className="grid grid-cols-2 gap-3">
                <input required type="date" value={createForm.date} onChange={(e) => setCreateForm((f) => ({ ...f, date: e.target.value }))} className={field} />
                <input type="time" value={createForm.time} onChange={(e) => setCreateForm((f) => ({ ...f, time: e.target.value }))} className={field} />
              </div>
              <input required type="number" min={1} value={createForm.capacity} onChange={(e) => setCreateForm((f) => ({ ...f, capacity: e.target.value }))} className={field} placeholder="Capacity" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 text-sm border border-neutral-300">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-2 text-sm bg-neutral-950 text-white disabled:opacity-60">
                  {creating ? 'Saving…' : 'Post event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white px-4 py-5">
      <p className="text-[11px] font-mono tracking-wider text-neutral-500">{label.toUpperCase()}</p>
      <p className="text-3xl font-semibold tabular-nums mt-1">{value}</p>
    </div>
  );
}
