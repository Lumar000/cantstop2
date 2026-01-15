const tf = require('@tensorflow/tfjs');
const Giocatore = require('./giocatore.js');
const Cantstop = require('./tabellone.js');
const GiocatoreNeurale = require('./giocatoreNeurale.js');
const GiocatoreEuristico = require('./giocatoreEuristico.js');
const fs = require('fs');
const path = require('path');

var giocatori = [new GiocatoreNeurale(), new GiocatoreNeurale(), new GiocatoreNeurale(), new GiocatoreEuristico(true)]; //0 = champion, 1 = challenger, 2 = random, 3 = euristico

const cantstop = new Cantstop(giocatori);


async function main() {
    await giocatori[0].load();
    giocatori[1].variazionePesi(giocatori[0].getPesi(), 0.05);

    for(i=0; i<20; i++){
        let giocateVinte = [];
        for(let j=0; j < giocatori.length; j++){
            giocateVinte.push(0);
        }

        for(j=0; j<100; j++){

            let vincitore = await cantstop.gioca(false);

            giocateVinte[vincitore] += 1;
        }

        //giocatore più vincente
        let idexgiocatoreMigliore = 0;
        for(let j=0; j < giocatori.length-1; j++){
            if(giocateVinte[j] > giocateVinte[idexgiocatoreMigliore]) 
                idexgiocatoreMigliore = j;
        }

        console.log(`${i} vittorie: ${giocateVinte}, migliore ${idexgiocatoreMigliore}`);
        
        //prendo i pesi del giocatore migliore
        let pesiMigliori = giocatori[idexgiocatoreMigliore].getPesi();
        
        //aggiorno i giocatori
        giocatori[0].setPesi(pesiMigliori);
        giocatori[1].variazionePesi(pesiMigliori, 0.05);
        giocatori[2] = new GiocatoreNeurale();

        //salvo i pesi del campione
        await giocatori[0].save();
        await giocatori[3].saveDataset("dataset.json");
    }
}

main();