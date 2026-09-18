import type { Candidate } from "../types/recruitment";

export const applicationColumns = [
  "Ad Soyad",
  "E-posta",
  "Telefon",
  "Yaş",
  "İlçe",
  "Ehliyet",
  "Aktif Kullanım",
  "Askerlik",
  "Yabancı Dil",
  "Toplam Tecrübe",
  "Bölüm / Alan",
  "CV",
  "Başvuru",
  "Başvuru Tarihi",
  "Skor",
] as const;

export const applicationDate = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));

export const militaryLabel = (
  value: Candidate["militaryStatus"],
) =>
  value === null
    ? "Belirtilmedi"
    : {
        yapildi: "Yapıldı",
        yapilmadi: "Yapılmadı",
        tecilli: "Tecilli",
        muaf: "Muaf",
      }[value];

export function licenseLabel(
  hasLicense: boolean | null,
  licenseType?: string | null,
) {
  if (hasLicense === true) {
    return licenseType ? `${licenseType} sınıfı` : "Var";
  }

  if (hasLicense === false) {
    return "Yok";
  }

  return "Belirtilmedi";
}

export function calculateAge(
  birthDate: string | null | undefined,
) {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();

  const hasBirthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());

  if (!hasBirthdayPassed) {
    age--;
  }

  return age;
}

export function applicationSource(tags?: string[] | null) {
  if (!tags || tags.length === 0) {
    return "Belirtilmedi";
  }

  const sourceTags = ["İBB", "Referans", "Kariyer.net"];

  const source = tags.find((tag) =>
    sourceTags.includes(tag),
  );

  return source || "Belirtilmedi";
}
export type QuestionOption = {
  id: string;
  label: string;
  value: string;
  score: number;
  order: number;
};

export type Question = {
  id: string;
  type:
    | "LIKERT"
    | "MULTIPLE_CHOICE"
    | "PRIORITY_RANK"
    | "SHORT_TEXT"
    | "SCENARIO_CHOICE";
  prompt: string;
  helpText: string | null;
  reverseScored: boolean;
  isActive: boolean;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  options: QuestionOption[];
};

export type TechnicalQuestion = {
  id: string;
  difficulty: number;
  title: string;
  problemStatement: string;
  inputContract: string;
  outputContract: string;
  constraints: string;
  starterCode: string;
  language: string;
  publicTestCases: unknown[];
  rubric: unknown[];
  acceptedApproaches: string;
  commonMistakes: string;
  reviewerNotesTemplate: string;
  timeLimitMs: number;
  memoryLimitMB: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TechnicalSession = {
  id: string;
  status:
    | "CREATED"
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "EVALUATED"
    | "ARCHIVED";
  scheduledAt: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  evaluatedAt: string | null;
  overallScore: number | null;
  confidence: number | null;
  reviewerOverallScore: number | null;
  reviewerNote: string | null;
  candidateId: string;
  candidateName: string;
  positionId: string | null;
  positionTitle: string | null;
};

export type TechnicalSessionQuestion = Pick<TechnicalQuestion,
  "title" | "difficulty" | "problemStatement" | "inputContract" | "outputContract" |
  "constraints" | "starterCode" | "language" | "rubric" | "publicTestCases" |
  "timeLimitMs" | "memoryLimitMB"> & { questionId: string; order: number };

export type TechnicalSubmission = {
  id: string;
  questionId: string;
  language: string;
  code: string;
  explanation: string | null;
  submittedAt: string;
  computedScore: number | null;
  testsTotal: number | null;
  testsPassed: number | null;
};

export type TechnicalTestResult = {
  id: string;
  submissionId: string;
  index: number;
  hidden: boolean;
  passed: boolean;
  expected: string | null;
  actual: string | null;
  errorMessage: string | null;
  durationMs: number | null;
};

export type TechnicalRubricScore = {
  id: string;
  submissionId: string | null;
  questionId: string | null;
  rubricKey: string;
  score: number;
  weight: number;
  comment: string | null;
  reviewerOverride: boolean;
};

export type TechnicalSessionDetail = TechnicalSession & {
  candidateEmail: string;
  candidatePhone: string | null;
  interviewerId: string;
  interviewerName: string;
  interviewerEmail: string;
  questions: TechnicalSessionQuestion[];
  submissions: TechnicalSubmission[];
  testResults: TechnicalTestResult[];
  rubricScores: TechnicalRubricScore[];
  testExecutionAvailable: boolean;
};
