# Il Sognatore

Sito personale di Pietro Sorrentino, scrittore, poeta e songwriter. Il progetto funziona come blog e vetrina per pubblicare testi, libri, riconoscimenti e collegamenti ai suoi contenuti online.

Il frontend e' un sito statico realizzato con HTML, CSS, JavaScript e Bootstrap, pubblicato su Netlify. Supabase gestisce database, autenticazione dell'amministratore e immagini.

## Struttura

- `index.html`: post pubblici
- `shop.html`: libri e guida all'acquisto
- `me.html`: biografia e riconoscimenti
- `network.html`: social e progetti
- `admin.html`: gestione dei contenuti
- `js/supabase-config.js`: configurazione condivisa di Supabase

## Pubblicazione

Il sito non richiede compilazione: la cartella del progetto puo' essere pubblicata direttamente su Netlify.

La chiave presente in `supabase-config.js` e' la chiave pubblica `anon`, necessaria al browser. La protezione dei dati dipende dalle policy RLS di Supabase.

I file nella cartella `sql` sono un archivio degli script usati durante lo sviluppo e non costituiscono migrazioni complete da eseguire in sequenza.
