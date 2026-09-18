import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowRight, LockKeyhole, ShieldCheck, Users } from "lucide-react";
import { BrandLogo_white } from "../components/ui/BrandLogo";
import { loginAdmin } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await loginAdmin(email.trim(), password); navigate((location.state as { from?: string } | null)?.from || "/", { replace: true }); }
    catch (e) { setError(e instanceof Error ? e.message : "Giriş yapılamadı."); }
    finally { setBusy(false); }
  };
  return <main className="auth-page">
    <section className="auth-story"><div className="auth-story-content"><div className="auth-brand"><BrandLogo_white /><span>ECR İşe Alım</span></div><div className="auth-story-main"><p className="auth-kicker">İNSAN KAYNAKLARI PLATFORMU</p><h1>Doğru insanlarla, daha güçlü ekipler.</h1><p>Adayları, değerlendirmeleri ve mülakatları aynı çalışma alanında yönetin.</p><div className="auth-story-icons"><span><Users size={20} /> Aday yönetimi</span><span><ShieldCheck size={20} /> Güvenli erişim</span></div></div><small>© 2026 ECR · İnsan Kaynakları</small></div></section>
    <section className="auth-form-side"><div className="auth-form-wrap"><div className="auth-form-icon"><LockKeyhole size={24} /></div><p className="eyebrow">YÖNETİCİ GİRİŞİ</p><h2>Tekrar hoş geldiniz</h2><p>Çalışma alanına erişmek için yönetici hesabınızla giriş yapın.</p><form onSubmit={submit}><label htmlFor="login-email">E-posta adresi</label><input id="login-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="xxx@ecr.com.tr" /><label htmlFor="login-password">Şifre</label><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Şifrenizi girin" />{error && <div className="auth-error" role="alert">{error}</div>}<button className="button primary" type="submit" disabled={busy}>{busy ? "Giriş yapılıyor…" : "Giriş Yap"}<ArrowRight size={17} /></button></form></div></section>
  </main>;
}
