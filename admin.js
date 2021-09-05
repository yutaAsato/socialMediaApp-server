require("dotenv").config();

const knex = require("knex");
const Pool = require("pg").Pool;

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

  pool = new Pool({
    host: "127.0.0.1",
    user: "postgres",
    password: process.env.PASSWORD,
    port: 5432,
    database: "socialmedia",
  });
} else {
  pool = new Pool({
    connectionString:
      "postgres://wdjjyskcleyolm:31ec7208768c4f238525c5ebc7f8ab45d154ca22dfd5f5400f58702bb9b95a70@ec2-54-236-137-173.compute-1.amazonaws.com:5432/d9i94tomfsecqi",
    ssl: true,
  });
}

module.exports = { db, pool };
