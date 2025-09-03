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
        origin: ['http://localhost:5173', 'https://hideous-ray.surge.sh', 'https://mart-academy.web.app', 'https://mart-academy.firebaseapp.com'],
        credentials: true,
    }
));
app.use(express.json());
app.use(cookieParser());


// Middleware to verify JWT token from Authorization header
const verifyToken = (req, res, next) => {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }

    // Verify token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded; // attach decoded info to request
        next();
    });
};



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

        // Middleware to verify if user is admin
        const verifyAdmin = async (req, res, next) => {
            const email = req?.decoded?.email;
            if (!email) return res.status(401).send({ message: 'Unauthorized access' });

            // Find user in DB
            const user = await users.findOne({ email });
            if (!user || user.role !== 'admin') {
                return res.status(403).send({ message: 'Forbidden access' });
            }

            next();
        };

        //end verify admin middleware--------------------------


        //banner api --------------------------------
        app.get('/api/v1/banner', async (req, res) => {
            const cursor = banner.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        //end banner api --------------------------------


        // Generate JWT token
        app.post('/api/v1/jwt', (req, res) => {
            const user = req.body;
            if (!user?.email) return res.status(400).send({ message: 'Invalid user data' });

            // Sign token (1 hour expiry)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            // Send token in response body
            res.send({ status: true, token });
        });


        //end jwt token api ------------------------------

        // Admin check API------------------------------
        app.get("/api/v1/admin/:email", verifyToken, async (req, res) => {
            const emailParam = req.params.email;

            // Ensure the JWT user matches the requested email
            if (req.decoded?.email !== emailParam) {
                return res.status(403).send({ status: "forbidden", message: "Forbidden access" });
            }

            // Find user by email
            const user = await users.findOne({ email: emailParam });

            // Determine if user is admin
            const isAdmin = user?.role === "admin";

            res.send({ isAdmin });
        });

        //end admin check api ------------------------------

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
        app.get('/api/v1/users', verifyToken, async (req, res) => {
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

        //single user delete api
        app.delete('/api/v1/users/:email', verifyToken, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await users.deleteOne(query);
            res.send(result);
        });



        //logout api
        app.post('/api/v1/logout', (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'None',
                path: '/'
            });

            res.send({ message: 'Logged out successfully' });
        });
        //end users api --------------------------------


























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

