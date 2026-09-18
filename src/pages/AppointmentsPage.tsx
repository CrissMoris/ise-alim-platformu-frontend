import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { appointmentsApi, type AppointmentSlot } from "../lib/api";

const hours = Array.from({ length: 8 }, (_, i) => `${String(i + 10).padStart(2, "0")}:00`);
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const slotDay = (s: AppointmentSlot) => new Date(s.startAt).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
const slotTime = (s: AppointmentSlot) => new Date(s.startAt).toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });

export function AppointmentsPage() {
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [days, setDays] = useState<string[]>([]);
  const [focus, setFocus] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const today = key(new Date());
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const focused = slots.filter(s => slotDay(s) === focus);
  const load = async () => { try { setSlots(await appointmentsApi.slots()); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Saatler alınamadı."); } finally { setLoading(false); } };
  useEffect(() => { appointmentsApi.slots().then(setSlots).catch(e => setError(e instanceof Error ? e.message : "Saatler alınamadı.")).finally(() => setLoading(false)); }, []);
  const add = async () => { setBusy(true); setMessage(""); try { const r = await appointmentsApi.createSlots(days, times); setMessage(`${r.created} saat eklendi.`); setDays([]); setTimes([]); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Saatler eklenemedi."); } finally { setBusy(false); } };
  const remove = async (id: string) => { setBusy(true); try { await appointmentsApi.deleteSlot(id); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Saat silinemedi."); } finally { setBusy(false); } };
  return <div className="appointments-page">
    <header className="page-heading"><div><div className="eyebrow">MÜLAKAT TAKVİMİ</div><h1>Randevular</h1><p>Görüşme saatlerini planlayın ve rezervasyonları tek yerden izleyin.</p></div><CalendarDays size={28} /></header>
    {error && <p className="data-message" role="alert">{error}</p>}{message && <p className="data-message" role="status">{message}</p>}
    <div className="appointments-layout"><section className="card appointments-card">
      <div className="appointments-month"><h2>Gün seçimi</h2><div><button type="button" aria-label="Önceki ay" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={17} /></button><strong>{month.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</strong><button type="button" aria-label="Sonraki ay" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={17} /></button></div></div>
      <div className="appointments-calendar">{["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map(d => <span className="appointments-weekday" key={d}>{d}</span>)}{Array.from({ length: offset }, (_, i) => <span key={i} />)}{Array.from({ length: count }, (_, i) => { const day = key(new Date(month.getFullYear(), month.getMonth(), i + 1)); const n = slots.filter(s => slotDay(s) === day).length; return <button type="button" key={day} disabled={day < today} className={`${days.includes(day) ? "selected" : ""} ${focus === day ? "focused" : ""}`} onClick={() => { setFocus(day); setDays(current => current.includes(day) ? current.filter(x => x !== day) : [...current, day]); }}><span>{i + 1}</span>{n > 0 && <small>{n}</small>}</button>; })}</div>
      <p className="appointments-hint">{days.length} gün seçildi. Birden fazla gün seçebilirsiniz.</p>
    </section><section className="card appointments-card"><h2>{focus ? new Date(`${focus}T12:00:00`).toLocaleDateString("tr-TR", { dateStyle: "full" }) : "Günlük saatler"}</h2><p>{focus ? "Seçilen günün tanımlı saatleri" : "Saatleri görmek için bir gün seçin."}</p>
      {focus && (focused.length ? <div className="appointments-day-slots">{focused.map(s => <div className="appointments-day-slot" key={s.id}><strong>{slotTime(s)}</strong><span className={s.isBooked ? "appointments-booked" : "appointments-free"}>{s.isBooked ? "Rezerve" : "Boş"}</span><span>{s.candidateName || "—"}</span>{!s.isBooked && <button type="button" disabled={busy} aria-label={`${slotTime(s)} saatini sil`} onClick={() => void remove(s.id)}><Trash2 size={16} /></button>}</div>)}</div> : <p className="data-message">Bu gün için saat tanımlanmadı.</p>)}
      <div className="appointments-add"><h3>Yeni saat oluştur</h3><br></br><div className="appointments-time-grid">{hours.map(t => <button type="button" key={t} className={times.includes(t) ? "selected" : ""} onClick={() => setTimes(current => current.includes(t) ? current.filter(x => x !== t) : [...current, t])}>{t}</button>)}</div><button type="button" className="button" disabled={!days.length || !times.length || busy} onClick={() => void add()}>{busy ? "Kaydediliyor…" : `${days.length * times.length} saat ekle`}</button></div>
    </section></div>
    <section className="card appointments-card"><h2>Tanımlı saatler <span>({slots.length})</span></h2>{loading ? <p className="data-message">Yükleniyor…</p> : !slots.length ? <p className="data-message">Henüz saat tanımlanmadı.</p> : <div className="appointments-list">{[...slots].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()).map(s => <div className="appointments-row" key={s.id}><strong>{new Date(s.startAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short" })}</strong><span className={s.isBooked ? "appointments-booked" : "appointments-free"}>{s.isBooked ? "Rezerve" : "Boş"}</span><span>{s.candidateName ?? "—"}</span>{!s.isBooked && <button type="button" disabled={busy} onClick={() => void remove(s.id)} aria-label={`${slotTime(s)} saatini sil`}><Trash2 size={16} /></button>}</div>)}</div>}</section>
  </div>;
}
