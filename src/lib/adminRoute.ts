// Endereço reservado do painel administrativo. O caminho não aparece escrito no código publicado:
// compara-se apenas uma "impressão digital" (hash) do endereço acessado com a do endereço reservado.
// Isto só dificulta a descoberta do endereço. A proteção real é o login e a lista de administradores.

const cyrb53 = (str: string, seed = 0): number => {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const normalize = (pathname: string) => pathname.toLowerCase().replace(/\/+$/, '');

const ADMIN_PATH_HASH = 551036280893772;

export const isAdminPath = (pathname: string): boolean => cyrb53(normalize(pathname)) === ADMIN_PATH_HASH;
