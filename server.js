const express = require('express');
const https = require('https'); // Use https for external API requests
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/db_1200iRealSongs'); // Ensure this path is correct

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(__dirname + '/public'));
app.use(express.json()); // to support JSON-encoded bodies

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

app.listen(PORT, err => {
    if (err) console.log(err);
    else {
        console.log(`Server listening on port: ${PORT}`);
        console.log(`http://localhost:${PORT}/`);
    }
});
