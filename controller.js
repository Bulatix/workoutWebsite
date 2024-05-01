//This is where the server will get its informations from the database in order to display on the view, and handle events as the user navigates through the website.
var http = require("http");
var qString = require("querystring");
let express = require("express");
let app = express();
var ObjectID = require('mongodb').ObjectId;
let {database, collection} = require('./database');
let mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
let bp = require('body-parser');
let session = require('express-session');

app.listen(3000, async ()=> {
    //start and wait for the DB connection
    try{
        await mongoose.connect('mongodb://127.0.0.1/workoutWebsite', {useNewUrlParser: true, useUnifiedTopology: true })
		await database.get("workoutWebsite");
    } catch (e){
        console.log(e.message);
    }

    console.log("Server is running...");
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: 'cho', // Change this to a secret key of your choice
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure to true if using HTTPS
}));

app.set('views', './views');
app.set('view engine', 'pug');

//app.get('/myWorkout', async function (req, res, next) {
//   try {
//        const username = req.session.user.username;
//
//        const myWorksCursor = await database.get("workoutWebsite").collection("workouts").find({userName: username });
//        const myWorks = await myWorksCursor.toArray();
//
//        res.render('myWorkout', { myWorks: myWorks });
//    } catch (e) {
//       console.log("Error!", e);
//        next(e);
//   }
//});

app.get('/', function (req, res){
	res.render('homepage')
});

app.get('/login', function (req, res){
	res.render('login_page')
});

app.get('/workout', function (req, res) {
    if(req.session.user){
        console.log(req.session.user.username);
    res.render('workout_page', { username: req.session.user.username });
    }
});

app.get('/commWorkout', function (req, res) {
    res.render('commWorkout')
});

app.get('/myWorkout', function (req, res) {
    res.render('myWorkout')
});

app.get('/signup', function (req, res) {
    res.render('signup_page')
});

app.post('/signup', async (req, res) => {
    try {

        const db = database.get('workoutWebsite');
        // Specify the name of the collection you want to insert into
        const collectionName = 'users';

        // Extract username and password from the request body
        const data = {
            name: req.body.username,
            password: req.body.password
        }

        const exist = await collection.findOne({ name: data.name });
        if (exist) {
            res.send("User already exists. Please reenter new username")
            console.log(data.name, data.password)
        } else {
            
                console.log(data.name, data.password)
                const userdata = await db.collection(collectionName).insertOne(data);
                console.log(userdata);
                res.redirect('/login');
        }
    } catch (error) {
        console.error("Error accessing database:", error);
        res.status(500).send("Error accessing database");
    }
});

app.post('/login', async (req, res) => {

    const db = database.get('workoutWebsite');
    // Specify the name of the collection you want to insert into
    const collectionName = 'users';

    // Extract username and password from the request body
    const data = {
        name: req.body.username,
        password: req.body.password
    }
    const user = await db.collection(collectionName).findOne(data);
    if(!user){
        res.send("Incorrect username and password")
    }
    else{
        if(req.body.password == user.password)
        {
            req.session.user = {
                _id: user._id,
                username: user.name
                // Add more user information if needed
            };
        res.redirect('/workout');
        }
    }
});

app.use('*', function(req, res){
    res.writeHead(404);
    res.end(`<h1> ERROR 404. ${req.url} NOT FOUND</h1><br><br>`);
});
app.use((err, req, res, next)=>{
	res.status(500).render('error', {message: err.message})
})

