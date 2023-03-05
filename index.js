const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const PORT = process.env.PORT || "5000";
const app = express();
const jwt = require("jsonwebtoken");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
// middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mas8d.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unuthorized access!" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "forbidden access!" });
    }
    req.decoded = decoded;
    next();
  });
}
app.get("/", async (req, res) => {
  res.send("Doctors portal server is running now");
});

// all server requests handled in run function
async function run() {
  try {
    // connect mongodb with node server
    await client.connect();

    // // get available appointments to the client
    const db = client.db("doctors-portal-again");
    const availableAppointmentCollection = db.collection(
      "available-appointments"
    );
    const bookingsCollection = db.collection("bookings");
    const usersCollection = db.collection("users");

    // handle /appointments get request
    app.get("/appointments", async (req, res) => {
      const date = req.query.date;

      const query = {};
      const bookingQuery = { appointmentDate: date };
      const appointments = await availableAppointmentCollection
        .find(query)
        .toArray();

      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();

      appointments.forEach((appointment) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.treatment == appointment.name
        );
        const bookedSlots = optionBooked.map((book) => book.slot);
        const remainingSlots = appointment.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        appointment.slots = remainingSlots;
      });

      // send data to server
      res.send(appointments);
    });

    // appointment speciality
    app.get("/specialties", async (req, res) => {
      const query = {};
      const result = await availableAppointmentCollection
        .find(query)
        .project({ name: 1, _id: 1 })
        .toArray();
      res.send(result);
    });
    // handle bookings api requests

    // handle bookings get request
    app.get("/bookings", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        res.status(403).send({ message: "forbidden!" });
      }
      const query = { email: email };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    // handle bookings post request
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = {
        appointmentDate: booking.appointmentDate,
        email: booking.email,
      };
      const alreadyBooked = await bookingsCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `You have already booking on ${booking.appointmentDate}`;
        return res.send({ acknowledged: false, message });
      }
      const result = await bookingsCollection.insertOne(booking);

      res.send(result);
    });

    // generate jwt token and return for verify
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const userQuery = { email: email };
      const user = await usersCollection.findOne(userQuery);
      console.log("user", user);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send("");
    });

    // handle users post requests
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // handle users get requests
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    // hanlde users patch requests
    app.patch("/users/admin/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const updatedDoc = { $set: { role: "admin" } };
      const options = { upsert: true };
      const decodedEmail = req.decoded.email;
      const filter = { email: decodedEmail };
      const user = await usersCollection.findOne(filter);
      if (user.role === "admin") {
        const result = await usersCollection.updateOne(
          query,
          updatedDoc,
          options
        );
        res.send(result);
      } else {
        res.status(401).send({ message: "forbidden" });
      }
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
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
