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

async function run() {
  try {
    const homeFoods = client.db("Home_Foods_DB").collection("homeFoods");
    app.get("/home", async (req, res) => {
      const cursor = homeFoods.find();
      const result = await cursor.toArray();
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

app.use(express.json());
app.get("/", (req, res) => {
  res.send("assignment-11 server is running");
});
app.listen(port, () => {
  console.log(`server is running at port ${port}`);
});
