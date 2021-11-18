import axios, { AxiosResponse } from "axios";
import { omdbUrl } from "../constants";
import { config } from "../config";

const OmdbService = {
  getMovie: async (title: string) => {
    let url = omdbUrl(config.API_KEY);
    url += `&t=${title}`;
    let response: AxiosResponse = await axios.post(url);
    return response.data;
  },
};

export default OmdbService;
