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

async function docifyWorkout(userName, workoutName, exercises) {
    let workoutDoc = {
      userName: userName,
      workoutName: workoutName,
      exercises: exercises
    };
  
  
    return workoutDoc;
  }

  function convertToIndexedObject(exercisesArray) {
    let indexedExercises = {};
    exercisesArray.forEach((exercise, index) => {
      indexedExercises[index.toString()] = exercise;
    });
    return indexedExercises;
  }
  

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

app.get('/workout/', async function (req, res, next) {
	const exerciseCol = database.collection('exercises');
	try {
	  const chestExs = await exerciseCol.find({ Group: 'Chest' }).toArray();
    const backExs = await exerciseCol.find({ Group: 'Back' }).toArray();
    const armExs = await exerciseCol.find({ Group: 'Shoulders/Arms' }).toArray();
    const legExs = await exerciseCol.find({ Group: 'Legs' }).toArray();
    let workout = req.session.workout;

	  res.render('workout_page', { chestExs, backExs, armExs, legExs, workout, username: req.session.user.username });
	} catch (e) {
	  console.log('Error!', e);
	  next(e);
	}
  });

  app.get('/commWorkout', async function (req, res, next){
    try {
        let workoutsCursor = await database.get("workoutWebsite").collection("workouts").find();
        let workouts = await workoutsCursor.toArray();
        console.log(workouts);
        res.render('commWorkout', { workouts: workouts });
    } catch (e) {
        console.log("Error!", e);
        next(e);
    }
  });

  app.get('/myWorkout', async function (req, res, next){
    try {
        let  result = {name: req.session.user.username};
        let workoutsCursor = await database.get("workoutWebsite").collection("workouts").find({userName: result.name});
        let workouts = await workoutsCursor.toArray();
        console.log(workouts);
        res.render('myWorkout', { workouts: workouts });
    } catch (e) {
        console.log("Error!", e);
        next(e);
    }
  });

  
  app.post('/workout/add', async (req, res) => {
    const { Name } = req.body;
    let workout = req.session.workout || { exercises: [] };
    workout.exercises.push(Name);
    req.session.workout = workout;
    console.log(req.session.workout);
    res.redirect('/workout/');
  });
  

  app.post('/workout/save', async (req, res) => {
    const workoutName = req.session.workoutName;
    const workout = req.session.workout;
    
    const indexedExercises = convertToIndexedObject(workout.exercises);
  
    try {
       let workoutDoc = await docifyWorkout(req.session.user.username, workoutName, indexedExercises )
        await database.collection('workouts').insertOne(workoutDoc);
        delete req.session.workout;
        res.redirect('/commWorkout/');
  
    } catch (err) {
        console.error('Error saving workout:', err);
        res.status(500).json({ success: false, message: 'Error saving workout' });
    }
  });

app.post('/workout/reset', (req, res) => {
  delete req.session.workout;
  res.redirect('/workout/');
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

