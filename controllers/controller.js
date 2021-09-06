const { db, pool } = require("../admin");

const jwt = require("jsonwebtoken");

const bcrypt = require("bcryptjs");

//validator imports
const { validateLoginData, validateRegisterData } = require("./validators");

//IMAGEUPLOAD - 'req.files' is from express-fileupload, image is name of file.
exports.handleUpload = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, password } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    //grab loggedin username user_id
    let username = await pool.query(
      "select username from users where email = $1",
      [email]
    );

    //check if user already has profile pic
    let pictureExists = await pool.query(
      "select * from profilePicture where username = $1",
      [username.rows[0].username]
    );

    pictureExists = pictureExists.rows;

    //checks if pictureExists is less than 1 is false, if so delete pic then upload new img. if true just upload img.
    if (!pictureExists.length < 1) {
      await pool.query("delete from profilePicture where username = $1", [
        username.rows[0].username,
      ]);
      await pool.query(
        "insert into profilePicture ( name, username, user_id, img) values ($1, $2, $3, $4)",
        [
          req.files.image.name,
          username.rows[0].username,
          userId.rows[0].user_id,
          req.files.image.data,
        ]
      );
    } else {
      await pool.query(
        "insert into profilePicture ( name, username, user_id, img) values ($1, $2, $3, $4)",
        [
          req.files.image.name,
          username.rows[0].username,
          userId.rows[0].user_id,
          req.files.image.data,
        ]
      );
    }

    let getImage = await pool.query(
      "select * from profilePicture where username = $1",
      [username.rows[0].username]
    );

    console.log("uploaded the image");
    res.end(getImage.rows[0].img);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//GET IMAGE
exports.handleGetUpload = async (req, res) => {
  try {
    // var decoded = jwt.verify(req.token, "secretKey");
    // const { email, password } = decoded.jwtUser;

    let username = req.params.username;

    let getImage = await pool.query(
      "select * from profilePicture where username = $1",
      [username]
    );

    // console.log("got the image");

    res.end(getImage.rows[0].img);
  } catch {
    console.error("cannot get user image");
    res.status(404).json("no image");
  }
};

//handleRegister
exports.handleRegister = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    let token;
    //validator check------------------
    const user = {
      email: email,
      password: password,
      username: username,
      confirmPassword: confirmPassword,
    };
    const { valid, errors } = validateRegisterData(user);
    if (!valid) return res.status(400).json({ errors });

    //bycrpt
    const hash = bcrypt.hashSync(password);

    const userTable = await pool.query(
      "insert into users (username, password, email, created_at, update_at) values ($1, $2, $3, $4, $5) returning *",
      [username, hash, email, new Date(), new Date()]
    );

    token = jwt.sign({ jwtUser: req.body }, "secretKey");
    console.log("registered user");
    res.json(token);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({
      errors: {
        email: "",
        password: "",
        username: "",
        confirmPassword: "",
        general: "Username or Email is already taken",
      },
    });
  }
};

//handleLogin
exports.handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    //validator check------------------
    const user = { email: email, password: password };
    const { valid, errors } = validateLoginData(user);
    if (!valid) return res.status(400).json({ errors });

    const loginInfo = await pool.query("select * from users where email = $1", [
      email,
    ]);

    const isValid = bcrypt.compareSync(password, loginInfo.rows[0].password);

    //create jwt and assign the login data to token.
    let token;

    console.log("isVaild", isValid);
    if (isValid) {
      token = jwt.sign({ jwtUser: req.body }, "secretKey");
    } else {
      throw "wrong credentials";
    }

    console.log("logged in");
    res.json(token);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({
      errors: { email: "", password: "", general: "wrong credentials" },
    });
  }
};

