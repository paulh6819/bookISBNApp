//THings to do:
// 1. I need to fix the landing animation for when i drop a photo in.
// finished - 2. I should have a loading state, a loading animation while waiting for the data, CSS is fast

//3. look up nullish coalessing
//4.look upoptional chaining

//5. I want to figure out a way to get every image on screen to see whats coming back!

//6. Put an the images in an icon and then have a "more" tab for more info, that expands the image and the text. That way more can be seen at once.
//7. find out how to do different things with data, and async. Because waiting for everything is slowing down my app plus i want differnt things to happen
// and the way the app is structered is slowing me down

//8. I need to implement javascript pupeeteer mode to move the CSV file to bookScouter

//9. a really cool feature would be if all the text that was on the sreen on the iphone as the user went to take a photo popped up on the mobile phone
// as the OCR started to identify the text on the book

//10. learn the basics of websockets on a seperate little practice page or app

//11. I need to get the websocket concept understood because my app brings back all the infomation if the user can click for more info

import { spawn } from "child_process";

import { exec } from "child_process";
import express from "express";
import axios from "axios";
import multer from "multer";
import OpenAI from "openai";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import dotenv from "dotenv";
dotenv.config();
// console.log(process.env.CHAT_GPT_API_KEY);
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const openai = new OpenAI({
  apiKey: process.env.CHAT_GPT_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});
const priceApiKey =
  "TZSVHHOSXBXVRLXRDXXMIEFOXWZUOZVIGZZGJAWCDNRGKNEHQKRRSMDJOLJURSWI";

// const CHAT_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";
// const chatGPTApiKey = process.env.CHAT_GPT_API_KEY;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const credentials = {
  type: "service_account",
  project_id: "tokyo-hold-396302",
  private_key_id: "2565a31bf3628fafe32d0b76f5fbf95957b37af4",
  private_key: process.env.PRIVATE_KEY,
  client_email: process.env.CLIENT_EMAIL,
  client_id: "107598203139965265258",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/paul-henderson%40tokyo-hold-396302.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

const client = new ImageAnnotatorClient({ credentials: credentials });

const baseURL = "https://www.googleapis.com";

const baseBooksRunURL = "https://booksrun.com/api/price/sell/";

const baseBooksRunURLBuying = "https://booksrun.com/api/v3/price/buy/";

//sometimes this key will randomly expire. must be cognizant of the issue, and think of a solution.
const booksRunApiKey = "p83zv395qxgyr2mj7xsn";

const apiKEYGoogleBooks = "AIzaSyC0VxffVwhh-iT2mTauuIoFoIwMgx20hUU";

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const port = process.env.PORT || 4006;

//const apiGoogleBooksKey = AIzaSyDklC7lbmUzVOIMCUMEhbas-WTu5AYG94c

//fetch(url: URL | RequestInfo, init?: RequestInit): Promise<Response>;

app.get("/fetchbooks", async (req, res) => {
  try {
    const googleData = await axios.get(
      `${baseURL}/books/v1/volumes?q=intitle:"McGraw Hill Guide Writing for College"&key=${apiKEY}`
    );

    // Then, we extract the ISBN_13 as befores
    let isbn13List = [];

    if (googleData.data.items) {
      for (const item of googleData.data.items) {
        if (item.volumeInfo?.industryIdentifiers) {
          for (const identifier of item.volumeInfo.industryIdentifiers) {
            if (identifier.type === "ISBN_13") {
              isbn13List.push(identifier.identifier);
              break;
            }
          }
        }
      }
    }

    console.log("these are all the ISBNs", isbn13List);
    let booksrunDataList2 = [];

    for (const isbn13 of isbn13List) {
      const booksrunData = await axios.get(
        `${baseBooksRunURL}${isbn13}?key=${booksRunApiKey}`
      );

      booksrunDataList.push(booksrunData.data);
    }

    if (isbn13) {
      booksrunData = await axios.get(
        `${baseBooksRunURL}${isbn13}?key=${booksRunApiKey}`
      );
    }

    res.json({
      googleData: isbn13List, // Changed this line
      booksRunData: booksrunDataList2,
    });
  } catch (error) {
    console.error("error fetching data", error);
    res.status(500).send("internal server error");
  }
});

///   The function below returns the response from chatGPT

