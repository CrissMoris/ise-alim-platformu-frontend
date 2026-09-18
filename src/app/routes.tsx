import { CandidatesPage } from "../pages/CandidatesPage";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { CandidateDetailPage } from "../pages/CandidateDetailPage";
import { CalendarPage } from "../pages/CalendarPage";
import { InvitesPage } from "../pages/InvitesPage";
import { EvaluationsPage } from "../pages/EvaluationsPage";
import { TechnicalSessionDetailPage } from "../pages/TechnicalSessionDetailPage";
import { AppointmentsPage } from "../pages/AppointmentsPage";
import { AppointmentBookingPage } from "../pages/AppointmentBookingPage";
import { InviteVerificationPage } from "../pages/InviteVerificationPage";
import { authToken, verifyAdmin } from "../lib/api";
import { NewCandidatePage } from "../pages/NewCandidatePage";

function AdminGate() {
  const location = useLocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    if (!authToken()) return;
    verifyAdmin().then(() => setAllowed(true)).catch(() => setAllowed(false));
  }, []);
  if (!authToken() || allowed === false) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (allowed === null) return <main className="auth-loading">Oturum doğrulanıyor…</main>;
  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/giris" element={<Navigate to="/login" replace />} />
      <Route path="/randevu/:token" element={<AppointmentBookingPage />} />
      <Route path="/invite/:token" element={<InviteVerificationPage />} />

      <Route element={<AdminGate />}>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />

        <Route path="/adaylar" element={<CandidatesPage />} />
        <Route path="/adaylar/yeni" element={<NewCandidatePage />} />
        <Route path="/adaylar/:id" element={<CandidateDetailPage />} />
        <Route path="/takvim" element={<CalendarPage />} />
        <Route path="/randevular" element={<AppointmentsPage />} />
        <Route path="/davetler" element={<InvitesPage />} />
        <Route path="/degerlendirmeler" element={<EvaluationsPage />} />
        <Route path="/degerlendirmeler/teknik/:id" element={<TechnicalSessionDetailPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Route>
    </Routes>
  );
}
