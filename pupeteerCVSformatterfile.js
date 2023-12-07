import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import axios from "axios";
import { error } from "console";

function csvFormatter(data) {
  let csvContent = "isbn\n";
  data.forEach((row) => {
    csvContent += `${row}\n`;
  });
  return csvContent;
}

// Construct __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadCSVAndRetrieveData(isbnString) {
  const csvContent = csvFormatter(isbnString.split(","));
  console.log(csvContent);
  const csvFilePath = path.join(__dirname, "isbnFile.csv");
  fs.writeFileSync(csvFilePath, csvContent);
  // Define the download path
  const downloadPath = path.join(__dirname, "downloads");

  // Create the 'downloads' directory if it doesn't exist
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--no-sandbox`,
      `--disable-setuid-sandbox`,
      `--disable-dev-shm-usage`,
      `--disable-accelerated-2d-canvas`,
      `--disable-gpu`,
      `--download.default_directory=${downloadPath}`,
    ],
  }); // set headless to false to see the browser
  const page = await browser.newPage();
  page.setDefaultTimeout(9200000);
  await page.setViewport({ width: 1280, height: 800 });

  // Navigate to the website
  await page.goto("https://bookscouter.com/"); // Replace with the actual URL

  // TODO: Add steps to log in if necessary
  await page.click('button[data-test-id="Log In button"]');
  // Wait for the email input field to be visible
  await page.waitForSelector('input[name="email"]');

  // Type the email into the email input field
  await page.type('input[name="email"]', "paulh6819@gmail.com");
  await page.type('input[name="password"]', "139990!1");
  await page.click('button[name="LOGIN"]');

  // Wait for the "Pro Tools" button to be available
  await page.waitForTimeout(9000);
  await page.waitForSelector('a[data-test-id="Pro Tools menu link"]');
  await page.click("div.NavLinkWrapper_n5ta92x");
  await page.click('a[data-test-id="Pro Tools menu link"]');
  await page.waitForSelector('a[data-test-id="Bulk Lookup open link"]');
  await page.click('a[data-test-id="Bulk Lookup open link"]');

  await page.waitForSelector("input#fileInput");
  const input = await page.$("input#fileInput");
  await input.uploadFile(csvFilePath);

  await page.waitForSelector('button[name="UPLOAD"]');
  await page.click('button[name="UPLOAD"]');

  await page.waitForSelector("a.UploadStatusPageDownloadFile_u1tjm5hp");

  // Click the download link
  await page.click("a.UploadStatusPageDownloadFile_u1tjm5hp", {
    timeout: 1020000,
  });

  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  await page.waitForFunction(() => {
    const el = document.querySelector(
      ".UploadStatusPageProgressSuccess_ukz22qo"
    );
    if (el && el.textContent.includes("Queued: 100%")) {
      console.log("ok we should be targeing the downloads here");
    } else {
      console.log("ok i dont thinkg we're targeting the downlaods correctly");
    }
    return el && el.textContent.includes("Queued: 100%");
  });

  await new Promise((resolve) => setTimeout(resolve, 4000));

  const macDownloadsFolder = "/Users/admin/Downloads"; // Replace [YourUsername] with your actual username

  fs.readdir(macDownloadsFolder, (err, files) => {
    if (err) {
      console.error("Error finding files:", err);
      return;
    }

    if (files.length === 0) {
      console.log("No files found in the download directory.");
      return;
    }

    // Sort files by modification time to find the most recent file
    files.sort((a, b) => {
      return (
        fs.statSync(path.join(macDownloadsFolder, b)).mtime.getTime() -
        fs.statSync(path.join(macDownloadsFolder, a)).mtime.getTime()
      );
    });

    // Most recent file
    const mostRecentFile = files[0];
    const fileContents = fs.readFileSync(
      path.join(macDownloadsFolder, mostRecentFile)
    );
    console.log("Most recent file:", mostRecentFile);

    axios
      .post("http://localhost:4006/setMostRecentFile", {
        file: fileContents,
      })
      .then((response) => console.log(response.data))
      .catch((error) =>
        console.error("error sending data to the server", error)
      );

    // Here you can add additional code to handle the most recent file
    // For example, moving it to another directory, processing it, etc.
  });

  // Waits for the next navigation
  // await page.click('button[data-test-id="Bulk  open link" ]');
  // await page.waitForNavigation();
  console.log("Current URL:", page.url());

  // TODO: Add steps to download the processed file or retrieve the results

  await browser.close();
}

const isbnString = process.argv[2] || "";
console.log("this is the string from the pupeteer page", isbnString);

// Replace 'path/to/your/csvfile.csv' with the actual path to the CSV file
uploadCSVAndRetrieveData(isbnString)
  .then(() => console.log("CSV processing completed"))
  .catch((error) => console.error("An error occurred:", error));
