const express = require("express");
const session = require("express-session");
const dashboardRoutes = require("./src/routes/client/client.routes");
const beneficiaireRoutes = require("./src/routes/client/beneficiaires.route");
const authRoute = require("./src/routes/auth.routes");

const path = require("path");

const app = express();
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/client", beneficiaireRoutes);

app.use("/auth", authRoute);

app.use("/client", dashboardRoutes);

const server = app.listen(3000, () => {
    console.log("Server is running on port 3000");
});


module.exports = app;
