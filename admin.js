require("dotenv").config();

const knex = require("knex");
const Pool = require("pg").Pool;
const { Client } = require("pg");

// let client;
let pool;
let db;

// console.log("env", process.env.NODE_ENV);

// client = new Client({
//   connectionString:
//     "postgres://fubifvdntqcuvp:b17d87e278c43ca67d61bef898a3ec9089adb5008eb0306008e21afdcdff7813@ec2-54-83-137-206.compute-1.amazonaws.com:5432/dbn8qrrfp7nnhs",
//   ssl: {
//     required: true,
//     rejectUnauthorized: false,
//   },
// });

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

  pool = new Pool({
    host: "127.0.0.1",
    user: "postgres",
    password: process.env.PASSWORD,
    port: 5432,
    database: "socialmedia",
  });
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

module.exports = { db, pool };
