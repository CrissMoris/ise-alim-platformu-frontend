# ECR İşe Alım Platformu — Frontend

ECR İşe Alım Platformu'nun web arayüzüdür. Aday yönetimi, değerlendirme süreçleri, mülakat/randevu işlemleri ve yönetim ekranlarını modern ve responsive bir kullanıcı arayüzü üzerinden sunar.

Uygulama **React + TypeScript + Vite** kullanılarak geliştirilmiştir.

## Teknolojiler

* React
* TypeScript
* Vite
* React Router
* CSS
* Lucide React
* ESLint

## Proje Yapısı

```text
frontend/
├── public/
│   └── ECR logo ve görsel varlıklar
│
├── src/
│   ├── app/
│   │   ├── navigation.ts
│   │   └── routes.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   │
│   │   └── ui/
│   │       ├── BrandLogo.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── EmptyState.tsx
│   │       ├── FormField.tsx
│   │       └── Modal.tsx
│   │
│   ├── features/
│   │   └── dashboard/
│   │       ├── CandidateTable.tsx
│   │       ├── DashboardPage.tsx
│   │       └── MetricCard.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   └── recruitment.ts
│   │
│   ├── pages/
│   │   ├── AppointmentBookingPage.tsx
│   │   ├── AppointmentsPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── CandidateAssessment.tsx
│   │   ├── CandidateDetailPage.tsx
│   │   ├── CandidatesPage.tsx
│   │   ├── EvaluationsPage.tsx
│   │   ├── InviteVerificationPage.tsx
│   │   ├── InvitesPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── NewCandidatePage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── TechnicalSessionDetailPage.tsx
│   │
│   ├── types/
│   │   └── recruitment.ts
│   │
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Uygulama Modülleri

### Dashboard

İşe alım süreçlerinin genel durumunu gösteren ana ekran.

* Aday ve süreç özetleri
* Devam eden değerlendirmeler
* Mülakat süreçleri
* Aday listeleri
* İşe alım sürecine ilişkin özet bilgiler

### Adaylar

Adayların listelenmesi ve detaylarının görüntülenmesini sağlar.

Aday bilgilerinde aşağıdaki alanlar desteklenir:

* Ad Soyad
* E-posta
* Telefon
* Doğum tarihi / yaş
* İlçe
* Yabancı dil
* Toplam iş tecrübesi
* Bölüm / alan
* Askerlik durumu
* Ehliyet bilgisi
* Aktif araç kullanımı
* CV
* Başvuru tarihi
* Başvuru durumu
* Aşama
* Puan
* Kaynak / etiket bilgileri

Aday detay ekranından ilgili işe alım işlemlerine ve değerlendirme süreçlerine erişilebilir.

### Mülakat ve Randevu

Mülakat süreçlerinin ve aday randevularının yönetilmesini sağlar.

* Mülakat randevularını görüntüleme
* Adaya randevu daveti gönderme
* Adayın uygun tarih ve saat seçmesi
* Randevu bilgilerinin görüntülenmesi

### Değerlendirmeler

Adayların değerlendirme süreçlerinin takip edilmesini sağlar.

* Değerlendirme davetleri
* E-posta doğrulama
* Aydınlatma ve onay süreci
* Değerlendirme kuralları
* Soru ve cevap süreci
* Değerlendirme sonucu
* Teknik mülakat oturumları

### Aday Değerlendirme Ekranı

Adayların kendilerine gönderilen değerlendirme bağlantısı üzerinden kullandıkları public ekranları içerir.

Değerlendirme akışı:

```text
Davet bağlantısı
      ↓
E-posta doğrulama
      ↓
Aydınlatma ve Onay
      ↓
Değerlendirme Kuralları
      ↓
Değerlendirme
      ↓
Tamamlandı
```

## Yönlendirmeler

Yönetim ekranlarının temel rotaları:

```text
/giris
/adaylar
/adaylar/:id
/adaylar/yeni
/takvim
/randevular
/degerlendirmeler
/davetler
```

Adaylara yönelik public rotalar:

```text
/invite/:token
/randevu/:token
```

Teknik değerlendirme ekranları ilgili değerlendirme oturumları üzerinden açılır.

## API Entegrasyonu

Frontend, backend REST API ile haberleşmek için `src/lib/api.ts` içerisindeki API katmanını kullanır.

API üzerinden;

* Kimlik doğrulama
* Aday bilgileri
* Değerlendirme davetleri
* Randevu işlemleri
* Takvim bilgileri
* Değerlendirme oturumları
* Değerlendirme sonuçları

gibi veriler yönetilir.

Frontend'de veritabanına doğrudan bağlantı bulunmaz. Veritabanı işlemleri backend tarafından gerçekleştirilir.

## Ortam Değişkenleri

API adresi ortam değişkenleri üzerinden yapılandırılır.

Örnek:

```env
VITE_API_URL=http://localhost:3000
```

Production ortamında değer ilgili backend adresine göre değiştirilmelidir.

`.env` dosyaları Git repository'sine eklenmemelidir.

## Kurulum

Projeyi klonladıktan sonra frontend klasörüne geçin:

```bash
cd frontend
```

Bağımlılıkları yükleyin:

```bash
npm install
```

Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Uygulama Vite geliştirme sunucusu üzerinden çalışır.

## Production Build

Production build oluşturmak için:

```bash
npm run build
```

TypeScript kontrolü:

```bash
npm run typecheck
```

Lint kontrolü:

```bash
npm run lint
```

## Tasarım

Arayüz ECR kurumsal kimliği doğrultusunda açık renkli, modern ve sade bir tasarım yaklaşımı kullanır.

Temel tasarım özellikleri:

* ECR marka logosu
* Açık arka planlar
* Indigo / mavi ağırlıklı vurgu renkleri
* Yumuşak kart ve panel yüzeyleri
* İnce kenarlıklar
* Hafif gölgeler
* Responsive tablolar ve içerik alanları
* Masaüstü ve mobil kullanım desteği
* Tutarlı buton, form ve kart bileşenleri

Arayüz tasarımında modern SaaS ve HR platformlarından görsel olarak ilham alınmış, ancak uygulamaya özel bir ECR tasarım dili oluşturulmuştur.

## Backend

Frontend uygulaması ayrı bir NestJS backend ile çalışır.

Backend repository:

```text
ecr-ise-alim-backend
```

Frontend ve backend birbirinden bağımsız olarak geliştirilip deploy edilebilir.

## Geliştirme Notları

Bu repository yalnızca frontend uygulamasını içerir.

* Veritabanı şeması frontend içerisinde bulunmaz.
* Veritabanı migration işlemleri frontend tarafından yapılmaz.
* Kimlik doğrulama ve yetkilendirme backend tarafından yönetilir.
* Hassas bilgiler kaynak koduna eklenmemelidir.
* API ve environment yapılandırmaları deployment ortamına göre belirlenmelidir.
