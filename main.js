const tf = require('@tensorflow/tfjs');
const Giocatore = require('./giocatore.js');
const Cantstop = require('./tabelone.js');
const GiocatoreNeurale = require('./giocatoreNeurale.js');
const GiocatoreEuristico = require('./giocatoreEuristico.js');
const fs = require('fs');
const path = require('path');

var giocatori = [new GiocatoreNeurale(), new GiocatoreNeurale(), new GiocatoreNeurale(), new GiocatoreEuristico(true)]; //0 = champion, 1 = challenger, 2 = random, 3 = euristico

const cantstop = new Cantstop(giocatori);


async function main() {
    await giocatori[0].loadPesi();
    giocatori[1].variazionePesi(giocatori[0].getPesi(), 0.05);

    for(k=0; k<10; k++){
        for(n=0;n<10;n++){
            let giocateVinte = [];
            for(let i=0; i < giocatori.length; i++){
                giocateVinte.push(0);
            }

            

            await cantstop.gioca(false);
        }
        await giocatori[0].save();
    }
}

main();