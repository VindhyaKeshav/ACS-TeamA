require("dotenv").config();
const FirestoreClient = require("./firestoreClient");
const perfy = require('perfy');

const fs = require("fs");
const csv = require("csv-parser");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
const mysql = require('mysql2');


// Set up MySQL connection

const db = mysql.createConnection(
  {
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 30000,
  },
  console.log("Connected to the spotify database")
);

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    throw err;
  }
  console.log('Connected to MySQL database');
});

app.use(bodyParser.json(), cors());

// To insert data into the database
// Insert endpoint
app.post("/api/insert", async (req, res) => {
  try {
    let { records, database } = req.body;
    records = parseInt(records);
    database = String(database);
    if (!records || !database) {
      return res.status(400).json({
        error: 'Both "Records" and "Database" are required in the request body.',
      });
    }

    if (records === 100 || records === 5000 || records === 10000) {
      const csvFilePath = `./data/${records}.csv`;

      const insertedData = []; // to store the data inserted
      perfy.start(database);
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on("data", (row) => {
          const record = {
            name: row.name,
            album: row.album,
            artists: row.artists,
            year: row.year,
            release_date: row.release_date,
          };
          console.log(record);

          if (database === "firestore") {
            const save = async () => {
              await FirestoreClient.save("music", record);
            };
            save();
          } else {
            const insertQuery = 'INSERT INTO music_table (name, album, artists, year) VALUES (?, ?, ?, ?)';
            db.query(insertQuery, [record.name, record.album, record.artists, record.year], (err, result) => {
              if (err) {
                console.error('MySQL insertion error:', err);
                return res.status(500).send('Error saving data to the database.');
              }
            });
            insertedData.push(record);
          }
        })
        .on("end", () => {
          // Sending the response after CSV processing is complete

          res.status(200).json({ status: 'success', data: perfy.end(database).fullSeconds});
        });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/api/query", async (req, res) => {
  try {
    let { song, artist, year, operator, database } = req.body;
    perfy.start(database);

    if (database == "firestore") {

      let sign = "<";
      const queryForSong = {
        field: "name",
        operator: "==",
        value: song,
      };

      const queryForArtist = {
        field: "artists",
        operator: "==",
        value: artist,
      };

      const queryForYear = {
        field: "year",
        operator: operator,
        value: year,
      };

      // const queryForLessYear = {
      //   field: "year",
      //   operator: operator,
      //   value: year,
      // };

      // const queryForGreYear = {
      //   field: "year",
      //   operator: operator,
      //   value: year,
      // };

      if (!song && artist && year) {
        const qres = await FirestoreClient.executeMultyQuery(
          "music",
          queryForArtist,
          queryForYear
        );
        return res.status(200).json({ status: 'success', data: qres, time: perfy.end(database).fullSeconds });
      }

      if (song && !artist && !year) {
        const qres = await FirestoreClient.executeQuery("music", queryForSong);
        return res.status(200).json({ status: 'success', data: qres, time: perfy.end(database).fullSeconds });

      }
      if (!song && artist && !year) {
        const qres = await FirestoreClient.executeQuery("music", queryForArtist);
        return res.status(200).json({ status: 'success', data: qres, time: perfy.end(database).fullSeconds });

      }
      if (!song && !artist && year) {
        const qres = await FirestoreClient.executeQuery("music", queryForYear);
        return res.status(200).json({ status: 'success', data: qres, time: perfy.end(database).fullSeconds });
      }



    }
    else if (database == "sql") {
      console.log("sql");
      const queryForSong = 'SELECT * FROM music_table WHERE name = ?';
      const queryForArtist = 'SELECT * FROM music_table WHERE artists LIKE ?';
      const queryForYear = `SELECT * FROM music_table WHERE year ${operator} ?`;
      console.log(song);

      console.log(song && !artist && !year);
      console.log(song, artist, year);
      
      if (!song && artist && year) {
        console.log(artist);
        artist = '%' + artist + '%';

        const combinedQuery = `SELECT * FROM music_table WHERE artists LIKE ? AND year ${operator} ?`;
        console.log('Combined Query:', combinedQuery);  // Added this line for debugging
        console.log('Parameters:', [artist, year]);     // Added this line for debugging
        db.query(combinedQuery, [artist, year], (err, results) => {
          if (err) {
            console.error('Error executing combined query:', err);
            res.status(500).json({ error: "Internal server error" });
          } else {
            console.log('Query Results:', results);  // Add this line for debugging
            handleQueryResponse(res, results, perfy.end(database).fullSeconds );
          }
        });
        return res;
      }

      if (song && !artist && !year) {
        console.log(song);

        db.query(queryForSong, [song], (err, results) => {
          if (err) {
            console.error('Error executing query for song:', err);
            res.status(500).json({ error: "Internal server error" });
          } else {
            console.log(results);

            handleQueryResponse(res, results, perfy.end(database).fullSeconds );
          }
        });
        return res;
      }

      if (!song && artist && !year) {
        artist = '%' + artist + '%';

        db.query(queryForArtist, [artist], (err, results) => {
          if (err) {
            console.error('Error executing query for artist:', err);
            res.status(500).json({ error: "Internal server error" });
          } else {
            handleQueryResponse(res, results, perfy.end(database).fullSeconds );
          }
        });
        return res;
      }

      if (!song && !artist && year) {
        db.query(queryForYear, [year], (err, results) => {
          if (err) {
            console.error('Error executing query for year:', err);
            res.status(500).json({ error: "Internal server error" });
          } else {
            handleQueryResponse(res, results, perfy.end(database).fullSeconds );
          }
        });
        return res;
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// logic for handling query responses
function handleQueryResponse(res, results, time) {
  // Implemented the logic to handle the query results and send the response
  res.status(200).json({ status: "success", data: results, time:time });
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
