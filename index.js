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
        origin: ['http://localhost:5173', 'https://hideous-ray.surge.sh', 'https://mart-academy.web.app'],
        credentials: true,
    }
));
app.use(express.json());
app.use(cookieParser());

//custom middleware to verify jwt token
const verifyToken = async (req, res, next) => {
    //token from cookie
    const token = req?.cookies?.token;
    // console.log(token);
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }

    //verify token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
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

        //verify admin middleware--------------------------
        const verifyAdmin = async (req, res, next) => {
            const email = req?.decoded?.email;
            // console.log('email inside verify admin', email);
            const query = { email: email };

            //user find from database
            const user = await users.findOne(query);
            // console.log('user inside verify admin', user);

            //check user role
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
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


        //jwt token api ------------------------------
        app.post('/api/v1/jwt', (req, res) => {
            const user = req.body;
            console.log(user, 'inside jwt');
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            //token in cookie
            res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 3600000 }); // 1 hour
            res.send({ status: true });

        });

        //end jwt token api ------------------------------

        //addmin check api ------------------------------

        app.get("/api/v1/admin/:email", verifyToken, async (req, res) => {
            const email = req.params.email;
            //console.log(email,req.decodedUser?.email);
            if (req.decoded?.email !== email) {
                return res.status(403).send({ status: "forbidden Access" });
            }

            let query = { email: email };

            //find user by query
            const user = await users.findOne(query);

            // //make a admin false initially
            let isAdmin = false;

            if (user) {
                isAdmin = user?.role === "admin";
            }

            res.send({ isAdmin: isAdmin });
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
        app.get('/api/v1/users',verifyToken, async (req, res) => {
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
                secure: true,
                sameSite: 'None', // must match your cookie options!
                path: '/',        // also ensure path matches if you used it when setting cookie
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

