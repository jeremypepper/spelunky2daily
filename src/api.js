import {getPlayerName} from "./utils";


const baseUrl =  (window.location.hostname === "localhost")
    ? "http://localhost:8010/proxy"
    : "https://spelunky2daily.s3-us-west-2.amazonaws.com"
export function fetchPath(path) {
  return fetch(baseUrl + path);
}

export function fetchPlayer(playerName) {
  return fetch("https://tfyx29y4wl.execute-api.us-west-2.amazonaws.com/prod/player?name="+
      getPlayerName(playerName))
      .then((response) => response.json())
      .then(data=>data?.data)
}
