import { useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, SlidersHorizontal, FileText } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { calculateAge, licenseLabel, militaryLabel, applicationSource } from "../../lib/recruitment";
import type { Candidate, Position } from "../../types/recruitment";

export function CandidateTable({
  candidates, positions, search, title = "Son başvurular", showPositionFilter = false, compact = false,
}: {
  candidates: Candidate[];
  positions: Position[];
  search: string;
  title?: string;
  showPositionFilter?: boolean;
  compact?: boolean;
}) {
  const [position, setPosition] = useState("");
  const [militaryFilter, setMilitaryFilter] = useState("Tümü");
  const [licenseFilter, setLicenseFilter] = useState("Tümü");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [districtFilter, setDistrictFilter] = useState("Tümü");

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
    </div>}
    {filtered.length ? <div className="table-scroll" tabIndex={0} role="region" aria-label={`${title} tablosu`}>
      <table className="application-table modern-table">
  <thead>
    <tr>
      <th className="candidate-column">Aday</th>
      <th>İletişim</th>
      {compact && <th>Başvuru Tarihi</th>}
      <th>Kaynak</th>

      {!compact && (
        <>
          <th>İlçe</th>
          <th>Yaş</th>
          <th>Ehliyet</th>
          <th>Aktif Sürücü</th>
          <th>Askerlik</th>
          <th>Yabancı Dil</th>
          <th>Bölüm / Alan</th>
        </>
      )}

      <th>CV</th>
      <th>Skor</th>
      <th>
        <span className="sr-only">Detay</span>
      </th>
    </tr>
  </thead>
  <tbody>
        {(compact ? filtered.slice(0, 8) : filtered).map((candidate) => <tr key={candidate.id}>
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
          
{compact && (
  <td>
    {candidate.createdAt
      ? new Date(candidate.createdAt).toLocaleDateString("tr-TR")
      : "—"}
  </td>
)}
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
      href={candidate.cvUrl}
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
    <div className="table-footer"><span>{compact ? Math.min(filtered.length, 8) : filtered.length} aday gösteriliyor{compact && filtered.length > 8 ? ` · ${filtered.length} eşleşme` : ""}</span></div>
  </Card>;
}
