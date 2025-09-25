import { inject, Injectable } from '@angular/core';
import { MOVIE_ROOMS_MOCK } from '../../../shared/mocks/movie-room-mock';
import { MovieRoom } from '../../../shared/model/movie-room.model';
import { Session } from '../../../shared/model/session.model';
import { ReservationService } from '../../reservation/services/reservation.service';

export interface SessionView {
  session: Session;
  room: MovieRoom;
  seatsLeft: number;
}

@Injectable({
  providedIn: 'root',
})
export class SessionServices {
  private readonly s_reservation = inject(ReservationService);
  private readonly m_rooms: MovieRoom[] = MOVIE_ROOMS_MOCK;

  private m_sessionIdSeq = 1;

  private nextSessionId(): number {
    return this.m_sessionIdSeq++;
  }
  /** Example session slots per day */
  private readonly BASE_SLOTS = [
    { id: 1, time: '10:45', roomId: 10, version: 'VOSTFR' as const },
    { id: 2, time: '14:15', roomId: 10, version: 'VOSTFR' as const },
    { id: 3, time: '16:00', roomId: 1, version: 'VO' as const },
    { id: 4, time: '19:30', roomId: 1, version: 'VO' as const },
  ];
  /** Get sessions for a movie, split between today and tomorrow */
  getSessionTimesForMovie(
    p_tmdbId: number,
    p_runtimeMinutes: number,
  ): { obs_today: SessionView[]; obs_tomorrow: SessionView[] } {
    const v_todaySessions = this.buildDaySessions(0, p_tmdbId, p_runtimeMinutes);
    const v_tomorrowSessions = this.buildDaySessions(1, p_tmdbId, p_runtimeMinutes);

    return {
      obs_today: this.buildSessionView(v_todaySessions),
      obs_tomorrow: this.buildSessionView(v_tomorrowSessions),
    };
  }

  /** Create sessions for a specific day */
  private buildDaySessions(p_dayOffset: number, p_tmdbId: number, p_runtime: number): Session[] {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + p_dayOffset);

    return this.BASE_SLOTS.map((slot) => {
      const [h, m] = slot.time.split(':').map(Number);
      const v_start = new Date(base);
      v_start.setHours(h, m, 0, 0);

      const v_end = new Date(v_start.getTime() + p_runtime * 60_000);

      return {
        id: slot.id,
        roomId: slot.roomId,
        tmdbId: p_tmdbId,
        start: v_start.toISOString(),
        end: v_end.toISOString(),
        version: slot.version,
      };
    });
  }

  /** build session view from session list */
  private buildSessionView(p_list: Session[]): SessionView[] {
    return p_list.map((v_session) => {
      const v_room = this.m_rooms.find((r) => r.id === v_session.roomId)!;
      const v_seatsLeft = this.s_reservation.seatsLeft(v_room, {
        id: v_session.id,
        roomId: v_session.roomId,
        tmdbId: v_session.tmdbId,
        start: v_session.start,
        end: v_session.end,
        version: v_session.version,
      });
      return { session: v_session, room: v_room, seatsLeft: v_seatsLeft };
    });
  }

  /** Check if session is in the past */
  isPastSession(p_sessionView: SessionView): boolean {
    const v_now = Date.now();
    return new Date(p_sessionView.session.start).getTime() <= v_now;
  }
}