//handleUser
exports.handleUser = async (req, res) => {
  try {
    //went through 'verifyJWT' middleware check, req.token holds the extracted token from header
    //'decoded' now holds the payload from token which includes the data assigned to token at login/signup.
    var decoded = jwt.verify(req.token, "secretKey");

    const { email, name, password } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    let username = await pool.query(
      "select username from users where email = $1",
      [email]
    );

    let verifiedUser = await pool.query(
      "select * from users where email = $1",
      [email]
    );

    let relationships = await pool.query(
      "select * from relationships where follower_id = $1 or followed_id =$2",
      [userId.rows[0].user_id, userId.rows[0].user_id]
    );

    //get notifications
    let notifications = await pool.query(
      "select * from notifications where recipient = $1 order by created_at asc",
      [username.rows[0].username]
    );

    let userData = {
      user: verifiedUser.rows[0],
      relationships: relationships.rows,
      notifications: notifications.rows,
    };

    res.json(userData);
    // res.json(verifiedUser.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(400).json("wrong credentials");
  }
};

//handle UserTweets
exports.handleUserTweets = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, name, password } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    let userTweets = await pool.query(
      "select tweets.*, count(distinct comments.*) as commentcount, count(distinct likes.*) as likescount from tweets left join comments on tweets.id = comments.tweetid left join likes on tweets.id = likes.tweetid where tweets.user_id = $1 group by tweets.id",
      [userId.rows[0].user_id]
    );

    // console.log(userTweets.rows);

    res.json(userTweets.rows);
  } catch (error) {
    console.error(error.message);
    res.status(400).json("wrong credentials");
  }
};

