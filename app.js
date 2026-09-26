const express = require("express");
const session = require("express-session");
const path = require("path");

const dashboardRoutes = require("./src/routes/client/client.routes");
const beneficiaireRoutes = require("./src/routes/client/beneficiaires.route");
const authRoute = require("./src/routes/auth.routes");
const virementRoute = require("./src/routes/client/virement.route");
const adminRoute = require("./src/routes/admin/admin.routes");
const chargeClientRoute = require("./src/routes/charge-client/charge-client.routes");
const reclamationRoutes = require("./src/routes/client/reclamation.route");
const profileRoutes = require("./src/routes/client/profile.route");


const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET || "fallback_secret_for_dev",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }
}));


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/admin", adminRoute);
app.use("/charge-client", chargeClientRoute);

app.use("/client", beneficiaireRoutes);
app.use("/client", dashboardRoutes);
app.use("/client", virementRoute);
app.use("/client", reclamationRoutes);

app.use("/auth", authRoute);

app.use("/client", profileRoutes);

const server = app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

module.exports = app;