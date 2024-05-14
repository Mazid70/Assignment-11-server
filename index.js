const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 1000;
app.use(
  cors({
    origin: ["http://localhost:5174", "http://localhost:5173"],
  })
);
const uri = `mongodb+srv://${process.env.DB_ID}:${process.env.DB_PASS}@cluster0.p4xzv3m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
app.use(express.json());
async function run() {
  try {
    const homeFoods = client.db("Home_Foods_DB").collection("homeFoods");
    const galleryCollection = client.db("Gallery_Foods_DB").collection("galleryFoods");
    const purchaseData = client.db("Buy_Foods_DB").collection("buyFoods");
    app.get("/home", async (req, res) => {
      const cursor = homeFoods.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/allfoods", async (req, res) => {
      const search = req.query.search;
      let query = {};
      if (search) {
          query = {
              foodName: { $regex: search, $options: "i" } // Case-insensitive search
          };
      }
      const result = await homeFoods.find(query).toArray();
      res.send(result);
  }); 
    app.get("/home/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await homeFoods.findOne(query);
      res.send(result);
    });


    app.post("/gallery", async (req, res) => {
      const newItems = req.body;
      const result = await galleryCollection.insertOne(newItems);
      console.log(newItems);
      res.send(result);
    });

    app.get("/gallery", async (req, res) => {
      const cursor = galleryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });


    app.post("/buy", async (req, res) => {
      const newItems = req.body;
      const result = await purchaseData.insertOne(newItems);
      console.log(newItems);
      res.send(result);
    });
    

await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("assignment-11 server is running");
});
app.listen(port, () => {
  console.log(`server is running at port ${port}`);
});
