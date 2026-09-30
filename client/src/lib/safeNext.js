// Only in-site paths are allowed as a post-login destination, so a crafted
// ?next=//evil.example link can't bounce users off the site.
export function safeNext(value, fallback = '/') {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : fallback;
}
