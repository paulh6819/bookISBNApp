//import { download } from "express/lib/response";

let image = {
  url: null,
  message: "Let's see what these books are worth",
};
const resultsContainer = document.getElementById("result-container");
console.log("hey");
let isbnData;
async function handleDrop(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  console.log("Dropped file:", file);
  showHamsterAndDimBackground();

  if (file && file.type.match(/^image\//)) {
    updateImage(URL.createObjectURL(file));

    let formData = new FormData();
    formData.append("image", file);

    let response = await fetch("http://localhost:4006/detectLabels", {
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
      console.log("This is my main object", result);
      console.log("trying to get URLS here", bookUrls);
      console.log("here are the mapped images", mappedImageAndSummary);
      // console.log(
      //   "here are the summarya",
      //   mappedImageAndSummary?.[0]?.summary ??
      //     "No summary availibe unfortunately"
      // );
      console.log("this is the place holder", pricePlaceHolder);
      console.log("these are the ISBNS", arrayOfISBNs);
      //console.log("this is ISBN", mappedImageAndSummary[0].ISBN[0].type);
      isbnData = arrayOfISBNs;
      console.log(isbnData);
      hideHamsterAndRemoveDim();
      showCSVButtonAfterPhotoIsDroppedAndThereIsData();
      mappedImageAndSummary.forEach((result) => {
        const bookContainer = document.createElement("div");
        bookContainer.className = "book-container";
        bookContainer.style.border = "1px solid black";
        bookContainer.className = "book-container";

        // This creates the title for the book in the UI
        const bookTitle = document.createElement("h2");
        bookTitle.innerHTML = result.title;

        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = result.title;
        details.appendChild(summary);

        let authorsElement = document.createElement("h4");
        authorsElement.innerHTML = `<span class="label"> Author: </span> ${
          result?.author?.[0] ?? ""
        }`;

        let publisherElemnt = document.createElement("h4");
        publisherElemnt.innerHTML = `<span class="label">Publisher:</span> ${
          result?.publisher ?? ""
        }`;

        let ISBNElemnet = document.createElement("h4");
        ISBNElemnet.innerHTML = `<span class="label">ISBN number:</span> ${
          result.ISBN?.[0]?.identifier ?? ""
        }`;

        const summaryElememnt = document.createElement("p");
        const imgElement = document.createElement("img"); // Create an actual img element
        imgElement.src = result.imageUrl; // Set the source of the image element

        imgElement.alt = `Cover of the book ${result.title}`;
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

        details.appendChild(authorsElement);
        details.appendChild(summaryElememnt);
        details.appendChild(publisherElemnt);
        details.appendChild(ISBNElemnet);

        bookContainer.appendChild(imgElement);
        // bookContainer.appendChild(bookTitle);
        // bookContainer.appendChild(summaryElememnt);
        // bookContainer.appendChild(authorsElement);
        // bookContainer.appendChild(publisherElemnt);
        // bookContainer.appendChild(ISBNElemnet);

        bookContainer.appendChild(details);
        // bookContainer.appendChild(test);
        if (result.rating) {
          let ratingElement = document.createElement("h4");
          ratingElement.innerHTML = `<span class="label">Rating:</span> ${result.rating}`;
          details.appendChild(ratingElement);
        }

        resultsContainer.appendChild(bookContainer);

        details.addEventListener("toggle", (event) => {
          if (event.newState === "open") {
            imgElement.classList.add("details-open");
          } else {
            imgElement.classList.remove("details-open");
          }
        });
      });

      bookUrls.forEach((url) => {
        const imgElemnt = document.createElement("img");
        imgElemnt.src = url;
        imgElemnt.alt = "Book Cover";
        imgElemnt.style.width = "100px";
        imgElemnt.style.height = "auto";

        resultsContainer.appendChild(imgElemnt);
      });

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
  } else {
    alert("Invalid file type. Please drop an image file.");
  }
  function csvFormatter(data) {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "isbn\n";
    console.log("isbn infor the foreach", isbnData);
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

function handleFileSelect(event) {
  const file = event.target.files[0];
  console.log("Selected file:", file);

  if (file && file.type.match(/^image\//)) {
    updateImage(URL.createObjectURL(file));
    alert("TRICKED YOU!!! Just hacked all your data 😂😂😂 - Paul Henderson");
  } else {
    alert("Invalid file type. Please select an image file.");
  }
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
