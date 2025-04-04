require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const path = require('path');
const session = require('express-session');
const http = require("http");
const WebSocket = require('ws');
const { sendWelcomeEmail, sendContactFormEmail } = require('./js/emailer');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, "html")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session middleware
const sessionMiddleware = session({
    secret: 'sampleOnly',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: { secure: false }
});

app.use(sessionMiddleware);

// WebSocket Active Users Tracking
let activeUsers = new Set();
wss.on("connection", (ws, req) => {
    sessionMiddleware(req, {}, () => {
        if (req.session?.user) {
            activeUsers.add(req.session.user.email);

            ws.on("close", () => {
                activeUsers.delete(req.session.user.email);
            });
        }
    });
});

// Connect to MongoDB
let db;
async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log("✅ Connected to DB");
        db = client.db('SampleDB');
    } catch (error) {
        console.error("❌ DB connection failed:", error);
        process.exit(1);
    }
}

// Ensure DB is ready before handling requests
app.use((req, res, next) => {
    if (!db) return res.status(503).json({ error: "Database connection is not ready" });
    req.db = db;
    next();
});

// Session Role Middleware
function ensureAdmin(req, res, next) {
    const user = req.session.user;
    if (user?.userAccess === 'Admin') return next();
    res.redirect('/home');
}

// Serve HTML pages
const servePage = (route, page) => app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'html', page)));
servePage('/', 'index.html');
servePage('/signup', 'signup.html');
servePage('/login', 'login.html');
servePage('/dashboard', 'dashboard.html');
servePage('/home', 'home.html');
servePage('/profile', 'profile.html');
servePage('/settings', 'settings.html');

// Serve Dashboard page (only accessible to admin users)
app.get('/dashboard', ensureAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'dashboard.html'));
});

// Serve static JS and CSS
const serveFile = (route, folder, file) => app.get(route, (req, res) => res.sendFile(path.join(__dirname, folder, file)));
['emailer', 'index', 'signup', 'login', 'dashboard', 'home', 'profile', 'settings'].forEach(file => serveFile(`/js/${file}.js`, 'js', `${file}.js`));
['dashboard', 'signup', 'login', 'index', 'home', 'profile', 'settings'].forEach(file => serveFile(`/css/${file}.css`, 'css', `${file}.css`));

// API: Get current user
app.get('/api/user', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.json(req.session.user);
});

// API: Dashboard data
app.get('/api/dashboard-data', ensureAdmin, async (req, res) => {
    try {
        const userCount = await db.collection('users').countDocuments();
        const activeUserCount = activeUsers.size;
        res.json({ userCount, activeUsers: activeUserCount });
    } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// API: Active Users Count
app.get('/activeUsers', (req, res) => {
    res.json({ activeUsers: activeUsers.size });
});

// API: User count
app.get('/count', async (req, res) => {
    try {
        const userCount = await db.collection('users').countDocuments();
        res.json({ userCount });
    } catch (error) {
        console.error("❌ Error fetching user count:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// API: Validate old password
app.post('/api/validate-password', async (req, res) => {
    try {
        const { oldPassword } = req.body;
        if (!req.session.user) return res.status(401).json({ error: 'User is not logged in' });

        const user = await db.collection('users').findOne({ email: req.session.user.email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        bcrypt.compare(oldPassword, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: "Internal Server Error" });
            if (!isMatch) return res.status(400).json({ error: 'Old password is incorrect' });
            return res.status(200).json({ success: 'Old password is valid' });
        });
    } catch (error) {
        console.error("❌ Error validating old password:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST: Register
app.post('/register', async (req, res) => {
    try {
        const { lastName, firstName, email, contact, address, gender, dob, username, password } = req.body;
        const emailLower = email.toLowerCase();
        const usernameLower = username.toLowerCase();

        const existingUser = await db.collection('users').findOne({
            $or: [{ email: emailLower }, { username: usernameLower }]
        });

        if (existingUser) return res.status(400).json({ error: "Email or username already registered" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.collection('users').insertOne({
            lastName, firstName, email: emailLower, contact, address, gender, dob,
            username: usernameLower, password: hashedPassword, createdDate: new Date(), userAccess: 'userOnly'
        });

        if (!result.insertedId) return res.status(500).json({ error: "Registration failed" });

        await sendWelcomeEmail(email);
        res.status(200).json({ success: "Registration successful!" });
    } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST: Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.collection('users').findOne({ email: email.toLowerCase() });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.redirect('/login?error=Invalid credentials');
        }

        req.session.user = (({ lastName, firstName, email, contact, address, gender, dob, username, userAccess }) =>
            ({ lastName, firstName, email, contact, address, gender, dob, username, userAccess }))(user);

        const redirectPath = user.userAccess === 'Admin' ? '/dashboard' : '/home';
        res.redirect(redirectPath);
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.redirect('/login?error=Something went wrong');
    }
});

// POST: Contact Form
app.post("/submit-contact", async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: "All fields are required!" });

    const response = await sendContactFormEmail(name, email, message);
    if (response.success) {
        res.json({ message: response.message });
    } else {
        res.status(500).json({ error: response.error });
    }
});

// POST: Logout
app.post("/logout", (req, res) => {
    if (req.session.user) activeUsers.delete(req.session.user.email);
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: "Logout failed" });
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// GET: All users (for testing)
app.get('/users', async (req, res) => {
    try {
        const users = await db.collection('users').find().toArray();
        res.json(users);
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'html', '404.html'));
});

// Start Server
connectDB().then(() => {
    server.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}/`));
});