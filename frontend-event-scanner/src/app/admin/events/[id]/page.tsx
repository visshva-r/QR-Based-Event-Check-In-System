'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/components/protected_route';
import { getSocket } from '@/lib/socket';
import { formatEventWhen } from '@/lib/format';

interface Person {
  _id: string;
  userId: { _id: string; name: string; email: string; studentId?: string } | string | null;
  checkedIn?: boolean;
}

interface EventDetail {
  _id: string;
  title: string;
  location?: string;
  date?: string;
  time?: string;
  capacity: number;
  registeredCount: number;
  checkedInCount: number;
  waitlistCount: number;
  checkInPercent: number;
  attendees: Person[];
  waitlist: Person[];
}

function displayUser(u: Person['userId']) {
  if (u && typeof u === 'object' && 'name' in u) return { name: u.name, email: u.email };
  return { name: 'Unknown', email: '' };
}

export default function AdminEventDetail() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || '');
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await api.get(`/admin/events/${id}`);
      setEvent(res.data);
    } catch {
      toast.error('Could not load this event');
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchEvent();
    const socket = getSocket();
    if (!socket) return;
    const onUpdated = (payload: { eventId?: string }) => {
      if (!payload?.eventId || payload.eventId === id) fetchEvent();
    };
    socket.on('event-updated', onUpdated);
    socket.on('checkin', fetchEvent);
    return () => {
      socket.off('event-updated', onUpdated);
      socket.off('checkin', fetchEvent);
    };
  }, [id, fetchEvent]);

  const handleExport = async (format: 'csv' | 'json') => {
    if (!event) return;
    setExporting(true);
    try {
      if (format === 'csv') {
        const res = await api.get(`/admin/export/${event._id}`, { responseType: 'blob' });
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.title}-door.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const res = await api.get(`/events/export/${event._id}`);
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.title}-door.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success(`Exported ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-neutral-100 px-5 sm:px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <button type="button" onClick={() => router.push('/admin/dashboard')} className="text-sm text-neutral-500 hover:text-neutral-900 mb-6">
            Staff desk
          </button>

          {!event ? (
            <p className="text-sm text-neutral-500">Loading event…</p>
          ) : (
            <>
              <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">{event.title}</h1>
                  <p className="text-sm text-neutral-500 mt-1">
                    {event.location} · {formatEventWhen(event.date, event.time)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleExport('csv')} disabled={exporting || event.attendees.length === 0} className="px-3 py-1.5 text-sm border border-neutral-400 disabled:opacity-40">
                    CSV
                  </button>
                  <button type="button" onClick={() => handleExport('json')} disabled={exporting || event.attendees.length === 0} className="px-3 py-1.5 text-sm border border-neutral-400 disabled:opacity-40">
                    JSON
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-neutral-300 border border-neutral-300 mb-10">
                <Mini label="Capacity" value={event.capacity} />
                <Mini label="Registered" value={event.registeredCount} />
                <Mini label="In" value={`${event.checkInPercent}%`} />
                <Mini label="Waitlist" value={event.waitlistCount} />
              </div>

              <section className="mb-10">
                <h2 className="text-sm font-medium text-neutral-500 mb-3">On the list</h2>
                <div className="border border-neutral-300 bg-white overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-950 text-white font-mono text-[11px] tracking-wider">
                      <tr>
                        <th className="px-4 py-2 font-medium">Student</th>
                        <th className="px-4 py-2 font-medium text-right">Door</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {event.attendees.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-8 text-center text-neutral-500">Nobody has taken a seat yet.</td>
                        </tr>
                      ) : (
                        event.attendees.map((a) => {
                          const u = displayUser(a.userId);
                          return (
                            <tr key={a._id}>
                              <td className="px-4 py-2.5">
                                {u.name}
                                {u.email && <span className="block text-xs text-neutral-500">{u.email}</span>}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-xs">
                                {a.checkedIn ? 'IN' : 'out'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-medium text-neutral-500 mb-3">Waitlist</h2>
                <div className="border border-neutral-300 bg-white overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-950 text-white font-mono text-[11px] tracking-wider">
                      <tr>
                        <th className="px-4 py-2 font-medium w-12">#</th>
                        <th className="px-4 py-2 font-medium">Student</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {event.waitlist.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-8 text-center text-neutral-500">Line is empty.</td>
                        </tr>
                      ) : (
                        event.waitlist.map((w, i) => {
                          const u = displayUser(w.userId);
                          return (
                            <tr key={w._id}>
                              <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">{i + 1}</td>
                              <td className="px-4 py-2.5">{u.name}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white px-4 py-4">
      <p className="text-[11px] font-mono tracking-wider text-neutral-500">{label.toUpperCase()}</p>
      <p className="text-2xl font-semibold tabular-nums mt-1">{value}</p>
    </div>
  );
}
