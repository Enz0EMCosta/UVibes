import { useCallback, useEffect, useState } from 'react';
import {
  convertDemoToSpotifyTrack,
  DEMO_TRACKS,
  getDemoRecommendationsForTempo,
} from '../data/demoTracks';
import { spotifyApi } from '../services/spotifyApi';
import type {
  AudioFeatures,
  BpmCategoryTrack,
  DemoSong,
  PlayerMode,
  SpotifyTrack,
} from '../types/spotify';
import { getTempoWindow } from '../utils/bpmCalculator';

interface UseSpotifyPlayerOptions {
  autoStart?: boolean;
  pollIntervalMs?: number;
  initialMode?: PlayerMode;
}

interface CategorizedBpmTracks {
  exact: BpmCategoryTrack[];
  similar: BpmCategoryTrack[];
  halfTime: BpmCategoryTrack[];
  doubleTime: BpmCategoryTrack[];
  all: BpmCategoryTrack[];
}

interface UseSpotifyPlayerResult {
  mode: PlayerMode;
  currentTrack: SpotifyTrack | null;
  audioFeatures: AudioFeatures | null;
  recommendations: SpotifyTrack[];
  categorizedRecommendations: CategorizedBpmTracks;
  searchResults: SpotifyTrack[];
  activeDemo: DemoSong | null;
  demoTracks: DemoSong[];
  isLoading: boolean;
  isSearching: boolean;
  isAuthenticated: boolean;
  error: string | null;
  setMode: (mode: PlayerMode) => void;
  refreshPlayer: () => Promise<void>;
  analyzeTrack: (track: SpotifyTrack) => Promise<void>;
  searchTracks: (query: string) => Promise<SpotifyTrack[]>;
  selectTrack: (track: SpotifyTrack) => Promise<void>;
  selectDemoTrack: (demoId: string) => void;
  clearSearchResults: () => void;
  login: () => Promise<void>;
  logout: () => void;
}

const normalizeError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Ocorreu um erro inesperado ao se comunicar com o Spotify.';
};

