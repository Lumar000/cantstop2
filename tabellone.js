const Giocatore = require('./giocatore.js');
const tf = require('@tensorflow/tfjs');

class Cantstop{

    /**
     * inizizlaiozza il gioco cantstop con i giocatori passati
     * @param {Giocatori[]} giocatori
     */
    constructor(giocatori){
        this.datasetInput = [];
        this.datasetOutput = [];
        this.giocatori = giocatori;
        this.tabellone = new Map();
        this.giocatore = 0;
        for(let i=-1; i<this.giocatori.length; i++){
            this.tabellone.set(i, [0,0,0,0,0,0,0,0,0,0,0,0,0]);    //elemento 0 e 1 non usati
        }
        this.colonneMax = [0,0,3,5,7,9,11,13,11,9,7,5,3];
    }

    /**
     * simula una partita di cantstop
     * @returns il giocatore che ha vinto
     */
    async gioca(debug=false){
        inizializzaPartita();

        // ogni turno di ogni giocatore
        while(true){
             //setup variabili
            let scalataRiuscita = false;
            let tabelloneProvisorio = new Map();
            for(let [key, value] of this.tabellone.entries()){
                tabelloneProvisorio.set(key, value.slice());
            }
            let colonneInScalate = [0,0,0];
            let sceltaGiocatore = [];

            //turno del giocatore
            do{
                //tira i dadi e ottieni le opzioni
                let dadi = this.tiraDadi();
                let opzioni = this.estraiOpzioni(dadi, colonneInScalate, tabelloneProvisorio.get(-1));

                //randomizza l'ordine delle opzioni per evitare bias
                for (let i = opzioni.length - 1; i > 0; i--) {
                    // Genera un indice casuale j tra 0 e i (inclusi)
                    const j = Math.floor(Math.random() * (i + 1));
                    // Scambia gli elementi in posizione i e j
                    [opzioni[i], opzioni[j]] = [opzioni[j], opzioni[i]]; // Destructuring assignment per lo scambio
                }

                //crea la maschera delle opzioni
                let maschera = this.creaMaschera(opzioni);

                scalataRiuscita = this.controllaCaduta(maschera, debug);

                if(!scalataRiuscita) {
                    if(debug) console.log("caduto--------------------");
                    break;
                }

                sceltaGiocatore = await this.giocatori[this.giocatore].predici(this.formalizzaPredizione(opzioni, tabelloneProvisorio, colonneInScalate), 13, 0);

                let sceltaMax = 0; //sceltaMax è l'indice dell'opzione scelta dal giocatore
                for(let i = 0; i < maschera.length; i++){
                    if(maschera[i] == 1){
                        sceltaMax=i;
                        break;
                    }
                }
                for(let i = 0; i < maschera.length; i++){
                    if(maschera[i] == 1){
                        if(sceltaGiocatore[i+1] > sceltaGiocatore[sceltaMax+1]){
                            sceltaMax = i;
                        }
                    }
                }

                //aggiorna colonne in scalata
                let scalandoO1 = colonneInScalate.includes(opzioni[sceltaMax][0]);
                let scalandoO2 = colonneInScalate.includes(opzioni[sceltaMax][1]);
                for(let i=0; i<colonneInScalate.length; i++){
                    if(opzioni[sceltaMax][0] != 0 && !scalandoO1 && colonneInScalate[i] == 0){
                        colonneInScalate[i] = opzioni[sceltaMax][0];
                        scalandoO1 = true;
                        scalandoO2 = colonneInScalate.includes(opzioni[sceltaMax][1]);
                    } else if(opzioni[sceltaMax][1] != 0 && !scalandoO2 && colonneInScalate[i] == 0){
                        colonneInScalate[i] = opzioni[sceltaMax][1];
                        scalandoO2 = true;
                    }
                }

                //console.log(opzioni + "| " + opzioni[sceltaMax][0] + "| " + opzioni[sceltaMax][1] + "| "+ maschera + "| "+ sceltaMax + "| " + sceltaGiocatore);
                //aggiorno tabellone provvisorio
                for(let i=2; i<tabelloneProvisorio.get(this.giocatore).length; i++){
                    if(i == opzioni[sceltaMax][0]){
                        tabelloneProvisorio.get(this.giocatore)[i]++;
                        if(tabelloneProvisorio.get(this.giocatore)[i] >= colonneMax[i]){
                            tabelloneProvisorio.get(-1)[i] = 1;
                        }
                    }
                    if(i == opzioni[sceltaMax][1] &&  tabelloneProvisorio.get(-1)[i] != 1){
                        tabelloneProvisorio.get(this.giocatore)[i]++;
                        if(tabelloneProvisorio.get(this.giocatore)[i] >= colonneMax[i]){
                            tabelloneProvisorio.get(-1)[i] = 1;
                        }
                    }
                }

                if(debug) console.log("tabellone: "+ this.giocatore +" | "+ tabelloneProvisorio.get(this.giocatore).slice(2) + " | "+ datiFormalizati[1] + " | " + opzioni[sceltaMax] + " | "+ opzioni +" | " + colonneInScalate);

            }while(sceltaGiocatore[0] >= 0.5);

             if(scalataRiuscita){
                //aggiorna tabellone
                this.tabellone = new Map(); //copia del tabellone attuale

                for(let [key, value] of tabelloneProvisorio.entries()){
                    this.tabellone.set(key, value.slice());
                }
                //console.log("tabellone: "+ this.giocatore +" | "+ this.tabellone.get(this.giocatore) + " | "+ this.tabellone.get(-1));
                //check vittoria
                let contatoreVittoria = 0;
                for(let i=2; i<colonneMax.length; i++){
                    if(this.tabellone.get(this.giocatore)[i] >= colonneMax[i]){
                        contatoreVittoria++;
                        if(contatoreVittoria == 3){
                            //console.log("tabellone: "+ this.giocatore +" , "+ this.tabellone.get(this.giocatore));
                            return this.giocatore; //ritorna il giocatore vincitore
                        }
                    }
                }
            }
            
            //passo giocatore
            if(this.giocatore == this.nGiocatori-1) this.giocatore = 0;
            else this.giocatore++;
        }
    }