async function getBooksFromChatGPT(ocrText) {
  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: `Please parse the following text from googles OCR of an image of books. I need the likely book titles in json format. You are
        an API and your response is going to another API so you must be very exact about the format that you return the json string. Return
        this exact format - which means excluding ANY explanatory text, I repeat, no text other than the formatted books in JSON! -    {
          "title": “EXAMPLE BOOK TITLE”,
          "subtitle": “example subtitle”
        },
        {
          "title": "EXAMPLE BOOK TITLE”,
          "author": “example author”,
          "subtitle": "example subtitle"
        },  - The following is the text that needs parsing: ${ocrText}`,
      },
    ],
    stream: true,
  });
  let responseContent = "";
  for await (const part of stream) {
    responseContent += part.choices[0]?.delta?.content || "";
  }
  // console.log(
  //   "this is chatgpt respnse",
  //   responseContent,
  //   "this is the end of the response content"
  // );
  return responseContent;
}

//This is my main function right now.

app.post("/detectLabels", upload.single("image"), async (req, res) => {
  let finalArryOfSetISBNS = "";
  if (!req.file) {
    // console.log("No image provided.");
    return res.status(400).send("No image uploaded.");
  }
  // console.log("Image received. Proceeding with label detection.");
  // let booksrunData = await axios.get(
  //   `${baseBooksRunURL}${9781138790988}?key=${booksRunApiKey}`
  // );
  // console.log(
  //   "this is my isbn test for booksrunData textbook",
  //   booksrunData.data.result.text
  // );
  try {
    // Path to the photo at the root
    const buffer = req.file.buffer;
    const [result] = await client.textDetection(buffer);
    // console.log(
    //   "THIS IS OCR RESULT OCR",
    //   result.textAnnotations[0].description
    // );

    //This is the text block back from googles OCR
    const textBackFromGoolgesOCR = result.textAnnotations[0].description;

    // chatGPT's parsing response
    const chatGPTResponse = await getBooksFromChatGPT(textBackFromGoolgesOCR);

    // console.log("chatGPT response", chatGPTResponse);

    let parsedGPTresponse;

    try {
      parsedGPTresponse = JSON.parse(chatGPTResponse);
    } catch (error) {
      console.error("this piece of shit parser for GPT isnt working", error);
      res.status(500).send("error processing line");
      return;
    }
    const allResults = [];
    const mappedBookToImageAndSummary = [];

    const bookImages = [];
    const totalArrayOfImages = [];

    // let setOfBookImages = new Set(bookImages);
    //console.log("here are some URLS", bookImages);

    // ... [earlier code]

    // Assuming parsedGPTresponse is an array of objects where each object has a 'title' property.
    for (let bookOBJ of parsedGPTresponse) {
      if (bookOBJ.title) {
        // console.log(`This is a returned title from chatGPT: ${bookOBJ.title}`);
        const constructedURL = `${baseURL}/books/v1/volumes?q=intitle:"${encodeURIComponent(
          bookOBJ.title
        )}"&key=${apiKEYGoogleBooks}`;

        try {
          // Fetch data from Google Books API
          const googleBooksResponse = await axios.get(constructedURL);

          if (
            //  googleBooksResponse.data.items &&
            googleBooksResponse.data.items?.length > 0
          ) {
            googleBooksResponse.data.items.forEach((arryOfBookInfo) => {
              if (arryOfBookInfo.volumeInfo.imageLinks?.thumbnail) {
                totalArrayOfImages.push(
                  arryOfBookInfo.volumeInfo.imageLinks?.thumbnail
                );
              }
            });

            // Get the first item's thumbnail
            const firstItemThumbnail =
              googleBooksResponse.data.items[0].volumeInfo.imageLinks
                ?.thumbnail;

            const firstItem = googleBooksResponse.data.items[0].volumeInfo;
            const firstItemDescription =
              firstItem.description ||
              "Unforfunately no summary is summarily available";

            const firstAuthor =
              googleBooksResponse.data.items[0].volumeInfo.authors;
            // console.log("this is the first authorr", firstAuthor);

            const firstPublisher =
              googleBooksResponse.data.items[0].volumeInfo.publisher;

            const firstRating =
              googleBooksResponse.data.items[0].volumeInfo.averageRating;

            const firstISBN =
              googleBooksResponse.data.items[0].volumeInfo.industryIdentifiers;

            // console.log("This is the first summary", firstItemDescription);
            // console.log("This is the first isbn", firstISBN);

            //   if (firstItemThumbnail) {
            // Create an object that contains the title and the corresponding image
            const resultWithImage = {
              title: bookOBJ.title,
              imageUrl: firstItemThumbnail,
              summary: firstItemDescription,
              author: firstAuthor,
              publisher: firstPublisher,
              rating: firstRating,
              ISBN: firstISBN,
            };

            // Push the object into an array that will contain all results with images AND SUMMARY
            mappedBookToImageAndSummary.push(resultWithImage);
            // console.log(
            //   "this is the result with image thats supposed to push broze age mindset",
            //   resultWithImage
            // );
            // }
            // console.log(
            //   "this is the complete obkect",
            //   mappedBookToImageAndSummary
            // );
          }
        } catch (error) {
          console.error("Error fetching from Google Books API:", error);
          res.status(500).send("Error fetching book data");
          return;
        }
      }
    }
    let totalISBNS = [];
    //This brings back all the data from googles book API
    for (let bookOBJ of parsedGPTresponse) {
      if (bookOBJ.title) {
        // console.log(`This is a returned title from chatGPT: ${bookOBJ.title} `);
      }

      const constructedURL = `${baseURL}/books/v1/volumes?q=intitle:"${encodeURIComponent(
        bookOBJ.title
      )}"&key=${apiKEYGoogleBooks}`;
      // console.log("Constructed URL:", constructedURL);

      const isbnsFromGoogleBooks = [];

      try {
        //this is what's bringing back the actul data from googles book API
        const googleBooksResponse = await axios.get(constructedURL);
        //
        //here below I am Trying to get an imgage from gogles book API
        //  console.log("this is googles books response:", googleBooksResponse);
        let temporaryBookImageArray = [];

        if (
          googleBooksResponse.data.items &&
          googleBooksResponse.data.items.length > 0
        ) {
          googleBooksResponse.data.items.forEach((item) => {
            temporaryBookImageArray.push(item.volumeInfo.imageLinks.thumbnail);
            // console.log(
            //   "this is the tempoary book image array",
            //   temporaryBookImageArray
            // );
            if (
              item.volumeInfo.industryIdentifiers &&
              item.volumeInfo.industryIdentifiers.length > 0
            ) {
              item.volumeInfo.industryIdentifiers.forEach((identifier) => {
                isbnsFromGoogleBooks.push(identifier.identifier);
                // console.log(
                //   "this is an identifier ISBN",
                //   identifier.identifier
                // );
              });
            }
            let firstBookImage = temporaryBookImageArray[0];
            let arrayOfEachBookImage = [];
            if (
              item.volumeInfo.imageLinks &&
              item.volumeInfo.imageLinks.thumbnail
            ) {
              arrayOfEachBookImage.push(item.volumeInfo.imageLinks.thumbnail);
            }
            try {
              // console.log(
              //   "this is the array of EachBook",
              //   arrayOfEachBookImage
              // );
            } catch (error) {
              "this array is not working", error;
            }

            let firstResponseForBookImage = temporaryBookImageArray[0];
            bookImages.push(firstResponseForBookImage);
            //  bookImages.push(firstResponseForBookImage);
            totalISBNS.push(isbnsFromGoogleBooks);
            // console.log(
            //   "these are the isbns PERBOOK NEW NEW NEW",
            //   isbnsFromGoogleBooks
            // );
          });
          //bookImages.push(arrayOfEachBookImage);
          // console.log(bookImages);
        }
      } catch (error) {
        if (error.response) {
          console.error(
            "Error fetching from Google Books API:",
            error.response.data
          );
        } else {
          console.error("Error fetching from Google Books API:", error.message);
        }
      }
      // console.log("here are the image URLS", bookImages);
      // console.log("this is the array of isbns per book", isbnsFromGoogleBooks);
      // console.log("these should be all the ISBNS", totalISBNS);

      const setOfIBNS = new Set();
      totalISBNS.forEach((isbnSubArray) => {
        isbnSubArray.forEach((isbn) => {
          setOfIBNS.add(isbn);
        });
      });
      // console.log("this is the set of ISBNS", [...setOfIBNS]);
      finalArryOfSetISBNS = [...setOfIBNS];
      // console.log(
      //   "this is the size of the finaly array of isBNS",
      //   finalArryOfSetISBNS.length
      // );
      // finalArryOfSetISBNS.forEach((isbn) => {
      //   console.log(isbn);
      // });
    }
    //This is the array where I am storing the price obeject and isbns returned from books run
    //  let booksrunPrices = [];
    //

    //Now I am sending the first ISBN to  books run
    // try {
    //   for (let isbn of isbnsFromGoogleBooks) {
    //     const booksrunResponse = await axios.get(
    //       `${baseBooksRunURL}${isbn}?key=${booksRunApiKey}`
    //     );

    // console.log("here is the raw data to booksRun", booksrunResponse);

    //   booksrunPrices.push([
    //     bookOBJ.title,
    //     isbn,
    //     booksrunResponse.data.result.text,
    //   ]);
    //   console.log(
    //     "this is the object coming back from books run for ISBN",

    //     isbn,
    //     booksrunResponse.data.result
    //   );
    // }
    // console.log(
    //     "this is the array of prices from books run",
    //     booksrunPrices
    //   );
    //   allResults.push(...booksrunPrices);
    // } catch (error) {
    //   console.error(
    //     "error getting book respnse from booksRUn",
    //     error.response.data
    //   );
    // }
    //  }

    // console.log(parsedGPTresponse);

    // console.log(textBackFromGoolgesOCR);

    //attempting to access googles book api

    // for (let book of parsedGPTresponse) {
    //   const query =
    //     book.title + (book.author ? ` inauthor:${book.author}` : "");
    //   const url = `${baseURL}${encodeURIComponent(
    //     query
    //   )}&key=${apiKEYGoogleBooks}`;

    //   try {
    //     const response = await axios.get(url);

    //     console.log(response);
    //     // Access the results using response.data
    //     const books = response.data.items; // an array of book objects

    //     console.log("This is loging infor from googlebooksAPI", books);

    //     if (books && books.length > 0) {
    //       console.log(books[0].volumeInfo); // Log the first book's details
    //     }
    //   } catch (error) {
    //     console.error(
    //       `Error fetching details for ${book.title} from Google Books API:`,
    //       error.message
    //     );
    //   }
    // }

    // If you want to send back the result or some other response, you can do it here.
    // console.log("this is the final result!:", allResults);
    // console.log("this is the mappedBookTOimage", mappedBookToImageAndSummary);
    // console.log("this is the array of book images", totalArrayOfImages);
    // console.log("this is the allresults varible", allResults);

    // Spawn the Puppeteer script process---------------
    const isbnArgs = finalArryOfSetISBNS.join(",");
    const puppeteerProcess = spawn("node", [
      "pupeteerCVSformatterfile.js",
      isbnArgs,
    ]);

    puppeteerProcess.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    puppeteerProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    puppeteerProcess.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });

    //--------------------------

    const urlArrayString = JSON.stringify(totalArrayOfImages);
    exec(
      `python3 image_comparison.py '${urlArrayString}'`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        // console.log(`Python Output: ${stdout}`);
      }
    );

    res.json({
      message: "Image processed successfully",
      result: allResults,
      bookUrls: totalArrayOfImages,
      mappedImageAndSummary: mappedBookToImageAndSummary,
      pricePlaceHolder: { Average: 0, Good: 0, New: 0 },
      arrayOfISBNs: finalArryOfSetISBNS,
    });
  } catch (error) {
    console.error(
      "Error processing line at the end of the app:",
      error.message
    );
    //  if (error.response && error.response.data) {
    //   console.error("OpenAI API error:", error.response.data);
    //   }
    // It's not recommended to just throw an error without handling it.
    // Instead, send a response to the client with an error status.
    res.status(500).send("Error processing the image.");
  }
});
app.use(express.json());

