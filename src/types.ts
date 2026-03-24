export interface Test {
  id: string;
  patientName: string;
  patientId: string;
  type: string;
  requestedDate: string;
  status: "Results ready" | "In progress" | "Pending" | "Delayed";
  waitingDays: number;
  location: string;
  timeSlot: string;
  progress: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  reason?: string;
  status: "Upcoming" | "Completed" | "Cancelled";
  reminderSent: boolean;
}

export interface MedicalHistoryEntry {
  item: string;
  timestamp: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  primaryPhysician: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory: {
    illnesses: MedicalHistoryEntry[];
    surgeries: MedicalHistoryEntry[];
    chronicConditions: MedicalHistoryEntry[];
  };
}

export type UserRole = "patient" | "staff";

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  patientId?: string;
}
