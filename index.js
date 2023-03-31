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
const port = 8000
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

// app.use('/')

// Define the database connection
const db = mysql.createConnection ({
    host: 'localhost',
    user: 'root',
    password: 'Ch@wdhury12',
    // password:'Chowdhury12',
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
// app.set('views', __dirname + '/views');
app.set('views', [path.join(__dirname, 'views'),
                    path.join(__dirname, 'views/Universal/'),
                    //Planner Pages
                    path.join(__dirname, 'views/Planner/'),
                    path.join(__dirname, 'views/Planner/login/'),
                    path.join(__dirname, 'views/Planner/Register/'),
                    path.join(__dirname, 'views/Planner/Photographer/'), 
                    path.join(__dirname, 'views/Planner/Photographer/list/'), 
                    path.join(__dirname, 'views/Planner/Photographer/add/'),
                    path.join(__dirname, 'views/Planner/Photographer/edit/'), 
                    path.join(__dirname, 'views/Planner/Videographer/'), 
                    path.join(__dirname, 'views/Planner/Videographer/list/'), 
                    path.join(__dirname, 'views/Planner/Videographer/add/'),
                    path.join(__dirname, 'views/Planner/Videographer/edit/'), 
                    path.join(__dirname, 'views/Planner/Itinerary/'),
                    path.join(__dirname, 'views/Planner/Itinerary/add/'),
                    path.join(__dirname, 'views/Planner/Itinerary/edit/'),
                    path.join(__dirname, 'views/Planner/Itinerary/list/'),
                    path.join(__dirname, 'views/Planner/Venue/'),
                    path.join(__dirname, 'views/Planner/Venue/add/'),
                    path.join(__dirname, 'views/Planner/Venue/edit/'),
                    path.join(__dirname, 'views/Planner/Venue/list/'),
                    path.join(__dirname, 'views/Planner/Cake/'),
                    path.join(__dirname, 'views/Planner/Cake/add/'),
                    path.join(__dirname, 'views/Planner/Cake/edit/'),
                    path.join(__dirname, 'views/Planner/Cake/list/'),
                    path.join(__dirname, 'views/Planner/Florist/'),
                    path.join(__dirname, 'views/Planner/Florist/add/'),
                    path.join(__dirname, 'views/Planner/Florist/edit/'),
                    path.join(__dirname, 'views/Planner/Florist/list/'),
                    path.join(__dirname, 'views/Planner/Transport/'),
                    path.join(__dirname, 'views/Planner/Transport/add/'),
                    path.join(__dirname, 'views/Planner/Transport/edit/'),
                    path.join(__dirname, 'views/Planner/Transport/list/'),
                    path.join(__dirname, 'views/Planner/Religious/'),
                    path.join(__dirname, 'views/Planner/Religious/add/'),
                    path.join(__dirname, 'views/Planner/Religious/edit/'),
                    path.join(__dirname, 'views/Planner/Religious/list/'),
                    path.join(__dirname, 'views/Planner/wFunction/'),
                    path.join(__dirname, 'views/Planner/wFunction/add/'),
                    path.join(__dirname, 'views/Planner/wFunction/edit/'),
                    path.join(__dirname, 'views/Planner/wFunction/list/'),
                    path.join(__dirname, 'views/Planner/Budget/'),
                    path.join(__dirname, 'views/Planner/Budget/add/'),
                    path.join(__dirname, 'views/Planner/Budget/edit/'),
                    path.join(__dirname, 'views/Planner/Budget/list/'),
                    //User Pages 
                    path.join(__dirname, 'views/Spouse/'),
                    path.join(__dirname, 'views/Spouse/Photographer/'),
                    path.join(__dirname, 'views/Spouse/Photographer/add/'),
                    path.join(__dirname, 'views/Spouse/Photographer/edit/'),
                    path.join(__dirname, 'views/Spouse/Photographer/list/'),
                    path.join(__dirname, 'views/Spouse/Videographer/'),
                    path.join(__dirname, 'views/Spouse/Videographer/add/'),
                    path.join(__dirname, 'views/Spouse/Videographer/edit/'),
                    path.join(__dirname, 'views/Spouse/Videographer/list/'),
                    path.join(__dirname, 'views/Spouse/Itinerary/'),
                    path.join(__dirname, 'views/Spouse/Itinerary/add/'),
                    path.join(__dirname, 'views/Spouse/Itinerary/edit/'),
                    path.join(__dirname, 'views/Spouse/Itinerary/list/'),
                    path.join(__dirname, 'views/Spouse/Venue/'),
                    path.join(__dirname, 'views/Spouse/Venue/add/'),
                    path.join(__dirname, 'views/Spouse/Venue/edit/'),
                    path.join(__dirname, 'views/Spouse/Venue/list/'),
                    path.join(__dirname, 'views/Spouse/Cake/'),
                    path.join(__dirname, 'views/Spouse/Cake/add/'),
                    path.join(__dirname, 'views/Spouse/Cake/edit/'),
                    path.join(__dirname, 'views/Spouse/Cake/list/'),
                    path.join(__dirname, 'views/Spouse/Florist/'),
                    path.join(__dirname, 'views/Spouse/Florist/add/'),
                    path.join(__dirname, 'views/Spouse/Florist/edit/'),
                    path.join(__dirname, 'views/Spouse/Florist/list/'),
                    path.join(__dirname, 'views/Spouse/Transport/'),
                    path.join(__dirname, 'views/Spouse/Transport/add/'),
                    path.join(__dirname, 'views/Spouse/Transport/edit/'),
                    path.join(__dirname, 'views/Spouse/Transport/list/'),
                    path.join(__dirname, 'views/Spouse/Religious/'),
                    path.join(__dirname, 'views/Spouse/Religious/add/'),
                    path.join(__dirname, 'views/Spouse/Religious/edit/'),
                    path.join(__dirname, 'views/Spouse/Religious/list/'),
                    path.join(__dirname, 'views/Spouse/wFunction/'),
                    path.join(__dirname, 'views/Spouse/wFunction/add/'),
                    path.join(__dirname, 'views/Spouse/wFunction/edit/'),
                    path.join(__dirname, 'views/Spouse/wFunction/list/'),
                    path.join(__dirname, 'views/Spouse/Budget/'),
                    path.join(__dirname, 'views/Spouse/Budget/add/'),
                    path.join(__dirname, 'views/Spouse/Budget/edit/'),
                    path.join(__dirname, 'views/Spouse/Budget/list/'),

                    ]);


// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs');

// Tells Express how we should process html files
// We want to use EJS's rendering engine
app.engine('html', ejs.renderFile);

// Define our data
var shopData = {shopName: "OneStepp Wedd"}

// Requires the main.js file inside the routes folder passing in the Express app and data as arguments.  All the routes will go in this file
require("./routes/main")(app, shopData);

// Start the web app listening
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