let storedFile; // This variable will hold the most recent file data

app.post("/setMostRecentFile", (req, res) => {
  storedFile = req.body.file;
  // console.log("this is the stored file", storedFile);
  res.send(
    "File received from puppeteer containing book scouter prices and data"
  );
});

// app.get("/getMostRecentFile", (req, res) => {
//   if (storedFile) {
//     // Convert the buffer data to a string
//     const fileContent = storedFile.data.toString();
//     res.json({ file: fileContent });
//     console.log(
//       "this is the converted buffer to jason string file",
//       fileContent
//     );
//   } else {
//     res.status(404).send("No file stored");
//   }
// });

app.get("/getMostRecentFile", (req, res) => {
  if (storedFile) {
    // Convert the buffer data (character codes) to a string
    const fileContent = String.fromCharCode.apply(null, storedFile.data);
    res.json({ file: fileContent });
    // console.log(
    //   "this is the converted buffer to jason string file",
    //   fileContent
    // );
  } else {
    res.status(404).send("No file stored");
  }
});

// app.get("/getFileContent", (req, res) => {
//   if (storedFile) {
//     const filePath = path.join(
//       __dirname,
//       "path-to-directory-containing-files",
//       storedFile
//     );
//     fs.readFile(filePath, "utf8", (err, data) => {
//       if (err) {
//         console.error("Error reading the file:", err);
//         return res.status(500).send("Error reading the file");
//       }
//       res.send(data);
//     });
//   } else {
//     res.status(404).send("No file stored");
//   }
// });

