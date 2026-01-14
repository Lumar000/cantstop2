const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');
const Giocatore = require('./giocatore');

const modelPath = path.join(__dirname, 'model_saved'); //il path dove salvare/caricare il modello

class GiocatoreNeurale extends Giocatore{
    
    /**
     * costuttore della classe, inizializza il modello di rete neurale
     * @param {*} pesi - i pesi/parametri del modello da caricare (opzionale)
     */
    constructor(pesi) {
        super();
        this.model = tf.sequential();
        this.model.add(tf.layers.dense({ units: 70, activation: 'elu', inputShape: [37] })); //'elu'|'hardSigmoid'|'linear'|'relu'|'relu6'| 'selu'|'sigmoid'|'softmax'|'softplus'|'softsign'|'tanh'|'swish'|'mish'|'gelu'|'gelu_new'
        this.model.add(tf.layers.dense({ units: 30, activation: 'elu' }));
        this.model.add(tf.layers.dense({ units: 7, activation: 'sigmoid' }));
        this.model.compile({ optimizer: tf.train.adam(0.1), loss: 'meanSquaredError' });
        if (pesi) {
            this.model.setWeights(pesi);
        }
    }

    /**
     * restituisce i pesi del modello
     * @returns i pesi del modello
     */
    getPesi(){
        return this.model.getWeights();
    }

    /**
     * imposta i pesi del modello
     * @param {*} pesi 
     */
    setPesi(pesi){
        this.model.setWeights(pesi);
    }

    /**
     * dati in input dei valori, restituisce la predizione della rete neurale
     * @param {[number]} input 
     * @param {number} inputMax - valori massimi per normalizzazione
     * @param {number} inputMin - valori minimi per normalizzazione
     */
    async predici(input, inputMax, inputMin) {
        input = this.normalizzaInput(input, inputMax, inputMin);
        const inputTensor = tf.tensor2d([input]);
        const prediction = this.model.predict(inputTensor);
        const values = await prediction.data();
        inputTensor.dispose();
        prediction.dispose();
        return values;
    }

    /**
     * muta i pesi del modello secondo un tasso di mutazione
     * @param {*} pesi
     * @param {*} tassoMutazione
     */
    variazionePesi(pesi, tassoMutazione) {
        const nuovPesi = [];
        for (let i = 0; i < pesi.length; i++) {
            const weightTensor = pesi[i];
            const shape = weightTensor.shape;
            const values = weightTensor.dataSync();

            const mutatedValues = Array.from(values).map(val => {
                const mutation = (Math.random() - 0.5) * tassoMutazione;
                return val + mutation;
            });
                
            nuovPesi.push(tf.tensor(mutatedValues, shape));
        }
        
        // Imposta tutti i pesi mutati una sola volta
        this.model.setWeights(nuovPesi);
        // Libera i tensori creati
        nuovPesi.forEach(w => w.dispose());
    }

    /**
     * salva i pesi del modello su file
     */
    async save() {
        // Crea la directory se non esiste
        if (!fs.existsSync(modelPath)) {
            fs.mkdirSync(modelPath, { recursive: true });
        }
        
        // Salva manualmente i pesi e la configurazione del modello
        const weights = this.model.getWeights();
        const weightsData = [];
        
        for (let w of weights) {
            const data = await w.data();
            weightsData.push({
                data: Array.from(data),
                shape: w.shape
            });
        }
        
        // Salva la configurazione del modello
        const modelConfig = {
            weights: weightsData,
            config: this.model.toJSON()
        };
        
        fs.writeFileSync(
            path.join(modelPath, 'model.json'),
            JSON.stringify(modelConfig, null, 2)
        );
        console.log(`Modello salvato in: ${path.join(modelPath, 'model.json')}`);
    }

    /**
     * carica i pesi del modello da file
     */
    async load() {
        try {
            const filePath = path.join(modelPath, 'model.json');
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (data.weights && data.weights.length > 0) {
                    const weights = data.weights.map(w => tf.tensor(w.data, w.shape));
                    this.model.setWeights(weights);
                    weights.forEach(w => w.dispose());
                    console.log('Modello caricato da:', filePath);
                }
            }
        } catch (error) {
            console.log('Impossibile caricare il modello, usando pesi iniziali:', error.message);
        }
    }

}

module.exports = GiocatoreNeurale;