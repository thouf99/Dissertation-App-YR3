const bcrypt = require('bcrypt');

const { check, validationResult } = require('express-validator');

module.exports = function(app, shopData) {
    //redirects login for add food and update food
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
    
    //about page
    app.get('/about',function(req,res){
        //renders about page
        res.render('about.ejs', shopData);
    });

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
        // [check('first').isEmpty()],
        // //checking if the last name is only letters and no numbers
        // [check('Last').isAlpha()],
        // //checking if the email inputted is in the email format
        // [check('email').isEmail()],
        // //checking the username to contain atleast the number 00 and any numbers after
        // [check('username').contains('00',[1,2,3,4,5,6,7,8,9])],
        // //username of length 6
        // [check('username').isLength({ max: 6 })],
        // //checking the length of the password is at least 8 characters long
        // [check('password').isLength({ min: 8 })],
        // //checking if the password has letters and numbers within
        // [check('password').isAlphanumeric('en-GB')],
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

    //add food page
	app.get('/addPhotographer', redirectLogin, function (req,res) {
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
                let newrecord = [req.sanitize(req.body.name), req.sanitize(req.body.company),req.sanitize(req.body.packpc), req.sanitize(req.body.packdc),
                    req.sanitize(req.body.Nocampm), req.sanitize(req.body.otherinfo), req.session.userId];
                db.query(sqlquery, newrecord, (err, result,) => {
                    if (err) {
                        //if error return the error message
                        return console.error(err.message);
                    }
                    else{
                        //When all requirements are met then send user to another page to say it is done
                        res.render('photographerAdded.ejs', shopData);
                        // res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.Price);
                    }
                }); 
            }
    });
    //list page for search food page
    app.get('/photographer', redirectLogin, function (req,res) {
        let sqlquery = "SELECT * FROM Photographers Where Username = '" + req.session.userId +"'"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, {allfoods:result});
            console.log(newData);
            res.render("photographer.ejs", newData);
	    });                                                                     
    });
}