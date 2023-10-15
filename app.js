var express = require("express");
var app = express();
var dbConnection = require("./database");
var recommended_elements;
var receivedData;

const path = require("path");

app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/shop.html");
});

app.use((req, res, next) => {
  if (receivedData) {
    req.currentUser = receivedData;
  }
  next();
});

app.get("/data", (req, res) => {
  const recomnd = recommended_elements;
  res.send(recomnd);
});

app.post("/select-product", (req, res) => {
  const product_id = req.body.product_id;

  // Access currentUser from req object
  const userSpecificRecommendTable = `RECOMMEND_${req.currentUser}`;

  // Get tag_id from the product_tag table for the selected product
  const getProductTagQuery = `
    SELECT TAG_ID
    FROM PRODUCT_TAG
    WHERE PRODUCT_ID = ?;
  `;

  dbConnection.query(getProductTagQuery, [product_id], function (err, result) {
    if (err) {
      console.error("Error executing SQL query: ", err);
      res.status(500).send("Error executing SQL query");
      return;
    }

    if (result.length > 0) {
      const tag_id = result[0].TAG_ID;
      console.log("Item with TAG_ID:", tag_id, "selected");

      const productsWithSameTagQuery = `
        SELECT PRODUCT_ID
        FROM PRODUCT_TAG
        WHERE TAG_ID = ?;
      `;

      dbConnection.query(
        productsWithSameTagQuery,
        [tag_id],
        function (err, productResult) {
          if (err) {
            console.error("Error executing SQL query: ", err);
            res.status(500).send("Error executing SQL query");
            return;
          }

          const valueSets = productResult.map((row) => [
            row.PRODUCT_ID,
            tag_id,
            1,
          ]);

          const insertOrUpdateQuery = `
          INSERT INTO ${userSpecificRecommendTable} (PRODUCT_ID, TAG_ID, INCR_TAG)
          VALUES ? 
          ON DUPLICATE KEY UPDATE INCR_TAG = INCR_TAG + 1;
        `;

          // Execute the bulk insert query
          dbConnection.query(
            insertOrUpdateQuery,
            [valueSets],
            function (err, result) {
              if (err) {
                console.error("Error executing SQL query: ", err);
                res.status(500).send("Error executing SQL query");
                return;
              }

              res.send("Data inserted or updated successfully");
            }
          );
        }
      );
    } else {
      res.status(400).send("Tag ID not found for the selected product");
    }
  });
});

app.post("/Reset-Recommendation", (req, res) => {
  let user_to_reset = `RECOMMEND_${req.currentUser}`;
  let dropTable = `DROP TABLE ${user_to_reset};`;

  dbConnection.query(dropTable, function (err, result) {
    if (err) {
      console.error("Table doesn't exist", err);
      res.status(500).send("Error executing SQL query");
      return;
    } else {
      let createTable = `CREATE TABLE ${user_to_reset}(
        PRODUCT_ID INT,
        TAG_ID INT,
        INCR_TAG INT,
        PRIMARY KEY (PRODUCT_ID, TAG_ID),
        FOREIGN KEY (PRODUCT_ID) REFERENCES PRODUCT_TAG(PRODUCT_ID),
        FOREIGN KEY (TAG_ID) REFERENCES TAG(TAG_ID)
    );`;

      dbConnection.query(createTable, function (err, result1) {
        if (err) {
          console.error("Table doesn't exist", err);
          res.status(500).send("Error executing SQL query");
          return;
        } else {
          res.send(`USER ${req.currentUser}'s recommendation has been reset`);
        }
      });
    }
  });
});

app.get("/send-data", (req, res) => {
  receivedData = req.query.value;
  console.log("Received data:", receivedData);

  if (receivedData) {
    const user = receivedData;
    const sql = `
      SELECT PRODUCT_ID
      FROM RECOMMEND_${user}
      ORDER BY INCR_TAG DESC
      LIMIT 4;
    `;
    dbConnection.query(sql, function (err, result) {
      if (err) {
        console.error("Error executing SQL query: ", err);
        res.status(500).send("Error executing SQL query");
        return;
      } else {
        recommended_elements = result;
        res.send("Data received and SQL query executed successfully");
      }
    });
  } else {
    res.status(400).send("Received data is missing");
  }
});

app.get("/other-recom", (req, res) => {
  const currentUser = req.currentUser;

  // Determine which tables to use based on the current user
  let otherUsers = [];
  if (currentUser === "A") {
    otherUsers = ["B", "C"];
  } else if (currentUser === "B") {
    otherUsers = ["A", "C"];
  } else if (currentUser === "C") {
    otherUsers = ["A", "B"];
  } else {
    res.status(400).send("Invalid user");
    return;
  }

  const recommendations = [];

  // Fetch the top recommendations for the current user
  const sqlCurrentUser = `
    SELECT PRODUCT_ID
    FROM RECOMMEND_${currentUser}
    ORDER BY INCR_TAG DESC
    LIMIT 2;
  `;

  dbConnection.query(sqlCurrentUser, function (err, currentUserResult) {
    if (err) {
      console.error("Error executing SQL query: ", err);
      res.status(500).send("Error executing SQL query");
      return;
    }

    const currentUserTopRecommendations = currentUserResult.map(
      (row) => row.PRODUCT_ID
    );

    // Fetch common tags between current user and other users
    const sqlCommonTags = `
      SELECT PT.TAG_ID
      FROM PRODUCT_TAG AS PT
      WHERE PT.PRODUCT_ID IN (
        SELECT PRODUCT_ID
        FROM RECOMMEND_${currentUser}
      )
      AND PT.PRODUCT_ID IN (
        SELECT PRODUCT_ID
        FROM RECOMMEND_${otherUsers[0]}
      )
      UNION
      SELECT PT.TAG_ID
      FROM PRODUCT_TAG AS PT
      WHERE PT.PRODUCT_ID IN (
        SELECT PRODUCT_ID
        FROM RECOMMEND_${currentUser}
      )
      AND PT.PRODUCT_ID IN (
        SELECT PRODUCT_ID
        FROM RECOMMEND_${otherUsers[1]}
      );
    `;

    dbConnection.query(sqlCommonTags, function (err, commonTagsResult) {
      if (err) {
        console.error("Error executing SQL query: ", err);
        res.status(500).send("Error executing SQL query");
        return;
      }

      const commonTags = commonTagsResult.map((row) => row.TAG_ID);

      // Fetch recommended products with uncommon tags
      const sqlUncommonRecommendations = `
        SELECT PT.PRODUCT_ID
        FROM PRODUCT_TAG AS PT
        WHERE PT.PRODUCT_ID NOT IN (?)
        AND PT.TAG_ID NOT IN (?) 
        ORDER BY RAND()
        LIMIT 2;
      `;

      dbConnection.query(
        sqlUncommonRecommendations,
        [currentUserTopRecommendations, commonTags],
        function (err, uncommonRecommendationsResult) {
          if (err) {
            console.error("Error executing SQL query: ", err);
            res.status(500).send("Error executing SQL query");
            return;
          }

          const uncommonRecommendations = uncommonRecommendationsResult.map(
            (row) => row.PRODUCT_ID
          );

          res.json({
            recommendations: uncommonRecommendations,
          });
        }
      );
    });
  });
});

dbConnection.connect(function (err) {
  if (err) console.log(err);
  console.log("Connected to Personalized Product Recommendation");
});

app.post("/recommend", (req, res) => {});

app.listen(3000, () => {
  console.log("Server is running");
});
