//import { download } from "express/lib/response";

let image = {
  url: null,
  message: "Let's see what these books are worth",
};
const resultsContainer = document.getElementById("result-container");
// console.log("hey");
let isbnData;

async function handleDrop(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  console.log("Dropped file:", file);
  showHamsterAndDimBackground();

  //below is the way I used to hide the arrow animation - keeping it incase I need to use it again tio hide the

  // const elementToHide = document.querySelector(".arrow");

  // elementToHide.style.display = "none";

  if (file && file.type.match(/^image\//)) {
    updateImage(URL.createObjectURL(file));

    let formData = new FormData();
    formData.append("image", file);

    let response = await fetch("/detectLabels", {
      method: "POST",
      body: formData,
    });
    console.log("response data form backend: ", response);

    if (response.ok) {
      const {
        result,
        bookUrls,
        mappedImageAndSummary,
        pricePlaceHolder,
        arrayOfISBNs,
      } = await response.json();
      // console.log("This is my main object", result);
      // console.log("trying to get URLS here", bookUrls);
      // console.log("here are the mapped images", mappedImageAndSummary);
      // console.log(
      //   "here are the summarya",
      //   mappedImageAndSummary?.[0]?.summary ??
      //     "No summary availibe unfortunately"
      // );
      // console.log("this is the place holder", pricePlaceHolder);
      // console.log("these are the ISBNS", arrayOfISBNs);
      //console.log("this is ISBN", mappedImageAndSummary[0].ISBN[0].type);
      isbnData = arrayOfISBNs;
      // console.log(isbnData);
      hideHamsterAndRemoveDim();
      showCSVButtonAfterPhotoIsDroppedAndThereIsData();
      mappedImageAndSummary.forEach((result) => {
        const bookItem = document.createElement("div");
        bookItem.className = "book-item"; // This class will be used for Flexbox styling

        const bookContainer = document.createElement("div");
        bookContainer.className = "book-container";
        // bookContainer.style.border = "1px solid black";
        bookContainer.className = "book-container";

        // This creates the title for the book in the UI
        const bookTitle = document.createElement("h2");
        bookTitle.innerHTML = result.title;
        bookTitle.style.textAlign = "left";
        bookTitle.style.backgroundColor = "red";
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = result.title;
        details.appendChild(summary);

        let authorsElement = document.createElement("p");
        authorsElement.innerHTML = `<span class="label"> Author: </span> ${
          result?.author?.[0] ?? ""
        }`;
        authorsElement.style.textAlign = "left";
        authorsElement.style.margin = "0px";
        authorsElement.style.marginBottom = "7px";

        let publisherElemnt = document.createElement("p");
        publisherElemnt.style.textAlign = "left";
        publisherElemnt.style.margin = "0px";
        publisherElemnt.style.marginBottom = "7px";
        publisherElemnt.innerHTML = `<span class="label">Publisher:</span> ${
          result?.publisher ?? ""
        }`;

        let ISBNElemnet = document.createElement("p");
        ISBNElemnet.innerHTML = `<span class="label">ISBN number:</span> ${
          result.ISBN?.[0]?.identifier ?? ""
        }`;
        ISBNElemnet.style.textAlign = "left";
        ISBNElemnet.style.margin = "0px";

        const summaryElememnt = document.createElement("p");
        const imgElement = document.createElement("img"); // Create an actual img element
        imgElement.src = result.imageUrl; // Set the source of the image element
        summaryElememnt.style.margin = "0px";
        summaryElememnt.style.marginLeft = "0px";
        summaryElememnt.style.marginTop = "28px";
        summaryElememnt.style.textAlign = "left";
        summaryElememnt.style.marginRight = "25px";
        summaryElememnt.style.marginBottom = "22px";

        summaryElememnt.style.textAlign = "left";

        imgElement.alt = ` `;
        imgElement.classList.add("book-container-img");
        // imgElement.style.width = "100px";
        // imgElement.style.height = "auto";

        summaryElememnt.innerHTML = result.summary;
        // const test = toHTML(
        //   `<div>
        //      <dl>
        //         <dt class= "title"> Title </dt>  <dd> ${result.title} </dd>

        //           <dt> ISBN </dt>
        //           <dd> ${result.ISBN[0].identifier} </dd>
        //     </dl>
        //        <p>
        //           <a href="https://developer.mozilla.org/en-US/docs/Web/API/range/createContextualFragment">
        //               Hello <strong>World!</strong>
        //           </a>
        //        </p>

        //   </div>`
        // );
        if (result.rating) {
          let ratingElement = document.createElement("p");
          ratingElement.innerHTML = `<span class="label">Rating:</span> ${result.rating}`;
          details.appendChild(ratingElement);
          ratingElement.style.textAlign = "left";
          ratingElement.style.margin = "0px";
          ratingElement.style.marginBottom = "7px";
        }
        details.appendChild(authorsElement);

        details.appendChild(publisherElemnt);
        details.appendChild(ISBNElemnet);
        details.appendChild(summaryElememnt);

        bookContainer.appendChild(imgElement);
        // bookContainer.appendChild(bookTitle);
        // bookContainer.appendChild(summaryElememnt);
        // bookContainer.appendChild(authorsElement);
        // bookContainer.appendChild(publisherElemnt);
        // bookContainer.appendChild(ISBNElemnet);

        bookContainer.appendChild(details);
        // bookContainer.appendChild(test);

        details.addEventListener("toggle", (event) => {
          if (event.newState === "open") {
            imgElement.classList.add("details-open");
          } else {
            imgElement.classList.remove("details-open");
          }
        });
        //this creates the x out button in the UI
        const closeButton = document.createElement("span");
        closeButton.innerHTML = "&times;";
        closeButton.classList.add("close-btn");
        closeButton.style.position = "relative";
        closeButton.style.top = "10px";
        closeButton.style.right = "30px";
        closeButton.style.cursor = "pointer";
        closeButton.style.fontSize = "20px";
        closeButton.style.fontWeight = "bold";

        closeButton.style.borderRadius = "4px";

        // Append close button to the bookContainer
        bookItem.appendChild(bookContainer);
        bookItem.appendChild(closeButton);

        document.getElementById("result-container").appendChild(bookItem);

        closeButton.addEventListener("click", function () {
          // Apply fade-out effect before removal
          bookItem.style.opacity = "0";
          bookItem.addEventListener("transitionend", () => bookItem.remove(), {
            once: true,
          });
        });

        // Use the setup function to associate the closeButton with the bookContainer
      });

      //below is the code for showing all the book covers

      // bookUrls.forEach((url) => {
      //   const imgElemnt = document.createElement("img");
      //   imgElemnt.src = url;
      //   imgElemnt.alt = "Book Cover";
      //   imgElemnt.style.width = "100px";
      //   imgElemnt.style.height = "auto";

      //   resultsContainer.appendChild(imgElemnt);
      // });

      result.forEach((bookrunItem) => {
        const dataLine = document.createElement("div");
        const prices =
          typeof bookrunItem[2] === "string"
            ? "Book has no value"
            : `Value is ${bookrunItem[2].Good}`;
        dataLine.innerText = `Name: ${bookrunItem[0]}, ISBN: ${bookrunItem[1]}, ${prices}`;
        resultsContainer.appendChild(dataLine);
      });

      // isbToPriceMapDisplay(isbToPriceMap ?? {});
    } else {
      console.log("failed to process image of OCR");
      alert(
        "Failed to process the OCR image. The page will refresh for another attempt."
      );
      // Refresh the page to allow the user to try again
      window.location.reload();
    }
  } else {
    alert("Invalid file type. Please drop an image file.");
  }
  function csvFormatter(data) {
    if (!Array.isArray(data)) {
      console.error("this cvs parser is throwing errors dawg", data);
      return "";
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "isbn\n";
    // console.log("isbn infor the foreach", isbnData);
    data.forEach((row) => {
      csvContent += row + "\n";
    });
    return csvContent;
  }

  function downloadCsvContent(content, filename = "isbn.csv") {
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    link.setAttribute("class", "downloadLink");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  let csvContentVariable = csvFormatter(isbnData);

  document
    .getElementById("downloadButton")
    .addEventListener("click", function () {
      downloadCsvContent(csvContentVariable);
    });

  function parseCSV(csvData) {
    let lines = csvData.split("\n");
    let headers = lines[0].split(",");
    let result = lines.slice(1).map((line) => {
      let obj = {};
      let currentline = line.split(",");
      headers.forEach((header, i) => {
        obj[header] = currentline[i];
      });
      return obj;
    });
    return result;
  }

  function displayFileData(csvData) {
    let parsedData = parseCSV(csvData);
    let container = document.createElement("div");
    let table = document.createElement("table");
    let tableHead = document.createElement("thead");
    let headerRow = document.createElement("tr");

    // Create the header row
    Object.keys(parsedData[0]).forEach((header) => {
      let headerCell = document.createElement("th");
      headerCell.textContent = header;
      headerCell.style.fontWeight = "bold"; // Make header text bold
      headerCell.style.borderBottom = "1px solid black"; // Add a line under the header
      headerRow.appendChild(headerCell);
    });
    tableHead.appendChild(headerRow);
    table.appendChild(tableHead);

    // Create the body of the table
    let tableBody = document.createElement("tbody");
    parsedData.forEach((row) => {
      let tableRow = document.createElement("tr");
      Object.values(row).forEach((text) => {
        let tableCell = document.createElement("td");
        tableCell.textContent = text;
        tableRow.appendChild(tableCell);
      });
      tableBody.appendChild(tableRow);
    });
    table.appendChild(tableBody);
    container.appendChild(table);
    document.body.appendChild(container); // Append to the body or a specific element
  }

  function fetchFileData() {
    //If I go back to my pupeteer code I will have to make maxAttempts go back to 1000.
    const maxAttempts = 1;
    let attempts = 0;

    function attemptFetch() {
      fetch("/getMostRecentFile")
        .then((response) => {
          if (!response.ok) {
            throw new Error("No file found");
          }
          return response.json();
        })
        .then(async (data) => {
          // console.log(
          //   "File data from the front end containing the CSV file:",
          //   // JSON.stringify(data.file.data)
          //   data
          // );
          displayFileData(data.file);
        })
        .catch((error) => {
          if (attempts++ < maxAttempts) {
            setTimeout(attemptFetch, 3000); // Wait for 2 seconds before trying again
          } else {
            console.error(
              "Error fetching file after multiple attempts:",
              error
            );
          }
        });
    }

    attemptFetch();
  }

  fetchFileData();
}

function isbToPriceMapDisplay(map) {
  const container = document.getElementById("isbnPriceContainer");
  container.innerHTML = "";

  for (const [isbn, price] of Object.entries(map)) {
    const item = document.createElement("div");
    item.innerText = `ISBN: ${isbn}, Price: ${price}`;
    container.appendChild(item);
  }
}

function handleDragOver(event) {
  event.preventDefault();
}

function updateImage(url) {
  image.url = url;
  document.getElementById("droppedImage").src = url;
  document.getElementById("imageMessage").innerText = image.message;
  document.getElementById("imagePreview").style.display = "block";
}

function toHTML(s) {
  return document.createRange().createContextualFragment(s);
}

function showHamsterAndDimBackground() {
  document.querySelector(".wheel-and-hamster").style.display = "block";
  // const loadingElement = document.createElement("h1");
  // loadingElement.innerHTML = "LOADING";
  // document.body.appendChild(loadingElement);
  document.querySelector(".dim-background").style.display = "block";
}

function hideHamsterAndRemoveDim() {
  document.querySelector(".wheel-and-hamster").style.display = "none";
  document.querySelector(".dim-background").style.display = "none";
}

function showCSVButtonAfterPhotoIsDroppedAndThereIsData() {
  document.getElementById("downloadButton").style.display = "block";
}

//below is my function for uploading a file

async function handleFileSelect(event) {
  const file = event.target.files[0];
  // console.log("Selected file:", file);
  showHamsterAndDimBackground();
  const elementToHide = document.querySelector(".arrow");
  // elementToHide.style.display = "none";

  if (file && file.type.match(/^image\//)) {
    updateImage(URL.createObjectURL(file));

    let formData = new FormData();
    formData.append("image", file);

    let response = await fetch("/detectLabels", {
      method: "POST",
      body: formData,
    });
    console.log("response data form backend: ", response);

    if (response.ok) {
      const {
        result,
        bookUrls,
        mappedImageAndSummary,
        pricePlaceHolder,
        arrayOfISBNs,
      } = await response.json();
      // console.log("This is my main object", result);
      // console.log("trying to get URLS here", bookUrls);
      // console.log("here are the mapped images", mappedImageAndSummary);
      // console.log(
      //   "here are the summarya",
      //   mappedImageAndSummary?.[0]?.summary ??
      //     "No summary availibe unfortunately"
      // );
      // console.log("this is the place holder", pricePlaceHolder);
      // console.log("these are the ISBNS", arrayOfISBNs);
      //console.log("this is ISBN", mappedImageAndSummary[0].ISBN[0].type);
      isbnData = arrayOfISBNs;
      // console.log(isbnData);
      hideHamsterAndRemoveDim();
      showCSVButtonAfterPhotoIsDroppedAndThereIsData();
      mappedImageAndSummary.forEach((result) => {
        const bookContainer = document.createElement("div");
        bookContainer.className = "book-container";
        // bookContainer.style.border = "1px solid black";
        bookContainer.className = "book-container";

        // This creates the title for the book in the UI
        const bookTitle = document.createElement("h2");
        bookTitle.innerHTML = result.title;
        bookTitle.style.textAlign = "left";
        bookTitle.style.backgroundColor = "red";
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = result.title;
        details.appendChild(summary);

        let authorsElement = document.createElement("p");
        authorsElement.innerHTML = `<span class="label"> Author: </span> ${
          result?.author?.[0] ?? ""
        }`;
        authorsElement.style.textAlign = "left";

        let publisherElemnt = document.createElement("p");
        publisherElemnt.style.textAlign = "left";
        publisherElemnt.style.marginBottom = "7px";
        publisherElemnt.innerHTML = `<span class="label">Publisher:</span> ${
          result?.publisher ?? ""
        }`;

        let ISBNElemnet = document.createElement("p");
        ISBNElemnet.innerHTML = `<span class="label">ISBN number:</span> ${
          result.ISBN?.[0]?.identifier ?? ""
        }`;
        ISBNElemnet.style.textAlign = "left";
        ISBNElemnet.style.margin = "0px";

        const summaryElememnt = document.createElement("p");
        const imgElement = document.createElement("img"); // Create an actual img element
        imgElement.src = result.imageUrl; // Set the source of the image element
        summaryElememnt.style.margin = "0px";
        summaryElememnt.style.marginLeft = "0px";
        summaryElememnt.style.top = "28px";
        summaryElememnt.style.textAlign = "left";

        imgElement.alt = ` `;
        imgElement.classList.add("book-container-img");
        // imgElement.style.width = "100px";
        // imgElement.style.height = "auto";

        summaryElememnt.innerHTML = result.summary;
        // const test = toHTML(
        //   `<div>
        //      <dl>
        //         <dt class= "title"> Title </dt>  <dd> ${result.title} </dd>

        //           <dt> ISBN </dt>
        //           <dd> ${result.ISBN[0].identifier} </dd>
        //     </dl>
        //        <p>
        //           <a href="https://developer.mozilla.org/en-US/docs/Web/API/range/createContextualFragment">
        //               Hello <strong>World!</strong>
        //           </a>
        //        </p>

        //   </div>`
        // );
        if (result.rating) {
          let ratingElement = document.createElement("p");
          ratingElement.innerHTML = `<span class="label">Rating:</span> ${result.rating}`;
          details.appendChild(ratingElement);
          ratingElement.style.textAlign = "left";
        }
        details.appendChild(authorsElement);

        details.appendChild(publisherElemnt);
        details.appendChild(ISBNElemnet);
        details.appendChild(summaryElememnt);

        bookContainer.appendChild(imgElement);
        // bookContainer.appendChild(bookTitle);
        // bookContainer.appendChild(summaryElememnt);
        // bookContainer.appendChild(authorsElement);
        // bookContainer.appendChild(publisherElemnt);
        // bookContainer.appendChild(ISBNElemnet);

        bookContainer.appendChild(details);
        // bookContainer.appendChild(test);

        resultsContainer.appendChild(bookContainer);

        details.addEventListener("toggle", (event) => {
          if (event.newState === "open") {
            imgElement.classList.add("details-open");
          } else {
            imgElement.classList.remove("details-open");
          }
        });
      });

      //below is the code for showing all the book covers

      // bookUrls.forEach((url) => {
      //   const imgElemnt = document.createElement("img");
      //   imgElemnt.src = url;
      //   imgElemnt.alt = "Book Cover";
      //   imgElemnt.style.width = "100px";
      //   imgElemnt.style.height = "auto";

      //   resultsContainer.appendChild(imgElemnt);
      // });

      result.forEach((bookrunItem) => {
        const dataLine = document.createElement("div");
        const prices =
          typeof bookrunItem[2] === "string"
            ? "Book has no value"
            : `Value is ${bookrunItem[2].Good}`;
        dataLine.innerText = `Name: ${bookrunItem[0]}, ISBN: ${bookrunItem[1]}, ${prices}`;
        resultsContainer.appendChild(dataLine);
      });

      // isbToPriceMapDisplay(isbToPriceMap ?? {});
    } else {
      console.log("failed to process image of OCR");
    }

    //processFile(file);
  } else {
    alert(
      "Invalid file type. Please select an image file so we can see those books."
    );
  }
}

//below is the code for drag hover effect for the upload section

document.addEventListener("DOMContentLoaded", function () {
  // Other initialization code here

  const dropArea = document.getElementById("drop-area-javascript");

  // Set up drag and drop listeners
  dropArea.addEventListener("dragenter", function (event) {
    dropArea.classList.add("drag-hover");
  });

  dropArea.addEventListener("dragleave", function (event) {
    dropArea.classList.remove("drag-hover");
  });

  dropArea.addEventListener("drop", function (event) {
    // Handle the drop event
    dropArea.classList.remove("drag-hover");
    // ... other drop handling code ...
  });

  // Any other code that needs to run after the DOM is fully loaded
});

//tranisition for the book container animarion

// const books = document.querySelectorAll(".book-container");

// books.forEach((book, i) => {
//   setTimeout(() => {
//     book.style.opacity = 1;
//   }, 200 * i);
// });

// document.addEventListener("DOMContentLoaded", function () {
//   const dropArea = document.querySelector(".drop-area"); // Target the drop-area class
//   const topLeftArrow = document.getElementById("top-left");
//   const topRightArrow = document.getElementById("top-right");
//   const bottomLeftArrow = document.getElementById("bottom-left");
//   const bottomRightArrow = document.getElementById("bottom-right");

//   // Animation for hovering over the drop area
//   dropArea.addEventListener("mouseenter", () => {
//     anime({
//       targets: topLeftArrow,
//       translateX: 6,
//       translateY: 6,
//       duration: 300,
//       easing: "easeInOutQuad",
//     });
//     anime({
//       targets: topRightArrow,
//       translateX: -6,
//       translateY: 6,
//       duration: 300,
//       easing: "easeInOutQuad",
//     });
//     anime({
//       targets: bottomLeftArrow,
//       translateX: 6,
//       translateY: -6,
//       duration: 300,
//       easing: "easeInOutQuad",
//     });
//     anime({
//       targets: bottomRightArrow,
//       translateX: -6,
//       translateY: -6,
//       duration: 300,
//       easing: "easeInOutQuad",
//     });
//   });

//   // Reset animation when not hovering
//   dropArea.addEventListener("mouseleave", () => {
//     anime({
//       targets: [topLeftArrow, bottomLeftArrow],
//       translateX: 0,
//       translateY: 0,
//       duration: 500,
//       easing: "easeInOutQuad",
//     });
//     anime({
//       targets: [topRightArrow, bottomRightArrow],
//       translateX: 0,
//       translateY: 0,
//       duration: 500,
//       easing: "easeInOutQuad",
//     });
//   });
// });
