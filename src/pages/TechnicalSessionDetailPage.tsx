import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Play, Save, Send } from "lucide-react";
import {
  evaluateTechnicalSession,
  getTechnicalSession,
  startTechnicalSession,
  submitTechnicalSession,
} from "../lib/api";
import { applicationDate } from "../lib/recruitment";
import type { TechnicalSessionDetail, TechnicalSessionQuestion } from "../lib/recruitment";
import { Card } from "../components/ui/Card";

const statusLabels: Record<string, string> = {
  CREATED: "Oluşturuldu", IN_PROGRESS: "Devam ediyor", SUBMITTED: "Gönderildi",
  EVALUATED: "Değerlendirildi", ARCHIVED: "Arşivlendi",
};

type Draft = { code: string; explanation: string };
type ReviewDraft = { scores: Record<string, string>; comment: string };

type RubricItem = { key: string; label: string; weight: number | null };
function rubricItems(question: TechnicalSessionQuestion): RubricItem[] {
  if (!Array.isArray(question.rubric)) return [];
  return question.rubric.flatMap((value): RubricItem[] => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const item = value as Record<string, unknown>;
    if (typeof item.key !== "string") return [];
    return [{
      key: item.key,
      label: typeof item.label === "string" ? item.label : item.key.replace(/[_-]/g, " "),
      weight: typeof item.weight === "number" ? item.weight : null,
    }];
  });
}

