// Import the modules we need
var express = require ('express')
var ejs = require('ejs')
var bodyParser= require ('body-parser')
const mysql = require('mysql');
//locking access until the user logs in 
var session = require ('express-session');
//validate the email
var validator = require ('express-validator');


// Create the express application object
const app = express()
const port = 8080
const expressSanitizer = require('express-sanitizer');
const path = require('path');
app.use(express.static(path.join(__dirname,'public')));
app.use(expressSanitizer());

app.use(bodyParser.urlencoded({ extended: true }))

// Create a session
app.use(session({
    secret: 'somerandomstuff',
    resave: false,
    saveUninitialized: false,
    cookie: {
    expires: 600000
    }
}));

// Create an input sanitizer
app.use(expressSanitizer());

// Set up css
app.use(express.static(__dirname + '/public'));

// Define the database connection
const db = mysql.createConnection ({
    host: 'localhost',
    user: 'root',
    // password: 'Chowdhury12',
    password: 'Ch@wdhury12',
    database: 'Wedding'
});
// Connect to the database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});
global.db = db;
// Set the directory where Express will pick up HTML files
// __dirname will get the current directory
app.set('views', __dirname + '/views');

// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs');

// Tells Express how we should process html files
// We want to use EJS's rendering engine
app.engine('html', ejs.renderFile);

// Define our data
var shopData = {shopName: "Re-Wedd"}

// Requires the main.js file inside the routes folder passing in the Express app and data as arguments.  All the routes will go in this file
require("./routes/main")(app, shopData);

// Start the web app listening
app.listen(port, () => console.log(`Example app listening on port ${port}!`))