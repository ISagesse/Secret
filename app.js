

require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
const port = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({extended: true}));

app.use(session({
  secret: "Our litle secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true, useUnifiedTopology: true, useCreateIndex: true});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, (err, user) => {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
  res.render("home");
})

app.get("/auth/google",
  passport.authenticate("google", {scope: ["profile"]})
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect to the scret page.
    res.redirect("/secret");
  });

app.get("/login", (req, res) => {
  res.render("login");
})

app.get("/register", (req, res) => {
  res.render("register");
})

app.get("/secret", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  }else {
    res.redirect("/login");
  }
})

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
})

app.post("/register", (req, res) => {
  User.register({username: req.body.username}, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect("/register");
    }else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secret");
      })
    }
  })
})

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, (err) => {
    if (err) {
      console.log(err);
    }else {
      passport.authenticate("local");
      res.redirect("/secret");
    }
  })

})

app.listen(port, () => {
  console.log("server stated on port 3000");
})
