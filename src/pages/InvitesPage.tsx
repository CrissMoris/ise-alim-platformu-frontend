import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { getInvites, type Invite } from "../lib/api";
import { applicationDate } from "../lib/recruitment";

const statusLabels: Record<string, string> = {
  DRAFT: "Taslak", SENT: "Gönderildi", OPENED: "Açıldı",
  EMAIL_VERIFIED: "E-posta doğrulandı", CONSENT_ACCEPTED: "Onaylandı",
  IN_PROGRESS: "Devam ediyor", COMPLETED: "Tamamlandı",
  EXPIRED: "Süresi doldu", REVOKED: "İptal edildi", INVALIDATED_BY_POLICY: "Geçersiz",
};

export function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getInvites().then(setInvites).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  const filtered = status ? invites.filter((invite) => invite.status === status) : invites;
  return <div className="record-page">
    <div className="page-heading"><div><p className="eyebrow">DEĞERLENDİRME SÜRECİ</p><h1>Davetler</h1><p className="page-subtitle">Gönderilen davetlerin durumunu ve geçerlilik tarihlerini izleyin.</p></div></div>
    <Card>
      <div className="card-heading"><h2>Değerlendirme davetleri <span className="count-pill">{filtered.length}</span></h2>
        <label className="filter-select"><select aria-label="Duruma göre filtrele" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tüm durumlar</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
      </div>
      {loading ? <p className="data-message">Davetler yükleniyor…</p> : error ? <p className="data-message" role="alert">Davetler alınamadı.</p> : filtered.length === 0 ?
        <EmptyState title="Davet bulunamadı" description="Bu filtreyle eşleşen davet yok." /> :
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Davetler tablosu"><table className="application-table"><thead><tr><th>Aday</th><th>Pozisyon</th><th>Durum</th><th>Gönderim</th><th>Son geçerlilik</th><th>Tamamlanma</th></tr></thead><tbody>
          {filtered.map((invite) => <tr key={invite.id}>
            <td><Link className="text-button" to={`/adaylar/${invite.candidateId}`}>{invite.candidateName}</Link></td>
            <td>{invite.positionTitle || "—"}</td><td><span className={`status-badge ${invite.status === "COMPLETED" ? "is-success" : invite.status === "EXPIRED" || invite.status === "REVOKED" || invite.status === "INVALIDATED_BY_POLICY" ? "is-muted" : "is-progress"}`}>{statusLabels[invite.status] || invite.status}</span></td>
            <td>{invite.sentAt ? applicationDate(invite.sentAt) : "—"}</td>
            <td>{applicationDate(invite.expiresAt)}</td>
            <td>{invite.completedAt ? applicationDate(invite.completedAt) : "—"}</td>
          </tr>)}
        </tbody></table></div>}
    </Card>
  </div>;
}
