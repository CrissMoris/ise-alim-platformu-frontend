import type { TechnicalQuestion, TechnicalSessionDetail } from "./recruitment";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const TOKEN_KEY = "ecr-admin-token";
export const authToken = () => localStorage.getItem(TOKEN_KEY);
export const clearAuth = () => { localStorage.removeItem(TOKEN_KEY); window.dispatchEvent(new Event("auth-changed")); };
export async function loginAdmin(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(data?.message || "Giriş yapılamadı.");
  }
  const data = await response.json() as { token: string; user: { name: string; email: string } };
  localStorage.setItem(TOKEN_KEY, data.token);
  window.dispatchEvent(new Event("auth-changed"));
  return data.user;
}
export async function logoutAdmin() {
  try { await apiFetch(`${API_URL}/auth/logout`, { method: "POST" }); } finally { clearAuth(); }
}
export async function verifyAdmin() {
  const response = await apiFetch(`${API_URL}/auth/me`);
  if (!response.ok) throw new Error("Oturum geçersiz.");
  return response.json() as Promise<{ id: string; name: string; email: string }>;
}
async function apiFetch(input: string, init: RequestInit = {}) {
  const token = authToken();
  const response = await fetch(input, { ...init, headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  if (response.status === 401 && token) clearAuth();
  return response;
}

type PositionRow = { id: string; title: string; department: string | null; level: string | null; isActive: boolean };
type CandidateRow = {
  id: string; fullName: string; email: string; phone: string | null;
  birthDate: string | null; district: string | null; foreignLanguage: string | null;
  totalWorkExperience: string | null; field: string | null;
  militaryStatus: "yapildi" | "yapilmadi" | "tecilli" | "muaf" | null;
  hasDriverLicense: boolean | null; driverLicenseType: string | null;
  activelyDriving: boolean | null; cvUrl: string | null; createdAt: string;
  score: number | null; positionId: string | null; tags: string[];
  notes?: string | null; coverLetter?: string | null;
  invites?: InviteRow[]; technicalSessions?: TechnicalSessionRow[];
  appointmentInvites?: AppointmentInviteRow[]; appointmentBookings?: AppointmentBookingRow[];
  evaluation?: {
  id: string;
  inviteId: string;
  overallSummary: string | null;
  consistencyScore: number | null;
  completedAt: string;
  dimensions: Array<{
    dimension: string;
    score: number;
    observation: string | null;
  }>;
} | null;

jobApplicationForm?: {
  id: string;
  appointmentInviteId: string;
  candidateId: string;
  cinsiyet: string | null;
  dogumYeriTarihi: string | null;
  ikametgahAdresi: string | null;
  askerlikDurumu: string | null;
  suruculBelgesi: string[];
  suruculBelgesiDiger: string | null;
  sigaraKullaniyor: boolean | null;
  medeniDurum: string | null;
  cocukSayisi: number | null;
  egitim: unknown;
  yabanciDiller: unknown;
  isTecrubesi: unknown;
  referanslar: unknown;
  saglikProblem: boolean | null;
  saglikProblemAciklama: string | null;
  mahkumiyetDurumu: boolean | null;
  mahkumiyetAciklama: string | null;
  acilIletisimAdSoyad: string | null;
  acilIletisimYakinligi: string | null;
  acilIletisimTelefon: string | null;
  netUcretBeklentisi: string | null;
  isBaslangicTarihi: string | null;
  basvurulanPozisyon: string | null;
  submittedAt: string | null;
} | null;
};
export type InviteRow = { id: string; status: string; completedAt: string | null };
export type TechnicalSessionRow = { id: string; status: string; evaluatedAt: string | null };
export type AppointmentInviteRow = { id: string; status: string; token?: string; sentAt: string | null; expiresAt?: string | null };
export type AppointmentBookingRow = { id: string; startAt: string };
export type AppointmentSlot = { id: string; startAt: string; isBooked: boolean; candidateName: string | null };

async function appointmentRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${API_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
    throw new Error(Array.isArray(body?.message) ? body.message.join(", ") : body?.message || "Randevu işlemi tamamlanamadı.");
  }
  return response.json() as Promise<T>;
}

export const appointmentsApi = {
  slots: () => appointmentRequest<AppointmentSlot[]>("/appointments/slots"),
  createSlots: (dates: string[], times: string[]) => appointmentRequest<{ created: number }>("/appointments/slots", { method: "POST", body: JSON.stringify({ dates, times }) }),
  deleteSlot: (id: string) => appointmentRequest<{ ok: boolean }>(`/appointments/slots/${encodeURIComponent(id)}`, { method: "DELETE" }),
  invite: (candidateId: string) => appointmentRequest<{ token: string; expiresAt: string; reused: boolean; mail: { sent: boolean; reason?: string; error?: string } }>("/appointments/invite", { method: "POST", body: JSON.stringify({ candidateId }) }),
  resolve: (token: string) => appointmentRequest<{ candidateName: string; alreadyBooked: boolean; startAt?: string; slots: Array<{ id: string; startAt: string }> }>(`/appointments/${encodeURIComponent(token)}`),
  book: (token: string, slotId: string) => appointmentRequest<{ ok: boolean; startAt: string }>(`/appointments/${encodeURIComponent(token)}/book`, { method: "POST", body: JSON.stringify({ slotId }) }),
};

export const rejectCandidate = (id: string) => appointmentRequest<{ id: string; tags: string[]; mail: { sent: boolean; reason?: string; error?: string } }>(`/candidates/${encodeURIComponent(id)}/reject`, { method: "POST" });
export const sendEvaluationInvite = (candidateId: string) => appointmentRequest<{ reused: boolean; status?: string; mail: { sent: boolean; reason?: string; error?: string } }>("/invites", { method: "POST", body: JSON.stringify({ candidateId }) });

async function candidateInviteRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
    throw new Error(Array.isArray(body?.message) ? body.message.join(", ") : body?.message || "Davet işlemi tamamlanamadı.");
  }
  return response.json() as Promise<T>;
}

