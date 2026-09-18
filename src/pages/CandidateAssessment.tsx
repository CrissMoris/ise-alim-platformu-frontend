import { useEffect, useMemo, useRef, useState } from "react";
import { candidateInviteApi, type CandidateAnswerValue, type CandidateAssessmentSession } from "../lib/api";

type Question = CandidateAssessmentSession["sections"][number]["questions"][number];
export function CandidateAssessment({ session, candidateName, onComplete }: { session: CandidateAssessmentSession; candidateName: string; onComplete: () => void }) {
  const questions = useMemo(() => session.sections.flatMap(section => section.questions), [session]);
  const [answers, setAnswers] = useState<Record<string, CandidateAnswerValue>>(session.alreadyAnswered || {});
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);
  const pending = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const values = useRef(answers);
  const question = questions[index];
  values.current = answers;

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, session.durationSec - Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [session]);
  useEffect(() => {
    const heartbeat = setInterval(() => { void candidateInviteApi.heartbeat(session.sessionId).catch(() => undefined); }, 12000);
    const report = (type: string) => { void candidateInviteApi.proctor(session.sessionId, { type, occurredAt: new Date().toISOString() }).catch(() => undefined); };
    const visibility = () => { if (document.hidden) report("TAB_HIDDEN"); };
    const blur = () => report("WINDOW_BLUR");
    const copy = () => report("COPY");
    const paste = () => report("PASTE");
    const context = () => report("CONTEXT_MENU");
    document.addEventListener("visibilitychange", visibility); window.addEventListener("blur", blur);
    document.addEventListener("copy", copy); document.addEventListener("paste", paste); document.addEventListener("contextmenu", context);
    return () => { clearInterval(heartbeat); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("blur", blur); document.removeEventListener("copy", copy); document.removeEventListener("paste", paste); document.removeEventListener("contextmenu", context); pending.current.forEach(clearTimeout); pending.current.clear(); };
  }, [session.sessionId]);

  function update(q: Question, value: CandidateAnswerValue) {
    setAnswers(current => ({ ...current, [q.id]: value }));
    const previous = pending.current.get(q.id);
    if (previous) clearTimeout(previous);
    pending.current.set(q.id, setTimeout(() => { pending.current.delete(q.id); void candidateInviteApi.answer(session.sessionId, q.id, value, 0).catch(e => setError(e instanceof Error ? e.message : "Yanıt kaydedilemedi.")); }, 350));
  }
  async function submit() {
    const missing = questions.find(q => ["LIKERT", "MULTIPLE_CHOICE", "SCENARIO_CHOICE"].includes(q.type) && !values.current[q.id]);
    if (missing) { setIndex(questions.indexOf(missing)); setError("Lütfen zorunlu soruyu yanıtlayın."); return; }
    setBusy(true); setError("");
    try {
      pending.current.forEach(clearTimeout); pending.current.clear();
      await Promise.all(Object.entries(values.current).map(([id, value]) => candidateInviteApi.answer(session.sessionId, id, value, 0)));
      await candidateInviteApi.submit(session.sessionId);
      onComplete();
    } catch (e) { setError(e instanceof Error ? e.message : "Değerlendirme tamamlanamadı."); }
    finally { setBusy(false); }
  }
  if (!question) return <main className="invite-page"><div className="invite-card"><p className="invite-error">Değerlendirme soruları bulunamadı.</p></div></main>;
  const answer = answers[question.id];
  return <main className="invite-page"><div className="invite-card invite-assessment"><div className="invite-brand"><img src="/ecr-logo.png" alt="ECR" /><span>ECR Etkinlik Bilgisayar</span></div><div className="invite-assessment-head"><div><div className="invite-step">DEĞERLENDİRME</div><h1>{candidateName}</h1></div><strong>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</strong></div><div className="invite-progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div><p className="invite-intro">Soru {index + 1} / {questions.length} · {session.sections.find(s => s.questions.some(q => q.id === question.id))?.title}</p><h2>{question.prompt}</h2>{question.helpText && <p className="invite-intro">{question.helpText}</p>}
    {question.type === "LIKERT" && <div className="invite-options">{(question.options.length ? question.options : [1,2,3,4,5].map(n => ({ id: String(n), label: String(n), value: String(n), order: n }))).map(o => <label key={o.id}><input type="radio" name={question.id} checked={answer?.type === "likert" && answer.value === Number(o.value)} onChange={() => update(question, { type: "likert", value: Number(o.value) })} />{o.label}</label>)}</div>}
    {(question.type === "MULTIPLE_CHOICE" || question.type === "SCENARIO_CHOICE") && <div className="invite-options">{question.options.map(o => <label key={o.id}><input type="radio" name={question.id} checked={answer?.type === "choice" && answer.value === o.value} onChange={() => update(question, { type: "choice", value: o.value })} />{o.label}</label>)}</div>}
    {question.type === "SHORT_TEXT" && <textarea className="invite-textarea" value={answer?.type === "text" ? answer.value : ""} onChange={e => update(question, { type: "text", value: e.target.value })} rows={6} placeholder="Yanıtınızı yazın" />}
    {question.type === "PRIORITY_RANK" && <RankOptions question={question} value={answer?.type === "rank" ? answer.value : question.options.map(o => o.value)} onChange={value => update(question, { type: "rank", value })} />}
    {error && <p className="invite-error" role="alert">{error}</p>}<div className="invite-nav"><button disabled={busy || index === 0} onClick={() => { setError(""); setIndex(index - 1); }}>Önceki</button>{index < questions.length - 1 ? <button className="invite-primary" disabled={busy} onClick={() => { setError(""); setIndex(index + 1); }}>Sonraki</button> : <button className="invite-primary" disabled={busy} onClick={() => void submit()}>{busy ? "Gönderiliyor..." : "Değerlendirmeyi Tamamla"}</button>}</div>
  </div></main>;
}

function RankOptions({ question, value, onChange }: { question: Question; value: string[]; onChange: (value: string[]) => void }) {
  return <div className="invite-options">{value.map((item, index) => <div className="invite-rank" key={item}><span>{index + 1}. {question.options.find(o => o.value === item)?.label || item}</span><span><button aria-label="Yukarı taşı" disabled={index === 0} onClick={() => { const next = [...value]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange(next); }}>↑</button><button aria-label="Aşağı taşı" disabled={index === value.length - 1} onClick={() => { const next = [...value]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; onChange(next); }}>↓</button></span></div>)}</div>;
}
