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
// client.connect((err) => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });

console.log(uri);
app.get("/", async (req, res) => {
  res.send("Doctors portal server is running now");
});

app.listen(PORT, () => {
  console.log(`node server is running at PORT:${PORT}`);
});
