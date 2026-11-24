/* =========================================================
   Funzioni condivise dal pannello e dalla pagina di setup.
   - cifratura della chiave GitHub con la password (AES-GCM + PBKDF2)
   - lettura / scrittura dei file nel repository tramite API GitHub
   ========================================================= */
const Core = (() => {
  const ITER = 600000;
  const te = new TextEncoder(), td = new TextDecoder();

  const bytesToB64 = bytes => {
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  const b64ToBytes = b64 => Uint8Array.from(atob(b64.replace(/\s/g, "")), c => c.charCodeAt(0));
  const utf8ToB64 = s => bytesToB64(te.encode(s));
  const b64ToUtf8 = b => td.decode(b64ToBytes(b));

  async function deriveKey(password, salt, iter) {
    const base = await crypto.subtle.importKey("raw", te.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function encrypt(text, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt, ITER);
    const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(text)));
    return { v: 1, iter: ITER, salt: bytesToB64(salt), iv: bytesToB64(iv), data: bytesToB64(data) };
  }
  async function decrypt(enc, password) {
    const key = await deriveKey(password, b64ToBytes(enc.salt), enc.iter);
    const out = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(enc.iv) }, key, b64ToBytes(enc.data));
    return td.decode(out); // se la password è sbagliata viene lanciato un errore
  }

  function configJs(cfg) {
    return "/* File generato automaticamente da admin/setup.html — non modificarlo a mano. */\n"
      + "window.MENU_ADMIN_CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n";
  }

  function errorText(status) {
    return status === 401 ? "La chiave di accesso del sito non è più valida (forse è scaduta). Contatta chi ha realizzato il sito."
      : status === 403 ? "Il sito non ha il permesso di salvare. Contatta chi ha realizzato il sito."
      : status === 404 ? "File del menù non trovato. Contatta chi ha realizzato il sito."
      : status === 409 || status === 422 ? "Il menù è stato modificato da un altro dispositivo nello stesso momento. Ricarica la pagina e riprova."
      : status === 0 ? "Connessione assente. Controlla internet e riprova."
      : `Errore imprevisto (${status}). Riprova tra poco.`;
  }

  /* repo = {owner, repo, branch, token} */
  async function gh(repo, path, method = "GET", body) {
    const url = `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/contents/`
      + path.split("/").map(encodeURIComponent).join("/")
      + (method === "GET" ? `?ref=${encodeURIComponent(repo.branch)}&t=${Date.now()}` : "");
    let r;
    try {
      r = await fetch(url, {
        method, cache: "no-store",
        headers: { "Authorization": `Bearer ${repo.token}`, "Accept": "application/vnd.github+json",
                   ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined
      });
    } catch { const e = new Error(errorText(0)); e.status = 0; throw e; }
    if (!r.ok) { const e = new Error(errorText(r.status)); e.status = r.status; throw e; }
    return r.json();
  }
  async function readFile(repo, path) {
    const j = await gh(repo, path, "GET");
    return { text: b64ToUtf8(j.content), sha: j.sha };
  }
  async function writeFile(repo, path, text, sha, message) {
    const body = { message, content: utf8ToB64(text), branch: repo.branch };
    if (sha) body.sha = sha;
    const j = await gh(repo, path, "PUT", body);
    return j.content.sha;
  }
  async function shaOf(repo, path) {
    try { return (await gh(repo, path, "GET")).sha; }
    catch (e) { if (e.status === 404) return null; throw e; }
  }

  return { encrypt, decrypt, configJs, readFile, writeFile, shaOf, errorText };
})();
