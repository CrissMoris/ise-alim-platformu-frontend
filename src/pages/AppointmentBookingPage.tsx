import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { CalendarDays, CircleAlert, Check, UserRound } from "lucide-react";
import { appointmentsApi } from "../lib/api";

type InviteView = Awaited<ReturnType<typeof appointmentsApi.resolve>>;
type Slot = InviteView["slots"][number];
type State = "loading" | "error" | "already_booked" | "select" | "confirm" | "done";
const dateLabel = (value: string) => new Date(value).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const dayLabel = (value: string) => new Date(value).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", year: "numeric" });
const dayKey = (value: string) => new Date(value).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
const timeLabel = (value: string) => new Date(value).toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });

export function AppointmentBookingPage() {
  const { token = "" } = useParams();
  const [state, setState] = useState<State>("loading");
  const [invite, setInvite] = useState<InviteView | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookedAt, setBookedAt] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    appointmentsApi.resolve(token).then(data => {
      setInvite(data);
      setState(data.alreadyBooked ? "already_booked" : "select");
    }).catch(e => {
      setErrorMsg(e instanceof Error ? e.message : "Bir hata oluştu.");
      setState("error");
    });
  }, [token]);

  async function confirmBooking() {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const result = await appointmentsApi.book(token, selectedSlot.id);
      setBookedAt(result.startAt);
      setState("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Rezervasyon yapılamadı.");
      setState("error");
    } finally {
      setSubmitting(false);
    }
  }

  const groups = new Map<string, Slot[]>();
  for (const slot of invite?.slots ?? []) {
    const key = dayKey(slot.startAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(slot);
  }

  return <main className="booking-page"><div className="booking-wrap">
    <header className="booking-header"><div className="booking-header-icon"><CalendarDays size={32} /></div><h1>Mülakat Randevusu</h1><p>ECR Etkinlik Bilgisayar</p></header>
    <section className="booking-panel">
      {state === "loading" && <div className="booking-state"><div className="booking-spinner" /><p>Yükleniyor…</p></div>}
      {state === "error" && <div className="booking-state"><div className="booking-state-icon error"><CircleAlert size={28} /></div><h2>Hata</h2><p role="alert">{errorMsg}</p></div>}
      {state === "already_booked" && <div className="booking-state"><div className="booking-state-icon success"><Check size={28} /></div><h2>Randevunuz Mevcut</h2><p>Bu davet için zaten bir randevu seçtiniz.</p></div>}
      {state === "select" && <>
        <div className="booking-intro"><h2>Merhaba, <span>{invite?.candidateName}</span></h2><p>Aşağıdaki müsait gün ve saatlerden size uygun olanı seçiniz.</p></div>
        {!invite?.slots.length ? <div className="booking-empty">Şu an müsait randevu saati bulunmamaktadır. Lütfen daha sonra tekrar deneyiniz.</div> :
          <div className="booking-days">{[...groups.entries()].map(([key, slots]) => <div key={key}><h3>{dayLabel(slots[0].startAt)}</h3><div className="booking-times">{slots.map(slot => <button key={slot.id} type="button" className={selectedSlot?.id === slot.id ? "selected" : ""} onClick={() => setSelectedSlot(selectedSlot?.id === slot.id ? null : slot)}>{timeLabel(slot.startAt)}</button>)}</div></div>)}</div>}
        {selectedSlot && <div className="booking-selection"><div>Seçilen saat: <strong>{dateLabel(selectedSlot.startAt)}</strong></div><button type="button" onClick={() => setState("confirm")}>Bu Saati Onayla</button></div>}
      </>}
      {state === "confirm" && selectedSlot && <div className="booking-confirm"><h2>Randevuyu Onayla</h2><p>Bu saati onayladığınızda randevunuz kesinleşecektir.</p><div className="booking-confirm-details"><div><CalendarDays size={20} /><span><small>Tarih & Saat</small><strong>{dateLabel(selectedSlot.startAt)}</strong></span></div><div><UserRound size={20} /><span><small>Aday</small><strong>{invite?.candidateName}</strong></span></div></div><div className="booking-confirm-actions"><button type="button" onClick={() => setState("select")}>Geri Dön</button><button type="button" disabled={submitting} onClick={() => void confirmBooking()}>{submitting ? "Kaydediliyor…" : "Randevuyu Onayla"}</button></div></div>}
      {state === "done" && <div className="booking-state"><div className="booking-state-icon success"><Check size={32} /></div><h2>Randevunuz Onaylandı!</h2><p>{bookedAt ? dateLabel(bookedAt) : "Seçtiğiniz saat"}</p><div className="booking-done-note">Randevunuz başarıyla kaydedildi.</div></div>}
    </section>
    <footer className="booking-footer">ECR Etkinlik Bilgisayar · İnsan Kaynakları</footer>
  </div></main>;
}
