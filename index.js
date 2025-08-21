const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const e = require('express');

//require('dotenv').config();
require('dotenv').config();

// Middleware
app.use(cors(
    {
        origin: ['http://localhost:5173', 'https://hideous-ray.surge.sh'],
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
        const faq = database.collection("faq");
        const courses = database.collection("courses");
        const users = database.collection("users");

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
            const cursor = faq.find({});
            const result = await cursor.toArray();
            res.send(result);
        });
        //end faq api --------------------------------

        //courses api with query -----------------------------

        app.get('/api/v1/courses', async (req, res) => {

            // filter by it
            let query = {};
            // if () {
            //     query = { category: category };
            // }
            const cursor = courses.find(query);
            const result = await cursor.toArray();
            res.send(result);
        }
        );

        //sigle course api -----------------------------
        app.get('/api/v1/courses/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await courses.findOne(query);
            res.send(result);
        });


        //end courses api --------------------------------


        // users api --------------------------------

        //user get by email api
        app.get('/api/v1/users', async (req, res) => {
            const email = req.query.email;
            let result;
            // console.log(email);
            const query = { email: email };
            // console.log(query);
            if (query?.email) {
                // If email is provided, find user by email
                result = await users.findOne(query);

            }
            else {
                // If no email is provided, return all users
                const cursor = users.find({});
                result = await cursor.toArray();
            }

            res.send(result);
        });

        //user post api
        app.post('/api/v1/users', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const result = await users.insertOne(user);
            res.send(result);
        });























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

