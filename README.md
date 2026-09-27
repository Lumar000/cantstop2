# Cant't Stop AI

Un'implementazione del gioco da tavolo **Can't Stop** in JavaScript, con un sistema di intelligenza artificiale che apprende a giocare tramite **reti neurali** addestrate con un approccio **evolutivo (champion/challenger)**, usando [TensorFlow.js](https://www.tensorflow.org/js).

Il progetto include inoltre un giocatore **euristico** (basato su regole) usato sia come avversario di riferimento sia come generatore di dataset per il **pre-addestramento supervisionato** della rete neurale.

## Indice

- [Come funziona il gioco](#come-funziona-il-gioco)
- [Struttura del progetto](#struttura-del-progetto)
- [Architettura dell'IA](#architettura-dellia)
- [Input/Output della rete neurale](#inputoutput-della-rete-neurale)
- [Installazione](#installazione)
- [Utilizzo](#utilizzo)
- [Dettagli sull'addestramento](#dettagli-sulladdestramento)
- [Requisiti](#requisiti)

## Come funziona il gioco

**Can't Stop** è un gioco da tavolo di probabilità e rischio, in cui i giocatori tirano 4 dadi (d6) e li combinano in coppie per ottenere 3 possibili somme (comprese tra 2 e 12). Ad ogni turno si può avanzare su un massimo di 3 colonne contemporaneamente; se non è possibile compiere nessuna mossa valida, si perdono tutti i progressi del turno corrente. Il giocatore può scegliere di fermarsi (consolidando i progressi) o continuare a rischiare. Vince chi per primo completa (raggiunge la cima) di 3 colonne.

Questa implementazione simula automaticamente migliaia di partite tra agenti IA per addestrarli tramite auto-apprendimento.

## Struttura del progetto

```
.
├── main.js                 # Ciclo principale di addestramento evolutivo
├── tabelone.js              # Logica del gioco (tabellone, dadi, regole, simulazione partita)
├── giocatore.js              # Classe astratta base per tutti i tipi di giocatore
├── giocatoreNeurale.js       # Giocatore IA basato su rete neurale (TensorFlow.js)
├── giocatoreEuristico.js     # Giocatore IA basato su regole euristiche
├── addestraGiocatore.js      # Script di pre-addestramento supervisionato della rete
│                              #   a partire dal dataset generato dal giocatore euristico
├── dataset/                  # Dataset input/output generato durante le simulazioni
│   ├── dataset_input.json
│   └── dataset_output.json
├── model_saved/               # Pesi del modello neurale addestrato (champion)
└── model_euristico_saved/     # Pesi del modello pre-addestrato sul giocatore euristico
```

## Architettura dell'IA

Il progetto usa quattro tipologie di giocatore, tutte derivate dalla classe astratta `Giocatore`:

| Giocatore | Descrizione |
|---|---|
| **Champion** (`GiocatoreNeurale`) | Il modello migliore ottenuto fino a quel momento dall'addestramento |
| **Challenger** (`GiocatoreNeurale`) | Una copia del champion con pesi leggermente mutati, per esplorare nuove strategie |
| **Random** (`GiocatoreNeurale`) | Una rete neurale inizializzata casualmente, reintrodotta a ogni ciclo per mantenere varietà |
| **Euristico** (`GiocatoreEuristico`) | Un giocatore basato su regole scritte a mano, usato come benchmark e come fonte di dati per il pre-addestramento |

### Ciclo di addestramento evolutivo (`main.js`)

1. Si simulano più partite tra i 4 giocatori.
2. Si conta quante partite ha vinto ciascuno.
3. Il giocatore che ha vinto di più tra `champion`, `challenger` e `random` diventa il nuovo champion.
4. Il challenger viene rigenerato mutando leggermente i pesi del nuovo champion.
5. Il giocatore random viene reinizializzato da zero.
6. Il ciclo si ripete, salvando periodicamente il modello champion su disco.

Questo approccio (simile a una strategia evolutiva "(1+1)") permette al modello di migliorare progressivamente senza bisogno di dati etichettati, tramite selezione competitiva.

### Pre-addestramento supervisionato (`addestraGiocatore.js`)

Prima di partire con l'addestramento evolutivo, è possibile:
1. Far giocare il giocatore euristico registrando le sue decisioni (`dataset_input.json` / `dataset_output.json`), impostando `salvaDatasetEuristico = true` in `main.js`.
2. Usare `addestraGiocatore.js` per addestrare in modo supervisionato una rete neurale a imitare il comportamento euristico, salvandola come punto di partenza (`model_euristico_saved`).

## Input/Output della rete neurale

**Rete**: 37 input → 70 neuroni (ELU) → 30 neuroni (ELU) → 7 neuroni (Sigmoid)

**Input** (formalizzati da `Cantstop.formalizzaPredizione`):
- Tabellone del giocatore corrente (11 colonne)
- Tabellone massimo degli avversari (11 colonne)
- Colonne attualmente in scalata nel turno (3 valori)
- Le 3 possibili opzioni di somma dei dadi (6 valori: 3 coppie)

Tutti i valori vengono normalizzati tra 0 e 1 prima di essere passati alla rete.

**Output** (7 valori, sigmoid):
- `output[0]`: probabilità/decisione di continuare a rischiare oppure fermarsi
- `output[1..6]`: punteggio assegnato a ciascuna delle 6 opzioni di mossa disponibili (la rete sceglie quella con il valore più alto tra le mosse valide)

## Utilizzo

### Avviare l'addestramento evolutivo

```bash
node main.js
```

Per impostazione predefinita, `main.js` chiama `main(true)`, che avvia l'addestramento salvando anche il dataset generato dal giocatore euristico. Per disattivare il salvataggio del dataset:

```javascript
main(false);
```

Il modello champion viene salvato periodicamente in `model_saved/model.json`.

### Pre-addestrare la rete sul dataset euristico

Dopo aver generato `dataset/dataset_input.json` e `dataset/dataset_output.json`:

```bash
node addestraGiocatore.js
```

Il modello risultante viene salvato in `model_euristico_saved/model.json` e può essere usato come punto di partenza (`modelPathInizizalizazione` in `main.js`) per l'addestramento evolutivo successivo.

### Testare il modello addestrato

In `main.js` è presente una funzione `test()` (commentata di default) che carica il modello salvato e simula una partita in modalità debug, stampando l'esito su console:

```javascript
// Decommenta la riga in main.js
test();
```