export const candidateInviteApi = {
  resolve: (token: string) => candidateInviteRequest<{ closed: boolean; status?: string; candidateName?: string; candidateEmailMasked?: string; emailVerified?: boolean; templateName?: string; durationSec?: number; consents?: Array<{ id: string; type: string; title: string; body: string; version: string; accepted: boolean }> }>(`/candidate/invites/${encodeURIComponent(token)}`),
  sendCode: (token: string) => candidateInviteRequest<{ ok: boolean; sentTo: string; ttlMs: number }>(`/candidate/invites/${encodeURIComponent(token)}/send-email-code`, { method: "POST" }),
  verifyCode: (token: string, code: string) => candidateInviteRequest<{ ok: boolean }>(`/candidate/invites/${encodeURIComponent(token)}/verify-email-code`, { method: "POST", body: JSON.stringify({ code }) }),
  accept: (token: string, documentIds: string[]) => candidateInviteRequest<{ ok: boolean }>(`/candidate/invites/${encodeURIComponent(token)}/accept-consent`, { method: "POST", body: JSON.stringify({ consents: documentIds.map(documentId => ({ documentId, accepted: true })) }) }),
  start: (token: string, body: { fullscreenAtStart: boolean; screen: { width: number; height: number } }) => candidateInviteRequest<CandidateAssessmentSession>(`/candidate/invites/${encodeURIComponent(token)}/start`, { method: "POST", body: JSON.stringify(body) }),
  answer: (sessionId: string, questionId: string, value: CandidateAnswerValue, timeSpentMs: number) => candidateInviteRequest<{ ok: boolean }>(`/candidate/sessions/${encodeURIComponent(sessionId)}/answer`, { method: "POST", body: JSON.stringify({ questionId, value, timeSpentMs }) }),
  proctor: (sessionId: string, event: { type: string; occurredAt: string; durationMs?: number }) => candidateInviteRequest<{ ok: boolean; decision: string }>(`/candidate/sessions/${encodeURIComponent(sessionId)}/proctor-event`, { method: "POST", body: JSON.stringify(event) }),
  heartbeat: (sessionId: string) => candidateInviteRequest<{ ok: boolean }>(`/candidate/sessions/${encodeURIComponent(sessionId)}/heartbeat`, { method: "POST" }),
  submit: (sessionId: string) => candidateInviteRequest<{ ok: boolean; resultId: string }>(`/candidate/sessions/${encodeURIComponent(sessionId)}/submit`, { method: "POST" }),
};
export type CandidateAnswerValue =
  | { type: "likert"; value: number }
  | { type: "choice"; value: string }
  | { type: "rank"; value: string[] }
  | { type: "text"; value: string };
export type CandidateAssessmentSession = {
  sessionId: string;
  durationSec: number;
  startedAt: string;
  sections: Array<{ id: string; title: string; description: string | null; order: number; questions: Array<{ id: string; type: "LIKERT" | "MULTIPLE_CHOICE" | "SCENARIO_CHOICE" | "PRIORITY_RANK" | "SHORT_TEXT"; prompt: string; helpText: string | null; options: Array<{ id: string; label: string; value: string; order: number }> }> }>;
  alreadyAnswered: Record<string, CandidateAnswerValue>;
  policy: { mode: string; fullscreenRequired: boolean; blockCopy: boolean; blockPaste: boolean; blockContextMenu: boolean };
};
export type CandidateDetail = Awaited<ReturnType<typeof getCandidateById>>;

