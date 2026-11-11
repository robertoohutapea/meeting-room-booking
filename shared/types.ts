import type { EQUIPMENT, RoomId } from "./config";
export interface Booking {
  date: string;
  roomId: RoomId;
  startTime: string;
  endTime: string;
  requesterName: string;
  department: string;
  internalPhone: string;
  subject: string;
  equipment: (keyof typeof EQUIPMENT)[];
  email: string;
}
export interface BusyPeriod {
  start: string;
  end: string;
}
export interface Availability {
  date: string;
  room: RoomId;
  busy: BusyPeriod[];
}
