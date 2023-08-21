import express from "express";
import axios from "axios";
import multer from "multer";

const baseURL = "https://www.googleapis.com";

const baseBooksRunURL = "https://booksrun.com/api/price/sell/";

const booksRunApiKey = "p83zv395qxgyr2mj7xsn";

const apiKEY = "AIzaSyDklC7lbmUzVOIMCUMEhbas-WTu5AYG94c";

const app = express();

const port = 4006;

//const apiGoogleBooksKey = AIzaSyDklC7lbmUzVOIMCUMEhbas-WTu5AYG94c

//fetch(url: URL | RequestInfo, init?: RequestInit): Promise<Response>;

app.get("/", async (req, res) => {
  try {
    const googleData = await axios.get(
      `${baseURL}/books/v1/volumes?q=intitle:"If on a winter's night a traveler"&key=${apiKEY}`
    );

    // Then, we extract the ISBN_13 as before
    let isbn13 = null;
    if (
      googleData.data.items &&
      googleData.data.items[0] &&
      googleData.data.items[0].volumeInfo &&
      googleData.data.items[0].volumeInfo.industryIdentifiers
    ) {
      for (const identifier of googleData.data.items[0].volumeInfo
        .industryIdentifiers) {
        if (identifier.type === "ISBN_13") {
          isbn13 = identifier.identifier;
          break;
        }
      }
    }

    let booksrunData = null;

    if (isbn13) {
      booksrunData = await axios.get(
        `${baseBooksRunURL}${isbn13}?key=${booksRunApiKey}`
      );
    }

    res.json({
      googleData: isbn13, // Changed this line
      booksRunData: booksrunData ? booksrunData.data : null,
    });
  } catch (error) {
    console.error("error fetching data", error);
    res.status(500).send("internal server error");
  }
});

app
  .listen(port, () => {
    console.log(`server is running on port ${port}, so quit your whining `);
  })
  .on("error", (err) => {
    console.error("Error starting the server:", err);
  });
