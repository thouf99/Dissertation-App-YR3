const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
module.exports = function(app, shopData) {
    //checks if the user is logged in or not 
    const redirectLogin = (req, res, next) => {
        if (!req.session.userId ) {
            res.redirect('./login')
        } else { 
            next (); 
        }
    }
    //Home page 
    app.get('/',function(req,res){
        //renders home page
        res.render('index.ejs', shopData)
    });
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    //about page
    app.get('/about',function(req,res){
        //renders about page
        res.render('about.ejs', shopData);
    });
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    //register page
    app.get('/register', function (req,res) {
        //renders the register page
        res.render('register.ejs',shopData);                                                                     
    });  
    //when the users presses register to take the information and add it to the database
    //For users to register their account successfully is to create a username with being 6 characters long and containing '00' in the username
    //For example it could be tes001
    //for the passwords to be successful it must be of length 8 and contain a combination of letters and numbers
    app.post('/registered',  
    //checking if the first name is empty and if left empty to go back to register page
        [check('first').isEmpty()],
        // //checking if the last name is only letters and no numbers
        [check('Last').isAlpha()],
        // //checking if the email inputted is in the email format
        [check('email').isEmail()],
        // //checking the username to contain atleast the number 00 and any numbers after
        [check('username').contains('00',[1,2,3,4,5,6,7,8,9])],
        // //username of length 6
        [check('username').isLength({ max: 6 })],
        // //checking the length of the password is at least 8 characters long
        [check('password').isLength({ min: 8 })],
        // //checking if the password has letters and numbers within
        [check('password').isAlphanumeric('en-GB')],
        function (req,res) {
            const errors = validationResult(req);
            //if an error has occured with any of the above criterias then the error will be printed to the console
            //and will send the user back to the register page and try again
            if (!errors.isEmpty()) {
                //printing the error to the console
                console.log(errors);
                //redirecting the user to the register page
                res.redirect('./register'); 
            }
            else{
            // saving data in database
                const saltRounds = 10;
                const plainPassword = req.sanitize(req.body.password);   
                bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
                    // Store hashed password in your database.
                    if (err) {
                        return console.error(err.message);
                    }
                    //database query to insert the data entered by the user
                    let sqlquery = "INSERT INTO Users (FirstName, LastName, Email, Username, HashedPassword,SpouseFName, SpouseLName, PlannerFName) VALUES (?,?,?,?,?,?,?,?)";
                    //stores the information to be placed into the database.
                    let newrecord = [req.sanitize(req.body.First), req.sanitize(req.body.Last), req.sanitize(req.body.email), req.sanitize(req.body.username), 
                         hashedPassword, req.sanitize(req.body.Spousefname),req.sanitize(req.body.Spouselname), req.sanitize(req.body.Plannerfname)];
                    //database query to add the users details to the database except for their password as it would be unsafe to store their password but
                    //having a hashed version of it instead.
                    db.query(sqlquery, newrecord, (err, result) => {
                        if (err) {
                            return console.error(err.message);
                        }
                        else{
                            console.log(result);
                            let newData = Object.assign({}, shopData, {user:result});
                            res.render('registered.ejs',newData);
                        }
                    });
                });   
            }                                                                             
    });

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    //login page
    app.get('/login',  function (req,res) {
        res.render('login.ejs',shopData);                                                                     
    });
    //outcome of what happens when the user presses 'login'
    //the user is to require the same parameters from when they registered, so this being a username of 'tes001' 
    //and password being alphanumerical
    app.post('/loggedin',
    //username must contain '00' within
    [check('username').contains('00',[1,2,3,4,5,6,7,8,9])],
    // username of length 6
    [check('username').isLength({ max: 6 })],
    // checking the length of the password is at least 8 characters long
    [check('password').isLength({ min: 8 })],
    // checking if the password has letters and numbers within
    [check('password').isAlphanumeric('en-GB')],
    function (req,res) {
        const errors = validationResult(req);
        //if an error has occured with any of the above criterias then the error will be printed to the console
        //and will send the user back to the register page and try again
        if (!errors.isEmpty()) {
            //prints the error to the console
            console.log(errors);
            //redirects the user when the login information is incorrect
            res.redirect('./login'); 
        }
        else{
            // saving data in database*/
            let sqlquery = "select hashedPassword from users where username = '" + req.sanitize(req.body.username) + "'";
            //comparing passwords
            db.query(sqlquery,(err,result)=> {
                if(err) {
                    // res.send('Username entered is incorrect');
                    console.log("error")
                    //will redirect the user to the homepage if the database cannot be found or queried
                    res.redirect('./');
                }
                //if the entered username is not in the database and pulls and
                //undefined hashedPassword then returns error to the console and displays
                //the username that is incorrect
                else if(result.length == 0) {
                    console.log("Username is incorrect")
                    // res.send('Hi '+ req.body.username + ' Username you have entered is incorrect')
                    res.render('incorrectusername.ejs', shopData);
                }
                else{
                    //hashedPassword get set to what the result was from the database
                    let hashedPassword = result[0].hashedPassword;
                    //compares the passwords with the hashedPassword
                    bcrypt.compare(req.sanitize(req.body.password),hashedPassword,function(err,result){
                        if(err) {
                            console.log("Not working " + hashedPassword);//errors with comparison
                            res.redirect('./');
                        }
                        //if the username and passwords match then will show that the user has logged in successfully
                        else if(result == true) {
                            // Save user session here, when login is successful
                            req.session.userId = req.body.username;
                            console.log(req.body.username + " is logged in successfully" )// both username and password correct
                            // res.send('Hi ' + req.body.username + ' is logged in'  )
                            res.render('loggedin.ejs', shopData)
                        }
                        //if username matches and the password does not then will ask the user to try again
                        else{
                                console.log("Incorrect password " + hashedPassword)//password incorrect
                                // res.send('Password you have entered is incorrect' + ' ' + ' Please try again ')
                                res.render('incorrectpassword.ejs', shopData);
                        }
                    });
                }
            });
        }   
    });
    //logout page
    app.get('/logout', redirectLogin, (req,res) => {
        //when logged out the user session cache is destroyed
        req.session.destroy(err => {
            if (err) {
                //any errors in this to redirect the login to home page
                return res.redirect('./')
            }else{
                //When user is logged out successfully to send a message that says they have logged out 
                //sends user back to the home page to do anything else on the web application 
                console.log('You have succefully logged out');
                res.send('you are now logged out. <a href='+'./'+'>Home</a>');
            }
        })
    });

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    //add food page
   app.get('/addPhotographer', 
   redirectLogin, 
   function (req,res) {
       res.render('addPhotographer.ejs', shopData);
   });
   //when a book is successfully added to the site
   app.post('/Photographeradded', 
       // //checking the name parameter is just letters
       // [check('name').isAlpha()],
       // //checks if the typical value is an integer
       // [check('tValue').isInt()],
       // //checks if the unit value is just letters
       // [check('uValue').isAlpha()],
       // //checks if Carb is a floating point number
       // [check('Carb').isFloat()],
       // //checks if Fat is a floating point number
       // [check('Fat').isFloat()], 
       // //checks if Protein is a floating point number
       // [check('Protein').isFloat()],
       // //checks if Salt is a floating point number
       // [check('Salt').isFloat()],
       // //checks if Sugar is a floating point number 
       // [check('Sugar').isFloat()],
       
       function (req,res) {
           //if an error has occured with any of the above criterias then the error will be printed to the console
           //and will send the user back to the register page and try again
           const errors = validationResult(req);
           if (!errors.isEmpty()) {
               // prints error message to the console
               console.log(errors);
               // returns the users back if any error occurs with name or price where name must have book and price must
               // be a decimal point number
               res.redirect('./addPhotographer'); 
           }else{
               // saving data in database
               let sqlquery = "INSERT INTO Photographers (Name, Company, PackPC, PackDC, NoCamPM, OtherInfo, Username) VALUES (?,?,?,?,?,?,?)";
               // execute sql query
               let newrecord = [req.sanitize(req.body.nam), req.sanitize(req.body.comp),req.sanitize(req.body.packp), req.sanitize(req.body.packd),
                   req.sanitize(req.body.nocamPM), req.sanitize(req.body.otherI), req.session.userId];
               db.query(sqlquery, newrecord, (err, result,) => {
                   if (err) {
                       //if error return the error message
                       return console.error(err.message);
                   }
                   else{
                       //When all requirements are met then send user to another page to say it is done
                       res.render('addedItem.ejs', shopData);
                       // res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.Price);
                   }
               }); 
           }
   });

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    //list page for search food page
    app.get('/photographer', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Photographers Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // let sqlquery = "SELECT * FROM Photographers JOIN Users where Users.Username=Photographers.Username"; //testing
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            // console.log(newData.photo[0].Username);
            res.render("photographer.ejs", newData);
	    });                                                                     
    });

    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    // deleting and updating photographer

    //editPhotographer page
    app.get('/editPhotographer', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Photographers Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            res.render("editPhotographer.ejs", newData);
	    });                                                                     
    });
    app.post('/updateItem',function(req,res){
        // let sqlquery = "SELECT * FROM Photographers Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        let sqlquery = "UPDATE Photographers SET Name = '"+ req.body.nam + 
                "', Company = '" + req.body.comp + 
                "', PackPC = '" + req.body.packp + 
                "', PackDC = '" + req.body.packd + 
                "', NoCamPM = '" + req.body.nocamPM + 
                "', OtherInfo = '" + req.body.otherI + 
                "'where ID = '"+ req.body.pid +"'"; //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./editPhotographer');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
                // res.render('hi');
            }
        });                                           
    })
    //delete an item from the photographers
    app.post('/deleteItem', function(req,res){
        let sqlquery = "DELETE FROM Photographers WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./editPhotographer');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })

    ///////////////////////////////////////////////////////////////////////////////////////////
    // List all itinerary based on currently logged in user
    //itinerary page
    app.get('/itinerary', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Itinerary Where Username = '" + req.session.userId +"'ORDER BY Dates ASC"; // query database to get all the foods
        // let sqlquery = "SELECT * FROM Photographers JOIN Users where Users.Username=Photographers.Username"; //testing
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            // console.log(newData.photo[0].Username);
            res.render("itinerary.ejs", newData);
	    });                                                                     
    });

    ///////////////////////////////////////////////////////////////////////////////////////////
    //adding and itinerary

    //Add itinerary
    app.get('/addItinerary', redirectLogin, function(req,res){
        res.render('addItinerary.ejs',shopData);
    });
    // Logic to insert the inputted data into the database
    app.post('/Itineraryadded', redirectLogin,function(req,res){
        let sqlquery = "INSERT INTO Itinerary (Dates, Name, Location, NoGuests, Username, OtherInfo) VALUES (?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.date),req.sanitize(req.body.name), req.sanitize(req.body.location),req.sanitize(req.body.no_Guest), req.session.userId, req.sanitize(req.body.other_I)];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                console.log(result);
                let newData = Object.assign({}, shopData, {allfoods:result});

                res.render('addedItem.ejs',newData);

            }
        });
    });
    ///////////////////////////////////////////////////////////////////////////////////////////

    //editting the itinerary created and when update button is pressed to do the following action
    app.get('/editItinerary', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Itinerary Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            res.render("editItinerary.ejs", newData);
	    });                                                                     
    });
    // updating the Itinerary page
    app.post('/uItinerary',function(req,res){
        let sqlquery = "UPDATE Itinerary SET Name = '"+ req.body.nam + 
                "', Dates = '" + req.body.date + 
                "', Location = '" + req.body.location + 
                "', NoGuests = '" + req.body.noGuests + 
                "', OtherInfo = '" + req.body.Otheri + 
                "'where ID = '"+ req.body.pid +"'"; //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./editItinerary');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
            }
        });                                           
    })
    
    ///////////////////////////////////////////////////////////////////////////////////////////

    // Deleting an item based on what is pressed on the screen and will do the following logic

    //delete an item from the photographers
    app.post('/dItinerary', function(req,res){
        let sqlquery = "DELETE FROM Itinerary WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./editPhotographer');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })
    ///////////////////////////////////////////////////////////////////////////////////////////

    // List all Videographer based on currently logged in user
    //Videographer page
    app.get('/videographer', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Videographers Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // let sqlquery = "SELECT * FROM Photographers JOIN Users where Users.Username=Photographers.Username"; //testing
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            // console.log(newData.photo[0].Username);
            res.render("videographer.ejs", newData);
	    });                                                                     
    });

    ///////////////////////////////////////////////////////////////////////////////////////////
    //adding to Videographer

    //Add Videographer
    app.get('/addVideographer', redirectLogin, function(req,res){
        res.render('addVideographer.ejs',shopData);
    });
    // Logic to insert the inputted data into the database
    app.post('/videographerAdded', redirectLogin,function(req,res){
        let sqlquery = "INSERT INTO Videographers (Name, Company, PackUSB, PackDig, NoCamVM, OtherInfo, Username) VALUES (?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.n),req.sanitize(req.body.c), req.sanitize(req.body.pUSB),req.sanitize(req.body.pDIG), req.sanitize(req.body.nCam),req.sanitize(req.body.otherI),req.session.userId];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                console.log(result);
                let newData = Object.assign({}, shopData, {allfoods:result});

                res.render('addedItem.ejs',newData);

            }
        });
    });
    ///////////////////////////////////////////////////////////////////////////////////////////

    //editting the Videographer created and when update button is pressed to do the following action
    app.get('/editVideographer', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Videographers Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            res.render("editVideographer.ejs", newData);
	    });                                                                     
    });
    // updating the Videographer page
    app.post('/uVideographer',function(req,res){
        let sqlquery = "UPDATE Videographers SET Name = '"+ req.body.n + 
                "', Company = '" + req.body.c + 
                "', PackUSB = '" + req.body.pUSB + 
                "', PackDig = '" + req.body.pDIG + 
                "', NoCamVM = '" + req.body.nCam + 
                "', OtherInfo = '" + req.body.otherI + 
                "'where ID = '"+ req.body.pid +"'"; //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./editVideographer');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
            }
        });                                           
    })
    
    ///////////////////////////////////////////////////////////////////////////////////////////

    // Deleting an item based on what is pressed on the screen and will do the following logic

    //delete an item from the Videographer
    app.post('/dVideographer', function(req,res){
        let sqlquery = "DELETE FROM Videographers WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./editVideographer');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })
    ///////////////////////////////////////////////////////////////////////////////////////////

    // List all Venue based on currently logged in user
    //Venue page
    app.get('/venue', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Venue Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            // console.log(newData.photo[0].Username);
            res.render("venue.ejs", newData);
	    });                                                                     
    });

    ///////////////////////////////////////////////////////////////////////////////////////////
    //adding to Venue

    //Add Venue
    app.get('/addVenue', redirectLogin, function(req,res){
        res.render('addVenue.ejs',shopData);
    });
    // Logic to insert the inputted data into the database
    app.post('/venueAdded', redirectLogin,function(req,res){
        let sqlquery = "INSERT INTO Venue (Name, Address, Guests, Stage, Food, Price, ExtraInfo, Username) VALUES (?,?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.name),req.sanitize(req.body.addr), req.sanitize(req.body.g),req.sanitize(req.body.stage), req.sanitize(req.body.food),req.sanitize(req.body.price),req.sanitize(req.body.eInfo),req.session.userId];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                console.log(result);
                let newData = Object.assign({}, shopData, {allfoods:result});

                res.render('addedItem.ejs',newData);

            }
        });
    });
    ///////////////////////////////////////////////////////////////////////////////////////////

    //editting the Venue created and when update button is pressed to do the following action
    app.get('/editVenue', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Venue Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            res.render("editVenue.ejs", newData);
	    });                                                                     
    });
    // updating the Venue page
    app.post('/uVenue',function(req,res){
        let sqlquery = "UPDATE Venue SET Name = '"+ req.body.name + 
                "', Address = '" + req.body.addr + 
                "', Guests = '" + req.body.g + 
                "', Stage = '" + req.body.stage + 
                "', Food = '" + req.body.food + 
                "', Price = '" + req.body.price +
                "', ExtraInfo = '" + req.body.eInfo + 
                "'where ID = '"+ req.body.pid +"'"; //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./editVenue');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
            }
        });                                           
    })
    
    ///////////////////////////////////////////////////////////////////////////////////////////

    // Deleting an item based on what is pressed on the screen and will do the following logic

    //delete an item from the Venue
    app.post('/dVenue', function(req,res){
        let sqlquery = "DELETE FROM Venue WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./editVenue');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })
    ///////////////////////////////////////////////////////////////////////////////////////////

    // List all Cake based on currently logged in user
    //Cake page
    app.get('/cake', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Cake Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            // console.log(newData.photo[0].Username);
            res.render("cake.ejs", newData);
	    });                                                                     
    });

    ///////////////////////////////////////////////////////////////////////////////////////////
    //adding to Cake

    //Add Cake
    app.get('/addCake', redirectLogin, function(req,res){
        res.render('addCake.ejs',shopData);
    });
    // Logic to insert the inputted data into the database
    app.post('/cakeAdded', redirectLogin,function(req,res){
        let sqlquery = "INSERT INTO Cake (Name, Flavour, Type, Homemade, Tiers, Company, Delivery, Price, Username) VALUES (?,?,?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.name),req.sanitize(req.body.flav), req.sanitize(req.body.type),req.sanitize(req.body.homeMade), req.sanitize(req.body.tier),req.sanitize(req.body.comp),req.sanitize(req.body.deliv),req.sanitize(req.body.price),req.session.userId];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                console.log(result);
                let newData = Object.assign({}, shopData, {allfoods:result});

                res.render('addedItem.ejs',newData);

            }
        });
    });
    ///////////////////////////////////////////////////////////////////////////////////////////

    //editting the Cake created and when update button is pressed to do the following action
    app.get('/editCake', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Venue Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            res.render("editCake.ejs", newData);
	    });                                                                     
    });
    // updating the Cake page
    app.post('/uCake',function(req,res){
        let sqlquery = "UPDATE Cake SET Name = '"+ req.body.name + 
                "', Flavour = '" + req.body.flav + 
                "', Type = '" + req.body.type + 
                "', Homemade = '" + req.body.homeMade + 
                "', Tiers = '" + req.body.tier + 
                "', Company = '" + req.body.comp +
                "', Delivery = '" + req.body.deliv + 
                "', Price = '" + req.body.price + 
                "'where ID = '"+ req.body.pid +"'"; //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./editCake');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
            }
        });                                           
    })
    
    ///////////////////////////////////////////////////////////////////////////////////////////

    // Deleting an item based on what is pressed on the screen and will do the following logic

    //delete an item from the Cake
    app.post('/dCake', function(req,res){
        let sqlquery = "DELETE FROM Cake WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./editCake');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })
    ///////////////////////////////////////////////////////////////////////////////////////////
   
    // List all Florist based on currently logged in user
    //Cake page
    app.get('/florist', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Florist Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            // console.log(newData.photo[0].Username);
            res.render("florist.ejs", newData);
	    });                                                                     
    });

    ///////////////////////////////////////////////////////////////////////////////////////////
    //adding to Florist

    //Add Florist
    app.get('/addFlorist', redirectLogin, function(req,res){
        res.render('addFlorist.ejs',shopData);
    });
    // Logic to insert the inputted data into the database
    app.post('/floristAdded', redirectLogin,function(req,res){
        let sqlquery = "INSERT INTO Florist (Name, Company, Address, Type, StemC, Boquet, Extra, Delivery, TotalP,  Username) VALUES (?,?,?,?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.name),req.sanitize(req.body.comp), req.sanitize(req.body.addr),req.sanitize(req.body.type), req.sanitize(req.body.stemC),req.sanitize(req.body.boq),req.sanitize(req.body.ex),req.sanitize(req.body.del), req.sanitize(req.body.p),req.session.userId];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                res.redirect('./addFlorist');
                return console.error(err.message);
            }
            else{
                console.log(result);
                let newData = Object.assign({}, shopData, {allfoods:result});

                res.render('addedItem.ejs',newData);

            }
        });
    });
    ///////////////////////////////////////////////////////////////////////////////////////////

    //editting the Florist created and when update button is pressed to do the following action
    app.get('/editFlorist', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Florist Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            res.render("editFlorist.ejs", newData);
	    });                                                                     
    });
    // updating the Florist page
    app.post('/uFlorist',function(req,res){
        let sqlquery = "UPDATE Florist SET Name = '"+ req.body.name + 
                "', Company = '" + req.body.comp +
                "', Address = '" + req.body.addr + 
                "', Type = '" + req.body.type + 
                "', StemC = '" + req.body.stemC + 
                "', Boquet = '" + req.body.boq + 
                "', Extra = '" + req.body.ex + 
                "', Delivery = '" + req.body.del + 
                "', TotalP = '" + req.body.p + 
                "'where ID = '"+ req.body.pid +"'"; //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./editFlorist');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
            }
        });                                           
    })
    
    ///////////////////////////////////////////////////////////////////////////////////////////

    // Deleting an item based on what is pressed on the screen and will do the following logic

    //delete an item from the Florist
    app.post('/dFlorist', function(req,res){
        let sqlquery = "DELETE FROM Florist WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./editFlorist');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })
    ///////////////////////////////////////////////////////////////////////////////////////////
      
    // List all Transport based on currently logged in user
    //Transport page
    app.get('/transport', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Transport Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            // console.log(newData.photo[0].Username);
            res.render("transport.ejs", newData);
	    });                                                                     
    });

    ///////////////////////////////////////////////////////////////////////////////////////////
    //adding to Transport

    //Add Transport
    app.get('/addTransport', redirectLogin, function(req,res){
        res.render('addTransport.ejs',shopData);
    });
    // Logic to insert the inputted data into the database
    app.post('/transportAdded', redirectLogin,function(req,res){
        let sqlquery = "INSERT INTO Transport (VehicleT, Name, CompanyN, CompanyA, DistanceR, Deposit, TotalP, ExtraInfo, Username) VALUES (?,?,?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.type),req.sanitize(req.body.name), req.sanitize(req.body.compName),req.sanitize(req.body.compAddr), req.sanitize(req.body.distR8),req.sanitize(req.body.dep),req.sanitize(req.body.totP),req.sanitize(req.body.ex),req.session.userId];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                res.redirect('./addTransport');
                return console.error(err.message);
            }
            else{
                console.log(result);
                let newData = Object.assign({}, shopData, {allfoods:result});

                res.render('addedItem.ejs',newData);

            }
        });
    });
    ///////////////////////////////////////////////////////////////////////////////////////////

    //editting the Transport created and when update button is pressed to do the following action
    app.get('/editTransport', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Transport Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            res.render("editTransport.ejs", newData);
	    });                                                                     
    });
    // updating the Transport page
    app.post('/uTransport',function(req,res){
        let sqlquery = "UPDATE Transport SET VehicleT = '"+ req.body.type + 
                "', Name = '" + req.body.name +
                "', CompanyN = '" + req.body.compName + 
                "', CompanyA = '" + req.body.compAddr + 
                "', DistanceR = '" + req.body.distR8 + 
                "', Deposit = '" + req.body.dep + 
                "', TotalP = '" + req.body.totP + 
                "', ExtraInfo = '" + req.body.ex +
                "'where ID = '"+ req.body.pid +"'"; 
        //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./editTransport');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
            }
        });                                           
    })
    
    ///////////////////////////////////////////////////////////////////////////////////////////

    // Deleting an item based on what is pressed on the screen and will do the following logic

    //delete an item from the Transport
    app.post('/dTransport', function(req,res){
        let sqlquery = "DELETE FROM Transport WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./editTransport');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })
    ///////////////////////////////////////////////////////////////////////////////////////////
      
    // List all Religious based on currently logged in user
    //Religious page
    app.get('/religious', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM ReligiousLOC Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            // console.log(newData.photo[0].Username);
            res.render("Religious.ejs", newData);
	    });                                                                     
    });

    ///////////////////////////////////////////////////////////////////////////////////////////
    //adding to Religious

    //Add Religious
    app.get('/addReligious', redirectLogin, function(req,res){
        res.render('addReligious.ejs',shopData);
    });
    // Logic to insert the inputted data into the database
    app.post('/religiousAdded', redirectLogin,function(req,res){
        let sqlquery = "INSERT INTO ReligiousLOC (Name, Type, DateTime, Price, ExtraInfo, Username) VALUES (?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.name),req.sanitize(req.body.type), req.sanitize(req.body.date),req.sanitize(req.body.p), req.sanitize(req.body.eInfo),req.session.userId];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                res.redirect('./addReligious');
                return console.error(err.message);
            }
            else{
                console.log(result);
                let newData = Object.assign({}, shopData, {allfoods:result});

                res.render('addedItem.ejs',newData);

            }
        });
    });
    ///////////////////////////////////////////////////////////////////////////////////////////

    //editting the Religious created and when update button is pressed to do the following action
    app.get('/editReligious', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM ReligiousLOC Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            res.render("editReligious.ejs", newData);
	    });                                                                     
    });
    // updating the Religious page
    app.post('/uReligious',function(req,res){
        let sqlquery = "UPDATE ReligiousLOC SET Name = '"+ req.body.name + 
                "', Type = '" + req.body.type +
                "', DateTime = '" + req.body.date + 
                "', Price = '" + req.body.p + 
                "', ExtraInfo = '" + req.body.eInfo +
                "'where ID = '"+ req.body.pid +"'"; 
        //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./editReligious');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
            }
        });                                           
    })
    
    ///////////////////////////////////////////////////////////////////////////////////////////

    // Deleting an item based on what is pressed on the screen and will do the following logic

    //delete an item from the Religious
    app.post('/dReligious', function(req,res){
        let sqlquery = "DELETE FROM ReligiousLOC WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./editReligious');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })
    ///////////////////////////////////////////////////////////////////////////////////////////
          
    // List all wFunction based on currently logged in user
    //wFunction page
    app.get('/wFunction', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM WeddingF Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            // console.log(newData.photo[0].Username);
            res.render("wFunction.ejs", newData);
	    });                                                                     
    });

    ///////////////////////////////////////////////////////////////////////////////////////////
    //adding to wFunction

    //Add wFunction
    app.get('/addwFunction', redirectLogin, function(req,res){
        res.render('addwFunction.ejs',shopData);
    });
    // Logic to insert the inputted data into the database
    app.post('/wFunctionAdded', redirectLogin,function(req,res){
        let sqlquery = "INSERT INTO WeddingF (DateTime, Name, Location, Guests, Activity, Price, ExtraInfo, Username) VALUES (?,?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.date),req.sanitize(req.body.name), req.sanitize(req.body.location),req.sanitize(req.body.g), req.sanitize(req.body.act),req.sanitize(req.body.p),req.sanitize(req.body.ex),req.session.userId];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                res.redirect('./addwFunction');
                return console.error(err.message);
            }
            else{
                console.log(result);
                let newData = Object.assign({}, shopData, {allfoods:result});

                res.render('addedItem.ejs',newData);

            }
        });
    });
    ///////////////////////////////////////////////////////////////////////////////////////////

    //editting the wFunction created and when update button is pressed to do the following action
    app.get('/editwFunction', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM WeddingF Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            res.render("editwFunction.ejs", newData);
	    });                                                                     
    });
    // updating the wFunction page
    app.post('/uwFunction',function(req,res){
        let sqlquery = "UPDATE WeddingF SET DateTime = '"+ req.body.date + 
                "', Name = '" + req.body.name +
                "', Location = '" + req.body.location + 
                "', Guests = '" + req.body.g + 
                "', Activity = '" + req.body.act +
                "', Price = '" + req.body.p +
                "', ExtraInfo = '" + req.body.ex +
                "'where ID = '"+ req.body.pid +"'"; 
        //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./editwFunction');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
            }
        });                                           
    })
    
    ///////////////////////////////////////////////////////////////////////////////////////////

    // Deleting an item based on what is pressed on the screen and will do the following logic

    //delete an item from the wFunction
    app.post('/dwFunction', function(req,res){
        let sqlquery = "DELETE FROM WeddingF WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./editwFunction');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })
    ///////////////////////////////////////////////////////////////////////////////////////////
              
    // List all Budget based on currently logged in user
    //Budget page
    app.get('/budget', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Budget Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            // console.log(newData.photo[0].Username);
            res.render("budget.ejs", newData);
	    });                                                                     
    });

    ///////////////////////////////////////////////////////////////////////////////////////////
    //adding to Budget

    //Add Budget
    app.get('/addBudget', redirectLogin, function(req,res){
        res.render('addBudget.ejs',shopData);
    });
    // Logic to insert the inputted data into the database
    app.post('/budgetAdded', redirectLogin,function(req,res){
        let sqlquery = "INSERT INTO Budget (Photographer, Videographer, Florist, Transport, ReligiousLOC, Venue, Cake,WeddingF, Username) VALUES (?,?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.photo),req.sanitize(req.body.video), req.sanitize(req.body.flor),req.sanitize(req.body.transp), req.sanitize(req.body.rel),req.sanitize(req.body.ven),req.sanitize(req.body.cak),req.sanitize(req.body.wedF),req.session.userId];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                res.redirect('./addBudget');
                return console.error(err.message);
            }
            else{
                console.log(result);
                let newData = Object.assign({}, shopData, {allfoods:result});

                res.render('addedItem.ejs',newData);

            }
        });
    });
    ///////////////////////////////////////////////////////////////////////////////////////////

    //editting the Budget created and when update button is pressed to do the following action
    app.get('/editBudget', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Budget Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            res.render("editBudget.ejs", newData);
	    });                                                                     
    });
    // updating the Budget page
    app.post('/uBudget',function(req,res){
        let sqlquery = "UPDATE Budget SET Photographer = '"+ req.body.photo + 
                "', Videographer = '" + req.body.video +
                "', Florist = '" + req.body.flor + 
                "', Transport = '" + req.body.transp + 
                "', ReligiousLOC = '" + req.body.rel +
                "', Venue = '" + req.body.ven +
                "', Cake = '" + req.body.cak +
                "', WeddingF = '" + req.body.wedF +
                "'where ID = '"+ req.body.pid +"'";
        //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./editBudget');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
            }
        });                                           
    })
    
    ///////////////////////////////////////////////////////////////////////////////////////////

    // Deleting an item based on what is pressed on the screen and will do the following logic

    //delete an item from the Budget
    app.post('/dBudget', function(req,res){
        let sqlquery = "DELETE FROM Budget WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./editBudget');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    
    //WEDDING PLANNERS SECTION OF THE APPLICATION 

    const redirectLogins = (req, res, next) => {
        if (!req.session.userId ) {
            res.redirect('./wlogin')
        } else { 
            next (); 
        }
    }
    //register page for wedding planners only
    app.get('/wRegister', function (req,res) {
        //renders the register page
        res.render('wRegister.ejs',shopData);                                                                     
    });
    //wedding planner register
    app.post('/registering',  
    //checking if the first name is empty and if left empty to go back to register page
        [check('first').isEmpty()],
        // //checking if the last name is only letters and no numbers
        [check('Last').isAlpha()],
        // //checking if the email inputted is in the email format
        [check('email').isEmail()],
        // //checking the username to contain atleast the number 00 and any numbers after
        [check('username').contains('00',[1,2,3,4,5,6,7,8,9])],
        // //username of length 6
        [check('username').isLength({ max: 6 })],
        // //checking the length of the password is at least 8 characters long
        [check('password').isLength({ min: 8 })],
        // //checking if the password has letters and numbers within
        [check('password').isAlphanumeric('en-GB')],
        function (req,res) {
            const errors = validationResult(req);
            //if an error has occured with any of the above criterias then the error will be printed to the console
            //and will send the user back to the register page and try again
            if (!errors.isEmpty()) {
                //printing the error to the console
                console.log(errors);
                //redirecting the user to the register page
                res.redirect('./wRegister'); 
            }
            else{
            // saving data in database
                const saltRounds = 10;
                const plainPassword = req.sanitize(req.body.password);   
                bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
                    // Store hashed password in your database.
                    if (err) {
                        return console.error(err.message);
                    }
                    //database query to insert the data entered by the user
                    let sqlquery = "INSERT INTO Planners (FirstName, LastName, Email, Username, HashedPassword) VALUES (?,?,?,?,?)";
                    //stores the information to be placed into the database.
                    let newrecord = [req.sanitize(req.body.first), req.sanitize(req.body.last), req.sanitize(req.body.email), req.sanitize(req.body.username), 
                         hashedPassword];
                    //database query to add the users details to the database except for their password as it would be unsafe to store their password but
                    //having a hashed version of it instead.
                    db.query(sqlquery, newrecord, (err, result) => {
                        if (err) {
                            return console.error(err.message);
                        }
                        else{
                            console.log(result);
                            let newData = Object.assign({}, shopData, {user:result});

                            res.render('registered.ejs',newData);

                        }
                    });
                });   
            }                                                                             
    }); 

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Login for Wedding planners
    //login page
    app.get('/wLogin',  function (req,res) {
        res.render('wLogin.ejs',shopData);                                                                     
    });
    //outcome of what happens when the user presses 'login'
    //the user is to require the same parameters from when they registered, so this being a username of 'tes001' 
    //and password being alphanumerical
    app.post('/loggin',
    //username must contain '00' within
    [check('username').contains('00',[1,2,3,4,5,6,7,8,9])],
    // username of length 6
    [check('username').isLength({ max: 6 })],
    // checking the length of the password is at least 8 characters long
    [check('password').isLength({ min: 8 })],
    // checking if the password has letters and numbers within
    [check('password').isAlphanumeric('en-GB')],
    function (req,res) {
        const errors = validationResult(req);
        //if an error has occured with any of the above criterias then the error will be printed to the console
        //and will send the user back to the register page and try again
        if (!errors.isEmpty()) {
            //prints the error to the console
            console.log(errors);
            //redirects the user when the login information is incorrect
            res.redirect('./wLoggin'); 
        }
        else{
            // saving data in database*/
            let sqlquery = "select hashedPassword from Planners where username = '" + req.sanitize(req.body.username) + "'";
            //comparing passwords
            db.query(sqlquery,(err,result)=> {
                if(err) {
                    // res.send('Username entered is incorrect');
                    console.log("error")
                    //will redirect the user to the homepage if the database cannot be found or queried
                    res.redirect('./');
                }
                //if the entered username is not in the database and pulls and
                //undefined hashedPassword then returns error to the console and displays
                //the username that is incorrect
                else if(result.length == 0) {
                    console.log("Username is incorrect")
                    // res.send('Hi '+ req.body.username + ' Username you have entered is incorrect')
                    res.render('incorrectusername.ejs', shopData);
                }
                else{
                    //hashedPassword get set to what the result was from the database
                    let hashedPassword = result[0].hashedPassword;
                    //compares the passwords with the hashedPassword
                    bcrypt.compare(req.sanitize(req.body.password),hashedPassword,function(err,result){
                        if(err) {
                            console.log("Not working " + hashedPassword);//errors with comparison
                            res.redirect('./');
                        }
                        //if the username and passwords match then will show that the user has logged in successfully
                        else if(result == true) {
                            // Save user session here, when login is successful
                            req.session.userId = req.body.username;
                            console.log(req.body.username + " is logged in successfully" )// both username and password correct
                            // res.send('Hi ' + req.body.username + ' is logged in'  )
                            res.render('loggedin.ejs', shopData)
                        }
                        //if username matches and the password does not then will ask the user to try again
                        else{
                                console.log("Incorrect password " + hashedPassword)//password incorrect
                                // res.send('Password you have entered is incorrect' + ' ' + ' Please try again ')
                                res.render('incorrectpassword.ejs', shopData);
                        }
                    });
                }
            });
        }   
    });

    ///////////////////////////////////////////////////////////////////////////////////////////
    
    //List based on username for photgraphers added by a certain user only which planner can see

    //list based on search from planner and searching by first name which planner can see
    app.get('/sPhotographer', redirectLogins, function (req,res) {
        res.render('search.ejs',shopData);                                                              
    });
    //update food page search result 
    app.get('/search-result', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Photographers join Users Where Photographers.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("photographer.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    // Update or Delete Records for Photographers which planner can do on their behalf

    //Search and then update or delete any of the fields
    //list based on search from planner and searching by first name which planner can see
    app.get('/dPhotographer', redirectLogins, function (req,res) {
        res.render('delete.ejs',shopData);                                                              
    });
    //update food page search result 
    app.get('/search-results', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Photographers join Users Where Photographers.Username=Users.Username and Users.Firstname ='" 
                        + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("editPhotographer.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Update or Delete Records for Photographers which planner can add on their behalf
    //updating the photographer
    app.post('/updateItems',function(req,res){
        // let sqlquery = "SELECT * FROM Photographers Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        let sqlquery = "UPDATE Photographers SET Name = '"+ req.body.nam + 
                "', Company = '" + req.body.comp + 
                "', PackPC = '" + req.body.packp + 
                "', PackDC = '" + req.body.packd + 
                "', NoCamPM = '" + req.body.nocamPM + 
                "', OtherInfo = '" + req.body.otherI + 
                "'where ID = '"+ req.body.pid +"'"; //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
                // res.render('hi');
            }
        });                                           
    })
    //delete an item from the photographers
    app.post('/deleteItems', function(req,res){
        let sqlquery = "DELETE FROM Photographers WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Adding Records for Photographers which planner can add on their behalf

    app.get('/pAdding', redirectLogins, function (req,res) {
        res.render('pAdd.ejs',shopData);                                                              
    });
    // Logic for adding an item entered by a planner which that user they are doing it for can see
    app.post('/PADDP',function(req,res){
        let sqlquery = "INSERT INTO Photographers (Name, Company, PackPC, PackDC, NoCamPM, OtherInfo, Username) VALUES (?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.name), req.sanitize(req.body.company),req.sanitize(req.body.packpc), req.sanitize(req.body.packdc),
            req.sanitize(req.body.Nocampm), req.sanitize(req.body.otherinfo), req.sanitize(req.body.username)];
        db.query(sqlquery, newrecord, (err, result,) => {
            if (err) {
                //if error return the error message
                return console.error(err.message);
            }
            else{
                //When all requirements are met then send user to another page to say it is done
                res.render('addedItem.ejs', shopData);
                // res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.Price);
            }                                        
        })
    })

    ///////////////////////////////////////////////////////////////////////////////////////////

    //List based on username for Videographers added by a certain user only which planner can see

    //list based on search from planner and searching by first name which planner can see
    app.get('/sVideographer', redirectLogins, function (req,res) {
        res.render('sV.ejs',shopData);                                                              
    });
    //update vidographer page search result 
    app.get('/search-V', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Videographers join Users Where Videographers.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("videographer.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    // Update or Delete Records for Videographers which planner can do on their behalf

    //Search and then update or delete any of the fields
    //list based on search from planner and searching by first name which planner can see
    app.get('/dVideographer', redirectLogins, function (req,res) {
        res.render('dV.ejs',shopData);                                                              
    });
    //update food page search result 
    app.get('/search-dV', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Videographers join Users Where Videographers.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("dVideographer.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Update or Delete Records for Videographers which planner can add on their behalf
    //updating the Videographers
    app.post('/updateVid',function(req,res){
        let sqlquery = "UPDATE Videographers SET Name = '"+ req.body.n + 
                "', Company = '" + req.body.c + 
                "', PackUSB = '" + req.body.pUSB + 
                "', PackDig = '" + req.body.pDIG + 
                "', NoCamVM = '" + req.body.nCam + 
                "', OtherInfo = '" + req.body.otherI + 
                "', Username = '" + req.body.username + 
                "'where ID = '"+ req.body.pid +"'"; //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
                // res.render('hi');
            }
        });                                           
    })
    //delete an item from the Videographers
    app.post('/deleteV', function(req,res){
        let sqlquery = "DELETE FROM Videographers WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Adding Records for Videographers which planner can add on their behalf

    app.get('/vAdding', redirectLogins, function (req,res) {
        res.render('vAdd.ejs',shopData);                                                              
    });
    // Logic for adding an item entered by a planner which that user they are doing it for can see
    app.post('/VADDV',function(req,res){
        let sqlquery = "INSERT INTO Videographers (Name, Company, PackUSB, PackDig, NoCamVM, OtherInfo, Username) VALUES (?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.n),req.sanitize(req.body.c), req.sanitize(req.body.pUSB),req.sanitize(req.body.pDIG), req.sanitize(req.body.nCam),
            req.sanitize(req.body.otherI),req.sanitize(req.body.username)];
        db.query(sqlquery, newrecord, (err, result,) => {
            if (err) {
                //if error return the error message
                return console.error(err.message);
            }
            else{
                //When all requirements are met then send user to another page to say it is done
                res.render('addedItem.ejs', shopData);
                // res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.Price);
            }                                        
        })
    })

        ///////////////////////////////////////////////////////////////////////////////////////////

    //List based on username for Itinerary added by a certain user only which planner can see

    //list based on search from planner and searching by first name which planner can see
    app.get('/sItinerary', redirectLogins, function (req,res) {
        res.render('sI.ejs',shopData);                                                              
    });
    //update vidographer page search result 
    app.get('/search-I', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Itinerary join Users Where Itinerary.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'ORDER BY Dates ASC"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("itinerary.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    // Update or Delete Records for Itinerary which planner can do on their behalf

    //Search and then update or delete any of the fields
    //list based on search from planner and searching by first name which planner can see
    app.get('/dItinerary', redirectLogins, function (req,res) {
        res.render('dI.ejs',shopData);                                                              
    });
    //update food page search result 
    app.get('/search-dV', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Videographers join Users Where Itinerary.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'ORDER BY Dates ASC"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("dItinerary.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Update or Delete Records for Videographers which planner can add on their behalf
    //updating the photographer
    app.post('/updateItin',function(req,res){
        let sqlquery = "UPDATE Itinerary SET Name = '"+ req.body.nam + 
                "', Dates = '" + req.body.date + 
                "', Location = '" + req.body.location + 
                "', NoGuests = '" + req.body.noGuests + 
                "', OtherInfo = '" + req.body.Otheri + 
                "'where ID = '"+ req.body.pid +"'"; //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
                // res.render('hi');
            }
        });                                           
    })
    //delete an item from the Videographers
    app.post('/deleteI', function(req,res){
        let sqlquery = "DELETE FROM Itinerary WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Adding Records for Itinerary which planner can add on their behalf

    app.get('/iAdding', redirectLogins, function (req,res) {
        res.render('iAdd.ejs',shopData);                                                              
    });
    // Logic for adding an item entered by a planner which that user they are doing it for can see
    app.post('/IADDI',function(req,res){
        let sqlquery = "INSERT INTO Itinerary (Dates, Name, Location, NoGuests, Username, OtherInfo) VALUES (?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.date),req.sanitize(req.body.name), req.sanitize(req.body.location),req.sanitize(req.body.no_Guest), req.sanitize(req.body.username), 
                    req.sanitize(req.body.other_I)];
        db.query(sqlquery, newrecord, (err, result,) => {
            if (err) {
                //if error return the error message
                return console.error(err.message);
            }
            else{
                //When all requirements are met then send user to another page to say it is done
                res.render('addedItem.ejs', shopData);
                // res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.Price);
            }                                        
        })
    })
    
    ///////////////////////////////////////////////////////////////////////////////////////////

    //List based on username for Venue added by a certain user only which planner can see

    //list based on search from planner and searching by first name which planner can see
    app.get('/sVenue', redirectLogins, function (req,res) {
        res.render('sVe.ejs',shopData);                                                              
    });
    //update vidographer page search result 
    app.get('/search-VE', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Venue join Users Where Venue.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("venue.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    // Update or Delete Records for Venue which planner can do on their behalf

    //Search and then update or delete any of the fields
    //list based on search from planner and searching by first name which planner can see
    app.get('/dVenue', redirectLogins, function (req,res) {
        res.render('dVe.ejs',shopData);                                                              
    });
    //update food page search result 
    app.get('/search-dv', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Venue join Users Where Venue.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("dVenue.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Update or Delete Records for Venue which planner can add on their behalf
    //updating the photographer
    app.post('/updateVen',function(req,res){
        let sqlquery = "UPDATE Venue SET Name = '"+ req.body.name + 
                "', Address = '" + req.body.addr + 
                "', Guests = '" + req.body.g + 
                "', Stage = '" + req.body.stage + 
                "', Food = '" + req.body.food + 
                "', Price = '" + req.body.price +
                "', ExtraInfo = '" + req.body.eInfo + 
                "'where ID = '"+ req.body.pid +"'"; //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
                // res.render('hi');
            }
        });                                           
    })
    //delete an item from the Venue
    app.post('/deleteVen', function(req,res){
        let sqlquery = "DELETE FROM Venue WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Adding Records for Venue which planner can add on their behalf

    app.get('/veAdding', redirectLogins, function (req,res) {
        res.render('veAdd.ejs',shopData);                                                              
    });
    // Logic for adding an item entered by a planner which that user they are doing it for can see
    app.post('/VEADDVE',function(req,res){
        let sqlquery = "INSERT INTO Venue (Name, Address, Guests, Stage, Food, Price, ExtraInfo, Username) VALUES (?,?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.name),req.sanitize(req.body.addr), req.sanitize(req.body.g),req.sanitize(req.body.stage), req.sanitize(req.body.food),req.sanitize(req.body.price),req.sanitize(req.body.eInfo),req.sanitize(req.body.username)];

        db.query(sqlquery, newrecord, (err, result,) => {
            if (err) {
                //if error return the error message
                return console.error(err.message);
            }
            else{
                //When all requirements are met then send user to another page to say it is done
                res.render('addedItem.ejs', shopData);
                // res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.Price);
            }                                        
        })
    })
        
    ///////////////////////////////////////////////////////////////////////////////////////////

    //List based on username for Cake added by a certain user only which planner can see

    //list based on search from planner and searching by first name which planner can see
    app.get('/sCake', redirectLogins, function (req,res) {
        res.render('sC.ejs',shopData);                                                              
    });
    //update Cake page search result 
    app.get('/search-C', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Venue join Users Where Venue.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("cake.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    // Update or Delete Records for Cake which planner can do on their behalf

    //Search and then update or delete any of the fields
    //list based on search from planner and searching by first name which planner can see
    app.get('/dCake', redirectLogins, function (req,res) {
        res.render('dC.ejs',shopData);                                                              
    });
    //update food page search result 
    app.get('/search-C', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Venue join Users Where Cake.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("dCake.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Update or Delete Records for Venue which planner can add on their behalf
    //updating the photographer
    app.post('/updateCake',function(req,res){
        let sqlquery = "UPDATE Cake SET Name = '"+ req.body.name + 
                "', Flavour = '" + req.body.flav + 
                "', Type = '" + req.body.type + 
                "', Homemade = '" + req.body.homeMade + 
                "', Tiers = '" + req.body.tier + 
                "', Company = '" + req.body.comp +
                "', Delivery = '" + req.body.deliv + 
                "', Price = '" + req.body.price + 
                "'where ID = '"+ req.body.pid +"'"; //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
                // res.render('hi');
            }
        });                                           
    })
    //delete an item from the Cake
    app.post('/deleteCake', function(req,res){
        let sqlquery = "DELETE FROM Cake WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Adding Records for Cake which planner can add on their behalf

    app.get('/cakeAdding', redirectLogins, function (req,res) {
        res.render('cAdd.ejs',shopData);                                                              
    });
    // Logic for adding an item entered by a planner which that user they are doing it for can see
    app.post('/CADDC',function(req,res){
        let sqlquery = "INSERT INTO Cake (Name, Flavour, Type, Homemade, Tiers, Company, Delivery, Price, Username) VALUES (?,?,?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.name),req.sanitize(req.body.flav), req.sanitize(req.body.type),req.sanitize(req.body.homeMade), req.sanitize(req.body.tier),req.sanitize(req.body.comp),
                            req.sanitize(req.body.deliv),req.sanitize(req.body.price),req.sanitize(req.body.username)];
        db.query(sqlquery, newrecord, (err, result,) => {
            if (err) {
                //if error return the error message
                return console.error(err.message);
            }
            else{
                //When all requirements are met then send user to another page to say it is done
                res.render('addedItem.ejs', shopData);
                // res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.Price);
            }                                        
        })
    })
        ///////////////////////////////////////////////////////////////////////////////////////////

    //List based on username for Florist added by a certain user only which planner can see

    //list based on search from planner and searching by first name which planner can see
    app.get('/sFlorist', redirectLogins, function (req,res) {
        res.render('sF.ejs',shopData);                                                              
    });
    //update vidographer page search result 
    app.get('/search-F', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Florist join Users Where Florist.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("florist.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    // Update or Delete Records for Florist which planner can do on their behalf

    //Search and then update or delete any of the fields
    //list based on search from planner and searching by first name which planner can see
    app.get('/dFlorist', redirectLogins, function (req,res) {
        res.render('dF.ejs',shopData);                                                              
    });
    //update food page search result 
    app.get('/search-Fl', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Florist join Users Where Florist.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("dFlorist.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Update or Delete Records for Florist which planner can add on their behalf
    //updating the photographer
    app.post('/updateFlorist',function(req,res){
        let sqlquery = "UPDATE Florist SET Name = '"+ req.body.name + 
                "', Company = '" + req.body.comp +
                "', Address = '" + req.body.addr + 
                "', Type = '" + req.body.type + 
                "', StemC = '" + req.body.stemC + 
                "', Boquet = '" + req.body.boq + 
                "', Extra = '" + req.body.ex + 
                "', Delivery = '" + req.body.del + 
                "', TotalP = '" + req.body.p + 
                "'where ID = '"+ req.body.pid +"'"; //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
                // res.render('hi');
            }
        });                                           
    })
    //delete an item from the Florist
    app.post('/deleteFlorist', function(req,res){
        let sqlquery = "DELETE FROM Florist WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Adding Records for Florist which planner can add on their behalf

    app.get('/FloristAdding', redirectLogins, function (req,res) {
        res.render('fAdd.ejs',shopData);                                                              
    });
    // Logic for adding an item entered by a planner which that user they are doing it for can see
    app.post('/FADDF',function(req,res){
        let sqlquery = "INSERT INTO Florist (Name, Company, Address, Type, StemC, Boquet, Extra, Delivery, TotalP,  Username) VALUES (?,?,?,?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.name),req.sanitize(req.body.comp), req.sanitize(req.body.addr),req.sanitize(req.body.type), req.sanitize(req.body.stemC),req.sanitize(req.body.boq),req.sanitize(req.body.ex),req.sanitize(req.body.del), req.sanitize(req.body.p),req.sanitize(req.body.username)];
        db.query(sqlquery, newrecord, (err, result,) => {
            if (err) {
                //if error return the error message
                return console.error(err.message);
            }
            else{
                //When all requirements are met then send user to another page to say it is done
                res.render('addedItem.ejs', shopData);
                // res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.Price);
            }                                        
        })
    })
            
    ///////////////////////////////////////////////////////////////////////////////////////////

    //List based on username for Transport added by a certain user only which planner can see

    //list based on search from planner and searching by first name which planner can see
    app.get('/sTransport', redirectLogins, function (req,res) {
        res.render('sT.ejs',shopData);                                                              
    });
    //update Transport page search result 
    app.get('/search-T', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Transport join Users Where Transport.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("transport.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    // Update or Delete Records for Transport which planner can do on their behalf

    //Search and then update or delete any of the fields
    //list based on search from planner and searching by first name which planner can see
    app.get('/dTransport', redirectLogins, function (req,res) {
        res.render('dF.ejs',shopData);                                                              
    });
    //update Transport page search result 
    app.get('/search-Tr', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Transport join Users Where Transport.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("dTransport.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Update or Delete Records for Transport which planner can add on their behalf
    //updating the photographer
    app.post('/updateTransport',function(req,res){
        let sqlquery = "UPDATE Transport SET VehicleT = '"+ req.body.type + 
                "', Name = '" + req.body.name +
                "', CompanyN = '" + req.body.compName + 
                "', CompanyA = '" + req.body.compAddr + 
                "', DistanceR = '" + req.body.distR8 + 
                "', Deposit = '" + req.body.dep + 
                "', TotalP = '" + req.body.totP + 
                "', ExtraInfo = '" + req.body.ex +
                "'where ID = '"+ req.body.pid +"'";  //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
                // res.render('hi');
            }
        });                                           
    })
    //delete an item from the Transport
    app.post('/deleteTransport', function(req,res){
        let sqlquery = "DELETE FROM Transport WHERE ID = '"+ req.body.fid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Adding Records for Transport which planner can add on their behalf

    app.get('/TransportAdding', redirectLogins, function (req,res) {
        res.render('tAdd.ejs',shopData);                                                              
    });
    // Logic for adding an item entered by a planner which that user they are doing it for can see
    app.post('/TADDT',function(req,res){
        let sqlquery = "INSERT INTO Transport (VehicleT, Name, CompanyN, CompanyA, DistanceR, Deposit, TotalP, ExtraInfo, Username) VALUES (?,?,?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.type),req.sanitize(req.body.name), req.sanitize(req.body.compName),req.sanitize(req.body.compAddr), req.sanitize(req.body.distR8),req.sanitize(req.body.dep),req.sanitize(req.body.totP),req.sanitize(req.body.ex),req.sanitize(req.body.username)];
        db.query(sqlquery, newrecord, (err, result,) => {
            if (err) {
                //if error return the error message
                return console.error(err.message);
            }
            else{
                //When all requirements are met then send user to another page to say it is done
                res.render('addedItem.ejs', shopData);
                // res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.Price);
            }                                        
        })
    })
       
    ///////////////////////////////////////////////////////////////////////////////////////////

    //List based on username for Religious added by a certain user only which planner can see

    //list based on search from planner and searching by first name which planner can see
    app.get('/sReligious', redirectLogins, function (req,res) {
        res.render('sR.ejs',shopData);                                                              
    });
    //update Religious page search result 
    app.get('/search-R', function (req, res) {
        //searching in the database
        let sqlquery = "select * from ReligiousLOC join Users Where ReligiousLOC.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("religious.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    // Update or Delete Records for Religious which planner can do on their behalf

    //Search and then update or delete any of the fields
    //list based on search from planner and searching by first name which planner can see
    app.get('/dReligious', redirectLogins, function (req,res) {
        res.render('dR.ejs',shopData);                                                              
    });
    //update Transport page search result 
    app.get('/search-REL', function (req, res) {
        //searching in the database
        let sqlquery = "select * from ReligiousLOC join Users Where ReligiousLOC.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("dReligious.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Update or Delete Records for Religious which planner can add on their behalf
    //updating the photographer
    app.post('/updateReligious',function(req,res){
        let sqlquery = "UPDATE ReligiousLOC SET Name = '"+ req.body.name + 
                "', Type = '" + req.body.type +
                "', DateTime = '" + req.body.date + 
                "', Price = '" + req.body.p + 
                "', ExtraInfo = '" + req.body.eInfo +
                "'where ID = '"+ req.body.pid +"'";   //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
                // res.render('hi');
            }
        });                                           
    })
    //delete an item from the Religious
    app.post('/deleteReligious', function(req,res){
        let sqlquery = "DELETE FROM ReligiousLOC WHERE ID = '"+ req.body.fid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Adding Records for Religious which planner can add on their behalf

    app.get('/ReligiousAdding', redirectLogins, function (req,res) {
        res.render('rAdd.ejs',shopData);                                                              
    });
    // Logic for adding an item entered by a planner which that user they are doing it for can see
    app.post('/RADDR',function(req,res){
        let sqlquery = "INSERT INTO ReligiousLOC (Name, Type, DateTime, Price, ExtraInfo, Username) VALUES (?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.name),req.sanitize(req.body.type), req.sanitize(req.body.date),req.sanitize(req.body.p), req.sanitize(req.body.eInfo),req.sanitize(req.body.username)];
        db.query(sqlquery, newrecord, (err, result,) => {
            if (err) {
                //if error return the error message
                return console.error(err.message);
            }
            else{
                //When all requirements are met then send user to another page to say it is done
                res.render('addedItem.ejs', shopData);
                // res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.Price);
            }                                        
        })
    })
    
    ///////////////////////////////////////////////////////////////////////////////////////////

    //List based on username for WeddingFunction added by a certain user only which planner can see

    //list based on search from planner and searching by first name which planner can see
    app.get('/sWFunction', redirectLogins, function (req,res) {
        res.render('sWf.ejs',shopData);                                                              
    });
    //update WeddingFunction page search result 
    app.get('/search-wf', function (req, res) {
        //searching in the database
        let sqlquery = "select * from WeddingF join Users Where WeddingF.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("wFunction.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    // Update or Delete Records for WeddingFunction which planner can do on their behalf

    //Search and then update or delete any of the fields
    //list based on search from planner and searching by first name which planner can see
    app.get('/dWeddingF', redirectLogins, function (req,res) {
        res.render('dWf.ejs',shopData);                                                              
    });
    //update Transport page search result 
    app.get('/search-WedF', function (req, res) {
        //searching in the database
        let sqlquery = "select * from WeddingF join Users Where WeddingF.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("dWeddingF.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Update or Delete Records for WeddingFunction which planner can add on their behalf
    //updating the WeddingFunction
    app.post('/updateWF',function(req,res){
        let sqlquery = "UPDATE WeddingF SET DateTime = '"+ req.body.date + 
                "', Name = '" + req.body.name +
                "', Location = '" + req.body.location + 
                "', Guests = '" + req.body.g + 
                "', Activity = '" + req.body.act +
                "', Price = '" + req.body.p +
                "', ExtraInfo = '" + req.body.ex +
                "'where ID = '"+ req.body.pid +"'";   //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
                // res.render('hi');
            }
        });                                           
    })
    //delete an item from the Religious
    app.post('/deleteWF', function(req,res){
        let sqlquery = "DELETE FROM ReligiousLOC WHERE ID = '"+ req.body.pid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Adding Records for WeddingFunction which planner can add on their behalf

    app.get('/WeddingFAdding', redirectLogins, function (req,res) {
        res.render('wfAdd.ejs',shopData);                                                              
    });
    // Logic for adding an item entered by a planner which that user they are doing it for can see
    app.post('/WFADDWF',function(req,res){
        let sqlquery = "INSERT INTO WeddingF (DateTime, Name, Location, Guests, Activity, Price, ExtraInfo, Username) VALUES (?,?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.date),req.sanitize(req.body.name), req.sanitize(req.body.location),req.sanitize(req.body.g),
                        req.sanitize(req.body.act),req.sanitize(req.body.p),req.sanitize(req.body.ex),req.sanitize(req.body.username)];
        db.query(sqlquery, newrecord, (err, result,) => {
            if (err) {
                //if error return the error message
                return console.error(err.message);
            }
            else{
                //When all requirements are met then send user to another page to say it is done
                res.render('addedItem.ejs', shopData);
                // res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.Price);
            }                                        
        })
    })
            
    ///////////////////////////////////////////////////////////////////////////////////////////

    //List based on username for Budget added by a certain user only which planner can see

    //list based on search from planner and searching by first name which planner can see
    app.get('/sBudget', redirectLogins, function (req,res) {
        res.render('sB.ejs',shopData);                                                              
    });
    //update Budget page search result 
    app.get('/search-B', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Budget join Users Where Budget.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("budget.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    // Update or Delete Records for Budget which planner can do on their behalf

    //Search and then update or delete any of the fields
    //list based on search from planner and searching by first name which planner can see
    app.get('/dBudget', redirectLogins, function (req,res) {
        res.render('dB.ejs',shopData);                                                              
    });
    //update Transport page search result 
    app.get('/search-BUD', function (req, res) {
        //searching in the database
        let sqlquery = "select * from Budget join Users Where Budget.Username=Users.Username and Users.Firstname ='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("dBudget.ejs", newData);
            }
        });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Update or Delete Records for Budget which planner can add on their behalf
    //updating the Budget
    app.post('/updateBudget',function(req,res){
        let sqlquery = "UPDATE Budget SET Photographer = '"+ req.body.photo + 
                    "', Videographer = '" + req.body.video +
                    "', Florist = '" + req.body.flor + 
                    "', Transport = '" + req.body.transp + 
                    "', ReligiousLOC = '" + req.body.rel +
                    "', Venue = '" + req.body.ven +
                    "', Cake = '" + req.body.cak +
                    "', WeddingF = '" + req.body.wedF +
                    "'where ID = '"+ req.body.pid +"'";   //SQL query to update the current item only when the id is gathered
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                //if error then redirect to home page
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //otherwise update the item and send user to another page to say it has been updated successfully
                res.render('updatedItem.ejs',shopData);
                // res.render('hi');
            }
        });                                           
    })
    //delete an item from the Religious
    app.post('/deleteBudget', function(req,res){
        let sqlquery = "DELETE FROM ReligiousLOC WHERE ID = '"+ req.body.fid +"'";//sql query to delete items by their ID only
        
        db.query(sqlquery, (err, result) => {
            // console.log(result);
            if (err) {
                //if error go to home
                res.redirect('./');
                return console.error(err.message);
            }
            else{
                //success message to say the item has been deleted
                res.render("deletedItem.ejs",shopData);
            }   
        });    
    })

    ///////////////////////////////////////////////////////////////////////////////////////////

    //Adding Records for WeddingFunction which planner can add on their behalf

    app.get('/BudgetAdding', redirectLogins, function (req,res) {
        res.render('bAdd.ejs',shopData);                                                              
    });
    // Logic for adding an item entered by a planner which that user they are doing it for can see
    app.post('/BADDB',function(req,res){
        let sqlquery = "INSERT INTO Budget (Photographer, Videographer, Florist, Transport, ReligiousLOC, Venue, Cake,WeddingF, Username) VALUES (?,?,?,?,?,?,?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.photo),req.sanitize(req.body.video), req.sanitize(req.body.flor),req.sanitize(req.body.transp), req.sanitize(req.body.rel),req.sanitize(req.body.ven),req.sanitize(req.body.cak),req.sanitize(req.body.wedF),req.sanitize(req.body.username)];
        db.query(sqlquery, newrecord, (err, result,) => {
            if (err) {
                //if error return the error message
                return console.error(err.message);
            }
            else{
                //When all requirements are met then send user to another page to say it is done
                res.render('addedItem.ejs', shopData);
                // res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.Price);
            }                                        
        })
    })


    //  "Taha";
    app.get('/Guest', function (req,res) {
        res.render('guestS.ejs',shopData);                                                              
    });
    //update Transport page search result 
    app.get('/search-spous', function (req, res) {
        //searching in the database
        let sqlquery = "select * FROM Itinerary JOIN Users where Itinerary.Username=Users.Username and Users.FirstName='" + req.sanitize(req.query.keyword) + "'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            console.log(result)
            if (err) {
                res.redirect('./');
            }else if(result == 0){
                //if result is 0 then display a new page to say there was no foods found with the keyword
                res.render('none.ejs',shopData);
                // res.send('No foods or recipes found. <a href='+'./'+'>Home</a>');

            }else{
                //Otherwise display the information found from the keyword
                let newData = Object.assign({}, shopData, {allfoods:result});
                //renders the page
                res.render("guest.ejs", newData);
            }
        });
    });

    // app.get('/todo', function (req,res) {
    //     res.render('index.php',shopData);                                                              
    // });
}