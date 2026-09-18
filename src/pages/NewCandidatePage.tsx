import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useOutletContext } from "react-router";
import type { RecruitmentContext } from "../types/recruitment";
import { createCandidate } from "../lib/api";
import { ArrowLeft, ClipboardList, UserPlus } from "lucide-react";

const districts = [
  "Arnavutköy",
  "Avcılar",
  "Bağcılar",
  "Bahçelievler",
  "Bakırköy",
  "Başakşehir",
  "Bayrampaşa",
  "Beşiktaş",
  "Beylikdüzü",
  "Beyoğlu",
  "Büyükçekmece",
  "Çatalca",
  "Esenler",
  "Esenyurt",
  "Eyüpsultan",
  "Fatih",
  "Gaziosmanpaşa",
  "Güngören",
  "Kağıthane",
  "Küçükçekmece",
  "Sarıyer",
  "Silivri",
  "Sultangazi",
  "Şişli",
  "Zeytinburnu",
  "Diğer",
];

const sourceOptions = [
  "Kariyer.net",
  "İBB",
  "Referans",
];

export function NewCandidatePage() {
  const navigate = useNavigate();
  const { positions } = useOutletContext<RecruitmentContext>();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    district: "",
    positionId: "",
    source: "",
    militaryStatus: "",
    hasDriverLicense: "",
    driverLicenseType: "",
    activelyDriving: "",
    foreignLanguage: "",
    totalWorkExperience: "",
    field: "",
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCvChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCvFile(event.target.files?.[0] ?? null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const createdCandidate = await createCandidate({
        fullName: form.fullName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        birthDate: form.birthDate || null,
        district: form.district || null,
        positionId: form.positionId || null,
        source: form.source || null,
        militaryStatus: form.militaryStatus || null,
        hasDriverLicense:
          form.hasDriverLicense === ""
            ? null
            : form.hasDriverLicense === "true",
        driverLicenseType:
          form.hasDriverLicense === "true"
            ? form.driverLicenseType || null
            : null,
        activelyDriving:
          form.hasDriverLicense === ""
            ? null
            : form.hasDriverLicense === "true"
              ? form.activelyDriving === ""
                ? null
                : form.activelyDriving === "true"
              : null,
        foreignLanguage: form.foreignLanguage || null,
        totalWorkExperience: form.totalWorkExperience || null,
        field: form.field || null,
      });

      navigate(`/adaylar/${createdCandidate.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Aday oluşturulurken bir hata oluştu.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="new-candidate-page">
      <div className="page-heading new-candidate-heading">
        <div>
          <p className="eyebrow">ADAY YÖNETİMİ</p>
          <h1>Aday Ekle</h1>
          <p className="page-subtitle">
            Yeni adayın profilini birkaç adımda oluşturun.
          </p>
        </div>
        <span className="new-candidate-heading-icon" aria-hidden="true"><UserPlus size={27} /></span>
      </div>

      <form className="new-candidate-form" onSubmit={handleSubmit}>
        <div className="card new-candidate-card">
          <div className="card-header">
            <span className="new-candidate-card-icon" aria-hidden="true"><ClipboardList size={19} /></span>
            <div>
              <h2>Aday Bilgileri</h2>
              <p>İletişim, başvuru ve mesleki bilgileri doldurun.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="new-candidate-section-label"><span>01</span><div><strong>İletişim bilgileri</strong><small>Adaya ulaşmak için temel bilgiler</small></div></div>
            <div className="form-field">
              <label htmlFor="fullName">Ad Soyad</label>
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(event) =>
                  updateField("fullName", event.target.value)
                }
                placeholder="Ad Soyad"
              />
            </div>

            <div className="form-field">
              <label htmlFor="email">E-posta</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                placeholder="ornek@mail.com"
              />
            </div>

            <div className="form-field">
              <label htmlFor="phone">Telefon</label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  updateField("phone", event.target.value)
                }
                placeholder="05XX XXX XX XX"
              />
            </div>

            <div className="form-field">
              <label htmlFor="birthDate">Doğum Tarihi</label>
              <input
                id="birthDate"
                type="date"
                value={form.birthDate}
                onChange={(event) =>
                  updateField("birthDate", event.target.value)
                }
              />
            </div>

            <div className="new-candidate-section-label"><span>02</span><div><strong>Başvuru ve uygunluk</strong><small>Pozisyon, kaynak ve çalışma koşulları</small></div></div>
            <div className="form-field">
              <label htmlFor="district">İlçe</label>
              <select
                id="district"
                value={form.district}
                onChange={(event) =>
                  updateField("district", event.target.value)
                }
              >
                <option value="">Seçiniz</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="positionId">Başvurulan Pozisyon</label>
              <select
                id="positionId"
                value={form.positionId}
                onChange={(event) =>
                  updateField("positionId", event.target.value)
                }
              >
                <option value="">Seçiniz</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="source">Kaynak</label>
              <select
                id="source"
                value={form.source}
                onChange={(event) =>
                  updateField("source", event.target.value)
                }
              >
                <option value="">Seçiniz</option>
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="militaryStatus">Askerlik Durumu</label>
              <select
                id="militaryStatus"
                value={form.militaryStatus}
                onChange={(event) =>
                  updateField("militaryStatus", event.target.value)
                }
              >
                <option value="">Seçiniz</option>
                <option value="yapildi">Yapıldı</option>
                <option value="yapilmadi">Yapılmadı</option>
                <option value="tecilli">Tecilli</option>
                <option value="muaf">Muaf</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="hasDriverLicense">Ehliyet</label>
              <select
                id="hasDriverLicense"
                value={form.hasDriverLicense}
                onChange={(event) => {
                  const value = event.target.value;

                  setForm((current) => ({
                    ...current,
                    hasDriverLicense: value,
                    driverLicenseType:
                      value === "true" ? current.driverLicenseType : "",
                    activelyDriving:
                      value === "true" ? current.activelyDriving : "",
                  }));
                }}
              >
                <option value="">Seçiniz</option>
                <option value="true">Var</option>
                <option value="false">Yok</option>
              </select>
            </div>

            {form.hasDriverLicense === "true" && (
              <>
                <div className="form-field">
                  <label htmlFor="driverLicenseType">
                    Ehliyet Sınıfı
                  </label>
                  <select
                    id="driverLicenseType"
                    value={form.driverLicenseType}
                    onChange={(event) =>
                      updateField(
                        "driverLicenseType",
                        event.target.value,
                      )
                    }
                  >
                    <option value="">Seçiniz</option>
                    <option value="A">A</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B">B</option>
                    <option value="BE">BE</option>
                    <option value="C">C</option>
                    <option value="CE">CE</option>
                    <option value="D">D</option>
                    <option value="DE">DE</option>
                    <option value="F">F</option>
                    <option value="G">G</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="activelyDriving">
                    Aktif Araç Kullanıyor mu?
                  </label>
                  <select
                    id="activelyDriving"
                    value={form.activelyDriving}
                    onChange={(event) =>
                      updateField(
                        "activelyDriving",
                        event.target.value,
                      )
                    }
                  >
                    <option value="">Seçiniz</option>
                    <option value="true">Evet</option>
                    <option value="false">Hayır</option>
                  </select>
                </div>
              </>
            )}

            <div className="new-candidate-section-label"><span>03</span><div><strong>Mesleki profil</strong><small>Deneyim ve yetkinlik bilgileri</small></div></div>
            <div className="form-field">
              <label htmlFor="foreignLanguage">Yabancı Dil</label>
              <input
                id="foreignLanguage"
                type="text"
                value={form.foreignLanguage}
                onChange={(event) =>
                  updateField("foreignLanguage", event.target.value)
                }
                placeholder="İngilizce - B2"
              />
            </div>

            <div className="form-field">
              <label htmlFor="totalWorkExperience">
                Toplam İş Deneyimi
              </label>
              <input
                id="totalWorkExperience"
                type="text"
                value={form.totalWorkExperience}
                onChange={(event) =>
                  updateField(
                    "totalWorkExperience",
                    event.target.value,
                  )
                }
                placeholder="Örn. 2 yıl 6 ay"
              />
            </div>

            <div className="form-field">
              <label htmlFor="field">Alan</label>
              <input
                id="field"
                type="text"
                value={form.field}
                onChange={(event) =>
                  updateField("field", event.target.value)
                }
                placeholder="Yazılım, Satış, Muhasebe..."
              />
            </div>

            <div className="form-field new-candidate-cv-field">
              <label htmlFor="cv">CV</label>
              <input
                id="cv"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCvChange}
              />
              {cvFile && (
                <span className="form-help">
                  Seçilen dosya: {cvFile.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="data-message" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/adaylar")}
            disabled={saving}
          >
            <ArrowLeft size={16} /> Vazgeç
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            <UserPlus size={17} /> {saving ? "Kaydediliyor…" : "Adayı Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
