require("dotenv").config();

const knex = require("knex");
const Pool = require("pg").Pool;
const { Client } = require("pg");

let client;
let pool;
let db;

console.log("env", process.env.NODE_ENV);

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  // // db = knex({
  // //   client: "pg",
  // //   connection: {
  // //     host: "127.0.0.1",
  // //     user: "yuta",
  // //     password: process.env.PASSWORD,
  // //     database: "socialmedia",
  // //   },
  // // });

  // pool = new Pool({
  //   host: "127.0.0.1",
  //   user: "postgres",
  //   // password: process.env.PASSWORD,
  //   password: process.env.PASSWORD,
  //   port: 5432,
  //   database: "socialmedia",
  // });

  client = new Client({
    host: "127.0.0.1",
    user: "postgres",
    // password: process.env.PASSWORD,
    password: process.env.PASSWORD,
    port: 5432,
    database: "socialmedia",
  });
} else {
  client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  // pool = new Pool({
  //   connectionString: process.env.DATABASE_URL,
  // });
}
client.connect();

module.exports = { db, pool, client };
