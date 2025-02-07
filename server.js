const express = require('express');
const https = require('https'); // Use https for external API requests
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/db_1200iRealSongs'); // Ensure this path is correct

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));
app.use(express.json()); // to support JSON-encoded bodies

// Authentication Middleware
function authenticate(request, response, next) {
    let auth = request.headers.authorization;
    if (!auth) {
        response.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        response.writeHead(401);
        response.end();
    } else {
        var tmp = auth.split(' ');
        var buf = Buffer.from(tmp[1], 'base64');
        var plain_auth = buf.toString();
        var credentials = plain_auth.split(':');
        var username = credentials[0];
        var password = credentials[1];

        db.get("SELECT userid, password, role FROM users WHERE userid = ?", [username], function(err, row) {
            if (err || !row || password !== row.password) {
                response.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
                response.writeHead(401);
                response.end();
            } else {
                request.user_role = row.role;
                next();
            }
        });
    }
}

app.use(authenticate);

// Array of paths that should resolve to the same result
const paths = ['/', '/mytunes.html', '/mytunes', '/index.html'];

// Route to serve the index.html file for the specified paths
app.get(paths, (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

// Route for '/songs' - Fetching songs data
app.get('/songs', (req, res) => {
    let songTitle = req.query.title;
    if (!songTitle) {
        res.json({ message: 'Please enter Song Title' });
        return;
    }

    let titleWithPlusSigns = songTitle.trim().replace(/\s/g, '+');
    console.log('Searching for song:', titleWithPlusSigns);

    const options = {
        hostname: "itunes.apple.com",
        path: `/search?term=${titleWithPlusSigns}&entity=musicTrack&limit=20`,
    };

    https.get(options, function(apiResponse) {
        let songData = '';
        apiResponse.on('data', (chunk) => {
            songData += chunk;
        });
        apiResponse.on('end', () => {
            res.contentType('application/json').json(JSON.parse(songData));
        });
    }).on('error', (e) => {
        console.error(e);
        res.status(500).send('Error fetching data from iTunes API');
    });
});

// Route for '/users'
app.get('/users', (req, res) => {
    if (req.user_role !== 'admin') {
        res.status(403).send('Access Denied');
        return;
    }

    db.all("SELECT userid, password FROM users", function(err, rows) {
        if (err) {
            res.status(500).send('Internal Server Error');
            return;
        }
        let responseBody = rows.map(row => `User: ${row.userid}, Password: ${row.password}`).join('<br>');
        res.send(responseBody);
    });
});

// Route for user registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!(username && password)) {
        return res.status(400).send('Username and password are required');
    }

    db.run('INSERT INTO users (userid, password, role) VALUES (?, ?, ?)', [username, password, 'guest'], function(err) {
        if (err) {
            return res.status(500).send('Error registering new user');
        }
        res.send('User registered successfully');
    });
});

app.listen(PORT, err => {
    if (err) console.log(err);
    else {
        console.log(`Server listening on port: ${PORT}`);
        console.log(`http://localhost:${PORT}/`)
        console.log(`http://localhost:${PORT}/users`)

    }
});
