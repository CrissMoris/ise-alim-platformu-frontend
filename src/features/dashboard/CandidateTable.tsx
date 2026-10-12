import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, SlidersHorizontal, FileText, X } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { calculateAge, licenseLabel, militaryLabel, applicationSource } from "../../lib/recruitment";
import { resolveCvUrl } from "../../lib/api";
import type { Candidate, Position } from "../../types/recruitment";

const TABLE_STATE_KEY = "candidate-table-state";
type SortKey = "name" | "age" | "score" | "createdAt";
type StoredTableState = Partial<{
  position: string;
  militaryFilter: string;
  licenseFilter: string;
  minAge: string;
  maxAge: string;
  districtFilter: string;
  sortKey: SortKey | null;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
}>;
function readStoredState(): StoredTableState {
  try {
    return JSON.parse(sessionStorage.getItem(TABLE_STATE_KEY) ?? "{}") as StoredTableState;
  } catch {
    return {};
  }
}

export function CandidateTable({
  candidates, positions, search, title = "Son başvurular", showPositionFilter = false, compact = false, onClearSearch,
}: {
  candidates: Candidate[];
  positions: Position[];
  search: string;
  title?: string;
  showPositionFilter?: boolean;
  compact?: boolean;
  onClearSearch?: () => void;
}) {
  const [stored] = useState<StoredTableState>(() => (showPositionFilter ? readStoredState() : {}));
  const [position, setPosition] = useState(stored.position ?? "");
  const [militaryFilter, setMilitaryFilter] = useState(stored.militaryFilter ?? "Tümü");
  const [licenseFilter, setLicenseFilter] = useState(stored.licenseFilter ?? "Tümü");
  const [minAge, setMinAge] = useState(stored.minAge ?? "");
  const [maxAge, setMaxAge] = useState(stored.maxAge ?? "");
  const [districtFilter, setDistrictFilter] = useState(stored.districtFilter ?? "Tümü");
  const [sortKey, setSortKey] = useState<SortKey | null>(stored.sortKey ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(stored.sortDir ?? "asc");
  const [page, setPage] = useState(stored.page ?? 1);
  const [pageSize, setPageSize] = useState(stored.pageSize === 50 ? 50 : 25);
  useEffect(() => {
    if (!showPositionFilter) return;
    sessionStorage.setItem(
      TABLE_STATE_KEY,
      JSON.stringify({ position, militaryFilter, licenseFilter, minAge, maxAge, districtFilter, sortKey, sortDir, page, pageSize }),
    );
  }, [showPositionFilter, position, militaryFilter, licenseFilter, minAge, maxAge, districtFilter, sortKey, sortDir, page, pageSize]);

  const hasActiveFilters = position !== "" || militaryFilter !== "Tümü" || licenseFilter !== "Tümü" || minAge !== "" || maxAge !== "" || districtFilter !== "Tümü" || search.trim() !== "";
  const clearFilters = () => {
    setPosition("");
    setMilitaryFilter("Tümü");
    setLicenseFilter("Tümü");
    setMinAge("");
    setMaxAge("");
    setDistrictFilter("Tümü");
    onClearSearch?.();
  };

  const positionName = (candidate: Candidate) => positions.find((item) => item.id === candidate.positionId)?.title || "Belirtilmedi";
  const filtered = candidates.filter((candidate) => {
    if (search.trim()) {
      const term = search.trim().toLocaleLowerCase("tr-TR");
      const fields = [candidate.name, candidate.email, candidate.phone, candidate.district, candidate.field, positionName(candidate)];
      if (!fields.some((value) => value?.toLocaleLowerCase("tr-TR").includes(term))) return false;
    }
    if (showPositionFilter && position && candidate.positionId !== position) return false;
    if (militaryFilter !== "Tümü" && candidate.militaryStatus !== militaryFilter) return false;
    if (licenseFilter === "Var" && candidate.hasDriverLicense !== true) return false;
    if (licenseFilter === "Yok" && candidate.hasDriverLicense !== false) return false;
    const age = calculateAge(candidate.birthDate);
    if (minAge && (age === null || age < Number(minAge))) return false;
    if (maxAge && (age === null || age > Number(maxAge))) return false;
    if (districtFilter !== "Tümü" && candidate.district !== districtFilter) return false;
    return true;
  });
  const districts = [...new Set(candidates.map((candidate) => candidate.district).filter((district): district is string => Boolean(district)))].sort((a, b) => a.localeCompare(b, "tr"));

  const sortValue = (candidate: Candidate, key: SortKey): string | number | null => {
    if (key === "name") return candidate.name;
    if (key === "age") return calculateAge(candidate.birthDate);
    if (key === "score") return candidate.score ?? null;
    return candidate.createdAt ? new Date(candidate.createdAt).getTime() : null;
  };
  const sorted = compact || sortKey === null ? filtered : [...filtered].sort((a, b) => {
    const left = sortValue(a, sortKey);
    const right = sortValue(b, sortKey);
    if (left === null && right === null) return 0;
    if (left === null) return 1; 
    if (right === null) return -1;
    const diff = typeof left === "string" && typeof right === "string" ? left.localeCompare(right, "tr") : Number(left) - Number(right);
    return sortDir === "asc" ? diff : -diff;
  });
  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir("asc");
    }
  };
  const sortHeader = (label: string, key: SortKey, className?: string) => (
    <th className={className} aria-sort={sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
      <button type="button" className="sort-header" onClick={() => toggleSort(key)}>
        {label}
        {sortKey === key ? (sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} className="sort-idle" />}
      </button>
    </th>
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = compact ? sorted.slice(0, 8) : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <Card className="candidate-card">
    <div className="card-heading">
      <div><p className="section-kicker">ADAY HAVUZU</p><h2>{title}<span className="count-pill">{filtered.length}</span></h2></div>
      {compact ? <Link className="text-button table-view-all" to="/adaylar">Tüm adaylar <ArrowUpRight size={16} /></Link> : null}
    </div>
    {showPositionFilter && <div className="candidate-filters">
      <span className="filters-label"><SlidersHorizontal size={16} /> Filtreler</span>
      <label className="filter-select"><select aria-label="Pozisyona göre filtrele" value={position} onChange={(event) => setPosition(event.target.value)}><option value="">Tüm pozisyonlar</option>{positions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label className="filter-select"><select aria-label="Askerlik durumuna göre filtrele" value={militaryFilter} onChange={(event) => setMilitaryFilter(event.target.value)}><option value="Tümü">Tüm askerlik durumları</option><option value="yapildi">Yapıldı</option><option value="yapilmadi">Yapılmadı</option><option value="tecilli">Tecilli</option><option value="muaf">Muaf</option></select></label>
      <label className="filter-select"><select aria-label="Ehliyet durumuna göre filtrele" value={licenseFilter} onChange={(event) => setLicenseFilter(event.target.value)}><option value="Tümü">Ehliyet durumu</option><option value="Var">Ehliyeti var</option><option value="Yok">Ehliyeti yok</option></select></label>
      <label className="filter-select"><select aria-label="İlçeye göre filtrele" value={districtFilter} onChange={(event) => setDistrictFilter(event.target.value)}><option value="Tümü">Tüm ilçeler</option>{districts.map((district) => <option key={district} value={district}>{district}</option>)}</select></label>
      <div className="age-filter"><input type="number" min="18" placeholder="Min yaş" aria-label="Minimum yaş" value={minAge} onChange={(event) => setMinAge(event.target.value)} /><span>–</span><input type="number" min="18" placeholder="Maks yaş" aria-label="Maksimum yaş" value={maxAge} onChange={(event) => setMaxAge(event.target.value)} /></div>
      {hasActiveFilters && <button type="button" className="filters-clear" onClick={clearFilters}><X size={14} /> Filtreleri Temizle</button>}
    </div>}
    {filtered.length ? <div className="table-scroll" tabIndex={0} role="region" aria-label={`${title} tablosu`}>
      <table className="application-table modern-table">
  <thead>
    <tr>
      {compact ? <th className="candidate-column">Aday</th> : sortHeader("Aday", "name", "candidate-column")}
      <th>İletişim</th>
      {compact ? <th>Başvuru Tarihi</th> : sortHeader("Başvuru Tarihi", "createdAt")}
      <th>Kaynak</th>

      {!compact && (
        <>
          <th>İlçe</th>
          {sortHeader("Yaş", "age")}
          <th>Ehliyet</th>
          <th>Aktif Sürücü</th>
          <th>Askerlik</th>
          <th>Yabancı Dil</th>
          <th>Bölüm / Alan</th>
        </>
      )}

      <th>CV</th>
      {compact ? <th>Skor</th> : sortHeader("Skor", "score")}
      <th>
        <span className="sr-only">Detay</span>
      </th>
    </tr>
  </thead>
  <tbody>
        {rows.map((candidate) => <tr key={candidate.id}>
          <td className="candidate-column">
  <Link
    className="candidate-identity"
    to={`/adaylar/${candidate.id}`}
  >
    <span className="candidate-avatar" aria-hidden="true">
      {candidate.initials}
    </span>

    <span className="candidate-name-block">
      <strong>{candidate.name}</strong>
      {candidate.tags?.includes("Reddedildi") && <small className="candidate-rejected-label">Reddedildi</small>}
      <small>{positionName(candidate)}</small>
    </span>
  </Link>
</td>

          <td><span className="contact-cell">{candidate.email}<small>{candidate.phone || "Telefon belirtilmedi"}</small></span></td>

  <td>
    {candidate.createdAt
      ? new Date(candidate.createdAt).toLocaleDateString("tr-TR")
      : "—"}
  </td>
         <td><span className="source-badge">{applicationSource(candidate.tags)}</span></td>
{!compact && (
  <>
    <td>{candidate.district || "—"}</td>

    <td>
      {calculateAge(candidate.birthDate) ?? "—"}
    </td>

    <td>
      {licenseLabel(
        candidate.hasDriverLicense,
        candidate.driverLicenseType,
      )}
    </td>
    <td>
  {candidate.activelyDriving === true
    ? "Evet"
    : candidate.activelyDriving === false
      ? "Hayır"
      : "—"}
</td>

<td>
  {militaryLabel(candidate.militaryStatus)}
</td>

<td className="foreign-language-column">
  <span
    className="foreign-language-cell"
    title={candidate.foreignLanguage || undefined}
  >
    {candidate.foreignLanguage || "—"}
  </span>
</td>

    <td>
      <span className="field-cell">
        {candidate.field || "—"}
      </span>
    </td>
  </>
)}

<td>
  {candidate.cvUrl ? (
    <a
      className="cv-link"
      href={resolveCvUrl(candidate.cvUrl)!}
      target="_blank"
      rel="noreferrer"
    >
      <FileText size={15} />
      CV
    </a>
  ) : (
    <span className="no-cv">—</span>
  )}
</td>
       <td><span className="score-badge">{candidate.score == null ? "—" : `${candidate.score}/5`}</span></td>
{!compact && (
  <td>
    <Link
      className="row-action"
      to={`/adaylar/${candidate.id}`}
      aria-label={`${candidate.name} detayını aç`}
    >
      <ArrowUpRight size={17} />
    </Link>
  </td>
)}        </tr>)}
      </tbody></table>
    </div> : <EmptyState title="Başvuru bulunamadı" description={candidates.length ? "Filtrelerle eşleşen aday bulunamadı." : "Henüz aday başvurusu yok."} />}
    <div className="table-footer">
      <span>{compact
        ? `${Math.min(filtered.length, 8)} aday gösteriliyor${filtered.length > 8 ? ` · ${filtered.length} eşleşme` : ""}`
        : `${sorted.length} aday · Sayfa ${currentPage}/${totalPages}`}</span>
      {!compact && <div className="table-pagination">
        <label className="filter-select"><select aria-label="Sayfa başına aday sayısı" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={25}>25 / sayfa</option><option value={50}>50 / sayfa</option></select></label>
        <button type="button" className="page-button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} aria-label="Önceki sayfa"><ChevronLeft size={16} /></button>
        <button type="button" className="page-button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Sonraki sayfa"><ChevronRight size={16} /></button>
      </div>}
    </div>
  </Card>;
}
