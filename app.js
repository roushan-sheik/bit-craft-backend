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
    // ==========================> vote related  route implementation <=============================
    const voteCollection = client.db( "bit-craft" ).collection( "vote" );
    
    // add vote
    app.post("/vote", async (req, res) => {
      const newItem = req.body;
      // find vote
      const reslt = await voteCollection.find({
        blog_id: newItem.blog_id,
      });
      const data = await reslt.toArray();
      const voteResutl = data.filter((item) => item.email === newItem.email);
      if (voteResutl.length !== 0) {
        res.status(422).send("You have voted");
        return;
      }
      const result = await voteCollection.insertOne(newItem);
      // Send the inserted comment as response
      res.status(201).send(result);
    });
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
    // get my blogs
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
      console.log(result);
      res.send(result);
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
