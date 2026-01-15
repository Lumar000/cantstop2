const Giocatore = require("./giocatore");
const fs = require('fs');
const path = require('path');

const colonneMax = [0,0,3,5,7,9,11,13,11,9,7,5,3];
const datasetPath = path.join(__dirname, 'dataset');

class GiocatoreEuristico extends Giocatore {
    /**
     * costuttore della classe, non fa nulla
     */
    constructor(salvaScelte=false) {
        super();
        this.sceleteBuffer = [];
        this.salvaScelte = salvaScelte;
    }

    
    /**
     * restituisce i pesi del modello
     * @returns i pesi del modello
     */
    getPesi(){
        return 0;
    }

    /**
     * imposta i pesi del modello
     * @param {*} pesi 
     */
    setPesi(pesi){
        return;
    }

    /**
     * dati in input dei valori, restituisce la predizione della rete neurale
     * @param {[number]} input 
     * @param {number} inputMax - valori massimi per normalizzazione
     * @param {number} inputMin - valori minimi per normalizzazione
     */
    async predici(input, inputMax, inputMin) {
        let tabelloneProprio = input[0];
        let colonneInScalate = input[2];
        let opzioniDadi = [];

        for(let i=3; i < input.length; i++){
            opzioniDadi.push(input[i]);
        }

        //calocla l'output euristico
        let output = [0, 0, 0, 0, 0, 0, 0];
        for(let i=0; i < opzioniDadi.length; i++){
            if(opzioniDadi[i][0] != 0){
                if(opzioniDadi[i][0] == opzioniDadi[i][1]){
                    output[i+1] += 20;
                }

                for(let j=0; j < opzioniDadi[i].length; j++){
                    if(opzioniDadi[i][j] == 0) break;

                    if(colonneInScalate.includes(opzioniDadi[i][j])){
                        output[i+1] += 10;
                    }
                    if(tabelloneProprio[opzioniDadi[i][j]-2]+1 >= colonneMax[opzioniDadi[i][j]]){
                        output[i+1] += 50;
                    }

                    output[i+1] += tabelloneProprio[opzioniDadi[i][j]-2]*10;
                }
            }
        }

        let cotinuare = 0;
        for(let i=0; i < colonneInScalate.length; i++){
            if(colonneInScalate[i] == 0) cotinuare++;
        }

        if(cotinuare >= 2) output[0] =  1;
        else if(cotinuare == 1) output[0] =  Math.random();
        else output[0] = 0;

        //salva i dataset se richiesto
        if(this.salvaScelte){
            this.sceleteBuffer.push({input: this.normalizzaInput(input, inputMax, inputMin), output: output});
        }

        return output;
    }

    /**
     * salva i datatset su file
     * @param {string} nomeFile 
     */
    async saveDataset(nomeFile) {
        if(!this.salvaScelte) return;
        // Crea la directory se non esiste
        if (!fs.existsSync(datasetPath)) {
            fs.mkdirSync(datasetPath, { recursive: true });
        }

        const filePath = path.join(datasetPath, nomeFile);

        // Prendiamo i dati dal buffer delle scelte
        const dati = Array.isArray(this.sceleteBuffer) ? this.sceleteBuffer : [];
        if (dati.length === 0) return; // nulla da salvare

        // Prepara i record da inserire: uno o più elementi JSON (senza parentesi)
        let records = '';
        if (Array.isArray(dati) && dati.length > 0 && (Array.isArray(dati[0]) || typeof dati[0] === 'object')) {
            records = dati.map(item => JSON.stringify(item)).join(',\n');
        } else {
            records = JSON.stringify(dati);
        }

        // Se il file non esiste o è vuoto, scriviamo l'array completo
        if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
            fs.writeFileSync(filePath, '[\n' + records + '\n]\n');
            this.sceleteBuffer = [];
            return;
        }

        // Leggi tutto il file (dataset solitamente non enorme). Normalizziamo e ri-scriviamo
        let content = fs.readFileSync(filePath, 'utf8').trim();
        if (content === '' || content === '[]') {
            fs.writeFileSync(filePath, '[\n' + records + '\n]\n');
            this.sceleteBuffer = [];
            return;
        }

        // Rimuoviamo la parentesi di chiusura e eventuali virgole finali, poi aggiungiamo i nuovi record
        let withoutClosing = content.replace(/\s*]$/, '');
        withoutClosing = withoutClosing.replace(/,\s*$/, '');
        const newContent = withoutClosing + ',\n' + records + '\n]\n';
        fs.writeFileSync(filePath, newContent);
        this.sceleteBuffer = [];
    }
}

module.exports = GiocatoreEuristico;