const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const express = require("express");

const cookieParser = require("cookie-parser");

const app = express();
//middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://bit-craft-e7008.web.app"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(cookieParser());

// Home and health route
app.get("/", (req, res) => {
  res.send("Hello BitCraft");
});
// health
app.get("/health", (req, res) => {
  res.status(200).send("Helth is Good");
});
// Database connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.08atmtx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // ==========================> user related  route implementation <=============================
    // ==========================> user related  route implementation <=============================
    // ==========================> user related  route implementation <=============================
    const userCollection = client.db("bit-craft").collection("users");
    // create  user route added
    app.post("/users/post", async (req, res) => {
      const newItem = req.body;
      console.log(newItem);
      // Check if user already exists based on email
      const existingUser = await userCollection.findOne({
        email: newItem.email,
      });

      console.log(existingUser);
      if (existingUser) {
        // User already exists, send an appropriate response
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }
      // Insert the new user if not already existing
      const result = await userCollection.insertOne(newItem);
      res.status(201).send(result);
    });
    // get single user
    app.get("/users/details/:email", async (req, res) => {
      const result = await userCollection.findOne({
        email: req.params.email,
      });
      res.send(result);
    });
    // get all users
    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // delete product post
    app.delete("/users/delete/:id", async (req, res) => {
      const result = await userCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // ==========================> review related  route implementation <=============================
    // ==========================> review related  route implementation <=============================
    // ==========================> review related  route implementation <=============================
    const reviewCollection = client.db("bit-craft").collection("reviews");
    // create  review route added
    app.post("/review/post", async (req, res) => {
      const newItem = req.body;
      console.log(newItem);
      const result = await reviewCollection.insertOne(newItem);
      res.send(result);
    });
    // get all review
    app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // get product reviews
    app.get("/reviews/:id", async (req, res) => {
      console.log(req.params.id);
      const result = await reviewCollection.find({
        product_id: req.params.id,
      });
      const data = await result.toArray();
      res.send(data);
    });
    // ==========================> product related  route implementation <=============================
    // ==========================> product related  route implementation <=============================
    // ==========================> product related  route implementation <=============================
    const productCollection = client.db("bit-craft").collection("products");
    // create product
    app.post("/product/post", async (req, res) => {
      const newItem = req.body;
      console.log(newItem);
      const result = await productCollection.insertOne(newItem);
      res.send(result);
    });
    // get all product
    app.get("/products", async (req, res) => {
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // get single product
    app.get("/product/details/:id", async (req, res) => {
      console.log(req.params.id);
      const result = await productCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
    // get my products
    app.get("/products/my/:email", async (req, res) => {
      console.log(req.params.email);
      const result = await productCollection
        .find({ user_email: req.params.email })
        .toArray();
      res.send(result);
    });
    // delete product post
    app.delete("/product/delete/:id", async (req, res) => {
      const result = await productCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });

      res.send(result);
    });
    // get trending  products
    app.get("/products/trending", async (req, res) => {
      const allProducts = await productCollection.find().toArray();
      const trendingProducts = allProducts.sort((a, b) => {
        return b.vote.upVote - a.vote.upVote;
      });
      res.json(trendingProducts);
    });
    // get Accepted products
    app.get("/products/accepted", async (req, res) => {
      const allProducts = await productCollection.find().toArray();
      const acceptedProducts = allProducts.filter(
        (product) => product.status === "Accepted"
      );
      res.send(acceptedProducts);
    });

    // update product route
    app.put("/product/update/:id", async (req, res) => {
      console.log(req.params.id);
      const query = { _id: new ObjectId(req.params.id) };
      const options = { upsert: true };
      const data = {
        $set: {
          name: req.body.name,
          title: req.body.title,
          image: req.body.image,
          tags: req.body.tags,
          description: req.body.description,
        },
      };
      const result = await productCollection.updateOne(query, data, options);
      res.send(result);
    });
    // UpVote down vote
    app.patch("/update-vote/:id", async (req, res) => {
      const { id } = req.params;
      const { userEmail, upVote, downVote } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send("Invalid ID format");
      }
      try {
        const document = await productCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!document) {
          return res.status(404).send("Document not found");
        }
        if (document.vote.users.includes(userEmail)) {
          return res.status(400).send("User has already voted");
        }
        const update = {
          $addToSet: { "vote.users": userEmail },
          $inc: {},
        };
        if (typeof upVote === "number") update.$inc["vote.upVote"] = upVote;
        if (typeof downVote === "number")
          update.$inc["vote.downVote"] = downVote;
        const result = await productCollection.updateOne(
          { _id: new ObjectId(id) },
          update
        );
        if (result.modifiedCount === 0) {
          return res.status(400).send("No changes made");
        }
        res.send("Vote count updated and user added successfully");
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
      }
    });
    // search product  by search input
    app.get("/products/accepted/:text", async (req, res) => {
      const searchText = req.params.text.toLowerCase();
      const productData = await productCollection.find().toArray();
      // get accepted product
      const acceptedProducts = productData.filter(
        (product) => product.status === "Accepted"
      );
      if (!searchText) {
        res.send(acceptedProducts);
      }
      const searchResult = acceptedProducts.filter((product) =>
        product.tags.toString().toLowerCase().match(searchText)
      );
      res.send(searchResult);
    });
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port : http://localhost:${port}`);
});
