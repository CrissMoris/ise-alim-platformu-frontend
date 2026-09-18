import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, X } from "lucide-react";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { createTechnicalSession, getCandidates, getTechnicalQuestions, getTechnicalSessions } from "../lib/api";
import { applicationDate } from "../lib/recruitment";
import type { TechnicalQuestion, TechnicalSession } from "../lib/recruitment";

const statusLabels: Record<string, string> = {
  CREATED: "Oluşturuldu", IN_PROGRESS: "Devam ediyor", SUBMITTED: "Gönderildi",
  EVALUATED: "Değerlendirildi", ARCHIVED: "Arşivlendi",
};

export function EvaluationsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TechnicalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [candidates, setCandidates] = useState<Awaited<ReturnType<typeof getCandidates>>>([]);
  const [questions, setQuestions] = useState<TechnicalQuestion[]>([]);
  const [candidateId, setCandidateId] = useState("");
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  useEffect(() => {
    getTechnicalSessions().then(setSessions).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!newSessionOpen) return;
    let active = true;
    Promise.all([getCandidates(), getTechnicalQuestions()])
      .then(([candidateRows, questionRows]) => {
        if (!active) return;
        setCandidates(candidateRows);
        setQuestions(questionRows);
      })
      .catch(() => { if (active) setFormError("Adaylar veya teknik sorular alınamadı."); })
      .finally(() => { if (active) setFormLoading(false); });
    return () => { active = false; };
  }, [newSessionOpen]);

  const closeModal = () => {
    if (creating) return;
    setNewSessionOpen(false);
    setCandidateId("");
    setQuestionIds([]);
    setFormError("");
  };

  const openModal = () => {
    setFormLoading(true);
    setFormError("");
    setNewSessionOpen(true);
  };

  const createSession = async () => {
    if (!candidateId || questionIds.length !== 5 || creating) return;
    setCreating(true);
    setFormError("");
    try {
      const created = await createTechnicalSession({ candidateId, questionIds });
      navigate(`/degerlendirmeler/teknik/${created.id}`);
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Oturum oluşturulamadı.");
    } finally {
      setCreating(false);
    }
  };

  return <div className="record-page">
    <div className="page-heading"><div><p className="eyebrow">DEĞERLENDİRME SÜRECİ</p><h1>Değerlendirmeler</h1><p className="page-subtitle">Teknik görüşmeleri ve değerlendirme sonuçlarını izleyin.</p></div><button className="button primary" type="button" onClick={openModal}><Plus size={17} /> Yeni Oturum</button></div>
    <Card><div className="card-heading"><h2>Teknik görüşmeler <span className="count-pill">{sessions.length}</span></h2></div>
      {loading ? <p className="data-message">Değerlendirmeler yükleniyor…</p> : error ? <p className="data-message" role="alert">Değerlendirmeler alınamadı.</p> : sessions.length === 0 ?
        <EmptyState title="Değerlendirme bulunamadı" description="Henüz teknik görüşme kaydı yok." /> :
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Teknik görüşmeler tablosu"><table className="application-table"><thead><tr><th>Aday</th><th>Durum</th><th>Değerlendirme tarihi</th><th>Puan</th><th>İşlem</th></tr></thead><tbody>
          {sessions.map((session) => <tr key={session.id}>
            <td><Link className="text-button" to={`/adaylar/${session.candidateId}`}>{session.candidateName}</Link></td>
            <td><span className={`status-badge ${session.status === "EVALUATED" ? "is-success" : session.status === "ARCHIVED" ? "is-muted" : "is-progress"}`}>{statusLabels[session.status] || session.status}</span></td>
            <td>{session.evaluatedAt ? applicationDate(session.evaluatedAt) : "—"}</td>
<td>
  {session.reviewerOverallScore != null
    ? Number(session.reviewerOverallScore).toFixed(1)
    : session.overallScore != null
      ? Number(session.overallScore).toFixed(1)
      : "—"}
</td><td><Link className="button technical-open-button" to={`/degerlendirmeler/teknik/${session.id}`}>Aç</Link></td>          </tr>)}
        </tbody></table></div>}
    </Card>
    {newSessionOpen && <Modal title="Yeni Teknik Oturum" onClose={closeModal}>
      <div className="technical-create-form">
        {formLoading ? <p className="technical-muted">Adaylar ve sorular yükleniyor…</p> : <>
          <label className="field"><span>Aday</span><select value={candidateId} onChange={(event) => setCandidateId(event.target.value)} disabled={creating}><option value="">Aday seçin</option>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.email}</option>)}</select></label>
          <label className="field"><span>Teknik soru ekle · {questionIds.length}/5</span><select value="" disabled={creating || questionIds.length === 5} onChange={(event) => { const id = event.target.value; if (id && !questionIds.includes(id)) setQuestionIds((current) => [...current, id]); }}><option value="">Soru seçin</option>{questions.filter((question) => !questionIds.includes(question.id)).map((question) => <option key={question.id} value={question.id}>{question.title} · {question.language}</option>)}</select></label>
          <div className="technical-selected"><strong>Seçilen sorular</strong>{questionIds.length ? <ol>{questionIds.map((id) => { const question = questions.find((item) => item.id === id); return <li key={id}><span>{question?.title ?? id}<small>{question?.language}</small></span><button type="button" aria-label={`${question?.title ?? "Soruyu"} kaldır`} disabled={creating} onClick={() => setQuestionIds((current) => current.filter((item) => item !== id))}><X size={15} /></button></li>; })}</ol> : <p>Henüz soru seçilmedi.</p>}</div>
          {questions.length < 5 && <p className="technical-create-hint">Oturum oluşturmak için en az 5 aktif teknik soru gerekli.</p>}
        </>}
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <div className="modal-actions"><button className="button" type="button" onClick={closeModal} disabled={creating}>İptal</button><button className="button primary" type="button" disabled={formLoading || creating || !candidateId || questionIds.length !== 5} onClick={createSession}>{creating ? "Oluşturuluyor…" : "Oturumu Oluştur"}</button></div>
      </div>
    </Modal>}
  </div>;
}
