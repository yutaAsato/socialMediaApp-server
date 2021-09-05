require("dotenv").config();

const knex = require("knex");
const Pool = require("pg").Pool;

let pool;
let db;

console.log("env", process.env.NODE_ENV);

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  // db = knex({
  //   client: "pg",
  //   connection: {
  //     host: "127.0.0.1",
  //     user: "yuta",
  //     password: process.env.PASSWORD,
  //     database: "socialmedia",
  //   },
  // });

  pool = new Pool({
    host: "127.0.0.1",
    user: "postgres",
    password: process.env.PASSWORD,
    port: 5432,
    database: "socialmedia",
  });

  console.log("development mode");
} else if (NODE_ENV === "production") {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log("production");
}

module.exports = { db, pool };
