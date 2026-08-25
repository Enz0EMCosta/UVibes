type SpotifyEnv = {
  spotifyClientId: string;
  redirectUri: string;
};

const getRedirectUri = (): string => {
  if (typeof window !== 'undefined') {
    // The URI used in authorize and token exchange must be identical.
    return window.location.origin;
  }

  const envRedirect = import.meta.env.VITE_REDIRECT_URI;
  if (envRedirect) {
    return envRedirect.replace(/\/+$/, '');
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

