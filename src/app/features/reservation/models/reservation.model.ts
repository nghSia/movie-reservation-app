export type TicketType = '-16' | '-26' | 'STUDENT' | 'ADULT' | 'SENIOR';
export type ReservationStatus = 'CONFIRMED' | 'CANCELLED';

export interface Reservation {
  id: string;
  userId: string;
  tmdbId: number;
  roomId: string;
  startHour: string;
  endHour: string;
  version: string;
  ticketType: TicketType;
  price: number;
  quantity: number;
  movieTitle?: string;
  moviePosterPath?: string;
  createdAt: string;
  status: ReservationStatus;
}
