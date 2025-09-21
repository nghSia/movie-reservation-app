import { Session } from '../../features/reservation/models/session.model';

export const SCREENINGS_MOCK: Session[] = [
  {
    id: 's-1-0900',
    roomId: '1',
    tmdbId: 872585,
    start: '2025-09-22T09:00:00+02:00',
    end: '2025-09-22T12:00:00+02:00',
  },
  {
    id: 's-1-1300',
    roomId: '1',
    tmdbId: 872585,
    start: '2025-09-22T13:00:00+02:00',
    end: '2025-09-22T16:00:00+02:00',
  },
  {
    id: 's-1-1700',
    roomId: '1',
    tmdbId: 872585,
    start: '2025-09-22T17:00:00+02:00',
    end: '2025-09-22T20:00:00+02:00',
  },
  {
    id: 's-1-2100',
    roomId: '1',
    tmdbId: 872585,
    start: '2025-09-22T21:00:00+02:00',
    end: '2025-09-22T23:59:00+02:00',
  },
];
