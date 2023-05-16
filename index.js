const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2cofc5d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const productCollection = client.db("emaJhonDB").collection("products");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    app.get("/totalProducts", async (req, res) => {
      const result = await productCollection.estimatedDocumentCount();
      res.send({ totalProducts: result });
    });

    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 10;
      const skip = page * limit;
      const result = await productCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
      res.send(result);
    });

    app.post("/productsByIds", async (req, res) => {
      const ids = req.body;
      console.log(ids);
      const objectIds = ids.map((id) => new ObjectId(id));
      const query = { _id: { $in: objectIds } };
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });

    // CREATE SEARCH API FROM HERE
    const indexKeys = { name: 1, category: 1 };
    const indexOptions = { name: "titleCategory" };
    const result = await productCollection.createIndex(indexKeys, indexOptions);
    app.get("/products/:text", async (req, res) => {
      const searchText = req.params.text;
      const result = await productCollection
        .find({
          $or: [
            { title: { $regex: searchText, $options: "i" } },
            { category: { $regex: searchText, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });
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

app.get("/", (req, res) => {
  res.send("Ema is busy");
});
app.listen(port, () => {
  console.log("Ema is running", port);
});
