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
const multer = require('multer');
const GridFSStorage = require('multer-gridfs-storage');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 3000;

// ===================================================================
// 1. MIDDLEWARE
// ===================================================================
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

// ===================================================================
// 2. DATABASE CONNECTION
// ===================================================================
let db;
const connectDB = async () => {
    try {
        const client = new MongoClient(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await client.connect();
        console.log("✅ Connected to DB");
        db = client.db('SampleDB');
    } catch (error) {
        console.error("❌ DB connection failed:", error);
        process.exit(1);
    }
};

connectDB();

// Ensure DB is ready
app.use((req, res, next) => {
    if (!db) return res.status(503).json({ error: "Database connection is not ready" });
    req.db = db;
    next();
});

// ===================================================================
// 3. WEBSOCKET
// ===================================================================
let activeUsers = new Set();

wss.on("connection", (ws, req) => {
    sessionMiddleware(req, {}, () => {
        if (req.session?.user) {
            const userEmail = req.session.user.email;
            activeUsers.add(userEmail);
            console.log("WebSocket user connected:", userEmail);
            ws.send(JSON.stringify({ message: "Welcome to the WebSocket server!" }));

            ws.on("close", () => {
                activeUsers.delete(userEmail);
            });
        }
    });
});

// ===================================================================
// 4. HELPER FUNCTIONS
// ===================================================================
const servePage = (route, page) =>
    app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'html', page)));

const serveFile = (route, folder, file) =>
    app.get(route, (req, res) => res.sendFile(path.join(__dirname, folder, file)));

const getUserRole = (req) => req.session.user ? req.session.user.role : null;

const ensureAdmin = (req, res, next) => {
    const role = getUserRole(req); // Using the getUserRole function here
    if (role.toLowerCase !== 'admin') return res.redirect('/home');
    next();
};


// ===================================================================
// 5. HTML PAGES & STATIC FILES
// ===================================================================
servePage('/', 'index.html');
servePage('/signup', 'signup.html');
servePage('/login', 'login.html');
servePage('/home', 'home.html');
servePage('/profile', 'profile.html');
servePage('/settings', 'settings.html');
servePage('/staff', 'staff.html');
app.get('/dashboard', ensureAdmin, (req, res) =>
    res.sendFile(path.join(__dirname, 'html', 'dashboard.html'))
);

// Static JS files
['emailer', 'index', 'signup', 'login', 'user', 'menu', 'product', 'connection', 'dashboard', 'home', 'profile', 'staff', 'settings'].forEach(file =>
    serveFile(`/js/${file}.js`, 'js', `${file}.js`)
);

// Static CSS files
['dashboard', 'signup', 'login', 'index', 'home', 'profile', 'settings'].forEach(file =>
    serveFile(`/css/${file}.css`, 'css', `${file}.css`)
);

// ===================================================================
// 6. API ROUTES
// ===================================================================
// 6.1 Get current user session
app.get('/api/user', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.json(req.session.user);
});

// 6.2 Dashboard data
app.get('/api/dashboard-data', ensureAdmin, async (req, res) => {
    try {
        const userCount = await db.collection('users').countDocuments();
        res.json({ userCount, activeUsers: activeUsers.size });
    } catch (error) {
        console.error("❌ Dashboard Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 6.3 Active users
app.get('/activeUsers', (req, res) => res.json({ activeUsers: activeUsers.size }));

// 6.4 User count
app.get('/count', async (req, res) => {
    try {
        const userCount = await db.collection('users').countDocuments();
        res.json({ userCount });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 6.5 Validate old password
app.post('/api/validate-password', async (req, res) => {
    const { oldPassword } = req.body;
    if (!req.session.user) return res.status(401).json({ error: 'User not logged in' });

    const user = await db.collection('users').findOne({ email: req.session.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Old password is incorrect' });

    res.status(200).json({ success: 'Old password is valid' });
});

// ===================================================================
// 7. AUTH ROUTES
// ===================================================================
app.post('/register', async (req, res) => {
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
        username: usernameLower, password: hashedPassword, createdDate: new Date(), role: 'userOnly'
    });

    if (!result.insertedId) return res.status(500).json({ error: "Registration failed" });

    await sendWelcomeEmail(email);
    res.status(200).json({ success: "Registration successful!" });
});

// 7.2 Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.redirect('/login?error=Invalid credentials');
    }

    req.session.user = (({ lastName, firstName, email, contact, address, gender, dob, username, role }) =>
        ({ lastName, firstName, email, contact, address, gender, dob, username, role }))(user);

    const redirectPath = user.role === 'Admin' ? '/dashboard' :
                         user.role === 'staff' ? '/staff' : '/home';

    res.redirect(redirectPath);
});

// 7.3 Logout
app.post("/logout", (req, res) => {
    if (req.session.user) activeUsers.delete(req.session.user.email);
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: "Logout failed" });
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// ===================================================================
// 9. PRODUCT ROUTES
// ===================================================================
const upload = multer({ storage: new GridFSStorage({
    url: process.env.MONGO_URI,
    file: (req, file) => ({ filename: `${Date.now()}-${file.originalname}`, bucketName: 'fs' })
}) });

// 9.1 Get products
app.get('/products', async (req, res) => {
    try {
        const products = await db.collection('products').find().toArray();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Import multer-gridfs-storage
const multerGridFsStorage = require('multer-gridfs-storage');
const GridFSStorage = multerGridFsStorage.default || multerGridFsStorage;

// Example route for adding a product with image upload
app.post('/add/product', upload.single('image'), async (req, res) => {
    const { name, price, description, quantity, category } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!name || !price || !description || !quantity || !category) {
        return res.status(400).json({ error: 'All fields except image are required' });
    }

    if (image && !req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are allowed' });
    }

    try {
        const product = await db.collection('products').insertOne({
            name,
            price,
            description,
            quantity,
            category,
            imageId: image,
        });

        const newProduct = {
            ...product.ops[0],
            imageUrl: image ? `/uploads/${image}` : null,
        };

        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ===================================================================
// 10. CONTACT FORM
// ===================================================================
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

// ===================================================================
// 11. 404 HANDLER
// ===================================================================
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'html', '404.html'));
});

// ===================================================================
// 12. START SERVER
// ===================================================================
server.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}/`);
});
