const express = require("express");

const authRoute = require("./src/routes/auth.routes");

const app = express();

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoute);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

module.exports = app;