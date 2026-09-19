const express = require("express");
const session = require("express-session");
const path = require("path");

const authRoute = require("./src/routes/auth.routes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use("/auth", authRoute);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

module.exports = app;