export type MovieVersion = 'VO' | 'VOSTFR' | 'VF';

export interface Session {
  id: number;
  roomId: number;
  tmdbId: number;
  start: string;
  end: string;
  version: MovieVersion;
}
