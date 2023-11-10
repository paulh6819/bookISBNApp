let image = {
  url: null,
  message: "Let's see what these books are worth",
};
const resultsContainer = document.getElementById("result-container");

async function handleDrop(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  console.log("Dropped file:", file);

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
      const { result, bookUrls, mappedImageAndSummary, pricePlaceHolder } =
        await response.json();
      console.log("THIS IS OCR DATA", result);
      console.log("trying to get URLS here", bookUrls);
      console.log("here are the mapped images", mappedImageAndSummary);
      console.log("here are the summarya", mappedImageAndSummary[0].summary);
      console.log("this is the place holder", pricePlaceHolder);
      //console.log("this is ISBN", mappedImageAndSummary[0].ISBN[0].type);

      mappedImageAndSummary.forEach((result) => {
        const bookContainer = document.createElement("div");
        bookContainer.className = "book-container";
        bookContainer.style.border = "1px solid black";

        // This creates the title for the book in the UI
        const bookTitle = document.createElement("h2");
        bookTitle.innerText = result.title;

        // Create an image element for the book cover
        const imgElement = document.createElement("img"); // Create an actual img element
        imgElement.src = result.imageUrl; // Set the source of the image element
        imgElement.alt = `Cover of the book ${result.title}`;
        imgElement.style.width = "100px";
        imgElement.style.height = "auto";

        let authorsElement = document.createElement("h4");
        authorsElement.innerText = `Author:${result.author[0]}`;

        let publisherElemnt = document.createElement("h4");
        publisherElemnt.innerText = `Publisher: ${result.publisher}`;

        let ISBNElemnet = document.createElement("h4");
        ISBNElemnet.innerText = `ISBN number ${result.ISBN[0].identifier}`;

        const summaryElememnt = document.createElement("p");
        summaryElememnt.innerText = result.summary;
        const test = toHTML(
          `<div>
             <dl>
                <dt class= "title"> Title </dt>
                  <dd> ${result.title} </dd>
                  <dt> ISBN </dt>
                  <dd> ${result.ISBN[0].identifier} </dd>
            </dl>
               <p>
                  <a href="https://developer.mozilla.org/en-US/docs/Web/API/range/createContextualFragment">
                      Hello <strong>World!</strong>
                  </a>
               </p>
               
          </div>`
        );

        bookContainer.appendChild(imgElement);
        bookContainer.appendChild(bookTitle);
        bookContainer.appendChild(summaryElememnt);
        bookContainer.appendChild(authorsElement);
        bookContainer.appendChild(publisherElemnt);
        bookContainer.appendChild(ISBNElemnet);
        bookContainer.appendChild(test);
        if (result.rating) {
          let ratingElement = document.createElement("h4");
          ratingElement.innerText = `Rating: ${result.rating}`;
          bookContainer.appendChild(ratingElement);
        }

        resultsContainer.appendChild(bookContainer);
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

      isbToPriceMapDisplay(isbToPriceMap);
    } else {
      console.log("failed to process image of OCR");
    }
  } else {
    alert("Invalid file type. Please drop an image file.");
  }
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
