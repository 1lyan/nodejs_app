export const noAppPortMsg = "Please, provide APP_PORT";
export const noEnvMsg = "Please, provide ENV";
export const noApiKeyMsg = "Please, provide API_KEY";
export const defaultScore = "1";

export const omdbUrl = (apiKey: string | undefined) => {
  return `https://www.omdbapi.com/?plot=full&apikey=${apiKey}`;
};

export const DB_URL = "mongodb://localhost:27017/moviesDB";