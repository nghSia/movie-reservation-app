export type MovieVersion = 'VO' | 'VOSTFR' | 'VF';

export interface Session {
  id: string;
  roomId: string;
  tmdbId: number;
  start: string;
  end: string;
  version: MovieVersion;
}
