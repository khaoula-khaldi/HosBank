const express = require("express");
const session = require("express-session");
const dashboardRoutes = require("./src/routes/client/client.routes");
const beneficiaireRoutes = require("./src/routes/client/beneficiaires.route");
const authRoute = require("./src/routes/auth.routes");
const virementRoute = require('./src/routes/client/virement.route');
const adminRoute = require('./src/routes/admin/admin.routes');

const path = require("path");

const app = express();
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_for_dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/admin", adminRoute);
app.use("/client", beneficiaireRoutes);

app.use("/auth", authRoute);

app.use("/client", dashboardRoutes);

app.use("/client",virementRoute);

const server = app.listen(3000, () => {
    console.log("Server is running on port 3000");
});


module.exports = app;
