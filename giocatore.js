class Giocatore {
    
    constructor(){
        if (new.target === Giocatore) {
            throw new TypeError('Giocatore è una classe astratta e non può essere istanziata direttamente');
        }
    }

    /**
     * funzione che predice il punteggio del giocatore
     * @param {int[][]} input 
     * @param {int} inputMax 
     * @param {int} inputMin 
     */
    async predici(input, inputMax, inputMin) {}

    /**
     * normalizza gli input tra 0 e 1
     * @param {*} input 
     * @param {*} inputMax 
     * @param {*} inputMin 
     */
    normalizzaInput(input, inputMax, inputMin) {
        const flatInput = input.flat(); 

        for(let i = 0; i < flatInput.length; i++) {
            flatInput[i] = (flatInput[i] - inputMin) / (inputMax - inputMin);
        }

        return flatInput;
    }

    /**
     * Metodo astratto: deve essere implementato dalle sottoclassi
     * @returns i pesi/parametri del modello
     */
    getPesi() {}

    /**
     * Metodo astratto: deve essere implementato dalle sottoclassi
     * @param {*} pesi - i pesi/parametri da impostare
     */
    setPesi(pesi) {}
}

module.exports = Giocatore;