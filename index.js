// CORS Setup
const cors = require("cors");
require("dotenv").config();

// Requiring packages
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

// Middlewares
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

// Creating MongoDB URI and client
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dh7kk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const database = client.db("machines_iot");
    const userCollections = database.collection("users");
    const appAccountCollections = database.collection("app_account");

    // ----------------------------------------------------
    // Users
    // ----------------------------------------------------

    // GET a single user account
    // app.get("/users/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { googleUid: id };
    //   const userAccount = await userCollections.findOne(query);

    //   res.json(userAccount);
    // });

    // GET user account with google uid
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { googleUid: id };
      const userAccount = await userCollections.findOne(query);

      res.json(userAccount);
    });

    // GET user account with google uid
    app.get("/users/isadmin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { googleUid: id };
      const userAccount = await userCollections.findOne(query);
      let isAdmin = "waiting";

      if (userAccount?.role === "admin") {
        isAdmin = "true";
      } else if (userAccount?.role === "user") {
        isAdmin = "false";
      } else {
        isAdmin = "false";
      }

      res.json({ admin: isAdmin });
    });

    // POST a single user account
    app.post("/users", async (req, res) => {
      const id = req.params.id;
      const userData = req.body;

      const result = await userCollections.insertOne(userData);

      res.json(result);
    });

    // ----------------------------------------------------
    // App account request
    // ----------------------------------------------------

    // Get all app accounts
    app.get("/app-accounts", async (req, res) => {
      const cursor = appAccountCollections.find({});
      const appAccounts = await cursor.toArray();
      console.log(appAccounts);
      res.send(appAccounts);
    });

    // Get all pending app accounts
    app.get("/app-accounts/pending", async (req, res) => {
      // query for pending request
      const query = { requestStatus: "pending" };

      const cursor = appAccountCollections.find(query);
      const pendingAppAccounts = await cursor.toArray();
      res.send(pendingAppAccounts);
    });

    // Get a single app account data API
    app.get("/app-accounts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { googleUid: id };
      const appAccount = await appAccountCollections.findOne(query);

      res.json(appAccount);
    });

    // App account Request- POST API
    app.post("/app-accounts", async (req, res) => {
      const body = req.body;
      const result = await appAccountCollections.insertOne(body);

      res.json(result);
    });

    // App account- UPDATE magic link
    app.put(
      "/app-accounts/update-cloud-account-approval/:id",
      async (req, res) => {
        const id = req.params.id;
        const magicLink = req.body.magicLink;
        const requestStatus = req.body.requestStatus;
        const filter = { googleUid: id };
        const options = { upsert: false };

        const updateMagicLink = {
          $set: {
            magicLink,
            requestStatus,
          },
        };

        const result = await appAccountCollections.updateOne(
          filter,
          updateMagicLink,
          options
        );

        res.json(result);
      }
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Machines!");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
