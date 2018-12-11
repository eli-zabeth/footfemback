var express = require('express');
var router = express.Router();
var unirest = require('unirest');
const mongoose = require('mongoose');

/* ----- Votre DB ------ */
const dbUrl = 'mongodb://footfem:mongoFF2018@ds129914.mlab.com:29914/footfem';
/* --------------------- */
var saisonEnCours = 207;
// console.log(saisonEnCours)
/* --------------------- */



const options = {
  connectTimeoutMS: 5000,
  useNewUrlParser: true
};
mongoose.connect(dbUrl, options, error => {
  if (error) {
    console.error(error);
  } else {
    console.log('server is running');
  }
});



const teamSchema = mongoose.Schema({
    name: String,
    api_id : Number,
    logo : String,
    jersey : String,
    coach : String,
    players : [
      {
        name: String,
        flag: String,
        goals: Number
      }
    ]
});
const TeamModel = mongoose.model('teams', teamSchema);

router.post('/teams', function(req, res, next) {
  unirest.get("https://api-football-v1.p.mashape.com/teams/league/207")
  .header("X-Mashape-Key", "LdHFSLCfdImsh1iG2dq2n8N0OGP5p1ETW3ajsnoC5PKR3q777c")
  .header("Accept", "application/json")
  .end(function (result) {
    // console.log(result.status, result.headers, result.body.api.teams);
    var teams = result.body.api.teams;
    var team = Object.keys(teams)
    //ici z est l'élement complet
    //quand on a z in .. c'est l'index
    for (var z of team){
      console.log(teams[z]);
      var newTeam = new TeamModel({
        name: teams[z].name,
        api_id : teams[z].team_id
      });
      newTeam.save((error, team) => {
        if (error) {
          console.error(error);
        } else {
          // console.log({team: team});
        };
      });
    }; // for terminé
    res.json({result: true})
});
})


router.get('/teams', function(req, res, next) {
  TeamModel.find(function(err, teams) {
        if (err) {
          console.log(error);
        }
        console.log("les teams en base : ", teams)
        res.json({teams});
      });
});


//PERMET DE RETOURNER LA SAISON EN COURS AVEC L'ID DE LA LIGUE QUI VA SERVIR POUR LES REQUETES
// function leagueId(){
//   unirest.get("https://api-football-v1.p.mashape.com/leagues/country/france/2018")
//   .header("X-Mashape-Key", "LdHFSLCfdImsh1iG2dq2n8N0OGP5p1ETW3ajsnoC5PKR3q777c")
//   .header("Accept", "application/json")
//   .end(function (result) {
//     // console.log("leagues france : ", result.body.api.leagues);
//     var leagues = result.body.api.leagues;
//     var cles = Object.keys(leagues);
//     for (var z in cles){
//       // console.log(leagues[cles[z]].name);
//       // console.log(cles[z]);
//       if(leagues[cles[z]].name =="Feminine Division 1"){
//         console.log(cles[z]);
//         return cles[z];
//       }
//     }
//   });
// }

var fixtures = () => {
  return new Promise(resolve => {
    unirest.get(`https://api-football-v1.p.mashape.com/fixtures/league/${saisonEnCours}`)
      .header("X-Mashape-Key", "LdHFSLCfdImsh1iG2dq2n8N0OGP5p1ETW3ajsnoC5PKR3q777c")
      .header("Accept", "application/json")
      .end(function(result) {
        //nb de matchs récupérés : result.body.api.results >> 132, 11/équipes
        // console.log("LEAGUE 207 NB DE MATCH : ", result.body.api.results);
        //result.body.api.fixtures : retourne un objet avec tous les id de fixtures
        console.log("LEAGUE 207 RENCONTRES : ", result.body.api.fixtures);
        resolve(result.body.api.fixtures);
      });
  })
}

router.get('/fixtures', function(req, res, next) {
  try {
    fixtures().then((resultat) => {
      console.log("resultat  :  ", resultat);
      res.json({ resultat });
    })
  } catch (e) {
    console.log(e);
  }
});


var standings = () => {
  return new Promise(resolve => {
    unirest.get(`https://api-football-v1.p.mashape.com/standings/${saisonEnCours}`)
      .header("X-Mashape-Key", "LdHFSLCfdImsh1iG2dq2n8N0OGP5p1ETW3ajsnoC5PKR3q777c")
      .header("Accept", "application/json")
      .end(function(result) {
        //nb de matchs récupérés : result.body.api.results >> 132, 11/équipes
        // console.log("LEAGUE 207 NB DE MATCH : ", result.body.api.results);
        //result.body.api.fixtures : retourne un objet avec tous les id de fixtures
        console.log("LEAGUE 207 CLASSEMENT : ", result.body.api.standings);
        resolve(result.body.api.standings);
      });
  })
}

router.get('/standings', function(req, res, next) {
  try {
    //l'argument du .then prend le contenu du resovle
    standings().then((classement) => {
      console.log("resultat  :  ", classement);
      res.json({ classement });
    })
  } catch (e) {
    console.log(e);
  }
});


// var statistics = (team) => {
//   return new Promise(resolve => {
//     unirest.get(`https://api-football-v1.p.mashape.com/statistics/${saisonEnCours}/${team}`)
//       .header("X-Mashape-Key", "LdHFSLCfdImsh1iG2dq2n8N0OGP5p1ETW3ajsnoC5PKR3q777c")
//       .header("Accept", "application/json")
//       .end(function(result) {
//         //nb de matchs récupérés : result.body.api.results >> 132, 11/équipes
//         // console.log("LEAGUE 207 NB DE MATCH : ", result.body.api.results);
//         //result.body.api.fixtures : retourne un objet avec tous les id de fixtures
//         console.log("LEAGUE 207 CLASSEMENT : ", result.body);
//         resolve(result.body);
//       });
//   })
// }
//
// router.get('/statistics', function(req, res, next) {
//   var team= req.teamApi_id;
//   unirest.get(`https://api-football-v1.p.mashape.com/statistics/${saisonEnCours}/${team}`)
//     .header("X-Mashape-Key", "LdHFSLCfdImsh1iG2dq2n8N0OGP5p1ETW3ajsnoC5PKR3q777c")
//     .header("Accept", "application/json")
//     .end(function(result) {
//       //nb de matchs récupérés : result.body.api.results >> 132, 11/équipes
//       // console.log("LEAGUE 207 NB DE MATCH : ", result.body.api.results);
//       //result.body.api.fixtures : retourne un objet avec tous les id de fixtures
//       console.log("LEAGUE 207 CLASSEMENT : ", result.body);
//     });
// });



module.exports = router;
