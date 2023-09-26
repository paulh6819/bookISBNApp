let image = {
  url: null,
  message: "Let's see what these books are worth",
};

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

    if (response.ok) {
      let OCRdata = await response.json();
      console.log("THIS IS OCR DATA", OCRdata);

      document.getElementById("imageMessage").innerText = data.text;

      const isbToPriceMap = data.isbToPriceMap;

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