//handleFollowTweets
exports.handleFollowTweets = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    //grab list of followed_id, who are users the logged user is following
    let followTweets = await pool.query(
      "select * from relationships where follower_id = $1",
      [userId.rows[0].user_id]
    );

    // find all tweets which match the users the logged user is following
    // Promise.all needs to wrap .map as it returns and array of promises
    let filterfollowTweets = await Promise.all(
      followTweets.rows.map((data) => {
        return pool.query(
          "select tweets.*, count(distinct comments.*) as commentcount, count(distinct likes.*) as likescount from tweets  left join comments on tweets.id = comments.tweetid left join likes on tweets.id = likes.tweetid where tweets.user_id = $1 group by tweets.id ",
          [data.followed_id]
        );
      })
    );

    //map the results again.. not sure why have to do this but it works
    //flatten the results.
    const results = filterfollowTweets.map((x) => x.rows);
    const outputTweets = results.flat();

    // console.log(outputTweets);

    //liked tweets
    const liked = await Promise.all(
      outputTweets.map((x) => {
        return pool.query(
          "select * from likes where user_id = $1 and tweetid = $2",
          [userId.rows[0].user_id, x.id]
        );
      })
    );

    const likedTweetsData = liked.map((x) => x.rows).flat();

    const followTweetAndLiked = {
      tweets: outputTweets,
      likes: likedTweetsData,
    };

    res.json(followTweetAndLiked);
  } catch (error) {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//get single tweet
exports.handleSingleTweet = async (req, res) => {
  try {
    const requestedTweetId = req.params.tweetId;

    let tweet = await pool.query("select * from tweets where id = $1", [
      requestedTweetId,
    ]);

    res.json(tweet.rows[0]);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//postTweet
exports.handlePostTweet = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email } = decoded.jwtUser;

    //grab tweet content
    const content = req.body.content;

    const urlUser = req.body.urlUser;

    const notOnHomePage = urlUser ? true : false;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    let username = await pool.query(
      "select username from users where email = $1",
      [email]
    );

    let postTweet = await pool.query(
      "insert into tweets(content, user_id, username, created_at, update_at) values ($1,$2,$3,$4, $5)",
      [
        content,
        userId.rows[0].user_id,
        username.rows[0].username,
        new Date(),
        new Date(),
      ]
    );

    let returnData;
    if (notOnHomePage) {
      returnData = await pool.query(
        "select * from tweets where username = $1",
        [urlUser]
      );
    }

    // console.log(returnData.rows);

    res.json(returnData.rows);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//likeTweet
exports.handleTweetLike = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    //tweetid
    const requestedTweetId = req.body.tweetId;

    let likeTweet = await pool.query(
      "insert into likes (tweetid, user_id, created_at) values ($1,$2, $3) ",
      [requestedTweetId, userId.rows[0].user_id, new Date()]
    );

    res.json(likeTweet);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//UnlikeTweet
exports.handleTweetUnlike = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    //tweetid
    const requestedTweetId = req.body.tweetId;

    //check if user has already liked this tweet

    //check if like exists from userid in likes matches userid AND tweetId matches requestedtweet id
    let likeExists = await pool.query(
      "select * from likes where user_id = $1 and tweetid = $2",
      [userId.rows[0].user_id, requestedTweetId]
    );

    console.log(likeExists);

    let unlikeTweet;
    //checks if likeExists array is empty if not then can delete
    if (!likeExists.rows.length) {
      return res.status(403).json({ error: "Sorry, can't do that" });
    } else {
      unlikeTweet = await pool.query(
        "delete from likes where user_id = $1 and tweetid = $2",
        [userId.rows[0].user_id, requestedTweetId]
      );
    }

    res.json(unlikeTweet);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//getLikes
exports.handleGetLikes = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    let tweetId = req.params.tweetId;

    let getLikes = await pool.query("select * from likes where tweetid = $1", [
      tweetId,
    ]);

    res.json(getLikes.rows);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//CommentTweet
exports.handleTweetComment = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    const comment = req.body.comment;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    console.log("checking");
    //tweetid
    const requestedTweetId = req.params.tweetId;
    //tweetusername
    const requestedTweetUsername = req.params.tweetUsername;
    //tweetusername
    const senderUsername = req.params.senderUsername;

    let commentTweet = await pool.query(
      "insert into comments (tweetid, user_id, comments, created_at, tweetusername, senderusername) values ($1,$2, $3, $4, $5, $6)",
      [
        requestedTweetId,
        userId.rows[0].user_id,
        comment,
        new Date(),
        requestedTweetUsername,
        senderUsername,
      ]
    );

    res.json(commentTweet);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//getComments
exports.handleRelevantComments = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    let tweetUser = req.params.tweetUsername;
    let tweetId = req.params.tweetId;

    let getComments = await pool.query(
      "select * from comments where tweetusername = $1 and tweetid = $2",
      [tweetUser, tweetId]
    );

    res.json(getComments.rows);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//DeleteTweet
exports.handleDeleteTweet = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    //tweetid
    const requestedTweetId = req.params.tweetId;

    //tweet must be the user's tweet if deleting
    let requestedTweet = await pool.query(
      "select * from tweets where id = $1",
      [requestedTweetId]
    );
    //gets tweets userid to check if matches decoded token userid
    let tweetUserId = requestedTweet.rows[0].user_id;

    let deleteTweet;
    if (tweetUserId === userId.rows[0].user_id) {
      console.log(requestedTweetId);
      deleteTweet = await pool.query("delete from tweets where id = $1", [
        requestedTweetId,
      ]);
    } else {
      return res.status(403).json({ error: "unauthorized" });
    }

    console.log("deleted post");
    res.json(deleteTweet);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//follow
exports.handleFollow = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    //requested username to follow
    let toFollowUsername = req.body.toFollowUsername;

    //grab id of to be followed user
    let toFollowId = await pool.query(
      "select * from users where username = $1",
      [toFollowUsername]
    );

    //flatten search result
    toFollowId = toFollowId.rows[0].user_id;
    console.log(toFollowId);

    if (toFollowId !== userId.rows[0].user_id) {
      let followUser = await pool.query(
        "insert into relationships (follower_id, followed_id, created_at, update_at, followed_username) values ($1,$2,$3,$4, $5)",
        [
          userId.rows[0].user_id,
          toFollowId,
          new Date(),
          new Date(),
          toFollowUsername,
        ]
      );
    } else {
      res.status(400).json("can't follow yourself");
    }

    let relationships = await pool.query(
      "select * from relationships where follower_id = $1 or followed_id =$2",
      [userId.rows[0].user_id, userId.rows[0].user_id]
    );

    res.json(relationships.rows);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//Unfollow
exports.handleunFollow = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    let toUnfollowUsername = req.body.toUnfollowUsername;

    let deleteFollow = await pool.query(
      "delete from relationships where follower_id = $1 and followed_username = $2",
      [userId.rows[0].user_id, toUnfollowUsername]
    );

    let relationships = await pool.query(
      "select * from relationships where follower_id = $1 or followed_id =$2",
      [userId.rows[0].user_id, userId.rows[0].user_id]
    );

    res.json(relationships.rows);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//relevantUser
exports.handleRelevantUser = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    let relevantUsername = req.body.relevantUsername;

    let userDetails = await pool.query(
      "select * from users where username = $1",
      [relevantUsername]
    );

    res.json(userDetails.rows[0]);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//relevantTweets
exports.handleRelevantTweets = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    let relevantUsername = req.body.relevantUsername;

    // let relevantTweets = await pool.query(
    //   "select * from tweets where username = $1",
    //   [relevantUsername]
    // );

    let relevantTweets = await pool.query(
      "select tweets.*, count(distinct comments.*) as commentcount, count(distinct likes.*) as likescount from tweets left join comments on tweets.id = comments.tweetid left join likes on tweets.id = likes.tweetid where tweets.username = $1 group by tweets.id",
      [relevantUsername]
    );

    res.json(relevantTweets.rows);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//editDetails
exports.handleEditDetails = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    let bio = req.body.bio;
    let website = req.body.website;
    let location = req.body.location;

    let editDetails = await pool.query(
      "update users set bio = $1, website = $2, location = $3 where user_id = $4",
      [bio, website, location, userId.rows[0].user_id]
    );

    let editedUserDetails = await pool.query(
      "select * from users where user_id = $1",
      [userId.rows[0].user_id]
    );

    // console.log(userId.rows[0].user_id);

    res.json(editedUserDetails.rows[0]);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//relevantRelationships
exports.handleRelevantRelationships = async (req, res) => {
  try {
    let relevantUser = req.body.relevantUser;

    let relevantUserId = await pool.query(
      "select user_id from users where username = $1",
      [relevantUser]
    );

    let findRelationships = await pool.query(
      "select * from relationships where follower_id = $1 or followed_id = $2",
      [relevantUserId.rows[0].user_id, relevantUserId.rows[0].user_id]
    );

    res.json(findRelationships.rows);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//whoToFollow
exports.handleWhoToFollow = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;
    //randomly orders users table then selects first 2,slow but works
    let randomUser = await pool.query(
      "SELECT * FROM users where email != $1 ORDER BY random() LIMIT 2",
      [email]
    );

    res.json(randomUser.rows);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//postNotifications
exports.handleNotifications = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, username, password, user_id } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    let sender = req.body.sender;
    let recipient = req.body.recipient;
    let type = req.body.type;
    let tweetId = req.body.tweetId;

    let postNotification = await pool.query(
      "insert into notifications (type, recipient, sender, created_at, tweetid) values ($1, $2, $3, $4, $5)",
      [type, recipient, sender, new Date(), tweetId]
    );

    res.json(postNotification);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//markNotificationsRead
exports.handleMarkNotifications = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, password, user_id } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    let username = await pool.query(
      "select username from users where email = $1",
      [email]
    );

    let unreadNotification = req.body.unreadNotificationId;

    let updateNotifications = await Promise.all(
      unreadNotification.map((x) => {
        return pool.query(
          "update notifications set read = true where id = $1 ",
          [x]
        );
      })
    );

    // let output = await pool.query(
    //   "select * from notifications where recipient = $1 order by created_at asc",
    //   [username.rows[0].username]
    // );

    // console.log(output.rows);

    res.json("updated Notifications");
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//deleteNotifications
exports.deleteNotifications = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, password, user_id } = decoded.jwtUser;

    //grab loggedin user user_id
    let userId = await pool.query(
      "select user_id from users where email = $1",
      [email]
    );

    const id = req.body.tweetId;

    await pool.query("delete from notifications where tweetid = $1", [id]);

    res.json("deleted Notification");
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//getAllUsers
exports.getAllUsers = async (req, res) => {
  try {
    var decoded = jwt.verify(req.token, "secretKey");
    const { email, password, user_id } = decoded.jwtUser;

    const allUsers = await pool.query("select * from users");

    res.json(allUsers.rows);
  } catch {
    console.error(error.message);
    res.status(400).json("something went wrong");
  }
};

//getNotifications
