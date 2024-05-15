const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 1000;
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "https://tablemingle.netlify.app",
    ],
    credentials: true,
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
app.use(cookieParser());

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    const homeFoods = client.db("Home_Foods_DB").collection("homeFoods");
    const galleryCollection = client
      .db("Gallery_Foods_DB")
      .collection("galleryFoods");
    const purchaseData = client.db("Buy_Foods_DB").collection("buyFoods");
    const userFoodData = client.db("User_Foods_DB").collection("userFoods");
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
          foodName: { $regex: search, $options: "i" }, // Case-insensitive search
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
    app.patch("/home/:id", async (req, res) => {
      const id = req.params.id;
      const options = { upsert: true };
      const query = { _id: new ObjectId(id) };
      const updateFood = req.body;
      const food = {
        $set: {
          quantity: updateFood.quantity,
        },
      };
      const result = await homeFoods.updateOne(query, food, options);
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
      const {
        foodName,
        price,
        foodQuantity,
        buyerName,
        buyerEmail,
        buyingDate,
        foodImage,
        madeBy,
      } = req.body;
      let existingPurchase = await purchaseData.findOne({
        foodName,
        buyerEmail,
      });

      if (existingPurchase) {
        await purchaseData.updateOne(
          { _id: existingPurchase._id },
          { $inc: { foodQuantity: foodQuantity } }
        );

        existingPurchase = await purchaseData.findOne({
          _id: existingPurchase._id,
        });
        res.send(existingPurchase);
      } else {
        const newPurchase = {
          foodName,
          price,
          foodQuantity,
          buyerName,
          buyerEmail,
          buyingDate,
          foodImage,
          madeBy,
        };
        await purchaseData.insertOne(newPurchase);
        // Fetch and send the inserted document as response
        const insertedDocument = await purchaseData.findOne(newPurchase);
        res.send(insertedDocument);
      }
    });

    app.get("/buy", async (req, res) => {
      const cursor = purchaseData.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/buy/:email", verifyToken, async (req, res) => {
      const tokenEmail = req.user.email;
      const email = req.params.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { buyerEmail: email };
      const result = await purchaseData.find(query).toArray();
      res.send(result);
    });
    app.delete("/buy/:email/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await purchaseData.deleteOne(query);
      res.send(result);
    });

    app.post("/userfood", async (req, res) => {
      const newItems = req.body;
      const result = await userFoodData.insertOne(newItems);
      console.log(newItems);
      res.send(result);
    });

    app.get("/userfood", async (req, res) => {
      const cursor = userFoodData.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.put("/userfood/:email/:id", async (req, res) => {
      const id = req.params.id;
      const options = { upsert: true };
      const query = { _id: new ObjectId(id) };
      const updateFood = req.body;
      const food = {
        $set: {
          foodImage: updateFood.foodImage,
          foodName: updateFood.foodName,
          foodCategory: updateFood.foodCategory,
          quantity: updateFood.quantity,
          price: updateFood.price,
          foodOrigin: updateFood.foodOrigin,
          foodDescription: updateFood.foodDescription,
          userName: updateFood.userName,
          userEmail: updateFood.userEmail,
        },
      };
      const result = await userFoodData.updateOne(query, food, options);
      res.send(result);
    });
    app.get("/userfood/:email", verifyToken, async (req, res) => {
      const tokenEmail = req.user.email;
      const email = req.params.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { userEmail: email };
      const result = await userFoodData.find(query).toArray();
      res.send(result);
    });
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Clear token on logout
    app.post("/logout", (req, res) => {
      res.clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
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
