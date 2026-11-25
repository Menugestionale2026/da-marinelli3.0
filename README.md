# Marinelli 3.0 — Menù digitale

| Indirizzo | A cosa serve | Chi lo usa |
|---|---|---|
| `https://<utente>.github.io/<repo>/` | Il **menù** per i clienti (anche via QR code) | Clienti |
| `https://<utente>.github.io/<repo>/admin/` | Il **pannello** per cambiare piatti e prezzi, **solo con password** | Proprietari |
| `https://<utente>.github.io/<repo>/admin/setup.html` | Configurazione iniziale del pannello | Solo chi gestisce il sito |

I proprietari **non usano GitHub**: aprono il pannello, inseriscono la password, modificano e premono *Salva e pubblica*.

```
index.html          → pagina del menù
menu.json           → piatti e prezzi (scritto dal pannello)
admin/index.html    → pannello dei proprietari
admin/setup.html    → configurazione (una volta sola)
admin/core.js       → funzioni comuni (cifratura e salvataggio)
allergeni.js        → elenco dei 14 allergeni e delle etichette
admin/style.css     → grafica del pannello
admin/config.js     → creato automaticamente dal setup (non va caricato a mano)
```

---

## Parte 1 — Messa online (chi gestisce il sito, una volta sola)

1. Crea un repository **pubblico** su GitHub (es. `menu`) e carica tutti i file, inclusa la cartella `admin`.
2. **Settings → Pages** → *Deploy from a branch* → branch **main**, cartella **/(root)** → **Save**. Dopo 1–2 minuti il menù è online.
3. Crea il token:
   **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
   - *Repository access*: **Only select repositories** → solo il repository del menù
   - *Permissions → Repository permissions → Contents*: **Read and write**
   - *Expiration*: la scadenza più lunga disponibile (segnatela in calendario)
4. Apri `…/admin/setup.html`, incolla il token e scegli la **password per i proprietari**. Il setup verifica il token e crea `admin/config.js` da solo.
5. Dopo 1–2 minuti consegna ai proprietari l'indirizzo `…/admin/` e la password. Genera un QR code dell'indirizzo del menù per i tavoli.

**Quando il token scade** il pannello mostra "La chiave di accesso del sito non è più valida". Crea un nuovo token e ripeti il punto 4 (puoi tenere la stessa password).

## Parte 2 — Guida per i proprietari

1. Apri l'indirizzo del pannello (conviene salvarlo nella schermata Home del telefono).
2. Inserisci la **password** e premi **Entra**. Con *Resta collegato* non servirà reinserirla.
3. Modifica:
   - **Prezzo**: solo il numero, es. `12` oppure `12,50`
   - **Ingredienti**: separati da virgola
   - **Disponibile**: togli la spunta e sul menù il piatto appare come *Esaurito*
   - **↑ ↓** cambiano l'ordine, **Elimina** toglie il piatto
   - **+ Aggiungi piatto**, **+ Aggiungi riga extra**, **+ Aggiungi una nuova sezione**
   - la barra **Cerca** trova subito un piatto
4. Premi **Salva e pubblica**: il menù online si aggiorna entro **1–2 minuti**.
5. Per cambiare la password: pulsante **Password** in alto.

**Schede del pannello**
- **🍔 Menù**: piatti, prezzi, ingredienti. Sotto ogni piatto, *Allergeni, etichette e descrizione*: si toccano gli allergeni presenti, le etichette (Piccante, Vegetariano, Novità) e la casella *Prodotto surgelato* (aggiunge l'asterisco richiesto dalla legge).
- **📍 Contatti e orari**: telefono (pulsante *Chiama*), WhatsApp, email, Instagram/Facebook, indirizzo con mappa, orari. I campi vuoti non compaiono sul menù.
- **⚙️ Generale e allergeni**: nome, sottotitolo, coperto, avviso allergeni.

Gli orari vanno scritti come `Lun–Ven: 18:00–23:30` (una riga per fascia): così il menù mostra anche "Aperto ora".

⚠️ **Gli allergeni sono stati precompilati in base agli ingredienti scritti sul menù cartaceo e vanno verificati dai proprietari** con le ricette e le etichette dei prodotti usati (es. panatura, salse, pane con sesamo).

## Sicurezza

- Il token GitHub è salvato nel sito **cifrato con la password** (AES-256, chiave derivata con PBKDF2 da 600.000 iterazioni): senza password non è utilizzabile. Per questo la password non deve essere banale.
- Il token può modificare **solo** il repository del menù.
- Se la password viene scoperta: cambiala dal pannello. Se serve bloccare tutto subito: GitHub → *Fine-grained tokens* → **Revoke**, poi rifai il setup.
- Ogni salvataggio resta nella cronologia del repository: si può sempre tornare a una versione precedente.
- `…/admin/?prova` apre il pannello in modalità di prova: niente viene pubblicato.
