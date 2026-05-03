export function setAuthCookie() {
  document.cookie = '__session=1; max-age=86400; path=/; SameSite=Strict';
}

export function clearAuthCookie() {
  document.cookie = '__session=; max-age=0; path=/; SameSite=Strict';
}
