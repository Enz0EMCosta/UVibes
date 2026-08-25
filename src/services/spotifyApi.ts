import { getSpotifyClientConfig } from '../config/env';
import type {
  AudioFeatures,
  RecommendationResponse,
  SpotifyCurrentlyPlayingResponse,
  SpotifyDevicesResponse,
  SpotifyErrorResponse,
  SpotifySearchResponse,
  SpotifyTokenResponse,
  SpotifyTrack,
} from '../types/spotify';

const SPOTIFY_ACCOUNT_BASE_URL = 'https://accounts.spotify.com';
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';

const AUTH_STORAGE_KEYS = {
  verifier: 'uvibes_spotify_code_verifier',
  state: 'uvibes_spotify_auth_state',
  token: 'uvibes_spotify_token',
};

type StoredSpotifyToken = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
};

const base64UrlEncode = (value: ArrayBuffer | Uint8Array): string => {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);

  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);

  crypto.getRandomValues(array);

  return base64UrlEncode(array);
};

const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier));

  return base64UrlEncode(digest);
};

const readStoredToken = (): StoredSpotifyToken | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const item = window.localStorage.getItem(AUTH_STORAGE_KEYS.token);

  if (!item) {
    return null;
  }

  try {
    return JSON.parse(item) as StoredSpotifyToken;
  } catch {
    return null;
  }
};

const writeStoredToken = (token: SpotifyTokenResponse, refreshToken?: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: StoredSpotifyToken = {
    access_token: token.access_token,
    refresh_token: refreshToken ?? token.refresh_token ?? readStoredToken()?.refresh_token,
    expires_at: Date.now() + token.expires_in * 1000,
  };

  window.localStorage.setItem(AUTH_STORAGE_KEYS.token, JSON.stringify(payload));
};

const clearStoredToken = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEYS.token);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.verifier);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.state);
};

const isTokenValid = (token: StoredSpotifyToken | null): boolean => {
  if (!token) {
    return false;
  }

  return token.expires_at > Date.now() + 60_000;
};

export const buildSpotifyAuthUrl = async (): Promise<string> => {
  const { spotifyClientId, redirectUri } = getSpotifyClientConfig();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(AUTH_STORAGE_KEYS.verifier, codeVerifier);
    window.sessionStorage.setItem(AUTH_STORAGE_KEYS.state, state);
  }

  const params = new URLSearchParams({
    client_id: spotifyClientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
    scope: ['user-read-currently-playing', 'user-read-playback-state', 'user-modify-playback-state'].join(' '),
  });

  return `${SPOTIFY_ACCOUNT_BASE_URL}/authorize?${params.toString()}`;
};

export const authorizeWithSpotify = async (): Promise<void> => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.verifier);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.state);
  }

  const authUrl = await buildSpotifyAuthUrl();

  window.location.assign(authUrl);
};

export const completeSpotifyPkceLogin = async (): Promise<SpotifyTokenResponse> => {
  if (typeof window === 'undefined') {
    throw new Error('Spotify PKCE login can only run in the browser.');
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const sessionState = window.sessionStorage.getItem(AUTH_STORAGE_KEYS.state);
  const codeVerifier = window.sessionStorage.getItem(AUTH_STORAGE_KEYS.verifier);

  if (!code || !state || !codeVerifier || !sessionState || sessionState !== state) {
    throw new Error('Spotify auth callback is invalid or missing required values.');
  }

  const { spotifyClientId, redirectUri } = getSpotifyClientConfig();
  const token = await exchangeCodeForToken(code, redirectUri, spotifyClientId, codeVerifier);

  writeStoredToken(token);

  window.history.replaceState({}, document.title, window.location.pathname);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.verifier);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.state);

  return token;
};

export const exchangeCodeForToken = async (
  code: string,
  redirectUri: string,
  clientId: string,
  codeVerifier: string
): Promise<SpotifyTokenResponse> => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${SPOTIFY_ACCOUNT_BASE_URL}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | (SpotifyErrorResponse & { error_description?: string; error?: string | { message?: string } })
      | null;
    const code = typeof error?.error === 'string' ? error.error : undefined;
    const detail = code ?? error?.error?.message;

    if (code === 'invalid_grant') {
      throw new Error('Código OAuth inválido ou expirado. Inicie a conexão novamente sem recarregar a página.');
    }

    if (code === 'invalid_client') {
      throw new Error('Client ID do Spotify inválido. Confira VITE_SPOTIFY_CLIENT_ID na Vercel.');
    }

    throw new Error(error?.error_description ?? detail ?? `Falha ao trocar o código do Spotify (${response.status}).`);
  }

  return (await response.json()) as SpotifyTokenResponse;
};

export const refreshSpotifyToken = async (refreshToken: string): Promise<SpotifyTokenResponse> => {
  const { spotifyClientId } = getSpotifyClientConfig();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: spotifyClientId,
  });

  const response = await fetch(`${SPOTIFY_ACCOUNT_BASE_URL}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: { message: 'Failed to refresh Spotify token.' } }))) as SpotifyErrorResponse;
    throw new Error(error.error?.message ?? 'Failed to refresh Spotify token.');
  }

  const data = (await response.json()) as SpotifyTokenResponse;

  const storedToken = readStoredToken();

  writeStoredToken(data, storedToken?.refresh_token ?? refreshToken);

  return data;
};

export const getAccessToken = async (): Promise<string | null> => {
  const storedToken = readStoredToken();

  if (storedToken && isTokenValid(storedToken)) {
    return storedToken.access_token;
  }

  if (storedToken?.refresh_token) {
    try {
      const refreshedToken = await refreshSpotifyToken(storedToken.refresh_token);
      return refreshedToken.access_token;
    } catch (error) {
      clearStoredToken();
      throw error;
    }
  }

  return null;
};

const fetchSpotify = async <T>(path: string, init: RequestInit = {}): Promise<T | null> => {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Você precisa conectar sua conta do Spotify para buscar ou analisar faixas ao vivo.');
  }

  const response = await fetch(`${SPOTIFY_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  if (response.status === 401) {
    clearStoredToken();
    throw new Error('Sua sessão do Spotify expirou. Por favor, conecte-se novamente.');
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: { message: `Spotify API error (${response.status})` } }))) as SpotifyErrorResponse;
    throw new Error(error.error?.message ?? `Erro na API do Spotify (${response.status}).`);
  }

  return (await response.json()) as T;
};

