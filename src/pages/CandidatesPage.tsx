import { Link, useOutletContext } from "react-router";
import { CandidateTable } from "../features/dashboard/CandidateTable";
import type { RecruitmentContext } from "../types/recruitment";

export function CandidatesPage() {
  const { positions, search, candidates, dataLoading, dataError } =
    useOutletContext<RecruitmentContext>();

  
  return (
    <>
      <div className="page-heading">
  <div>
    <p className="eyebrow">ADAY YÖNETİMİ</p>
    <h1>Adaylar</h1>
    <p className="page-subtitle">
      Başvuruları arayın, filtreleyin ve aday profillerini inceleyin.
    </p>
  </div>

  <Link to="/adaylar/yeni" className="primary-button">
    + Aday Ekle
  </Link>
</div>

      {dataLoading ? <p className="data-message">Adaylar yükleniyor…</p> : dataError ? <p className="data-message" role="alert">Adaylar alınamadı. Backend bağlantısını kontrol edin.</p> : <CandidateTable
        title="Aday Başvuruları"
        candidates={candidates}
        positions={positions}
        search={search}
        showPositionFilter
      />}
    </>
  );
}
