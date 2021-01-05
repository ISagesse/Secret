

require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();
const port = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const secret = process.env.SECRET;

userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] });

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
})

app.get("/login", (req, res) => {
  res.render("login");
})

app.get("/register", (req, res) => {
  res.render("register");
})

app.post("/register", (req, res) => {
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });
  newUser.save((err) => {
    if (err) {
      console.log(err);
    }else {
      res.render("secrets");
    }
  })
})

app.post("/login", (req, res) => {
  const userName = req.body.username;
  const passWord = req.body.password;

  User.findOne({email: userName}, (err, foundUser) => {
    if (foundUser.password === passWord) {
      res.render("secrets");
    }else {
      if (err) {
        console.log(err);
      }else {
        res.render("register");
      }
    }
  })
})

app.listen(port, () => {
  console.log("server stated on port 3000");
})
