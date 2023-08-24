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

const booksRunApiKey = "p83zv395qxgyr2mj7xsn";

const apiKEY = "AIzaSyDklC7lbmUzVOIMCUMEhbas-WTu5AYG94c";

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const port = 4006;

//const apiGoogleBooksKey = AIzaSyDklC7lbmUzVOIMCUMEhbas-WTu5AYG94c

//fetch(url: URL | RequestInfo, init?: RequestInit): Promise<Response>;

app.get("/", async (req, res) => {
  try {
    const googleData = await axios.get(
      `${baseURL}/books/v1/volumes?q=intitle:"HARRY POTTER"&key=${apiKEY}`
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

    console.log(isbn13List);
    let booksrunDataList = [];

    for (const isbn13 of isbn13List) {
      const booksrunData = await axios.get(
        `${baseBooksRunURL}${isbn13}?key=${booksRunApiKey}`
      );

      booksrunDataList.push(booksrunData.data);
    }

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
