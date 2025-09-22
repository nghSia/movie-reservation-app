import { inject, Injectable } from '@angular/core';
import { Session } from '../../../shared/model/session.model';
import { MovieRoom } from '../../../shared/model/movie-room.model';
import { ReservationService } from '../../reservation/services/reservation.service';
import { MOVIE_ROOMS_MOCK } from '../../../shared/mocks/movie-room-mock';

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

  /** Example session slots per day */
  private readonly BASE_SLOTS = [
    { time: '10:45', roomId: '10', version: 'VOSTFR' as const },
    { time: '12:30', roomId: '1', version: 'VO' as const },
    { time: '14:15', roomId: '10', version: 'VOSTFR' as const },
    { time: '16:00', roomId: '1', version: 'VO' as const },
    { time: '17:45', roomId: '10', version: 'VOSTFR' as const },
    { time: '19:30', roomId: '1', version: 'VO' as const },
    { time: '21:00', roomId: '10', version: 'VOSTFR' as const },
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
    const v_baseDate = this.atLocalMidnight(new Date());
    v_baseDate.setDate(v_baseDate.getDate() + p_dayOffset);

    return this.BASE_SLOTS.map((slot, idx) => {
      const v_startISO = this.isoAtTime(v_baseDate, slot.time);
      const v_endISO = this.addMinutesISO(v_startISO, p_runtime);

      return {
        id: `s-${p_dayOffset}-${idx}`,
        roomId: slot.roomId,
        tmdbId: p_tmdbId,
        start: v_startISO,
        end: v_endISO,
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

  /** Get localtime at midnight */
  private atLocalMidnight(p_date: Date): Date {
    return new Date(p_date.getFullYear(), p_date.getMonth(), p_date.getDate(), 0, 0, 0, 0);
  }

  /** Convert hour string to ISO string */
  private isoAtTime(p_baseDay: Date, p_hour: string): string {
    const [v_hh, v_mm] = p_hour.split(':').map(Number);
    const v_date = new Date(
      p_baseDay.getFullYear(),
      p_baseDay.getMonth(),
      p_baseDay.getDate(),
      v_hh,
      v_mm,
      0,
      0,
    );
    return this.toLocalISO(v_date);
  }

  /** Add minutes to an ISO string date */
  private addMinutesISO(p_startISO: string, p_minutes: number): string {
    const v_date = new Date(p_startISO);
    v_date.setMinutes(v_date.getMinutes() + p_minutes);
    return this.toLocalISO(v_date);
  }

  /** Convert date to local ISO string */
  private toLocalISO(p_date: Date): string {
    const v_pad = (n: number) => String(Math.trunc(Math.abs(n))).padStart(2, '0');

    const v_year = p_date.getFullYear();
    const v_month = v_pad(p_date.getMonth() + 1);
    const v_day = v_pad(p_date.getDate());
    const v_hour = v_pad(p_date.getHours());
    const v_min = v_pad(p_date.getMinutes());
    const v_sec = v_pad(p_date.getSeconds());

    const v_offsetMin = -p_date.getTimezoneOffset();
    const v_sign = v_offsetMin >= 0 ? '+' : '-';
    const v_offH = v_pad(Math.floor(Math.abs(v_offsetMin) / 60));
    const v_offM = v_pad(Math.abs(v_offsetMin) % 60);

    return `${v_year}-${v_month}-${v_day}T${v_hour}:${v_min}:${v_sec}${v_sign}${v_offH}:${v_offM}`;
  }

  /** Check if session is in the past */
  isPastSession(p_sessionView: SessionView): boolean {
    const v_now = Date.now();
    return new Date(p_sessionView.session.start).getTime() <= v_now;
  }
}
