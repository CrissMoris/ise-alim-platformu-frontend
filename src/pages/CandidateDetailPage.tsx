import { useParams, useNavigate, useOutletContext } from "react-router";
import { useEffect, useState, type ReactNode } from "react";
import { getCandidateById, updateCandidateScore, updateCandidate, appointmentsApi, rejectCandidate, sendEvaluationInvite } from "../lib/api";
import { Pencil, Plus, X } from "lucide-react";
import type { CandidateDetail } from "../lib/api";
import type { RecruitmentContext } from "../types/recruitment";
import {
  calculateAge,
  licenseLabel,
  militaryLabel,
} from "../lib/recruitment";

const dimensionLabels: Record<string, string> = {
  empathy: "Empati",
  fairness: "Adalet",
  team_fit: "Takım Uyumu",
  integrity: "Dürüstlük / Etik",
  ownership: "Sahiplenme",
  accountability: "Sorumluluk",
  learning_openness: "Öğrenmeye Açıklık",
  stress_consistency: "Stres Tutarlılığı",
  customer_sensitivity: "Müşteri Hassasiyeti",
  communication_kindness: "İletişim Nezaketi",
};

function percentage(value: number | null | undefined) {
  return value == null || !Number.isFinite(value)
    ? "—"
    : `${value.toFixed(1).replace(/\.0$/, "")}%`;
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("tr-TR");
}

function readableKey(key: string) {
  return key.replace(/([a-zğüşöçı])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (letter) => letter.toLocaleUpperCase("tr-TR"));
}

function structuredValue(value: unknown, depth = 0): ReactNode {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "—";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "—";
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try { return structuredValue(JSON.parse(trimmed) as unknown, depth); } catch { /* Düz metin olarak göster. */ }
    }
    return value;
  }
  if (depth > 6) return "—";
  if (Array.isArray(value)) {
    if (!value.length) return "—";
    return <div className="application-array">{value.map((item, index) => <div className="application-array-item" key={index}>{structuredValue(item, depth + 1)}</div>)}</div>;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== null && item !== "");
    if (!entries.length) return "—";
    return <dl className="application-object">{entries.map(([key, item]) => <div key={key}><dt>{readableKey(key)}</dt><dd>{structuredValue(item, depth + 1)}</dd></div>)}</dl>;
  }
  return "—";
}

function FormField({ label, value }: { label: string; value: unknown }) {
  return <div className="application-field"><dt>{label}</dt><dd>{structuredValue(value)}</dd></div>;
}

export function CandidateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { positions } =
    useOutletContext<RecruitmentContext>();

  const [candidate, setCandidate] = useState<CandidateDetail>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointmentBusy, setAppointmentBusy] = useState(false);
  const [appointmentLink, setAppointmentLink] = useState("");
  const [appointmentMessage, setAppointmentMessage] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectBusy, setRejectBusy] = useState(false);
  const [score, setScore] = useState("");
  const [scoreDraft, setScoreDraft] = useState("");
  const [editingScore, setEditingScore] = useState(false);
  const [scoreSaving, setScoreSaving] = useState(false);
  const [scoreMessage, setScoreMessage] = useState("");
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);

  const [personalSaving, setPersonalSaving] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);

  const [personalMessage, setPersonalMessage] = useState("");
  const [notesMessage, setNotesMessage] = useState("");

  const printApplicationForm = () => {
    const card = document.querySelector<HTMLElement>(".job-application-card");
    if (!card) return;

    document.body.classList.add("print-preparing");
    card.style.setProperty("--print-scale", "1");
    const pageHeightPx = (275 / 25.4) * 96; // A4 içerik yüksekliğinin altında güvenli pay
    const contentHeightPx = card.getBoundingClientRect().height;
    const scale = contentHeightPx > 0 ? Math.min(1, pageHeightPx / contentHeightPx) : 1;
    card.style.setProperty("--print-scale", String(scale));
    document.body.classList.remove("print-preparing");

    window.addEventListener("afterprint", () => card.style.removeProperty("--print-scale"), { once: true });
    window.print();
  };

  const [personalForm, setPersonalForm] = useState({
  name: "",
  email: "",
  phone: "",
  district: "",
  militaryStatus: "",
  hasDriverLicense: false,
  driverLicenseType: "",
  activelyDriving: false,
  field: "",
  totalWorkExperience: "",
  foreignLanguage: "",
});

