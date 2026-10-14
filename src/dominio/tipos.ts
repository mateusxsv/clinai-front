export type Role = "patient" | "doctor";
export interface Health {
  chronic: string;
  allergies: string;
  reaction: string;
  medications: string;
  surgeries: string;
  support: string;
}
export interface Profile {
  id: string;
  name: string;
  email: string;
  birth: string;
  phone: string;
  role: Role;
  health: Health;
}
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  rating?: number;
  reviews?: number;
  plans: string[];
  price?: number;
  initials: string;
  image?: string;
}
export interface Report {
  complaint: string;
  onset: string;
  location: string;
  evolution: string;
  pain: number;
  other: string;
  medication: string;
  pregnancy: string;
}
export interface Appointment {
  id: string;
  doctorId: string;
  patientName: string;
  date: string;
  time: string;
  plan: string;
  status: "scheduled" | "confirmed" | "cancelled";
  report?: Report;
  health: Health;
  reviewed: boolean;
}
export interface Availability {
  date: string;
  start: string;
  end: string;
  duration: number;
}
export interface ClinAiService {
  getSession(): Promise<Profile | null>;
  getSlots(doctorId: string, date: string): Promise<string[]>;
  login(email: string, password: string, role: Role): Promise<Profile>;
  register(profile: Omit<Profile, "id">, password: string): Promise<Profile>;
  recover(email: string): Promise<void>;
  getDoctors(): Promise<Doctor[]>;
  saveProfile(profile: Profile): Promise<Profile>;
  getAppointments(): Promise<Appointment[]>;
  book(
    input: Omit<Appointment, "id" | "status" | "reviewed">,
  ): Promise<Appointment>;
  updateAppointment(
    id: string,
    patch: Partial<Pick<Appointment, "status" | "reviewed">>,
  ): Promise<Appointment>;
  getAvailability(): Promise<Availability[]>;
  saveAvailability(value: Availability): Promise<void>;
  logout(): Promise<void>;
}
