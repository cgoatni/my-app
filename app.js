require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');
const session = require('express-session');
const { sendWelcomeEmail } = require('./js/emailer');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "html")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'sampleOnly',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));


async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log("✅ Connected to MongoDB");
        return client.db('SampleDB');
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        process.exit(1);
    }
}

let db;
connectDB().then(database => db = database);

const servePage = (route, page) => app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'html', page)));

app.post('/register', async (req, res) => {
    try {
        const { fullName, email, contact, address, gender, dob, username, password } = req.body;

        const emailLower = email.toLowerCase();
        const usernameLower = username.toLowerCase();

        const existingUser = await db.collection('users').findOne({ 
            $or: [{ email: emailLower }, { username: usernameLower }] 
        });

        if (existingUser) {
            return res.status(400).json({ error: "Email or username already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.collection('users').insertOne({
            fullName, 
            email: emailLower, 
            contact, 
            address, 
            gender, 
            dob, 
            username: usernameLower, 
            password: hashedPassword, 
            createdDate: new Date()
        });

        if (!result.insertedId) {
            return res.status(500).json({ error: "Registration failed" });
        }

        await sendWelcomeEmail(email);

        return res.status(200).json({ success: "Registration successful!" });

    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

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
        console.error("Login Error:", error);
        res.redirect('/login?error=Something went wrong');
    }
});

app.get('/api/user', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.json(req.session.user);
});

app.get('/users', async (req, res) => {
    try {
        const users = await db.collection('users').find().toArray();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

servePage('/', 'index.html');
servePage('/signup', 'signup.html');
servePage('/login', 'login.html');
servePage('/dashboard', 'dashboard.html');
servePage('/success', 'success.html');
servePage('/error', 'error.html');

const serveFile = (route, folder, file) => app.get(route, (req, res) => res.sendFile(path.join(__dirname, folder, file)));

serveFile('/js/emailer.js', 'js', 'emailer.js');
serveFile('/js/signup.js', 'js', 'signup.js');
serveFile('/js/login.js', 'js', 'login.js');
serveFile('/js/dashboard.js', 'js', 'dashboard.js');
serveFile('/css/dashboard.css', 'css', 'dashboard.css');

app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}/`));
