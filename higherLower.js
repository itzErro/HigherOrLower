process.stdin.setEncoding("utf8");


// EXPRESS
const fs = require("fs"); /* Module for file reading */
const express = require("express"); /* Accessing express module */
const path = require("path");
const app = express();
const bodyParser = require("body-parser");


// MONGO SET UP START
// require("dotenv").config({ path: path.resolve(__dirname, '.env') })
const MONGO_DB_USERNAME = process.env.MONGO_DB_USERNAME;
const MONGO_DB_PASSWORD = process.env.MONGO_DB_PASSWORD;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
const MONGO_COLLECTION = process.env.MONGO_COLLECTION;
const databaseAndCollection = {db: MONGO_DB_NAME, collection: MONGO_COLLECTION};
const MONGO_CONNECTION_STRING = `mongodb+srv://${MONGO_DB_USERNAME}:${MONGO_DB_PASSWORD}@cluster0.tfdkclv.mongodb.net/?retryWrites=true&w=majority`
const uri = MONGO_CONNECTION_STRING;
const { MongoClient, ServerApiVersion } = require('mongodb');


// GLOBALLY SCOPED
let vars = {};
let resultsTable = "";


// COMMAND LINE CODE START
if (process.argv.length != 3) {
  process.stdout.write(`Error Starting\n`);
  process.exit(0);
}

const portNumber = process.env.PORT;

app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);

const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
  let dataInput = process.stdin.read();
  if (dataInput !== null) {
    let command = dataInput.trim();

    if (command === "stop") {
      console.log("Shutting down the server");
      process.exit(0);

    } else {
      console.error(`Invalid command: ${command}`);
    }
    process.stdout.write(prompt);
    process.stdin.resume();
  }
});


// SET UP CODE
/* directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));
/* Initializes request.body with post information */
app.use(bodyParser.urlencoded({ extended: false }));
/* view/templating engine */
app.set("view engine", "ejs");


//Game State
// let gameInProgress = false;
let playerLoggedIn = false;
let score = 0;
let highScore = 0;
let playerName;
let playerLocation;

// SITE CODE
app.use( express.static( "public" ) );

// Home Page
app.get("/", (req, res) => {
  res.render("index");
});


// Application Page
app.get("/game", (req, res) => {
  const serverData = { 
    score: score, 
    playerLoggedIn: playerLoggedIn, 
    playerHighScore: highScore, 
    playerName: playerName, 
    playerLocation: playerLocation 
  };

  res.render("game", { serverData });
});

app.post("/game", (req, res) => {

  vars = {
    // name: req.body?.name,
    highScore: req.body?.highScore
  };
   highScore = vars["highScore"];

  res.json({redirect: true})
});

/* GAME-OVER */

app.get("/game-over", (req, res) => {

  res.render("game-over", {highScore: highScore});
})

app.post("/game-over", (req, res) => {
  // Create data variable from form submission
  vars = {
    name: req.body?.name,
    highScore: highScore
  };

  // Insert into database
  insertScore(vars);

  // goes back to the home page after submitting score if user
  // didn't press play again
  res.redirect('/');
})


/* LEADERBOARD STUFF */


app.get("/leaderboard", async (req, res) => {  
  await lookUpHelp(res);
  res.render("leaderboard");
});

app.post("/leaderboard", async (req, res) => {  
  await lookUpHelp(res);
  res.render("leaderboardLoad", { resultsTable });
  
});

/* MONGO FUNCTIONS */

async function lookUpHelp(res) {
  const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1 });
  let results = [];
  try {
      await client.connect();
      results = await lookUpMany(client, databaseAndCollection);
      results.sort((a,b)=>b.highScore-a.highScore);
      results = results.slice(0, 10);
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();

      // Create string for HTML table
      resultsTable = '<table border="1" style="black solid">';
      resultsTable += '<tr> <th> Name </th> <th> Score </th> </tr>';

      // Add items from database to table
      // console.log(results);
      results.forEach(element => {
          resultsTable += `<tr><td>${element.name}</td><td>${element.highScore}</td></tr>`;
      });
      resultsTable += "</table>"

      // console.log("completed the table thing");
      return resultsTable;
      
      
  }
}

async function lookUpMany(client, databaseAndCollection) {
  let filter = {};
  const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);

  return await cursor.toArray();
}


async function insertScore(vars) {
  const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1 });
  try {
      await client.connect();
      const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .insertOne(vars);
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}


app.get("/signIn", (req, res) => {  
  res.render("signIn");
});

