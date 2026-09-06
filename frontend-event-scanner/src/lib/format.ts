export function formatEventWhen(date?: string, time?: string) {
  if (!date) return time || '';
  const parsed = new Date(date);
  const day = Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return time ? `${day} · ${time}` : day;
}

export function shortTicketId(id?: string) {
  if (!id) return '';
  return id.slice(0, 8).toUpperCase();
}
