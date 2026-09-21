require('dotenv').config();
const express    = require("express");
const session    = require("express-session");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");
const path       = require("path");

const authRoute      = require("./src/routes/auth.routes");
const dashboardRoute = require("./src/routes/dashboard.routes");

const app = express();

// ── Security ──────────────────────────────────────────────
app.use(helmet());
app.disable("x-powered-by");

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// ── View engine ───────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));
app.use(express.static(path.join(__dirname, "src/public")));

// ── Body parsers ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session ───────────────────────────────────────────────
app.use(session({
    secret: process.env.SESSION_SECRET || "hosbank_fallback_dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 2   // 2 h
    }
}));

// ── Routes ────────────────────────────────────────────────
app.use("/auth",      authRoute);
app.use("/dashboard", dashboardRoute);

// Redirect root to login
app.get("/", (req, res) => res.redirect("/auth/login"));

// 404 handler
app.use((req, res) => res.status(404).send("Page non trouvée"));

// ── Start ─────────────────────────────────────────────────
app.listen(3000, () => console.log("Server running on http://localhost:3000"));

module.exports = app;