export const searchSpotify = async (
  query: string,
  type: 'track' | 'artist' = 'track',
  limit = 8
): Promise<SpotifySearchResponse> => {
  const params = new URLSearchParams({
    q: query,
    type,
    limit: String(limit),
  });

  const result = await fetchSpotify<SpotifySearchResponse>(`/search?${params.toString()}`);

  if (!result || !result.tracks) {
    throw new Error('Nenhuma música encontrada para a busca.');
  }

  return result;
};

export const getCurrentTrack = async (): Promise<SpotifyTrack | null> => {
  const response = await fetchSpotify<SpotifyCurrentlyPlayingResponse>('/me/player/currently-playing');

  if (!response || !response.item) {
    return null;
  }

  return response.item;
};

export const startPlayback = async (trackUri: string): Promise<void> => {
  const devices = await fetchSpotify<SpotifyDevicesResponse>('/me/player/devices');
  const availableDevice = devices?.devices.find((device) => device.is_active && !device.is_restricted)
    ?? devices?.devices.find((device) => !device.is_restricted);

  if (!availableDevice) {
    throw new Error('Abra o Spotify em um dispositivo ativo antes de trocar a música.');
  }

  await fetchSpotify<void>(`/me/player/play?device_id=${encodeURIComponent(availableDevice.id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris: [trackUri] }),
  });
};

const generateEstimatedFeatures = (trackId: string, durationMs = 210000): AudioFeatures => {
  // Deterministic pseudo-random generation based on trackId for consistent offline/fallback analysis
  let hash = 0;
  for (let i = 0; i < trackId.length; i++) {
    hash = (hash << 5) - hash + trackId.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const bpmList = [95, 100, 105, 110, 115, 120, 124, 126, 128, 130, 132, 135, 140, 150, 160, 172];
  const tempo = bpmList[absHash % bpmList.length] + ((absHash % 10) * 0.1);
  const danceability = Number((0.45 + ((absHash % 50) / 100)).toFixed(2));
  const energy = Number((0.50 + (((absHash >> 2) % 45) / 100)).toFixed(2));
  const valence = Number((0.30 + (((absHash >> 4) % 65) / 100)).toFixed(2));
  const acousticness = Number((0.02 + (((absHash >> 6) % 30) / 100)).toFixed(2));

  return {
    id: trackId,
    uri: `spotify:track:${trackId}`,
    track_href: `${SPOTIFY_API_BASE_URL}/tracks/${trackId}`,
    analysis_url: '',
    type: 'audio_features',
    tempo,
    danceability,
    energy,
    valence,
    acousticness,
    instrumentalness: ((absHash >> 8) % 100) > 80 ? 0.75 : 0.01,
    liveness: 0.12,
    speechiness: 0.05,
    key: absHash % 12,
    loudness: -6.5,
    mode: (absHash % 2) as 0 | 1,
    duration_ms: durationMs,
    time_signature: 4,
  };
};

export const getAudioFeatures = async (trackId: string, durationMs?: number): Promise<AudioFeatures> => {
  // Spotify currently restricts this endpoint for some applications.
  return generateEstimatedFeatures(trackId, durationMs);
};

export const getRecommendations = async ({
  seed_tracks,
  target_tempo,
  seed_artist_name,
  limit = 10,
}: {
  seed_artists?: string[];
  seed_genres?: string[];
  seed_tracks?: string[];
  target_tempo?: number;
  min_tempo?: number;
  max_tempo?: number;
  seed_artist_name?: string;
  limit?: number;
}): Promise<RecommendationResponse> => {
  try {
    if (seed_artist_name) {
      const fallbackSearch = await searchSpotify(seed_artist_name, 'track', limit + 8);
      return {
        seeds: [],
        tracks: fallbackSearch.tracks.items
          .filter((track) => track.artists?.some((artist) => artist.name.toLowerCase().includes(seed_artist_name.toLowerCase())))
          .filter((track) => track.id !== seed_tracks?.[0])
          .sort((first, second) => {
            const firstBpm = generateEstimatedFeatures(first.id, first.duration_ms).tempo;
            const secondBpm = generateEstimatedFeatures(second.id, second.duration_ms).tempo;
            return Math.abs(firstBpm - (target_tempo ?? 120)) - Math.abs(secondBpm - (target_tempo ?? 120));
          })
          .slice(0, limit),
      };
    }

    return { seeds: [], tracks: [] };
  } catch {
    return {
      seeds: [],
      tracks: [],
    };
  }
};

export const logoutSpotify = (): void => {
  clearStoredToken();
};

export const isUserLoggedIn = (): boolean => {
  const token = readStoredToken();
  return Boolean(token && isTokenValid(token));
};

export const spotifyApi = {
  authorizeWithSpotify,
  completeSpotifyPkceLogin,
  getAccessToken,
  getCurrentTrack,
  startPlayback,
  getAudioFeatures,
  getRecommendations,
  searchSpotify,
  logoutSpotify,
  isUserLoggedIn,
};

