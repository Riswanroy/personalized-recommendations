var mysql = require("mysql2");

var dbConnection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "toor",
  database: "recommendation",
});

module.exports = dbConnection;