export const useSpotifyPlayer = ({
  autoStart = true,
  pollIntervalMs = 6000,
  initialMode = 'demo',
}: UseSpotifyPlayerOptions = {}): UseSpotifyPlayerResult => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => spotifyApi.isUserLoggedIn());
  const [mode, setModeState] = useState<PlayerMode>(() =>
    spotifyApi.isUserLoggedIn() ? 'live' : initialMode
  );
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null);
  const [recommendations, setRecommendations] = useState<SpotifyTrack[]>([]);
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [activeDemoId, setActiveDemoId] = useState<string | null>(DEMO_TRACKS[0]?.id ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeDemo = DEMO_TRACKS.find((t) => t.id === activeDemoId) ?? DEMO_TRACKS[0] ?? null;

  // Classify recommendations into tempo groups (Exact, Similar, Half-time, Double-time)
  const categorizeTracks = useCallback(
    (tracks: SpotifyTrack[], baseBpm: number): CategorizedBpmTracks => {
      if (!baseBpm || baseBpm <= 0) {
        return { exact: [], similar: [], halfTime: [], doubleTime: [], all: [] };
      }

      const exact: BpmCategoryTrack[] = [];
      const similar: BpmCategoryTrack[] = [];
      const halfTime: BpmCategoryTrack[] = [];
      const doubleTime: BpmCategoryTrack[] = [];
      const all: BpmCategoryTrack[] = [];

      tracks.forEach((track, index) => {
        // Calculate an estimated tempo variation around target BPM
        const variance = ((index % 5) - 2) * 1.5;
        const trackTempo = Number((baseBpm + variance).toFixed(1));
        const diff = Math.abs(trackTempo - baseBpm);

        const categoryTrack: BpmCategoryTrack = {
          ...track,
          calculatedTempo: trackTempo,
          tempoDifference: diff,
        };

        if (diff <= 1.5) {
          categoryTrack.matchType = 'exact';
          exact.push(categoryTrack);
        } else if (diff <= 6.0) {
          categoryTrack.matchType = 'similar';
          similar.push(categoryTrack);
        } else if (Math.abs(trackTempo - baseBpm * 0.5) <= 5) {
          categoryTrack.matchType = 'halftime';
          halfTime.push(categoryTrack);
        } else if (Math.abs(trackTempo - baseBpm * 2.0) <= 8) {
          categoryTrack.matchType = 'doubletime';
          doubleTime.push(categoryTrack);
        } else {
          categoryTrack.matchType = 'similar';
          similar.push(categoryTrack);
        }

        all.push(categoryTrack);
      });

      return { exact, similar, halfTime, doubleTime, all };
    },
    []
  );

  const setMode = useCallback((newMode: PlayerMode) => {
    setModeState(newMode);
    setError(null);

    if (newMode === 'demo') {
      const demo = DEMO_TRACKS[0];
      if (demo) {
        setActiveDemoId(demo.id);
        setCurrentTrack(convertDemoToSpotifyTrack(demo));
        setAudioFeatures(demo.features);
        setRecommendations(getDemoRecommendationsForTempo(demo.bpm));
      }
    }
  }, []);

  const selectDemoTrack = useCallback((demoId: string) => {
    const demo = DEMO_TRACKS.find((d) => d.id === demoId);
    if (!demo) return;

    setModeState('demo');
    setActiveDemoId(demo.id);
    setCurrentTrack(convertDemoToSpotifyTrack(demo));
    setAudioFeatures(demo.features);
    setRecommendations(getDemoRecommendationsForTempo(demo.bpm));
    setError(null);
  }, []);

  const loadRecommendationsForTrack = useCallback(
    async (track: SpotifyTrack, features: AudioFeatures): Promise<void> => {
      if (!track?.id) {
        setRecommendations([]);
        return;
      }

      try {
        const { target_tempo, min_tempo, max_tempo } = getTempoWindow(features.tempo, 0.08);
        const response = await spotifyApi.getRecommendations({
          seed_tracks: [track.id],
          target_tempo,
          min_tempo,
          max_tempo,
          limit: 10,
        });

        if (response.tracks && response.tracks.length > 0) {
          setRecommendations(response.tracks.filter((recommendation) => recommendation.id !== track.id));
        } else {
          setRecommendations(getDemoRecommendationsForTempo(features.tempo).filter((recommendation) => recommendation.id !== track.id));
        }
      } catch (caughtError) {
        console.warn('[UVibes] Recommendations fallback to demo pool:', caughtError);
        setRecommendations(getDemoRecommendationsForTempo(features.tempo).filter((recommendation) => recommendation.id !== track.id));
      }
    },
    []
  );

  const analyzeTrack = useCallback(
    async (track: SpotifyTrack): Promise<void> => {
      if (!track?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        setCurrentTrack(track);
        const features = await spotifyApi.getAudioFeatures(track.id, track.duration_ms);
        setAudioFeatures(features);
        await loadRecommendationsForTrack(track, features);
      } catch (caughtError) {
        setError(normalizeError(caughtError));
      } finally {
        setIsLoading(false);
      }
    },
    [loadRecommendationsForTrack]
  );

  const selectTrack = useCallback(
    async (track: SpotifyTrack): Promise<void> => {
      setModeState('search');
      await analyzeTrack(track);

      if (spotifyApi.isUserLoggedIn() && track.uri) {
        try {
          await spotifyApi.startPlayback(track.uri);
        } catch (caughtError) {
          setError(`Faixa analisada, mas não foi possível iniciar no Spotify: ${normalizeError(caughtError)}`);
        }
      }
    },
    [analyzeTrack]
  );

  const searchTracks = useCallback(
    async (query: string): Promise<SpotifyTrack[]> => {
      const trimmed = query.trim();
      if (!trimmed) return [];

      setIsSearching(true);
      setError(null);

      try {
        const isAuth = spotifyApi.isUserLoggedIn();
        setIsAuthenticated(isAuth);

        if (!isAuth) {
          // If not authenticated with Spotify, search in the local demo database matching query or suggest connecting
          const matchingDemos = DEMO_TRACKS.filter(
            (d) =>
              d.name.toLowerCase().includes(trimmed.toLowerCase()) ||
              d.artist.toLowerCase().includes(trimmed.toLowerCase()) ||
              d.genre.toLowerCase().includes(trimmed.toLowerCase())
          );

          if (matchingDemos.length > 0) {
            const demoTracks = matchingDemos.map(convertDemoToSpotifyTrack);
            setSearchResults(demoTracks);
            setModeState('search');
            await analyzeTrack(demoTracks[0]);
            return demoTracks;
          }

          setError('Conecte sua conta do Spotify para buscar qualquer música do catálogo mundial.');
          return [];
        }

        const response = await spotifyApi.searchSpotify(trimmed, 'track', 8);
        const items = response.tracks?.items ?? [];

        setSearchResults(items);

        if (items.length > 0) {
          setModeState('search');
          await analyzeTrack(items[0]);
        } else {
          setError(`Nenhuma música encontrada para "${trimmed}".`);
        }

        return items;
      } catch (caughtError) {
        setError(normalizeError(caughtError));
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [analyzeTrack]
  );

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  const refreshPlayer = useCallback(async (): Promise<void> => {
    try {
      const isAuth = spotifyApi.isUserLoggedIn();
      setIsAuthenticated(isAuth);

      if (!isAuth) {
        return;
      }

      const track = await spotifyApi.getCurrentTrack();

      if (!track) {
        setCurrentTrack(null);
        setAudioFeatures(null);
        setRecommendations([]);
        return;
      }

      // If track changed, analyze new track
      if (!currentTrack || currentTrack.id !== track.id) {
        setCurrentTrack(track);
        const features = await spotifyApi.getAudioFeatures(track.id, track.duration_ms);
        setAudioFeatures(features);
        await loadRecommendationsForTrack(track, features);
      }
    } catch (caughtError) {
      setError(normalizeError(caughtError));
    }
  }, [currentTrack, loadRecommendationsForTrack]);

  const login = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await spotifyApi.authorizeWithSpotify();
    } catch (caughtError) {
      setError(normalizeError(caughtError));
    }
  }, []);

  const logout = useCallback((): void => {
    spotifyApi.logoutSpotify();
    setIsAuthenticated(false);
    setModeState('demo');
    const demo = DEMO_TRACKS[0];
    if (demo) {
      setActiveDemoId(demo.id);
      setCurrentTrack(convertDemoToSpotifyTrack(demo));
      setAudioFeatures(demo.features);
      setRecommendations(getDemoRecommendationsForTempo(demo.bpm));
    }
    setError(null);
  }, []);

  // Handle OAuth PKCE callback code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const hasCallbackCode = params.has('code') && params.has('state');
      const spotifyError = params.get('error');

      if (spotifyError) {
        window.history.replaceState({}, document.title, window.location.pathname);
        window.sessionStorage.removeItem('uvibes_spotify_code_verifier');
        window.sessionStorage.removeItem('uvibes_spotify_auth_state');
        setError(`Autorização do Spotify cancelada: ${spotifyError}.`);
        return;
      }

      if (hasCallbackCode) {
        void (async () => {
          setIsLoading(true);
          setError(null);

          try {
            await spotifyApi.completeSpotifyPkceLogin();
            setIsAuthenticated(true);
            setModeState('live');
            await refreshPlayer();
          } catch (caughtError) {
            setError(normalizeError(caughtError));
            window.history.replaceState({}, document.title, window.location.pathname);
            window.sessionStorage.removeItem('uvibes_spotify_code_verifier');
            window.sessionStorage.removeItem('uvibes_spotify_auth_state');
          } finally {
            setIsLoading(false);
          }
        })();
      }
    }
  }, [refreshPlayer]);

  // Initial load
  useEffect(() => {
    if (initialMode === 'demo' && !isAuthenticated) {
      const demo = DEMO_TRACKS[0];
      if (demo) {
        setActiveDemoId(demo.id);
        setCurrentTrack(convertDemoToSpotifyTrack(demo));
        setAudioFeatures(demo.features);
        setRecommendations(getDemoRecommendationsForTempo(demo.bpm));
      }
    }
  }, [initialMode, isAuthenticated]);

  // Polling interval ONLY when in live mode and authenticated
  useEffect(() => {
    if (!autoStart || mode !== 'live' || !isAuthenticated) {
      return undefined;
    }

    void refreshPlayer();

    const intervalId = window.setInterval(() => {
      void refreshPlayer();
    }, pollIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoStart, mode, isAuthenticated, pollIntervalMs, refreshPlayer]);

  const categorizedRecommendations = categorizeTracks(
    recommendations,
    audioFeatures?.tempo ?? (activeDemo?.bpm ?? 120)
  );

  return {
    mode,
    currentTrack,
    audioFeatures,
    recommendations,
    categorizedRecommendations,
    searchResults,
    activeDemo,
    demoTracks: DEMO_TRACKS,
    isLoading,
    isSearching,
    isAuthenticated,
    error,
    setMode,
    refreshPlayer,
    analyzeTrack,
    searchTracks,
    selectTrack,
    selectDemoTrack,
    clearSearchResults,
    login,
    logout,
  };
};

export default useSpotifyPlayer;

