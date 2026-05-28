const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("MySQL Pool Connected");

// ROOT API
app.get("/", (req, res) => {
  res.send("API Running");
});

// STATES API
app.get("/states", (req, res) => {
  db.query("SELECT * FROM states", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(result);
  });
});

app.get('/districts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM districts');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/subdistricts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subdistricts');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/villages', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM villages');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEARCH API (Hierarchical & Secure)
app.get("/search", (req, res) => {
  const { q, subdistrict_id } = req.query;
  const searchTerm = `%${q}%`;

  let query = `
    SELECT v.village, v.village_id, v.subdistrict_id, s.subdistrict, d.district, st.state
    FROM villages v
    JOIN subdistricts s ON v.subdistrict_id = s.subdistrict_id
    JOIN districts d ON s.district_id = d.district_id
    JOIN states st ON d.state_id = st.state_id
    WHERE v.village LIKE ?
  `;
  const params = [searchTerm];

  if (subdistrict_id) {
    query += " AND v.subdistrict_id = ?";
    params.push(subdistrict_id);
  }

  query += " LIMIT 50";

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Search Error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(result);
  });
});


// FULL HIERARCHY API
app.get("/full/:village_id", (req, res) => {
  db.query(
    `SELECT v.village, s.subdistrict, d.district, st.state
     FROM villages v
     JOIN subdistricts s ON v.subdistrict_id = s.subdistrict_id
     JOIN districts d ON s.district_id = d.district_id
     JOIN states st ON d.state_id = st.state_id
     WHERE v.village_id = ?`,
    [req.params.village_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
      }
      res.json(result);
    }
  );
});

// START SERVER
app.listen(3000, () => {
  console.log("Server running on port 3000");
});