export function TechnicalSessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState<TechnicalSessionDetail | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [reviews, setReviews] = useState<Record<string, ReviewDraft>>({});
  const [overall, setOverall] = useState("");
  const [reviewerNote, setReviewerNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getTechnicalSession(id).then((data) => {
      if (cancelled) return;
      setSession(data);
      setActiveQuestionId(data.questions[0]?.questionId ?? "");
      setOverall(data.reviewerOverallScore == null ? "" : String(data.reviewerOverallScore));
      setReviewerNote(data.reviewerNote ?? "");
      const nextDrafts: Record<string, Draft> = {};
      const nextReviews: Record<string, ReviewDraft> = {};
      for (const question of data.questions) {
        const latest = data.submissions.find((submission) => submission.questionId === question.questionId);
        nextDrafts[question.questionId] = {
          code: latest?.code ?? question.starterCode ?? "",
          explanation: latest?.explanation ?? "",
        };
        const scores: Record<string, string> = {};
        for (const score of data.rubricScores) {
          if (score.submissionId === latest?.id && score.reviewerOverride) scores[score.rubricKey] = String(score.score);
        }
        const comment = data.rubricScores.find((score) => score.submissionId === latest?.id && score.reviewerOverride)?.comment ?? "";
        nextReviews[question.questionId] = { scores, comment };
      }
      setDrafts(nextDrafts);
      setReviews(nextReviews);
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "Mülakat alınamadı.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const refresh = async () => {
    if (!id) return;
    const data = await getTechnicalSession(id);
    setSession(data);
    return data;
  };

  const runAction = async (action: () => Promise<string>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try { setNotice(await action()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "İşlem tamamlanamadı."); }
    finally { setBusy(false); }
  };

  const question = session?.questions.find((item) => item.questionId === activeQuestionId);
  const draft = question ? drafts[question.questionId] ?? { code: question.starterCode ?? "", explanation: "" } : null;
  const review = question ? reviews[question.questionId] ?? { scores: {}, comment: "" } : null;
  const latestSubmission = session?.submissions.find((item) => item.questionId === activeQuestionId);
  const results = latestSubmission ? session?.testResults.filter((item) => item.submissionId === latestSubmission.id) ?? [] : [];
  const canReview = session && ["IN_PROGRESS", "SUBMITTED", "EVALUATED"].includes(session.status);

  if (loading) return <p className="data-message">Teknik mülakat yükleniyor…</p>;
  if (!session) return <div className="record-page"><Link className="text-button" to="/degerlendirmeler">← Değerlendirmeler</Link><p className="data-message" role="alert">{error || "Teknik mülakat bulunamadı."}</p></div>;

  return <div className="technical-detail-page">
    <Link className="technical-back" to="/degerlendirmeler"><ArrowLeft size={16} /> Değerlendirmelere dön</Link>
    <div className="page-heading technical-heading">
      <div><p className="eyebrow">TEKNİK MÜLAKAT</p><h1>{session.candidateName}</h1><p className="page-subtitle">{session.positionTitle || "Pozisyon belirtilmedi"}</p></div>
      <span className="status-badge is-progress">{statusLabels[session.status] ?? session.status}</span>
    </div>
    <div className="technical-meta">
      <Card><span>Aday</span><strong><Link to={`/adaylar/${session.candidateId}`}>{session.candidateName}</Link></strong><small>{session.candidateEmail}</small>{session.candidatePhone && <small>{session.candidatePhone}</small>}</Card>
      <Card><span>Mülakatçı</span><strong>{session.interviewerName}</strong><small>{session.interviewerEmail}</small></Card>
      <Card><span>Oturum</span><strong>{statusLabels[session.status] ?? session.status}</strong><small>{session.scheduledAt ? `Planlandı: ${applicationDate(session.scheduledAt)}` : "Planlama tarihi yok"}</small></Card>
    </div>
    {error && <p className="data-message" role="alert">{error}</p>}
    {notice && <p className="data-message technical-success" role="status">{notice}</p>}
    {session.status === "CREATED" && <div className="technical-start"><button className="button primary" type="button" disabled={busy} onClick={() => runAction(async () => { await startTechnicalSession(session.id); await refresh(); return "Mülakat başlatıldı."; })}><Play size={16} /> {busy ? "Başlatılıyor…" : "Testi Başlat"}</button></div>}
    {session.status === "CREATED" ? <p className="data-message">Soruları açmak için önce testi başlatın.</p> : <div className="technical-workspace">
      <Card className="technical-question-nav"><h2>Sorular</h2>{session.questions.length ? session.questions.map((item, index) => <button key={item.questionId} type="button" className={activeQuestionId === item.questionId ? "active" : ""} onClick={() => setActiveQuestionId(item.questionId)}><span>{index + 1}</span>{item.title}</button>) : <p>Bu oturuma soru eklenmemiş.</p>}</Card>
      <div className="technical-main">
        {question && draft && review ? <>
          <Card className="technical-panel">
            <div className="technical-panel-heading"><div><p className="section-kicker">SORU {question.order + 1}</p><h2>{question.title}</h2></div><span className="technical-language">{question.language}</span></div>
            <p className="technical-problem">{question.problemStatement}</p>
            <div className="technical-contracts">
              {question.inputContract && <div><strong>Girdi</strong><p>{question.inputContract}</p></div>}
              {question.outputContract && <div><strong>Çıktı</strong><p>{question.outputContract}</p></div>}
              {question.constraints && <div><strong>Kısıtlar</strong><p>{question.constraints}</p></div>}
            </div>
            {question.starterCode && <div className="technical-starter"><strong>Başlangıç kodu</strong><pre>{question.starterCode}</pre></div>}
          </Card>
          <Card className="technical-panel">
            <div className="technical-panel-heading"><h2>Kod ve açıklama</h2></div>
            <label className="technical-field"><span>Kod · {question.language}</span><textarea className="technical-code" spellCheck={false} value={draft.code} disabled={session.status !== "IN_PROGRESS" || busy} onChange={(event) => setDrafts((current) => ({ ...current, [question.questionId]: { ...draft, code: event.target.value } }))} /></label>
            <label className="technical-field"><span>Açıklama</span><textarea rows={4} value={draft.explanation} disabled={session.status !== "IN_PROGRESS" || busy} onChange={(event) => setDrafts((current) => ({ ...current, [question.questionId]: { ...draft, explanation: event.target.value } }))} placeholder="Yaklaşımınızı ve önemli kararları açıklayın." /></label>
            <div className="technical-submit-row"><p>Bu backend’de otomatik test çalıştırıcısı yok. Gönderim kodu kaydeder; test sonucu üretmez.</p><button className="button primary" type="button" disabled={session.status !== "IN_PROGRESS" || busy || !draft.code.trim()} onClick={() => runAction(async () => { const result = await submitTechnicalSession(session.id, { questionId: question.questionId, language: question.language, code: draft.code, explanation: draft.explanation }); await refresh(); return result.message; })}><Send size={16} /> {busy ? "Gönderiliyor…" : "Çalıştır & Gönder"}</button></div>
          </Card>
          <Card className="technical-panel"><h2>Otomatik test sonucu</h2>{latestSubmission ? <><p className="technical-muted">Son gönderim: {applicationDate(latestSubmission.submittedAt)}</p>{results.length ? <div className="technical-results"><p>{latestSubmission.testsPassed ?? results.filter((item) => item.passed).length} / {latestSubmission.testsTotal ?? results.length} test geçti{latestSubmission.computedScore != null ? ` · Otomatik puan: ${latestSubmission.computedScore.toFixed(1)}` : ""}</p>{results.map((item) => <div key={item.id} className={item.passed ? "passed" : "failed"}><strong>Test {item.index + 1} · {item.passed ? "Geçti" : "Başarısız"}{item.hidden ? " · Gizli" : ""}</strong>{item.errorMessage && <span>{item.errorMessage}</span>}{!item.hidden && item.expected != null && <span>Beklenen: {item.expected}</span>}{!item.hidden && item.actual != null && <span>Çıktı: {item.actual}</span>}</div>)}</div> : <p className="technical-muted">Bu gönderim için otomatik test sonucu bulunmuyor.</p>}</> : <p className="technical-muted">Henüz kod gönderilmedi.</p>}</Card>
          <Card className="technical-panel"><h2>Soru bazlı reviewer rubric</h2>{rubricItems(question).length ? <div className="technical-rubric">{rubricItems(question).map((item) => <label key={item.key}><span>{item.label}{item.weight != null ? ` · ağırlık ${item.weight}` : ""}</span><input type="number" min="0" max="100" step="0.1" placeholder="0–100" value={review.scores[item.key] ?? ""} disabled={!canReview || !latestSubmission || busy} onChange={(event) => setReviews((current) => ({ ...current, [question.questionId]: { ...review, scores: { ...review.scores, [item.key]: event.target.value } } }))} /></label>)}</div> : <p className="technical-muted">Bu soru için rubric tanımlanmamış.</p>}<label className="technical-field"><span>Soru değerlendirme yorumu</span><textarea rows={3} value={review.comment} disabled={!canReview || !latestSubmission || busy} onChange={(event) => setReviews((current) => ({ ...current, [question.questionId]: { ...review, comment: event.target.value } }))} /></label></Card>
        </> : <Card className="technical-panel"><p>Bu oturuma soru eklenmemiş.</p></Card>}
      </div>
    </div>}
    <Card className="technical-panel technical-review"><h2>Reviewer değerlendirmesi</h2><div className="technical-review-grid"><label className="technical-field"><span>Genel puan (0–100)</span><input type="number" min="0" max="100" step="0.1" value={overall} disabled={!canReview || busy} onChange={(event) => setOverall(event.target.value)} /></label><label className="technical-field"><span>Reviewer notu</span><textarea rows={4} value={reviewerNote} disabled={!canReview || busy} onChange={(event) => setReviewerNote(event.target.value)} /></label></div><div className="technical-review-footer"><p>Otomatik genel skor ve güven düzeyi yalnızca mevcut test sonuçlarından gelir; bu ekranda hesaplanmaz.</p><button className="button primary" type="button" disabled={!canReview || busy} onClick={() => runAction(async () => {
      const numericOverall = overall.trim() === "" ? null : Number(overall);
      if (numericOverall != null && (!Number.isFinite(numericOverall) || numericOverall < 0 || numericOverall > 100)) throw new Error("Genel puan 0–100 arasında olmalı.");
      const rubric = session.questions.flatMap((item) => {
        const latest = session.submissions.find((submission) => submission.questionId === item.questionId);
        if (!latest) return [];
        const reviewDraft = reviews[item.questionId];
        if (!reviewDraft) return [];
        const scores = Object.fromEntries(Object.entries(reviewDraft.scores).filter(([, value]) => value.trim() !== "").map(([key, value]) => [key, Number(value)]));
        if (Object.values(scores).some((score) => !Number.isFinite(score) || score < 0 || score > 100)) throw new Error("Rubric puanları 0–100 arasında olmalı.");
        return Object.keys(scores).length ? [{ questionId: item.questionId, scores, comment: reviewDraft.comment }] : [];
      });
      if (rubric.length === 0) throw new Error("Kaydetmek için en az bir gönderilmiş soruya rubric puanı girin.");
      await evaluateTechnicalSession(session.id, { rubric, reviewerOverallScore: numericOverall, reviewerNote: reviewerNote.trim() || null });
      await refresh();
      return "Değerlendirme kaydedildi.";
    })}><Save size={16} /> {busy ? "Kaydediliyor…" : "Değerlendirmeyi Kaydet"}</button></div></Card>
  </div>;
}
