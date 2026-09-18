export type Candidate = {
  id: string;
  positionId?: string | null;
  name: string;
  initials: string;
  email: string;
  phone: string | null;
  birthDate?: string | null;
  district: string | null;
  foreignLanguage: string | null;
  totalWorkExperience: string | null;
  field: string | null;
  militaryStatus:
    | "yapildi"
    | "yapilmadi"
    | "tecilli"
    | "muaf"
    | null;
  hasDriverLicense: boolean | null;
  driverLicenseType: string | null;
  activelyDriving: boolean | null;
  cvUrl?: string | null;
  createdAt?: string;
  score?: number | null;
  tags?: string[];
};

export type Position = {
  id: string;
  title: string;
  department: string;
  type: string;
  status: "Açık" | "Kapalı";
};

export type RecruitmentContext = {
  search: string;
  positions: Position[];
  candidates: Candidate[];
  dataLoading: boolean;
  dataError: boolean;
};
export type CalendarAppointment = {
  id: string;
  startAt: string;
  isBooked: boolean;

  bookingId: string | null;
  bookingCreatedAt: string | null;

  candidateId: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  candidatePhone: string | null;

  positionId: string | null;
  positionTitle: string | null;
};
