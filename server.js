import express from "express";
import axios from "axios";
import multer from "multer";

const baseURL = "https://www.googleapis.com";

const baseBooksRunURL = "https://booksrun.com/api/price/sell/";

const booksRunApiKey = "p83zv395qxgyr2mj7xsn";

const apiKEY = "AIzaSyDklC7lbmUzVOIMCUMEhbas-WTu5AYG94c";

const restOrUrl = `/books/v1/volumes\?q\=flowers+inauthor:keyes\&key\=${apiKEY}`;

const app = express();

const port = 4006;

//const apiGoogleBooksKey = AIzaSyDklC7lbmUzVOIMCUMEhbas-WTu5AYG94c

//fetch(url: URL | RequestInfo, init?: RequestInit): Promise<Response>;

app.get("/", async (req, res) => {
  try {
    const { data } = await axios.get(
      `${baseURL}/books/v1/volumes?q=intitle:"Pharmacology+in+Nursing+Fourteenth+Edition"&key=${apiKEY}`,
      `${baseBooksRunURL}{9781595829788}?key=${booksRunApiKey}`
    );

    console.log(data.items);

    // Then, we extract the ISBN_13 as before
    let isbn13 = null;
    if (
      data.items &&
      data.items[0] &&
      data.items[0].volumeInfo &&
      data.items[0].volumeInfo.industryIdentifiers
    ) {
      for (const identifier of data.items[0].volumeInfo.industryIdentifiers) {
        if (identifier.type === "ISBN_13") {
          isbn13 = identifier.identifier;
          break;
        }
      }
    }

    // Sending the ISBN_13 back to the client or handle as needed
    res.json({ isbn13 });
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
