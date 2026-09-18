import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { candidateInviteApi, type CandidateAssessmentSession } from "../lib/api";
import { CandidateAssessment } from "./CandidateAssessment";

type Invite = Awaited<ReturnType<typeof candidateInviteApi.resolve>>;
type Stage = "loading" | "closed" | "verify" | "consent" | "rules" | "assessment" | "done";

export function InviteVerificationPage() {
  const { token = "" } = useParams();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [session, setSession] = useState<CandidateAssessmentSession | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  useEffect(() => {
    let active = true;
    candidateInviteApi.resolve(token).then(async result => {
      if (!active) return;
      setInvite(result);
      if (result.status === "COMPLETED") { setStage("done"); return; }
      if (result.closed) { setStage("closed"); return; }
      if (result.status === "IN_PROGRESS") {
        const resumed = await candidateInviteApi.start(token, { fullscreenAtStart: !!document.fullscreenElement, screen: { width: innerWidth, height: innerHeight } });
        if (active) { setSession(resumed); setStage("assessment"); }
        return;
      }
      setStage(!result.emailVerified ? "verify" : result.consents?.every(c => c.accepted) ? "rules" : "consent");
    }).catch(e => { if (active) { setError(e instanceof Error ? e.message : "Davet açılamadı."); setStage("closed"); } });
    return () => { active = false; };
  }, [token]);

  async function perform(action: () => Promise<unknown>, next?: Stage) {
    setBusy(true); setError(""); setInfo("");
    try { await action(); if (next) setStage(next); }
    catch (e) { setError(e instanceof Error ? e.message : "İşlem tamamlanamadı."); }
    finally { setBusy(false); }
  }

  if (stage === "assessment" && session) return <CandidateAssessment session={session} candidateName={invite?.candidateName || ""} onComplete={() => setStage("done")} />;
  return <main className="invite-page"><div className="invite-card">
    <div className="invite-brand"><img src="/ecr-logo.png" alt="ECR" /><span>ECR Etkinlik Bilgisayar</span></div>
    {stage !== "loading" && stage !== "closed" && stage !== "done" && <div className="invite-steps">E-posta doğrulama <span>›</span> Aydınlatma &amp; Onay <span>›</span> Kurallar <span>›</span> Değerlendirme</div>}
    {stage === "loading" && <p className="invite-message">Davet yükleniyor...</p>}
    {stage === "closed" && <div className="invite-message"><h1>Bağlantı kullanılamıyor</h1><p>Bu davet bağlantısının süresi dolmuş veya bağlantı geçersiz olabilir.</p></div>}
    {stage === "verify" && <><div className="invite-step">E-POSTA DOĞRULAMA</div><h1>Merhaba {invite?.candidateName}</h1><p className="invite-intro">Değerlendirmeye devam etmek için <strong>{invite?.candidateEmailMasked}</strong> adresine gönderilen doğrulama kodunu girin.</p><button className="invite-primary invite-main-button" disabled={busy} onClick={() => perform(async () => { const r = await candidateInviteApi.sendCode(token); setInfo(`Kod ${r.sentTo} adresine gönderildi.`); })}>Doğrulama Kodu Gönder</button><form className="invite-form" onSubmit={e => { e.preventDefault(); void perform(() => candidateInviteApi.verifyCode(token, code), "consent"); }}><label htmlFor="invite-code">Doğrulama kodu</label><input id="invite-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} maxLength={6} required /><button className="invite-primary" disabled={busy || code.length !== 6}>Doğrula ve Devam Et</button></form></>}
    {stage === "consent" && <><div className="invite-step">AYDINLATMA &amp; ONAY</div><h1>Aydınlatma &amp; Onay</h1><p className="invite-intro">Devam etmek için aşağıdaki metinleri okuyup her birini ayrı ayrı onaylayın.</p>{invite?.consents?.map(c => <div className="invite-consent" key={c.id}><details><summary>{c.title} <small>v{c.version}</small></summary><div className="invite-consent-body">{c.body}</div></details><label><input type="checkbox" checked={checked.includes(c.id) || c.accepted} disabled={c.accepted} onChange={e => setChecked(v => e.target.checked ? [...v, c.id] : v.filter(id => id !== c.id))} /> Okudum ve kabul ediyorum.</label></div>)}<button className="invite-primary invite-main-button" disabled={busy || !invite?.consents?.length || !invite.consents.every(c => c.accepted || checked.includes(c.id))} onClick={() => perform(() => candidateInviteApi.accept(token, invite!.consents!.map(c => c.id)), "rules")}>Devam Et</button></>}
    {stage === "rules" && <><div className="invite-step">KURALLAR</div><h1>Değerlendirme Kuralları</h1><p className="invite-intro">{invite?.templateName} · Yaklaşık {Math.ceil((invite?.durationSec || 0) / 60)} dakika</p><ul className="invite-rules"><li>Tam ekran zorunlu değildir; sekme veya pencere değişiklikleri oturumu kapatmaz.</li><li>Yanıtlarınız otomatik kaydedilir.</li><li>Soruların tek bir doğru cevabı yoktur; size en uygun yanıtı seçin.</li><li>Nihai karar insan kaynakları ekibine aittir; sistem yalnızca rapor oluşturur.</li></ul><label className="invite-check"><input type="checkbox" checked={rulesAccepted} onChange={e => setRulesAccepted(e.target.checked)} /> Kuralları okudum ve değerlendirmeye hazırım.</label><button className="invite-primary invite-main-button" disabled={busy || !rulesAccepted} onClick={() => perform(async () => { const s = await candidateInviteApi.start(token, { fullscreenAtStart: !!document.fullscreenElement, screen: { width: innerWidth, height: innerHeight } }); setSession(s); }, "assessment")}>Değerlendirmeyi Başlat</button></>}
    {stage === "done" && <div className="invite-message"><div className="invite-done-icon">✓</div><h1>Teşekkür ederiz, {invite?.candidateName}</h1><p>Değerlendirmeniz başarıyla tamamlandı. İnsan kaynakları ekibimiz raporunuzu inceleyecek ve süreç hakkında en kısa sürede sizinle iletişime geçecektir.</p><p>Bu bağlantı artık kullanılmamaktadır.</p></div>}
    {info && <p className="invite-info" role="status">{info}</p>}{error && <p className="invite-error" role="alert">{error}</p>}
  </div></main>;
}
