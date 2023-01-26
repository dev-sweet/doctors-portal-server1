const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || "5000";
const app = express();
require("dotenv").config();
// middlewares
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mas8d.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.get("/", async (req, res) => {
  res.send("Doctors portal server is running now");
});

// node run function all server requests handle here
async function run() {
  try {
    // connect mongodb with node server
    await client.connect();

    // get available appointments to the client
    const db = client.db("doctors-portal-again");
    const availableAppointmentCollection = db.collection(
      "available-appointments"
    );
    const bookingsCollection = db.collection("bookings");

    // handle /appointments get request
    app.get("/appointments", async (req, res) => {
      const query = {};
      const appointments = await availableAppointmentCollection
        .find(query)
        .toArray();
      res.send(appointments);
      console.log(appointments);
    });

    // handle bookings api requests

    // handle bookings post request
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });
  } catch (error) {
    console.log(error);
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// listen app
app.listen(PORT, () => {
  console.log(`node server is running at PORT:${PORT}`);
});
