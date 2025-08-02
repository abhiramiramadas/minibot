export function encode(str) {
  return btoa(str);
}

export function decode(str) {
  return atob(str);
}