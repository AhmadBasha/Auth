//jshint esversion:6
//level 1
//npm i mongoose-encryption
// level 2
//npm i dotenv
// touch .env
// level 3
//npm i md5
//leve 4
// check node version and go to this site https://www.npmjs.com/package/bcrypt
//npm i bcrypt
//level 5
//npm i passport passport-local passport-local-mongoose express-session
// level 6
//npm install passport-google-oauth20
//npm install mongoose-findorcreate
//http://www.passportjs.org/docs/downloads/html/
// npm i passport-facebook

require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
// level 2
// const encrypt = require("mongoose-encryption");
// level 3
// const md5 = require("md5");
// level 4
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
// level 5
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//level 6
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

// to print API_KEY fron env file
// console.log(process.env.API_KEY);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));


// level 5 , it must be before connect and after use and set.
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));
// level 5
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});
// level 5
mongoose.set("useCreateIndex", true);


// encryption
const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  //level 6
  googleId: String,
  facebookId: String,
  secret: String
});

// level 5
userSchema.plugin(passportLocalMongoose);
//level 6
userSchema.plugin(findOrCreate);


// this is the key . level 1
// const secret = "Thisisourlittlesecret.";

// level 1
// it must be created before the collections.
// userSchema.plugin(encrypt, { secret: secret });
// i can include multiple fields. just adding a comma inside the password array
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"]});


//level2
// userSchema.plugin(encrypt, { secret:process.env.SECRET, encryptedFields: ["password"]});


// // collection
const User= mongoose.model("User", userSchema);

// level 5
passport.use(User.createStrategy());
// level 5
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());


//level 6
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


// level 6
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// level 6

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",

  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

////////////////////////////////Post Register/////////////////////////////
// app.post("/register",function(req, res){
//   //level 4
//   bcrypt.hash(req.body.password, saltRounds, function(err,hash) {
//     const newUser = new User ({
//       email: req.body.username,
//       password: hash
//     });
//     newUser.save(function(err){
//       if (err) {
//         console.log(err);
//       } else {
//         res.render("secrets");
//       }
//     });
//
//   });
//
//   // level 2 & 3
//   // const newUser = new User ({
//   //   email: req.body.username,
//   //   // password: req.body.password
//   //   //just level 3
//   //   password: md5(req.body.password)
//   // });
//   // newUser.save(function(err){
//   //   if (err) {
//   //     console.log(err);
//   //   } else {
//   //     res.render("secrets");
//   //   }
//   // });
// });
//////////////////////////////// continue Post Register////////////////////
// level 5

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.get("/secrets", function(req, res){
  // if (req.isAuthenticated()){
  //   res.render("secrets");
  // }else {
  //   res.redirect("/login");
  // }

  User.find({"secret": {$ne: null}}, function(err, foundUser){
    if (err){
      console.log(err);
    } else {
      if (foundUser) {
        res.render("secrets", {userWithSecrets: foundUser});
      }
    }
  });

});
// level 5
app.post("/register",function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});
////////////////////////////////Post Login/////////////////////////////
// app.post("/login", function(req, res){
//   const username = req.body.username;
//   const password = req.body.password;
//   // level 3
//    // const password = md5(req.body.password);
// User.findOne({email:username}, function(err, foundUser){
//   if (err) {
//     console.log(err);
//   } else {
//     if (foundUser) {
//       // if (foundUser.password === password) {
//
//       // level 4         foundUser.password is the password in the database
//         bcrypt.compare(password, foundUser.password, function(err, result){
//             if(result === true) {
//                 res.render("secrets");
//             }
//         });
//       // }
//     }
//   }
//  });
// });
/////////////////////////// continue Post Login /////////////////////////////
// level 5
app.post("/login",function(req, res){

const user = new User({
  username: req.body.username,
  password: req.body.password
});

req.login(user, function(err){
  if (err) {
    console.log(err);
  } else {
    passport.authenticate("local")(req, res, function(){
      res.redirect("/secrets");
    });
  }
 });
});

// level 6
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
  // level 6

  app.get("/auth/facebook",
  passport.authenticate("facebook"));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { successRedirect: "/secrets", failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });


  app.get("/submit", function(req, res){
    if (req.isAuthenticated()){
      res.render("submit");
    }else {
      res.redirect("/login");
    }
  });

  app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret ;
    // saving the current session ,,
    // console.log(req.user);
    User.findById(req.user.id, function(err, foundUser){
      if (err){
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.secret = submittedSecret ;
          foundUser.save(function(){
            res.redirect("/secrets");
          });
        }
      }
    });
  });



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
