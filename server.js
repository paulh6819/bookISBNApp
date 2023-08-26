import express from "express";
import axios from "axios";
import multer from "multer";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const credentials = {
  client_email: process.env.CLIENT_EMAIL,
  private_key: process.env.PRIVATE_KEY,
};

const client = new ImageAnnotatorClient({
  keyFilename: "./credentials.json",
});

const baseURL = "https://www.googleapis.com";

const baseBooksRunURL = "https://booksrun.com/api/price/sell/";

//sometimes this key will randomly expire. must be cognizant of the issue, and think of a solution.
const booksRunApiKey = "p83zv395qxgyr2mj7xsn";

const apiKEY = "AIzaSyBrhum9eqZYgjZkuL4CDeqGkfDLmcEYUEI";

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const port = 4006;

//const apiGoogleBooksKey = AIzaSyDklC7lbmUzVOIMCUMEhbas-WTu5AYG94c

//fetch(url: URL | RequestInfo, init?: RequestInit): Promise<Response>;

app.get("/fetchbooks", async (req, res) => {
  try {
    const googleData = await axios.get(
      `${baseURL}/books/v1/volumes?q=intitle:"CRANK"&key=${apiKEY}`
    );

    // Then, we extract the ISBN_13 as befores
    let isbn13List = [];

    if (googleData.data.items) {
      for (const item of googleData.data.items) {
        if (item.volumeInfo && item.volumeInfo.industryIdentifiers) {
          for (const identifier of item.volumeInfo.industryIdentifiers) {
            if (identifier.type === "ISBN_13") {
              isbn13List.push(identifier.identifier);
              break;
            }
          }
        }
      }
    }

    // console.log(isbn13List);
    // let booksrunDataList = [];

    // for (const isbn13 of isbn13List) {
    //   const booksrunData = await axios.get(
    //     `${baseBooksRunURL}${isbn13}?key=${booksRunApiKey}`
    //   );

    //   booksrunDataList.push(booksrunData.data);
    // }

    // if (isbn13) {
    //   booksrunData = await axios.get(
    //     `${baseBooksRunURL}${isbn13}?key=${booksRunApiKey}`
    //   );
    // }

    res.json({
      googleData: isbn13List, // Changed this line
      booksRunData: booksrunDataList,
    });
  } catch (error) {
    console.error("error fetching data", error);
    res.status(500).send("internal server error");
  }
});

app.post("/detectLabels", upload.single("image"), async (req, res) => {
  if (!req.file) {
    console.log("No image provided.");
    return res.status(400).send("No image uploaded.");
  }
  console.log("Image received. Proceeding with label detection.");
  try {
    // Path to the photo at the root
    const buffer = req.file.buffer;
    const [result] = await client.textDetection(buffer);
    if (result && result.textAnnotations) {
      const texts = result.textAnnotations;
      const textDetection = result.textAnnotations[0].description;
      const lines = textDetection.split("\n");
      let potentialISBNs = [];
      let booksrunDataList = [];

      for (const line of lines) {
        console.log(`processing line ----->${line}`);
        try {
          const googleBooksResponse = await axios.get(
            `${baseURL}/books/v1/volumes?q=intitle:"${encodeURIComponent(
              line
            )}"&key=${apiKEY}`
          );

          if (
            googleBooksResponse.data.items &&
            googleBooksResponse.data.items.length > 0
          ) {
            for (const item of googleBooksResponse.data.items) {
              const volumeInfo = item.volumeInfo;
              if (volumeInfo && volumeInfo.industryIdentifiers) {
                for (const identifier of volumeInfo.industryIdentifiers) {
                  if (identifier.type === "ISBN_13") {
                    console.log(identifier.type);
                    potentialISBNs.push(identifier.identifier);
                    console.log(identifier.identifier);
                    //break; // Break out of the loop once you find the ISBN_13 for this book
                  }
                }
              }
            }
          }
          for (const isbn of potentialISBNs) {
            try {
              const booksrunData = await axios.get(
                `${baseBooksRunURL}${isbn}?key=${booksRunApiKey}`
              );
              booksrunDataList.push(booksrunData.data);
            } catch (error) {
              console.error(`Error processing line "${line}":`, error.message);
            }
          }
          console.log(booksrunDataList);
          let prices = [];

          for (const data of booksrunDataList) {
            if (data.result.status === "success") {
              // Make sure it's "success" not "sucess"
              console.log("Text Object:", data.result.text); // Let's see the structure of the text object
              prices.push(data.result.text); // This will push the whole object for now
            }
          }

          console.log(`this is the prices array`, prices);
          console.log(`this is the prices array ${prices}`);
        } catch (error) {
          console.error(`Error processing line "${line}":`, error.message);
        }
      }

      // I need this to give me every ISBN though so i can feed them all to booksrun
      //   if (
      //     googleBooksResponse.data.items &&
      //     googleBooksResponse.data.items.length > 0
      //   ) {
      //     const volumeInfo = googleBooksResponse.data.items[0].volumeInfo;
      //     if (volumeInfo && volumeInfo.industryIdentifiers) {
      //       for (const identifier of volumeInfo.industryIdentifiers) {
      //         if (identifier.type === "ISBN_13") {
      //           // or "ISBN_10" if you prefer
      //           potentialISBNs.push(identifier.identifier);
      //           break; // Break out of the loop once you find the ISBN_13 for this book
      //         }
      //       }
      //     }
      //   }

      console.log(`Text detected: ${texts[0].description}`);
      res.json({ text: texts[0].description }); // sending only the full detected text
    } else {
      console.log("No text detected or response format unexpected.");
      res
        .status(400)
        .send("Could not detect text or response format was unexpected.");
    }
  } catch (error) {
    console.error("Error detecting labels  - damn:", error);
    res.status(500).send("Error detecting labels.");
  }
});

app
  .listen(port, () => {
    console.log(`server is running on port ${port}, so quit your whining `);
  })
  .on("error", (err) => {
    console.error("Error starting the server:", err);
  });
