export interface SpotifyExternalUrls {
  spotify?: string;
}

export interface SpotifyImage {
  url: string;
  height?: number | null;
  width?: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  type: string;
  uri: string;
  href?: string;
  external_urls?: SpotifyExternalUrls;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type?: string;
  total_tracks?: number;
  href?: string;
  images: SpotifyImage[];
  release_date?: string;
  release_date_precision?: string;
  artists: SpotifyArtist[];
  external_urls?: SpotifyExternalUrls;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  href?: string;
  preview_url?: string | null;
  duration_ms: number;
  popularity?: number;
  explicit?: boolean;
  artists: SpotifyArtist[];
  album?: SpotifyAlbum;
  external_urls?: SpotifyExternalUrls;
}

export interface AudioFeatures {
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  type: string;
  id: string;
  uri: string;
  track_href: string;
  analysis_url: string;
  duration_ms: number;
  time_signature: number;
}

export interface RecommendationSeed {
  afterFilteringSize: number;
  afterRelinkingSize: number;
  href: string;
  id: string;
  initialPoolSize: number;
  type: string;
}

export interface RecommendationResponse {
  seeds: RecommendationSeed[];
  tracks: SpotifyTrack[];
}

export interface SpotifyErrorResponse {
  error: {
    status: number;
    message: string;
  };
}

export interface SpotifyCurrentlyPlayingResponse {
  item: SpotifyTrack | null;
  is_playing: boolean;
  progress_ms?: number;
  timestamp?: number;
  currently_playing_type?: string;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SpotifySearchResponse {
  tracks: {
    href: string;
    items: SpotifyTrack[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
}

export type PlayerMode = 'live' | 'search' | 'demo';

export interface BpmCategoryTrack extends SpotifyTrack {
  calculatedTempo?: number;
  tempoDifference?: number;
  matchType?: 'exact' | 'similar' | 'halftime' | 'doubletime';
}

export interface DemoSong {
  id: string;
  name: string;
  artist: string;
  album: string;
  genre: string;
  cover: string;
  bpm: number;
  durationMs: number;
  popularity: number;
  features: AudioFeatures;
  previewUrl?: string;
  spotifyUrl?: string;
}

