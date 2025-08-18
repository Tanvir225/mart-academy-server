const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const { MongoClient, ServerApiVersion } = require('mongodb');

//require('dotenv').config();
require('dotenv').config();

// Middleware
app.use(cors(
    {
        origin: 'http://localhost:5173',
        credentials: true,
    }
));
app.use(express.json());
app.use(cookieParser());


// Routes
app.get('/', (req, res) => {
    res.send('Welcome to mart academy server');
}
);

const uri = `mongodb+srv://${process.env.academyUser}:${process.env.academyPassword}@cluster0.gghp2r5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // start code----------------------------------------------------------

        // Get the database and collection on which to run the operation
        const database = client.db("mart-academy");
        const banner = database.collection("banner");

        // end database and collection code--------------------------------

        //banner api --------------------------------
        app.get('/api/v1/banner', async (req, res) => {
            const cursor = banner.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        //end banner api --------------------------------

        //faq api --------------------------------
        app.get('/api/v1/faq', async (req, res) => {
            const cursor = database.collection("faq").find({});
            const result = await cursor.toArray();
            res.send(result);
        });
        //end faq api --------------------------------




















        //end code ----------------------------------------------
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Mart academy server is running on port ${port}`);
});

