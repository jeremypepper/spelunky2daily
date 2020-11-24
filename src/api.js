

const baseUrl =  (window.location.hostname === "localhost")
    ? "http://localhost:8010/proxy"
    : "https://spelunky2daily.s3-us-west-2.amazonaws.com"
export function fetchPath(path) {
  return fetch(baseUrl + path);
}