    /**
     * inizializza una nuova partita
     */
    inizializzaPartita(){
        this.datasetInput = [];
        this.datasetOutput = [];
        this.tabellone = new Map();// reimposta il tabellone
        this.giocatore = Math.floor(Math.random()*(this.nGiocatori-1)); //sceglie il giocatore iniziale in modo casuale tra 0 e nGiocatori-1
        for(let i = -1; i<this.nGiocatori; i++){ // -1 è la maschera del tabellone, che indica quali colonne sono già state chiuse
            this.tabellone.set(i, [0,0,0,0,0,0,0,0,0,0,0,0,0]);    //elemento 0 e 1 non usati
        }  
    }

    controllaCaduta(maschera, debug=false){
        let scalataRiuscita = false;
        for(let i=0; i<maschera.length; i++){
            if(maschera[i] == 1){
                scalataRiuscita = true;
                break;
            }
        }
        return scalataRiuscita;
    }

    /**
     * tira 4 dadi 
     * @returns vettore contenete 4 numeri randomici da 1 a 6
     */
    tiraDadi(){
        let dadi = [];
        for(let i=0;i<4;i++){
            dadi[i] = Math.floor(Math.random()*6)+1;
        }
        return dadi;
    }

    /**
     * estrae le 3 opzioni di somma dei dadi, ed elimina le opzioni non valide
     * @param {int[]} dadi
     * @param {int[]} colonneInScalate
     * @returns 
     */
    estraiOpzioni(dadi, colonneInScalate, mascheraTabellone){
        let opzione1 = [dadi[0] + dadi[1], dadi[2] + dadi[3]];
        let opzione2 = [dadi[0] + dadi[2], dadi[1] + dadi[3]];
        let opzione3 = [dadi[0] + dadi[3], dadi[1] + dadi[2]];

        let opzioni = [opzione1, opzione2, opzione3];

        let output = [[0,0], [0,0], [0,0], [0,0], [0,0], [0,0]];
        let scalateLibere = 0;

        colonneInScalate.forEach(element => {
            if(element == 0) scalateLibere++;
        });
        let contOutput = 0;
        
        for(let i = 0; i<opzioni.length; i++, contOutput++){
            let scalandoO1 = colonneInScalate.includes(opzioni[i][0]);
            let scalandoO2 = colonneInScalate.includes(opzioni[i][1]);

            if((scalandoO1 && scalandoO2) || scalateLibere >= 2){ //se entrambe le opzioni sono già in scalata
                output[contOutput] = opzioni[i];
            }
            else if(scalateLibere == 0){
                if(!scalandoO1 && !scalandoO2){ //se entrambe le opzioni NON sono già in scalata
                    output[contOutput] = [0, 0];
                }else if(scalandoO1){ //se solo la prima opzione è in scalata
                    output[contOutput] = [opzioni[i][0], 0];
                }else{
                    output[contOutput] = [opzioni[i][1], 0];
                }
            }
            else if(scalateLibere == 1){
                if(!scalandoO1 && !scalandoO2 && opzioni[i][0] != opzioni[i][1]){ //se entrambe le opzioni NON sono già in scalata e le opzioni sono diverse
                    output[contOutput] = [opzioni[i][0], 0];
                    contOutput++;
                    output[contOutput] = [opzioni[i][1], 0];
                } else{
                    output[contOutput] = opzioni[i];
                }
            }
        }

        for(let i = 0; i<output.length; i++){
            let colonna1 = output[i][0];
            let colonna2 = output[i][1];
            if(mascheraTabellone[colonna1] == 1){
                output[i] = [0,output[i][1]];
            }
            if (mascheraTabellone[colonna2] == 1){
                output[i] = [output[i][0],0];
            }

            if(output[i][0] == 0 && output[i][1] != 0){
                output[i] = [output[i][1],0];
            }
        }

        return output;
    }

