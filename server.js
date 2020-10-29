const express = require("express");

//express-fileupload (for uploading images to postgres)
const fileUpload = require("express-fileupload");

const knex = require("knex");

//local
// const db = knex({
//   client: "pg",
//   connection: {
//     host: "127.0.0.1",
//     user: "yuta",
//     password: "oblivion",
//     database: "socialmedia",
//   },
// });

//heroku postgres
const db = knex({
  client: "pg",
  connection: {
    host: "postgresql-aerodynamic-01585.0.0.1",
    user: "yuta",
    password: "oblivion",
    database: "socialmedia",
  },
});

const cors = require("cors");
const { json } = require("express");
const app = require("express")();

// //bodyparser
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

app.use(express.json());

app.use(cors());

// express-fileupload
app.use(fileUpload());

//controller imports

const {
  handleRegister,
  handleLogin,
  handleUser,
  handleFollowTweets,
  handleSingleTweet,
  handlePostTweet,
  handleTweetLike,
  handleTweetComment,
  handleDeleteTweet,
  handleTweetUnlike,
  handleUserTweets,
  handleFollow,
  handleunFollow,
  handleRelevantUser,
  handleRelevantTweets,
  handleEditDetails,
  handleRelevantRelationships,
  handleUpload,
  handleGetUpload,
  handleWhoToFollow,
  handleRelevantComments,
  handleGetLikes,
  handleNotifications,
  handleMarkNotifications,
} = require("./controllers/controller");

//----------------------------------------------------------

//verify jwt token
function jwtVerify(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers["authorization"];
  // Check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    // Split at the space
    const bearer = bearerHeader.split(" ");
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    req.token = bearerToken;
    // Next middleware
    // console.log(token);
    return next();
  } else {
    // Forbidden
    return res.sendStatus(403);
  }
}

//
app.get("/", (req, res) => {
  res.send("Server is deployed");
});

//------------------------
//IMAGEUPLOAD (express-fileupload)
app.post("/upload", jwtVerify, handleUpload);

//GET IMAGEUPLOAD
app.get("/img/:username", handleGetUpload);

//handleuser
app.get("/user", jwtVerify, handleUser);

//handle UserTweets
app.get("/userTweets", jwtVerify, handleUserTweets);

//handle register
app.post("/register", handleRegister);

//handle login
app.post("/login", handleLogin);

//home page tweets
app.post("/followTweets", jwtVerify, handleFollowTweets);

//single tweet
app.get("/tweet/:tweetId", handleSingleTweet);

//postTweet
app.post("/postTweet", jwtVerify, handlePostTweet);

//likeTweet
app.post("/tweet/:tweetId/like", jwtVerify, handleTweetLike);

//unlikeTweet
app.post("/tweet/:tweetId/unlike", jwtVerify, handleTweetUnlike);

//getLikes
app.get("/tweet/:tweetId/getLike", jwtVerify, handleGetLikes);

//CommentOnTweet
app.post(
  "/tweet/:tweetUsername/:tweetId/:senderUsername/comment",
  jwtVerify,
  handleTweetComment
);

//getcomments
app.get("/comment/:tweetUsername/:tweetId", jwtVerify, handleRelevantComments);

//deleteTweet
app.post("/tweet/:tweetId", jwtVerify, handleDeleteTweet);

//follow
app.post("/follow", jwtVerify, handleFollow);

//unfollow
app.post("/unfollow", jwtVerify, handleunFollow);

//getRelevantUser
app.post("/relevantUser", jwtVerify, handleRelevantUser);

//getRelevantTweets
app.post("/relevantTweets", jwtVerify, handleRelevantTweets);

//editDetails
app.post("/editDetails", jwtVerify, handleEditDetails);

//getRelevantRelationships
app.post("/relevantRelationships", jwtVerify, handleRelevantRelationships);

//whoToFollow
app.get("/whoToFollow", jwtVerify, handleWhoToFollow);

//PostNotifications
app.post("/notifications", jwtVerify, handleNotifications);

//MarkNotifications
app.post("/markNotifications", jwtVerify, handleMarkNotifications);

//------dev-----------------------------------------------------------

//first find who ryu is following, then map through those ids to get the usernames
// db.select("*")
//   .from("relationships")
//   .where("follower_id", "=", "2")
//   .then((res) =>
//     res.map((x) => {
//       return db
//         .select("username")
//         .from("users")
//         .where("user_id", "=", x.followed_id)
//         .then((users) => console.log(users));
//     })
//   );

//first finds who ryu is following, then gets tweets from the users he if following
// db.select("*")
//   .from("relationships")
//   .where("follower_id", "=", "2")
//   .then((res) =>
//     res.map((x) => {
//       return db
//         .select("*")
//         .from("tweets")
//         .where("user_id", "=", x.followed_id)
//         .then((users) => console.log(users));
//     })
//   );

// db.select("*")
//   .from("tweets")
//   .where("user_id", "=", "2")
//   .then((res) => console.log(res));

//listen =======================================
app.listen(process.env.PORT || 3000, () => {
  console.log(`running on ${process.env.PORT}`);
});

//--------------------
