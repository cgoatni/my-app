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
const { sendWelcomeEmail } = require('./js/emailer');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, "html")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

// Attach session to WebSocket
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

let db;
async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log("✅ Connected to MongoDB");
        db = client.db('SampleDB');
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        process.exit(1);
    }
}

// Ensure DB is ready before handling requests
app.use((req, res, next) => {
    if (!db) return res.status(503).json({ error: "Database connection is not ready" });
    req.db = db;
    next();
});

// Serve HTML pages (Home, Profile, Settings, etc.)
const servePage = (route, page) => app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'html', page)));
servePage('/', 'index.html');
servePage('/signup', 'signup.html');
servePage('/login', 'login.html');
servePage('/dashboard', 'dashboard.html');
servePage('/home', 'home.html');         // Home page route
servePage('/profile', 'profile.html');   // Profile page route
servePage('/settings', 'settings.html'); // Settings page route

// Serve static files
const serveFile = (route, folder, file) => app.get(route, (req, res) => res.sendFile(path.join(__dirname, folder, file)));
['emailer', 'signup', 'login', 'dashboard', 'home', 'profile', 'settings'].forEach(file => serveFile(`/js/${file}.js`, 'js', `${file}.js`));
['dashboard', 'signup', 'login', 'index', 'home', 'profile', 'settings'].forEach(file => serveFile(`/css/${file}.css`, 'css', `${file}.css`));

// User Registration
app.post('/register', async (req, res) => {
    try {
        const { fullName, email, contact, address, gender, dob, username, password } = req.body;
        const emailLower = email.toLowerCase();
        const usernameLower = username.toLowerCase();

        const existingUser = await db.collection('users').findOne({
            $or: [{ email: emailLower }, { username: usernameLower }]
        });

        if (existingUser) return res.status(400).json({ error: "Email or username already registered" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.collection('users').insertOne({
            fullName, email: emailLower, contact, address, gender, dob,
            username: usernameLower, password: hashedPassword, createdDate: new Date()
        });

        if (!result.insertedId) return res.status(500).json({ error: "Registration failed" });

        await sendWelcomeEmail(email);
        res.status(200).json({ success: "Registration successful!" });

    } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch User Count
app.get('/count', async (req, res) => {
    try {
        const userCount = await db.collection('users').countDocuments();
        res.json({ userCount });
    } catch (error) {
        console.error("❌ Error fetching user count:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch Active Users
app.get('/activeUsers', (req, res) => {
    res.json({ activeUsers: activeUsers.size });
});

// User Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.collection('users').findOne({ email: email.toLowerCase() });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.redirect('/login?error=Invalid credentials');
        }

        req.session.user = (({ fullName, email, contact, address, gender, dob, username }) =>
            ({ fullName, email, contact, address, gender, dob, username }))(user);

        res.redirect('/dashboard');

    } catch (error) {
        console.error("❌ Login Error:", error);
        res.redirect('/login?error=Something went wrong');
    }
});

// Get Current User
app.get('/api/user', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.json(req.session.user);
});

// Logout
app.post("/logout", (req, res) => {
    if (req.session.user) activeUsers.delete(req.session.user.email);

    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: "Logout failed" });

        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// Fetch All Users (for testing/debugging)
app.get('/users', async (req, res) => {
    try {
        const users = await db.collection('users').find().toArray();
        res.json(users);
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

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

// Fetch Dashboard Data
app.get('/api/dashboard-data', async (req, res) => {
    try {
        // Get user count from the database
        const userCount = await db.collection('users').countDocuments();
        
        // Get active users from the activeUsers set
        const activeUserCount = activeUsers.size;

        // Send the data as a JSON response
        res.json({ userCount, activeUsers: activeUserCount });
    } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start Server
connectDB().then(() => {
    server.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}/`));
});
// Handle 404 errors
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'html', '404.html'));
});