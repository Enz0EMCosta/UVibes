type SpotifyEnv = {
  spotifyClientId: string;
  redirectUri: string;
};

const getRedirectUri = (): string => {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return window.location.origin;
    }
  }

  const envRedirect = import.meta.env.VITE_REDIRECT_URI;
  if (envRedirect) {
    return envRedirect.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:5173';
};

export const getSpotifyClientConfig = (): SpotifyEnv => {
  const spotifyClientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = getRedirectUri();

  if (!spotifyClientId) {
    throw new Error(
      'Spotify Client ID is missing. Please set VITE_SPOTIFY_CLIENT_ID in your environment.'
    );
  }

  return {
    spotifyClientId,
    redirectUri,
  };
};

export const hasSpotifyConfig = Boolean(
  import.meta.env.VITE_SPOTIFY_CLIENT_ID
);

export default {
  getSpotifyClientConfig,
  hasSpotifyConfig,
};