export async function getPositions() {
  const response = await apiFetch(`${API_URL}/positions`);

  if (!response.ok) {
    throw new Error("Pozisyonlar alınamadı");
  }

  const positions = await response.json() as PositionRow[];

  return positions.map((position) => ({
    id: position.id,
    title: position.title,
    department: position.department || "Belirtilmemiş",
    type: position.level || "Belirtilmemiş",
    status: position.isActive ? "Açık" as const : "Kapalı" as const,
  }));
}
export async function getDashboardStats() {
  const response = await apiFetch(`${API_URL}/dashboard/stats`);

  if (!response.ok) {
    throw new Error("Dashboard verileri alınamadı.");
  }

  return response.json() as Promise<{
    totalCandidates: string;
    totalPositions: string;
    inEvaluation: string;
    inInterview: string;
  }>;
}
export async function getCandidates() {
  const response = await apiFetch(`${API_URL}/candidates`);

  if (!response.ok) {
    throw new Error("Adaylar alınamadı");
  }

  const candidates = await response.json() as CandidateRow[];

  return candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.fullName,
    initials: candidate.fullName
      ? candidate.fullName
          .split(" ")
          .map((part: string) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "?",
    email: candidate.email,
    phone: candidate.phone ?? null,
    birthDate: candidate.birthDate ?? null,
    district: candidate.district ?? null,
    foreignLanguage: candidate.foreignLanguage ?? null,
    totalWorkExperience: candidate.totalWorkExperience ?? null,
    field: candidate.field ?? null,
    militaryStatus: candidate.militaryStatus ?? null,
    hasDriverLicense: candidate.hasDriverLicense ?? null,
    driverLicenseType: candidate.driverLicenseType ?? null,
    activelyDriving: candidate.activelyDriving ?? null,
    cvUrl: candidate.cvUrl ?? null,
    createdAt: candidate.createdAt,
    score: candidate.score ?? null,
    positionId: candidate.positionId ?? null,
    tags: candidate.tags ?? [],

  }));
}

export async function getCandidatesByPosition(positionId: string) {
  const response = await apiFetch(
    `${API_URL}/positions/${positionId}/candidates`,
  );

  if (!response.ok) {
    throw new Error("Pozisyon adayları alınamadı");
  }

  const candidates = await response.json() as CandidateRow[];

  return candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.fullName,
    initials: candidate.fullName
      ? candidate.fullName
          .split(" ")
          .map((part: string) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "?",
    email: candidate.email,
    phone: candidate.phone ?? null,
    birthDate: candidate.birthDate ?? null,
    district: candidate.district ?? null,
    foreignLanguage: candidate.foreignLanguage ?? null,
    totalWorkExperience: candidate.totalWorkExperience ?? null,
    field: candidate.field ?? null,
    militaryStatus: candidate.militaryStatus ?? null,
    hasDriverLicense: candidate.hasDriverLicense ?? null,
    driverLicenseType: candidate.driverLicenseType ?? null,
    activelyDriving: candidate.activelyDriving ?? null,
    cvUrl: candidate.cvUrl ?? null,
    createdAt: candidate.createdAt,
    score: candidate.score ?? null,
    tags: candidate.tags ?? [],
  }));
}
export async function getCandidateById(id: string) {
  const response = await apiFetch(`${API_URL}/candidates/${id}`);

  if (!response.ok) {
    throw new Error("Aday bilgileri alınamadı");
  }

  const candidate = await response.json() as CandidateRow | null;

  if (!candidate) {
    return null;
  }

  return {
  id: candidate.id,
  name: candidate.fullName,
  initials: candidate.fullName
    ? candidate.fullName
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?",
  email: candidate.email,
  phone: candidate.phone ?? null,
  birthDate: candidate.birthDate ?? null,
  district: candidate.district ?? null,
  hasDriverLicense: candidate.hasDriverLicense ?? null,
  driverLicenseType: candidate.driverLicenseType ?? null,
  activelyDriving: candidate.activelyDriving ?? null,
  militaryStatus: candidate.militaryStatus ?? null,
  foreignLanguage: candidate.foreignLanguage ?? null,
  totalWorkExperience: candidate.totalWorkExperience ?? null,
  field: candidate.field ?? null,
  cvUrl: candidate.cvUrl ?? null,
  createdAt: candidate.createdAt,
  score: candidate.score ?? null,
  positionId: candidate.positionId ?? null,
  notes: candidate.notes ?? null,
  coverLetter: candidate.coverLetter ?? null,
  tags: candidate.tags ?? [],

  invites: candidate.invites ?? [],
  technicalSessions: candidate.technicalSessions ?? [],
  appointmentInvites: candidate.appointmentInvites ?? [],
  appointmentBookings: candidate.appointmentBookings ?? [],

evaluation: candidate.evaluation ?? null,
jobApplicationForm: candidate.jobApplicationForm ?? null,
};
}
export async function getCandidateEvaluationAndApplication(id: string) {
  const response = await apiFetch(
    `${API_URL}/candidates/${id}/evaluation-and-application`,
  );

  if (!response.ok) {
    throw new Error("Değerlendirme ve başvuru formu alınamadı");
  }

  return response.json();
}
export async function createCandidate(
  data: {
    fullName?: string;
    email?: string;
    phone?: string;
    birthDate?: string | null;
    district?: string | null;
    militaryStatus?: string | null;
    hasDriverLicense?: boolean | null;
    driverLicenseType?: string | null;
    activelyDriving?: boolean | null;
    positionId?: string | null;
    source?: string | null;
    foreignLanguage?: string | null;
    totalWorkExperience?: string | null;
    field?: string | null;
  },
) {
  const response = await apiFetch(`${API_URL}/candidates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as {
      message?: string | string[];
    } | null;

    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;

    throw new Error(message || "Aday oluşturulamadı.");
  }

  return response.json();
}
//UPDATE

export async function updateCandidateScore(
  id: string,
  score: number | null,
) {
  const response = await apiFetch(`${API_URL}/candidates/${id}/score`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ score }),
  });

  if (!response.ok) {
    throw new Error("Aday skoru güncellenemedi");
  }

  return response.json();
}

export async function updateCandidate(
  id: string,
  data: Record<string, unknown>,
) {
  const response = await apiFetch(`${API_URL}/candidates/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Aday bilgileri güncellenemedi");
  }

  return response.json();
}
export async function getQuestions() {
  const response = await apiFetch(`${API_URL}/questions`);

  if (!response.ok) {
    throw new Error("Sorular alınamadı");
  }

  return response.json();
}