    /**
     * formalizza l'input per la rete neurale
     * @param {*} opzioni
     * @param {*} tabelloneProvisorio
     * @param {*} colonneInScalate
     * @returns {int[][]} input per la rete neurale
     */
    formalizzaPredizione(opzioni, tabelloneProvisorio, colonneInScalate){
        let output = [];

        //aggiungo tabellone giocatore
        output[0] = tabelloneProvisorio.get(this.giocatore).slice(2);

        //aggiungo tabellone avversari
        let tabelloneAvversari = [];
        for(let i=2; i<colonneMax.length; i++){
            let maxAltezza = 0;
            for(let j=0; j<this.nGiocatori; j++){
                if(j != this.giocatore){
                    if(tabelloneProvisorio.get(j)[i] > maxAltezza){
                        maxAltezza = tabelloneProvisorio.get(j)[i];
                    }
                }
            }
            tabelloneAvversari[i-2] = maxAltezza;
        }

        output[1] = tabelloneAvversari;

        //aggiungo colonne in scalata
        output[2] = colonneInScalate;

        //aggiungo opzioni
        for(let i=0; i<opzioni.length; i++){
            output[3+i] = opzioni[i];
        }

        return output;
    }

    /**
     * crea una maschera binaria delle opzioni valide
     * @param {*} opzioni 
     * @returns 
     */
    creaMaschera(opzioni){
        let maschera = [0,0,0,0,0,0];

        for(let i=0; i<opzioni.length; i++){
            if(opzioni[i][0] != 0){
                maschera[i] = 1;
            }
        }

        return maschera;
    }
} 

module.exports = Cantstop;