import { useOutletContext } from "react-router";
import { Users, ClipboardCheck, Video, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import type { RecruitmentContext } from "../../types/recruitment";
import { MetricCard } from "./MetricCard";
import { CandidateTable } from "./CandidateTable";
import { useEffect, useState } from "react";
import { getDashboardStats } from "../../lib/api";

export function DashboardPage() {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    inEvaluation: 0,
    inInterview: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    getDashboardStats()
      .then((data) => {
        setStats({
          totalCandidates: Number(data.totalCandidates),
          inEvaluation: Number(data.inEvaluation),
          inInterview: Number(data.inInterview),
        });
      })
      .catch(() => setStatsError(true))
      .finally(() => setStatsLoading(false));
  }, []);

  const { search, positions, candidates, dataLoading, dataError } =
    useOutletContext<RecruitmentContext>();

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">İŞE ALIM</p>
          <h1>Genel bakış</h1>
          <p className="page-subtitle">Adaylarınızı ve devam eden süreçleri tek yerden izleyin.</p>
        </div>
        <Link className="heading-action" to="/adaylar">Adayları görüntüle <ArrowUpRight size={18} /></Link>
      </div>

      {statsError && <p className="data-message" role="alert">İstatistikler alınamadı.</p>}
      <div className="metrics-grid">
      <MetricCard
        title="Toplam aday"
        value={statsLoading || statsError ? "—" : String(stats.totalCandidates)}
        icon={Users}
      />

      <MetricCard
        title="Değerlendirmede"
        value={statsLoading || statsError ? "—" : String(stats.inEvaluation)}
        icon={ClipboardCheck}
      />

      <MetricCard
        title="Mülakat aşamasında"
        value={statsLoading || statsError ? "—" : String(stats.inInterview)}
        icon={Video}
      />
      </div>

      {dataLoading ? <p className="data-message">Başvurular yükleniyor…</p> : dataError ? <p className="data-message" role="alert">Başvurular alınamadı.</p> : <CandidateTable
        title="Son Başvurular"
        candidates={candidates}
        positions={positions}
        search={search}
        compact
      />}
    </>
  );
}