//Not really sure what this does, just syntax as far as I'm concerned. Not part of my logic
app
  .listen(port, () => {
    console.log(`server is running on port ${port}, so quit your whining `);
  })
  .on("error", (err) => {
    console.error("Error starting the server:", err);
  });

//export default textBackFromGoolgesOCR;

// if (result && result.textAnnotations) {
//   const texts = result.textAnnotations;
//   const textDetection = result.textAnnotations[0].description;
//   const lines = textDetection.split("\n");

//   const linesLessThanFour = [];

//   for (let line of lines) {
//     if (line.trim().length > 4) {
//       linesLessThanFour.push(line);
//     }
//   }
//   const isbToPriceMap = {};
//   console.log(lines);
//   console.log(linesLessThanFour);

// perhaps I will use other APIS like a merry go round that switches when i hit my google limit

// Here I am putting the funtion that takes data` raw data from googles OCR and sends it for parsing to GPT

// const parsedBookTitles = [];
// async function parseBookTitlesWithChatGPT(text) {
//   const headers = {
//     Authorization: `Bearer ${chatGPTApiKey}`,
//     "Content-Type": "application/json",
//   };

// const data = {
//   prompt: `Parse the following OCR data into book titles: ${text}`,
//   max_tokens: 200, // You can adjust this based on your needs
// };
//st response = await axios.post(CHAT_API_ENDPOINT, data, {
//     headers: headers,
//   });
//   return response.data.choices[0].text.trim();

