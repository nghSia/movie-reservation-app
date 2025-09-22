export type TicketType = '-16' | '-26' | 'STUDENT' | 'ADULT' | 'SENIOR';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Reservation {
  id: number;
  userId: number;
  tmdbId: number;
  roomId: number;
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