export async function getTechnicalQuestions() {
  const response = await apiFetch(`${API_URL}/technical/questions`);

  if (!response.ok) {
    throw new Error("Teknik sorular alınamadı");
  }

  return response.json() as Promise<TechnicalQuestion[]>;
}

export async function getTechnicalSessions() {
  const response = await apiFetch(`${API_URL}/technical/sessions`);

  if (!response.ok) {
    throw new Error("Teknik mülakatlar alınamadı");
  }

  return response.json();
}

async function technicalRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await apiFetch(`${API_URL}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message = payload && typeof payload === "object" && "message" in payload
      ? (payload as { message: unknown }).message : null;
    throw new Error(typeof message === "string" ? message : "Teknik mülakat işlemi tamamlanamadı.");
  }
  return response.json() as Promise<T>;
}

export const getTechnicalSession = (id: string) =>
  technicalRequest<TechnicalSessionDetail>(`/technical/sessions/${encodeURIComponent(id)}`);

export const createTechnicalSession = (body: { candidateId: string; questionIds: string[] }) =>
  technicalRequest<{ id: string; status: "CREATED" }>("/technical/sessions", body);

export const startTechnicalSession = (id: string) =>
  technicalRequest<{ id: string; status: string; startedAt: string }>(`/technical/sessions/${encodeURIComponent(id)}/start`, {});

export const submitTechnicalSession = (
  id: string,
  body: { questionId: string; language: string; code: string; explanation?: string },
) => technicalRequest<{ submission: { id: string }; testExecuted: boolean; message: string }>(
  `/technical/sessions/${encodeURIComponent(id)}/submit`, body,
);

export const evaluateTechnicalSession = (
  id: string,
  body: {
    rubric: Array<{ questionId: string; scores: Record<string, number>; comment?: string }>;
    reviewerOverallScore: number | null;
    reviewerNote: string | null;
  },
) => technicalRequest<{ id: string; status: string }>(`/technical/sessions/${encodeURIComponent(id)}/evaluate`, body);

export type Invite = {
  id: string; status: string; createdAt: string; sentAt: string | null;
  expiresAt: string; completedAt: string | null;
  candidateId: string; candidateName: string; positionTitle: string | null;
};

export async function getInvites(): Promise<Invite[]> {
  const response = await apiFetch(`${API_URL}/invites`);
  if (!response.ok) throw new Error("Davetler alınamadı");
  return response.json() as Promise<Invite[]>;
}

export async function getCalendarAppointments() {
  const response = await apiFetch(`${API_URL}/calendar`);

  if (!response.ok) {
    throw new Error("Takvim verileri alınamadı");
  }

  return response.json();
}
