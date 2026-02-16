const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
app.set("trust proxy", 1);

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const e = require('express');

//require('dotenv').config();
require('dotenv').config();

// Middleware
app.use(cors(
    {
        origin: [
            "http://localhost:5173",
            "https://hideous-ray.surge.sh",
            "https://mart-academy.web.app",
            "https://mart-academy.firebaseapp.com",

        ],
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
        const notifications = database.collection("notifications");
        const batches = database.collection("batches");

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

            const token = jwt.sign(
                user,
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '7d' }   // match cookie
            );

            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "None",
                path: "/",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.send({ status: true });
        });



        //end jwt token api ------------------------------

        //addmin check api ------------------------------

        app.get("/api/v1/admin/:email", verifyToken, async (req, res) => {
            const email = req.params.email;

            // check if decoded email matches param
            if (req.decoded?.email !== email) {
                return res.status(403).send({ status: "forbidden Access" });
            }

            const user = await users.findOne({ email });

            const isAdmin = user?.role === "admin";
            console.log(isAdmin);
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

        // course delete api-----------------------------
        app.delete('/api/v1/courses/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            // console.log(id,query);
            const result = await courses.deleteOne(query);
            res.send(result);
        });
        // end course delete api-----------------------------

        //sigle course api -----------------------------
        app.get('/api/v1/courses/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await courses.findOne(query);
            res.send(result);
        });


        //end courses api --------------------------------

        // patch api course
        app.patch("/api/v1/courses/:id", verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const { _id, ...data } = req.body;

            // 1️⃣ Get old course
            const oldCourse = await courses.findOne({
                _id: new ObjectId(id),
            });

            // 2️⃣ Update course
            const result = await courses.updateOne(
                { _id: new ObjectId(id) },
                { $set: data }
            );

            // 3️⃣ Detect changes
            let updatedPart = "course";

            if (
                JSON.stringify(oldCourse.summary) !==
                JSON.stringify(data.summary)
            ) {
                updatedPart = "summary";
            }

            if (
                JSON.stringify(oldCourse.modules) !==
                JSON.stringify(data.modules)
            ) {
                updatedPart = "modules";
            }

            // 4️⃣ Create notification
            const notificationDoc = {
                courseId: id,
                courseTitle: oldCourse.title,
                type: `${updatedPart}_update`,
                message: `Course ${updatedPart} has been updated`,
                createdAt: new Date(),
                isRead: false,
            };

            await notifications.insertOne(notificationDoc);

            res.send(result);
        });

        //notifications get api---------------------
        app.get("/api/v1/notifications", async (req, res) => {
            const data = await notifications
                .find()
                .sort({ createdAt: -1 })
                .limit(10)
                .toArray();

            res.send(data);
        });

        //=======================

        // batch post api --------------------------------
        app.post("/api/v1/batches", verifyToken, verifyAdmin, async (req, res) => {
            const data = req.body;
            data.createdAt = new Date();
            // console.log(data);

            const result = await batches.insertOne(data);

            res.send(result);
        });
        // end batch post api --------------------------------

        // batch get api --------------------------------
        app.get("/api/v1/batches", verifyToken, async (req, res) => {
            const cursor = batches.find({}).sort({ createdAt: -1 });
            const result = await cursor.toArray();
            res.send(result);
        });
        // end batch get api --------------------------------

        // batch delete api --------------------------------
        app.delete("/api/v1/batches/:id", verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            console.log(id, query);
            const result = await batches.deleteOne(query);
            res.send(result);
        }
        );
        // end batch delete api --------------------------------    

        // batch patch api --------------------------------
        app.patch("/api/v1/batches/:id", verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const { _id, ...data } = req.body;

            // console.log(data);

            const result = await batches.updateOne(
                { _id: new ObjectId(id) },
                { $set: data }
            );
            res.send(result);
        });
        // end batch patch api --------------------------------




        // users api --------------------------------

        //user get by email api
        app.get('/api/v1/users', verifyToken, verifyAdmin, async (req, res) => {

            const cursor = users.find({});
            const result = await cursor.toArray();
            res.send(result);
        });


        //single user get api
        app.get('/api/v1/users/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await users.findOne(query);
            res.send(result);
        });


        //user post api
        app.post('/api/v1/users', async (req, res) => {
            const user = req.body;
            const { email } = user;
            console.log(user);

            const existingUser = await users.findOne({ email: email });
            if (existingUser) {
                res.send({ message: "This user already exists" });
            } else {
                const result = await users.insertOne(user);
                res.send(result);
            }
        });

        //single user delete api
        app.delete('/api/v1/users/:email', verifyToken, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await users.deleteOne(query);
            res.send(result);
        });

        // single user patch api
        app.patch('/api/v1/users/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const { _id, ...data } = req.body;
            const query = { email: email };
            // console.log(data);
            const result = await users
                .updateOne(query, {
                    $set: data,
                });
            res.send(result);
        }
        );

        // -----------------------

        // course upcomming batch api
        app.get("/api/v1/batches/course/:id", verifyToken, async (req, res) => {
            const id = req.params.id;

            const today = new Date().toISOString().split("T")[0];

            const result = await batches
                .find({
                    courseId: id,
                    startDate: { $gte: today }, // future batches only
                })
                .toArray();

            res.send(result);
        });

        // course upcomming batch api end-----------------------


        //logout api
        app.post('/api/v1/logout', (req, res) => {
            res.clearCookie("token", {
                httpOnly: true,
                secure: true,
                sameSite: "None",
                path: "/",
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

