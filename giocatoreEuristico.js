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
            this.saveDataset(this.normalizzaInput(input, inputMax, inputMin), "dataset_input.json");
            this.saveDataset(output, "dataset_output.json");
        }

        return output;
    }

    /**
     * salva i datatset su file
     * @param {int[]} dati 
     * @param {string} nomeFile 
     */
    async saveDataset(dati, nomeFile) {
        // Crea la directory se non esiste
        if (!fs.existsSync(datasetPath)) {
            fs.mkdirSync(datasetPath, { recursive: true });
        }
        
        const filePath = path.join(datasetPath, nomeFile);
        let dataset = [];
        
        // Leggi il file esistente
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            if (fileContent.trim()) {
                dataset = JSON.parse(fileContent);
            }
        }

        dataset = dataset.concat(dati);

        // Riscrivi il file
        fs.writeFileSync(
            filePath,
            JSON.stringify(dataset, null, 2)
        );
    }
}

module.exports = GiocatoreEuristico;