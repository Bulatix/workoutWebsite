const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://scullr47:RowanMMAFan17!@workoutdb.nc3uu06.mongodb.net/?retryWrites=true&w=majority&appName=WorkoutDB";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
//var getID = require('mongodb').ObjectID();
let dbName = "workoutWebsite";
let database = {};
let myDB;
/*function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();
        // Send a ping to confirm a successful connection
        client.db("workoutWebsite").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run();*/
var connect = async function(dbName){
    try{
	await client.connect();
	await client.db("admin").command({ ping: 1 });

	myDB=client.db(dbName);
	
	if (!myDB){
	    throw new Error("DB Connection Failed to start!");
	}
	else{
	    console.log(`Connected to ${dbName}`);
	    return myDB;
	}
    } catch(e){
	console.log(e.message);
    }
}
//Call get("<name_of_your_DB"> to initialize the db connection
//after that you can can call get() to just get the connection anywhere
database.get = function(dbName){
    if (myDB){
	console.log("Already connected!");
	return myDB;
    } else {
	return connect(dbName);
    }
}
//call close in your apps when you want to close the DB connection
database.close = async function(){

    try{
	await client.close();
	return;
    } catch(e){
	console.log(e.message);
    }
 }
module.exports = database;