// for (const line of linesLessThanFour) {
//   isbToPriceMap[line] = {};

//   let potentialISBNs = [];
//   let booksrunDataList = [];

//   console.log(`processing line ----->${line}`);
//   const parsedTitle = await parseBookTitlesWithChatGPT(line);

//   // Store the parsed title
//   parsedBookTitles.push(parsedTitle);

//here is the uility funciton that is sending information to googles books API

// try {
//   const googleBooksResponse = await axios.get(
//     `${baseURL}/books/v1/volumes?q=intitle:"${encodeURIComponent(
//       line
//     )}"&key=${apiKEY}`
//   );

//   if (
//     googleBooksResponse.data.items &&
//     googleBooksResponse.data.items.length > 0
//   ) {
//     for (const item of googleBooksResponse.data.items) {
//       const volumeInfo = item.volumeInfo;
//       if (volumeInfo && volumeInfo.industryIdentifiers) {
//         for (const identifier of volumeInfo.industryIdentifiers) {
//           if (identifier.type === "ISBN_13") {
//             potentialISBNs.push(identifier.identifier);

//             //break; // Break out of the loop once you find the ISBN_13 for this book
//           }
//         }
//       }
//     }
//   }
//   console.log(
//     `these are the potentail ISBNS for one book ${potentialISBNs}`
//   );
// for (const isbn of potentialISBNs) {
//   try {
//     const booksrunData = await axios.get(
//       `${baseBooksRunURL}${isbn}?key=${booksRunApiKey}`
//     );
//     booksrunDataList.push(booksrunData.data);
//     if (booksrunData.data.result.status === "success") {
//       isbToPriceMap[line][isbn] = booksrunData.data.result.text;
//     }
//   } catch (error) {
//     console.error(`Error processing line "${line}":`, error.message);
//   }
// }
// //   console.log(booksrunDataList);

//     let prices = [];

//     for (const data of booksrunDataList) {
//       if (data.result.status === "success") {
//         // Make sure it's "success" not "sucess"
//         //console.log("Text Object:", data.result.text); // Let's see the structure of the text object
//         prices.push(data.result.text); // This will push the whole object for now
//       }
//     }

//     //   console.log(`this is the prices array`, prices);
//     console.log("this is the prices array", prices);
//   } catch (error) {
//     console.error(`Error processing line "${line}":`, error.message);
//   }
//   console.log("Final state of isbnToPriceMap:", isbToPriceMap);
// }

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

//       console.log(`Text detected: ${texts[0].description}`);
//       res.json({
//         text: texts[0].description,
//         isbnToPrice: isbToPriceMap,
//         parsedTitles: parsedBookTitles,
//       }); // sending only the full detected text
//     } else {
//       console.log("No text detected or response format unexpected.");
//       res
//         .status(400)
//         .send("Could not detect text or response format was unexpected.");
//     }
//   } catch (error) {
//     console.error("Error detecting labels  - damn:", error);
//     res.status(500).send("Error detecting labels.");
//   }
// });