const [notes, setNotes] = useState("");
  const position = positions.find(
  (item) => String(item.id) === String(candidate?.positionId),
);

const isRejected = candidate?.tags?.includes("Reddedildi");

  useEffect(() => {
    if (!id) return;

    getCandidateById(id)
 .then((data) => {
  setCandidate(data);
  setScore(data?.score != null ? String(data.score) : "");

  if (data) {
    setPersonalForm({
      name: data.name ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      district: data.district ?? "",
      militaryStatus: data.militaryStatus ?? "",
      hasDriverLicense: data.hasDriverLicense ?? false,
      driverLicenseType: data.driverLicenseType ?? "",
      activelyDriving: data.activelyDriving ?? false,
      field: data.field ?? "",
      totalWorkExperience: data.totalWorkExperience ?? "",
      foreignLanguage: data.foreignLanguage ?? "",
    });

    setNotes(data.notes ?? "");
  }
})
      .catch((err) => {
        console.error(err);
        setError("Aday bilgileri alınamadı.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleScoreSave = async (value: number) => {
  if (!id) return;

  try {
    setScoreSaving(true);
    setScoreMessage("");

    const updated = await updateCandidateScore(id, value);
    setScore(updated.score != null ? String(updated.score) : "");
    setEditingScore(false);

    setCandidate((current) =>
      current
        ? { ...current, score: updated.score }
        : current,
    );

    setScoreMessage("Skor kaydedildi.");
  } catch (err) {
    console.error(err);
    setScoreMessage("Skor kaydedilemedi.");
  } finally {
    setScoreSaving(false);
  }
};
const handlePersonalInfoSave = async () => {
  if (!id) return;

  try {
    setPersonalSaving(true);
    setPersonalMessage("");

    const updated = await updateCandidate(id, {
      fullName: personalForm.name,
      email: personalForm.email,
      phone: personalForm.phone || null,
      district: personalForm.district || null,
      militaryStatus: personalForm.militaryStatus || null,
      hasDriverLicense: personalForm.hasDriverLicense,
      driverLicenseType: personalForm.hasDriverLicense
        ? personalForm.driverLicenseType || null
        : null,
      activelyDriving: personalForm.activelyDriving,
      field: personalForm.field || null,
      totalWorkExperience:
        personalForm.totalWorkExperience || null,
      foreignLanguage: personalForm.foreignLanguage || null,
    });

    setCandidate((current) =>
      current
        ? {
            ...current,
            name: updated.fullName ?? personalForm.name,
            email: updated.email ?? personalForm.email,
            phone: updated.phone ?? null,
            district: updated.district ?? null,
            militaryStatus: updated.militaryStatus ?? null,
            hasDriverLicense: updated.hasDriverLicense ?? false,
            driverLicenseType: updated.driverLicenseType ?? null,
            activelyDriving: updated.activelyDriving ?? false,
            field: updated.field ?? null,
            totalWorkExperience:
              updated.totalWorkExperience ?? null,
            foreignLanguage: updated.foreignLanguage ?? null,
          }
        : current,
    );

    setEditingPersonalInfo(false);
    setPersonalMessage("Bilgiler kaydedildi.");
  } catch (err) {
    console.error(err);
    setPersonalMessage("Bilgiler kaydedilemedi.");
  } finally {
    setPersonalSaving(false);
  }
};
const handleNotesSave = async () => {
  if (!id) return;

  try {
    setNotesSaving(true);
    setNotesMessage("");

    const updated = await updateCandidate(id, {
      notes: notes.trim() || null,
    });

    setCandidate((current) =>
      current
        ? {
            ...current,
            notes: updated.notes ?? null,
          }
        : current,
    );

    setNotes(updated.notes ?? "");
    setEditingNotes(false);
    setNotesMessage("İK notu kaydedildi.");
  } catch (err) {
    console.error(err);
    setNotesMessage("İK notu kaydedilemedi.");
  } finally {
    setNotesSaving(false);
  }
};

  if (loading) {
    return (
      <div className="candidate-detail-page">
        <button
          type="button"
          className="candidate-back-button"
          onClick={() => navigate("/adaylar")}
        >
          ← Adaylara Dön
        </button>

        <div className="candidate-detail-card">
          Aday bilgileri yükleniyor...
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="candidate-detail-page">
        <button
          type="button"
          className="candidate-back-button"
          onClick={() => navigate("/adaylar")}
        >
          ← Adaylara Dön
        </button>

        <div className="candidate-detail-card">
          {error || "Aday bulunamadı."}
        </div>
      </div>
    );
  }
  const completedInvite = candidate.invites?.find(
  (invite) => invite.status === "COMPLETED",
);

const bookedAppointment = candidate.appointmentInvites?.find(
  (invite) => invite.status === "BOOKED",
);

const evaluatedTechnicalSession = candidate.technicalSessions?.find(
  (session) => session.status === "EVALUATED",
);

  return (
    <div className="candidate-detail-page">
      <button
        type="button"
        className="candidate-back-button"
        onClick={() => navigate("/adaylar")}
      >
        ← Adaylara Dön
      </button>

      <div className="candidate-detail-header">
        <div>
            <h1>{candidate.name}</h1>
            <p>{position?.title || "Pozisyon belirtilmemiş"}</p>
        </div>
        <div className="candidate-appointment-action">
          <div className="candidate-action-buttons">
          <button type="button" className="button" disabled={appointmentBusy || bookedAppointment != null || isRejected} onClick={async () => {
            setAppointmentBusy(true); setAppointmentMessage("");
            try {
              const result = await appointmentsApi.invite(candidate.id);
              if (!result.mail.sent) {
                  setAppointmentLink(`${window.location.origin}/randevu/${result.token}`);
                }
              setAppointmentMessage(result.mail.sent
                ? "Randevu daveti oluşturuldu ve e-posta adaya gönderildi."
                : result.reused
                  ? "Mevcut randevu daveti kullanıldı; tekrar e-posta gönderilmedi."
                  : `Randevu daveti oluşturuldu, ancak e-posta gönderilemedi: ${result.mail.error ?? "Mail yapılandırmasını kontrol edin."} Bağlantıyı adaya iletebilirsiniz.`);
              const updated = await getCandidateById(candidate.id);
              setCandidate(updated);
            } catch (e) { setAppointmentMessage(e instanceof Error ? e.message : "Davet oluşturulamadı."); }
            finally { setAppointmentBusy(false); }
          }}>{appointmentBusy ? "Oluşturuluyor…" : "Mülakata Çağır"}</button>
          <button type="button" className="button candidate-secondary-action" disabled={inviteBusy} onClick={async () => {
            setInviteBusy(true); setInviteMessage("");
            try {
              const result = await sendEvaluationInvite(candidate.id);
              setInviteMessage(result.reused
                ? "Mevcut değerlendirme daveti kullanıldı; tekrar e-posta gönderilmedi."
                : result.mail.sent
                  ? "Değerlendirme daveti oluşturuldu ve e-posta adaya gönderildi."
                  : `Değerlendirme e-postası gönderilemedi: ${result.mail.error ?? "Mail yapılandırmasını kontrol edin."} Tekrar deneyebilirsiniz.`);
              setCandidate(await getCandidateById(candidate.id));
            } catch (e) { setInviteMessage(e instanceof Error ? e.message : "Değerlendirme daveti oluşturulamadı."); }
            finally { setInviteBusy(false); }
          }}>{inviteBusy ? "Gönderiliyor…" : "Davet Gönder"}</button>
          <button type="button" className="button candidate-reject-action" disabled={isRejected || rejectBusy} onClick={() => setRejectOpen(true)}>{isRejected ? "Reddedildi" : "Reddet"}</button>
          </div>
          {rejectOpen && <div className="candidate-confirm" role="dialog" aria-modal="true" aria-label="Adayı reddet"><p>Bu adayı reddetmek istediğinize emin misiniz?</p><div><button type="button" disabled={rejectBusy} onClick={() => setRejectOpen(false)}>İptal</button><button type="button" disabled={rejectBusy} onClick={async () => { setRejectBusy(true); try { const result = await rejectCandidate(candidate.id); setCandidate(current => current ? { ...current, tags: result.tags } : current); window.dispatchEvent(new Event("candidates-updated")); setRejectOpen(false); setAppointmentMessage(result.mail.sent ? "Aday reddedildi ve bilgilendirme e-postası gönderildi." : `Aday reddedildi, ancak bilgilendirme e-postası gönderilemedi: ${result.mail.error ?? "Tekrar e-posta gönderilmedi."}`); } catch (e) { setAppointmentMessage(e instanceof Error ? e.message : "Aday reddedilemedi."); } finally { setRejectBusy(false); } }}>{rejectBusy ? "Kaydediliyor…" : "Reddet"}</button></div></div>}
          {appointmentMessage && <small role="status">{appointmentMessage}</small>}
          {inviteMessage && <small role="status">{inviteMessage}</small>}
          {(appointmentLink || candidate.appointmentInvites?.find(invite => invite.status === "PENDING" && invite.token && (!invite.expiresAt || new Date(invite.expiresAt) > new Date()))?.token) && <input aria-label="Aday randevu bağlantısı" readOnly value={appointmentLink || `${window.location.origin}/randevu/${candidate.appointmentInvites?.find(invite => invite.status === "PENDING" && invite.token && (!invite.expiresAt || new Date(invite.expiresAt) > new Date()))?.token}`} onFocus={e => e.target.select()} />}
        </div>
        </div>

      <div className="candidate-detail-layout">
        <div className="candidate-detail-main">
          {/* KİŞİSEL BİLGİLER */}
          <section className="candidate-detail-card">
  <div className="candidate-section-header">
    <h2>Kişisel Bilgiler</h2>

    {!editingPersonalInfo && (
      <button
        type="button"
        className="candidate-icon-button"
        onClick={() => {
          setPersonalForm({
            name: candidate.name ?? "",
            email: candidate.email ?? "",
            phone: candidate.phone ?? "",
            district: candidate.district ?? "",
            militaryStatus: candidate.militaryStatus ?? "",
            hasDriverLicense: candidate.hasDriverLicense ?? false,
            driverLicenseType: candidate.driverLicenseType ?? "",
            activelyDriving: candidate.activelyDriving ?? false,
            field: candidate.field ?? "",
            totalWorkExperience:
              candidate.totalWorkExperience ?? "",
            foreignLanguage: candidate.foreignLanguage ?? "",
          });

          setPersonalMessage("");
          setEditingPersonalInfo(true);
        }}
        aria-label="Kişisel bilgileri düzenle"
      >
        <Pencil size={16} />
      </button>
    )}

    {editingPersonalInfo && (
      <button
        type="button"
        className="candidate-icon-button"
        onClick={() => {
          setEditingPersonalInfo(false);
          setPersonalMessage("");
        }}
        aria-label="Düzenlemeyi iptal et"
      >
        <X size={16} />
      </button>
    )}
  </div>

  {!editingPersonalInfo ? (
    <div className="candidate-info-grid">
      <div>
        <span>Ad Soyad</span>
        <strong>{candidate.name || "Belirtilmedi"}</strong>
      </div>

      <div>
        <span>Yaş</span>
        <strong>
          {calculateAge(candidate.birthDate) ?? "Belirtilmedi"}
        </strong>
      </div>

      <div>
        <span>E-posta</span>
        <strong>{candidate.email || "Belirtilmedi"}</strong>
      </div>

      <div>
        <span>Telefon</span>
        <strong>{candidate.phone || "Belirtilmedi"}</strong>
      </div>

      <div>
        <span>İlçe</span>
        <strong>{candidate.district || "Belirtilmedi"}</strong>
      </div>

      <div>
        <span>Askerlik</span>
        <strong>
          {militaryLabel(candidate.militaryStatus)}
        </strong>
      </div>

      <div>
        <span>Ehliyet</span>
        <strong>
          {licenseLabel(
            candidate.hasDriverLicense,
            candidate.driverLicenseType,
          )}
        </strong>
      </div>

      <div>
        <span>Aktif Kullanım</span>
        <strong>
          {candidate.activelyDriving === true
            ? "Evet"
            : candidate.activelyDriving === false
              ? "Hayır"
              : "Belirtilmedi"}
        </strong>
      </div>

      <div>
        <span>Bölüm / Alan</span>
        <strong>{candidate.field || "Belirtilmedi"}</strong>
      </div>

      <div>
        <span>Toplam Tecrübe</span>
        <strong>
          {candidate.totalWorkExperience || "Belirtilmedi"}
        </strong>
      </div>

      <div>
        <span>Yabancı Dil</span>
        <strong>
          {candidate.foreignLanguage || "Belirtilmedi"}
        </strong>
      </div>

      <div>
        <span>Başvuru Tarihi</span>
        <strong>
          {candidate.createdAt
            ? new Date(candidate.createdAt).toLocaleDateString(
                "tr-TR",
              )
            : "Belirtilmedi"}
        </strong>
      </div>
    </div>
  ) : (
    <div className="candidate-edit-layout">
      <div className="candidate-edit-intro"><strong>Aday bilgilerini düzenle</strong><span>İletişim ve yetkinlik bilgilerini güncel tutun.</span></div>
      <div className="candidate-edit-grid">
      <div className="candidate-edit-section-title"><strong>İletişim bilgileri</strong><span>Ad ve ulaşım bilgileri</span></div>
      <label>
        <span>Ad Soyad</span>
        <input
          value={personalForm.name}
          onChange={(e) =>
            setPersonalForm({
              ...personalForm,
              name: e.target.value,
            })
          }
        />
      </label>

      <label>
        <span>E-posta</span>
        <input
          type="email"
          value={personalForm.email}
          onChange={(e) =>
            setPersonalForm({
              ...personalForm,
              email: e.target.value,
            })
          }
        />
      </label>

      <label>
        <span>Telefon</span>
        <input
          value={personalForm.phone}
          onChange={(e) =>
            setPersonalForm({
              ...personalForm,
              phone: e.target.value,
            })
          }
        />
      </label>

      <label>
        <span>İlçe</span>
        <input
          value={personalForm.district}
          onChange={(e) =>
            setPersonalForm({
              ...personalForm,
              district: e.target.value,
            })
          }
        />
      </label>

      <div className="candidate-edit-section-title"><strong>Uygunluk ve yetkinlikler</strong><span>Çalışma ve deneyim bilgileri</span></div>
      <label>
        <span>Askerlik</span>
        <select
          value={personalForm.militaryStatus}
          onChange={(e) =>
            setPersonalForm({
              ...personalForm,
              militaryStatus: e.target.value,
            })
          }
        >
          <option value="">Belirtilmedi</option>
          <option value="yapildi">Yapıldı</option>
          <option value="yapilmadi">Yapılmadı</option>
          <option value="tecilli">Tecilli</option>
          <option value="muaf">Muaf</option>
        </select>
      </label>

      <label>
        <span>Ehliyet</span>
        <select
          value={
            personalForm.hasDriverLicense
              ? personalForm.driverLicenseType || ""
              : ""
          }
          onChange={(e) =>
            setPersonalForm({
              ...personalForm,
              hasDriverLicense: e.target.value !== "",
              driverLicenseType: e.target.value,
            })
          }
        >
          <option value="">Yok</option>
          <option value="B">B</option>
          <option value="A">A</option>
          <option value="A2">A2</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="E">E</option>
        </select>
      </label>

      <label>
        <span>Aktif Kullanım</span>
        <select
          value={
            personalForm.activelyDriving ? "true" : "false"
          }
          onChange={(e) =>
            setPersonalForm({
              ...personalForm,
              activelyDriving: e.target.value === "true",
            })
          }
        >
          <option value="true">Evet</option>
          <option value="false">Hayır</option>
        </select>
      </label>

      <label className="candidate-edit-wide">
        <span>Bölüm / Alan</span>
        <input
          value={personalForm.field}
          onChange={(e) =>
            setPersonalForm({
              ...personalForm,
              field: e.target.value,
            })
          }
        />
      </label>

      <label>
        <span>Toplam Tecrübe</span>
        <input
          value={personalForm.totalWorkExperience}
          onChange={(e) =>
            setPersonalForm({
              ...personalForm,
              totalWorkExperience: e.target.value,
            })
          }
        />
      </label>

      <label className="candidate-edit-wide">
        <span>Yabancı Dil</span>
        <input
          value={personalForm.foreignLanguage}
          onChange={(e) =>
            setPersonalForm({
              ...personalForm,
              foreignLanguage: e.target.value,
            })
          }
        />
      </label>

      </div>
      <div className="candidate-edit-actions candidate-edit-footer">
        <button
          type="button"
          className="candidate-secondary-button"
          onClick={() => setEditingPersonalInfo(false)}
          disabled={personalSaving}
        >
          İptal
        </button>

        <button
          type="button"
          className="candidate-primary-button"
          onClick={handlePersonalInfoSave}
          disabled={personalSaving}
        >
          {personalSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </button>
      </div>
    </div>
  )}

  {personalMessage && (
    <p className="candidate-score-message">
      {personalMessage}
    </p>
  )}
</section>

          {/* ÖN YAZI */}
          <section className="candidate-detail-card">
            <h2>Ön Yazı</h2>

            <div className="candidate-text-content">
              {candidate.coverLetter || "Ön yazı bulunmuyor."}
            </div>
          </section>

          {/* İK NOTLARI */}
          <section className="candidate-detail-card">
  <div className="candidate-section-header">
    <h2>İK Notları</h2>

    {!editingNotes && (
      <button
        type="button"
        className="candidate-icon-button"
        onClick={() => {
          setNotes(candidate.notes ?? "");
          setNotesMessage("");
          setEditingNotes(true);
        }}
        aria-label={
          candidate.notes
            ? "İK notunu düzenle"
            : "İK notu ekle"
        }
      >
        {candidate.notes ? (
          <Pencil size={16} />
        ) : (
          <Plus size={17} />
        )}
      </button>
    )}

    {editingNotes && (
      <button
        type="button"
        className="candidate-icon-button"
        onClick={() => {
          setEditingNotes(false);
          setNotes(candidate.notes ?? "");
          setNotesMessage("");
        }}
        aria-label="İK notu düzenlemeyi iptal et"
      >
        <X size={16} />
      </button>
    )}
  </div>

  {!editingNotes ? (
    <div className="candidate-text-content">
      {candidate.notes || "Henüz İK notu eklenmemiş."}
    </div>
  ) : (
    <div className="candidate-notes-edit">
      <div className="candidate-notes-heading"><label className="candidate-notes-label" htmlFor="hr-note">İK değerlendirme notu</label><span>Görüşme ve değerlendirme gözlemlerinizi yazın.</span></div>
      <textarea
        id="hr-note"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Adayla ilgili görüşlerinizi ve sonraki adımları yazın..."
        rows={7}
      />

      <div className="candidate-edit-actions">
        <button
          type="button"
          className="candidate-secondary-button"
          onClick={() => {
            setEditingNotes(false);
            setNotes(candidate.notes ?? "");
          }}
          disabled={notesSaving}
        >
          İptal
        </button>

        <button
          type="button"
          className="candidate-primary-button"
          onClick={handleNotesSave}
          disabled={notesSaving}
        >
          {notesSaving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  )}

  {notesMessage && (
    <p className="candidate-score-message">
      {notesMessage}
    </p>
  )}
</section>

          <section className="candidate-detail-card candidate-evaluation-card">
            <h2>Değerlendirme Sonuçları</h2>
            {candidate.evaluation ? (
              <div className="evaluation-content">
                {candidate.evaluation.overallSummary && (
                  <p className="evaluation-summary">{candidate.evaluation.overallSummary}</p>
                )}
                <div className="evaluation-consistency">
                  <span>Tutarlılık skoru</span>
                  <strong>{percentage(candidate.evaluation.consistencyScore)}</strong>
                </div>
                {candidate.evaluation.dimensions?.length ? (
                  <div className="evaluation-dimensions">
                    {candidate.evaluation.dimensions.map((item, index) => (
                      <div className="evaluation-dimension" key={`${item.dimension}-${index}`}>
                        <div className="evaluation-dimension-top">
                          <strong>{dimensionLabels[item.dimension] ?? item.dimension}</strong>
                          <span>{percentage(item.score)}</span>
                        </div>
                        {Number.isFinite(item.score) && <div className="evaluation-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }} /></div>}
                        {item.observation && <p>{item.observation}</p>}
                      </div>
                    ))}
                  </div>
                ) : <p className="candidate-form-empty">Boyut sonucu bulunmuyor.</p>}
              </div>
            ) : <p className="candidate-form-empty">Bu aday için değerlendirme sonucu bulunmuyor.</p>}
          </section>
        </div>
        
{/* SAĞ TARAF */}
<aside className="candidate-detail-sidebar">

  {/* CV */}
  <section className="candidate-detail-card candidate-cv-card">
    <div className="candidate-section-header">
      <h2>CV</h2>
    </div>

    {candidate.cvUrl ? (
      <a
        className="candidate-secondary-button"
        href={candidate.cvUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        CV'yi Yeni Sekmede Aç
      </a>
    ) : (
      <p className="muted">CV eklenmemiş.</p>
    )}
  </section>

  {/* SKOR */}
  <section className="candidate-detail-card candidate-score-card">
    <div className="candidate-section-header">
      <h2>Aday Skoru</h2>

      {!editingScore && (
        <button
          type="button"
          className="candidate-icon-button"
          aria-label="Aday skorunu düzenle"
          onClick={() => {
            setScoreDraft(score);
            setScoreMessage("");
            setEditingScore(true);
          }}
        >
          <Pencil size={16} />
        </button>
      )}
    </div>

    <div className="candidate-score-selector">
      <div className="candidate-score-top">
        <span className="candidate-score-label">
          Genel değerlendirme puanı
        </span>

        <div className="candidate-score-value">
          <strong>{score !== "" ? score : "—"}</strong>
          <span>/ 5</span>
        </div>
      </div>

      {editingScore && (
        <div className="candidate-score-editor">
          <div className="candidate-score-editor-heading"><div><strong>Puanı güncelle</strong><span>Adayın genel değerlendirme puanını seçin.</span></div><strong className="candidate-score-preview">{scoreDraft === "" ? "—" : scoreDraft}<small> / 5</small></strong></div>

          <div className="candidate-score-options">
            {[0, 1, 2, 3, 4, 5].map((value) => {
              const selected = scoreDraft === String(value);

              return (
                <button
                  key={value}
                  type="button"
                  className={`candidate-score-option ${
                    selected ? "selected" : ""
                  }`}
                  onClick={() => setScoreDraft(String(value))}
                  disabled={scoreSaving}
                  aria-label={`${value} üzerinden skor`}
                >
                  {value}
                </button>
              );
            })}
          </div>

          <div className="candidate-edit-actions">
            <button
              type="button"
              className="candidate-secondary-button"
              disabled={scoreSaving}
              onClick={() => {
                setEditingScore(false);
                setScoreDraft(score);
              }}
            >
              İptal
            </button>

            <button
              type="button"
              className="candidate-primary-button"
              disabled={
                scoreSaving ||
                scoreDraft === "" ||
                scoreDraft === score
              }
              onClick={() =>
                void handleScoreSave(Number(scoreDraft))
              }
            >
              {scoreSaving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </div>
      )}

      {scoreMessage && (
        <p className="candidate-score-message">
          {scoreMessage}
        </p>
      )}
    </div>
  </section>

  {/* ADAY SÜRECİ */}
  <section className="candidate-detail-card candidate-process-card">
  <h2>Aday Süreci</h2>

  <div className="candidate-timeline">

    <div className="candidate-timeline-item active">
      <span className="timeline-dot" />
      <div>
        <strong>Başvuru alındı</strong>
        <span>
          {candidate.createdAt
            ? new Date(candidate.createdAt).toLocaleDateString("tr-TR")
            : "Tarih belirtilmedi"}
        </span>
      </div>
    </div>

    <div
      className={`candidate-timeline-item ${
        completedInvite ? "active" : ""
      }`}
    >
      <span className="timeline-dot" />
      <div>
        <strong>Değerlendirme</strong>
        <span>
          {completedInvite?.completedAt
            ? `Tamamlandı — ${new Date(
                completedInvite.completedAt,
              ).toLocaleDateString("tr-TR")}`
            : "Henüz tamamlanmadı"}
        </span>
      </div>
    </div>

    <div
      className={`candidate-timeline-item ${
        bookedAppointment ? "active" : ""
      }`}
    >
      <span className="timeline-dot" />
      <div>
        <strong>Mülakat</strong>
        <span>
          {candidate.appointmentBookings?.[0]?.startAt
            ? `Randevu — ${new Date(
                candidate.appointmentBookings[0].startAt,
              ).toLocaleDateString("tr-TR")}`
            : "Henüz planlanmadı"}
        </span>
      </div>
    </div>

    <div
      className={`candidate-timeline-item ${
        evaluatedTechnicalSession ? "active" : ""
      }`}
    >
      <span className="timeline-dot" />
      <div>
        <strong>Teknik görüşme</strong>
        <span>
          {evaluatedTechnicalSession?.evaluatedAt
            ? `Değerlendirildi — ${new Date(
                evaluatedTechnicalSession.evaluatedAt,
              ).toLocaleDateString("tr-TR")}`
            : "Henüz gerçekleşmedi"}
        </span>
      </div>
    </div>

    <div
      className={`candidate-timeline-item ${
        isRejected ? "active" : ""
      }`}
    >
      <span className="timeline-dot" />
      <div>
        <strong>Sonuç</strong>
        <span>
          {isRejected
            ? "Reddedildi"
            : "Henüz sonuçlandırılmadı"}
        </span>
      </div>
    </div>

  </div>
</section>

</aside>
      </div>

      <section className="candidate-detail-card job-application-card" aria-labelledby="job-application-title">
        <div className="candidate-section-header job-application-header">
          <div><h2 id="job-application-title">İş Başvuru Formu</h2><p className="job-application-print-name">{candidate.name}</p></div>
          <button type="button" className="candidate-secondary-button job-application-print" onClick={printApplicationForm} disabled={!candidate.jobApplicationForm}>Yazdır</button>
        </div>
        {candidate.jobApplicationForm ? (() => {
          const form = candidate.jobApplicationForm;
          return <div className="job-application-sections">
            <section className="job-application-section job-application-personal"><h3>Kişisel Bilgiler</h3><dl className="job-application-grid">
              <FormField label="Cinsiyet" value={form.cinsiyet} />
              <FormField label="Doğum Yeri / Tarihi" value={form.dogumYeriTarihi} />
              <div className="application-wide"><FormField label="İkametgah Adresi" value={form.ikametgahAdresi} /></div>
              <FormField label="Askerlik Durumu" value={form.askerlikDurumu} />
              <FormField label="Medeni Durum" value={form.medeniDurum} />
              <FormField label="Çocuk Sayısı" value={form.cocukSayisi} />
              <FormField label="Sigara Kullanımı" value={form.sigaraKullaniyor} />
              <FormField label="Sürücü Belgesi" value={form.suruculBelgesi} />
              <FormField label="Diğer Açıklama" value={form.suruculBelgesiDiger} />
            </dl></section>
            <section className="job-application-section"><h3>Eğitim</h3><div className="job-application-structured">{structuredValue(form.egitim)}</div></section>
            <section className="job-application-section"><h3>Yabancı Diller</h3><div className="job-application-structured">{structuredValue(form.yabanciDiller)}</div></section>
            <section className="job-application-section"><h3>İş Tecrübesi</h3><div className="job-application-structured">{structuredValue(form.isTecrubesi)}</div></section>
            <section className="job-application-section"><h3>Referanslar</h3><div className="job-application-structured">{structuredValue(form.referanslar)}</div></section>
            <section className="job-application-section"><h3>Sağlık / Adli Durum</h3><dl className="job-application-grid">
              <FormField label="Sağlık Problemi" value={form.saglikProblem} />
              <FormField label="Sağlık Açıklaması" value={form.saglikProblemAciklama} />
              <FormField label="Mahkumiyet Durumu" value={form.mahkumiyetDurumu} />
              <FormField label="Mahkumiyet Açıklaması" value={form.mahkumiyetAciklama} />
            </dl></section>
            <section className="job-application-section"><h3>Acil İletişim</h3><dl className="job-application-grid">
              <FormField label="Ad Soyad" value={form.acilIletisimAdSoyad} />
              <FormField label="Yakınlığı" value={form.acilIletisimYakinligi} />
              <FormField label="Telefon" value={form.acilIletisimTelefon} />
            </dl></section>
            <section className="job-application-section"><h3>Başvuru Bilgileri</h3><dl className="job-application-grid">
              <FormField label="Net Ücret Beklentisi" value={form.netUcretBeklentisi} />
              <FormField label="İş Başlangıç Tarihi" value={dateLabel(form.isBaslangicTarihi)} />
              <FormField label="Başvurulan Pozisyon" value={form.basvurulanPozisyon} />
              <FormField label="Gönderilme Tarihi" value={dateLabel(form.submittedAt)} />
            </dl></section>
          </div>;
        })() : <p className="candidate-form-empty">Bu aday için iş başvuru formu bulunmuyor.</p>}
      </section>
    </div>
  );
}
