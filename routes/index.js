var express = require('express');
var router = express.Router();
var unirest = require('unirest');
const mongoose = require('mongoose');

/* ----- Votre DB ------ */
const dbUrl = 'mongodb://footfem:mongoFF2018@ds129914.mlab.com:29914/footfem';
/* --------------------- */
var saisonEnCoursD1 = 207;
// console.log(saisonEnCoursD1)
/* --------------------- */



/* ************************    MONGOOSE  ******************************/

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

const db = {
  config: {
    url: 'mongodb://footfem:mongoFF2018@ds129914.mlab.com:29914/footfem',
    options: {
      connectTimeoutMS: 5000,
      useNewUrlParser: true
    }
  }
};


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

const journeeSchema = mongoose.Schema({
    round : Number,
    fixtures : [
      {
        fixture_api_id : Number,
      }
    ]
});
const JourneeModel = mongoose.model('journees', journeeSchema);


/***********************************************************************/


/*permet d'avoir un résultat visuel meilleur que 'not found' quand on fait app start sur Heroku
on peut aussi faire une requete sur une bdd pour s'assurer que tout fonctionne */
router.get('/', function(req, res, next){
  res.json({result:true})
})
/**/

/********************   ajout des équipes dans la bdd   ***********************/
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


/********************   ajout des journees   ***********************/
router.post('/journees', function(req, res, next) {
  for (var i = 1; i <= 22; i++) {
    var newJournee = new JourneeModel({
      round: i,
    });
    newJournee.save((error, journee) => {
      if (error) {
        console.error(error);
      } else {
        console.log({
          journee: journee
        });
      };
    });
  }; // for terminé
  unirest.get(`https://api-football-v1.p.mashape.com/fixtures/league/${saisonEnCoursD1}`)
    .header("X-Mashape-Key", "LdHFSLCfdImsh1iG2dq2n8N0OGP5p1ETW3ajsnoC5PKR3q777c")
    .header("Accept", "application/json")
    .end(function(result) {
      var match = Object.keys(result.body.api.fixtures);
      var matchs = result.body.api.fixtures;
      for (var z in matchs) {
        //on récupère le round
        //crée un tableau de tous les mots sans les espaces
        var roundS = matchs[z].round.split(' ');
        //récupère le dernier élément du tableau >> le numéro de la journée
        var roundN = parseInt(roundS[roundS.length-1])
        // console.log("roundN : ", roundN);
        // var roundN = parseInt(matchs[z].round.substring(28));
        // console.log("roundN : ", roundN);
        JourneeModel.findOneAndUpdate({
          round: roundN
        }, {
          $push: {
            fixtures: {
              fixture_api_id: matchs[z].fixture_id
            }
          }
        }, {
          new: true
        }, (error, journee) => {
          if (error || !journee) {
            console.error(error ? error : 'journee not found');
          } else {
            // console.log(journee);
            // res.json(journee)
          };
        });
      }; // for terminé
      res.json(result.body.api.fixtures);
    });
})




//   **********        RECUPERATION DES EQUIPES :  TEAMS :  *********    //////////////////
router.get('/teams', function(req, res, next) {
  TeamModel.find(function(err, teams) {
        if (err) {
          console.log(error);
        }
        console.log("les teams en base : ", teams)
        res.json({teams});
      });
});



//  **********        RECUPERATION DES JOURNEES :  ROUND:  *********    //////////////////
router.get('/journees/', function(req, res, next) {
  JourneeModel.find(function(err, journees) {
        if (err) {
          console.log(error);
        }
        console.log("les journées en base : ", journees)
        res.json({journees});
      });
});


//  **********        RECUPERATION D'UNE JOURNEE :  1ROUND:  *********    ////////////////
router.get('/journee/:round', function(req, res, next) {
  var roundi = req.params.round;
  JourneeModel.find({ round: roundi }, function(err, journee) {
    // res.json({journee})
    if (err) {
      console.log(error);
    }
    console.log("les matchs de la journee : ", journee[0].fixtures)
    res.json({journee});
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


//   **********        RECUPERATION DES MATCHS :  FIXTURES :  *********    //////////////////
var fixtures = () => {
  return new Promise(resolve => {
    unirest.get(`https://api-football-v1.p.mashape.com/fixtures/league/${saisonEnCoursD1}`)
      .header("X-Mashape-Key", "LdHFSLCfdImsh1iG2dq2n8N0OGP5p1ETW3ajsnoC5PKR3q777c")
      .header("Accept", "application/json")
      .end(function(result) {
        //nb de matchs récupérés : result.body.api.results >> 132, 11/équipes
        // console.log("LEAGUE 207 RENCONTRES : ", result.body.api.fixtures);
        resolve(result.body.api.fixtures);
      });
  })
}

router.get('/fixtures', function(req, res, next) {
  try {
    fixtures().then((matchs) => {
      // console.log("matchs  :  ", matchs);

      res.json({ matchs });
    })
  } catch (e) {
    console.log(e);
  }
});


//   **********        RECUPERATION DU CLASSEMENT :  STANDINGS  *********    //////////////////

var standings = () => {
  return new Promise(resolve => {
    unirest.get(`https://api-football-v1.p.mashape.com/standings/${saisonEnCoursD1}`)
      .header("X-Mashape-Key", "LdHFSLCfdImsh1iG2dq2n8N0OGP5p1ETW3ajsnoC5PKR3q777c")
      .header("Accept", "application/json")
      .end(function(result) {
        // console.log("LEAGUE 207 CLASSEMENT : ", result.body.api.standings);
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


//   **********        RECUPERATION DES MATCHS PAR EQUIPE  :  FIXTURES/TEAM  *********    //////////////////

//attend https://adresseDuBack/statistics/teamApi_id
router.get('/fixtures/team/:id', function(req, res) {
  console.log ("route fixtures/team")
  var team= req.params.id;
  // console.log("req.params.teamApi_id : ", req.params.id)
  unirest.get(`https://api-football-v1.p.mashape.com/fixtures/team/${team}`)
    .header("X-Mashape-Key", "LdHFSLCfdImsh1iG2dq2n8N0OGP5p1ETW3ajsnoC5PKR3q777c")
    .header("Accept", "application/json")
    .end(function(result) {
      console.log("LEAGUE 207 STAT : ", result.body);
      res.json({resultat: result.body.api})
    });
});


//   **********        RECUPERATION DES STATS  :  STANDINGS  *********    //////////////////

//attend https://adresseDuBack/statistics/teamApi_id
router.get('/statistics/:id', function(req, res) {
  console.log ("route statistiques")
  var team= req.params.id;
  // console.log("req.params.teamApi_id : ", req.params.id)
  unirest.get(`https://api-football-v1.p.mashape.com/statistics/${saisonEnCoursD1}/${team}`)
    .header("X-Mashape-Key", "LdHFSLCfdImsh1iG2dq2n8N0OGP5p1ETW3ajsnoC5PKR3q777c")
    .header("Accept", "application/json")
    .end(function(result) {
      console.log("LEAGUE 207 STAT : ", result.body);
      res.json({result: result.body.api.stats})
    });
});


module.exports = router;
