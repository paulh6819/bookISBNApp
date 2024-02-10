const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const fs = require("fs");
const app = express();
const upload = multer({ dest: "uploads/" });
console.log("this is just to see if the page works");
app.post("/new-backend-endpoint", upload.single("image"), async (req, res) => {
  const imagePath = req.file.path;
  console.log(imagePath, "this is the image path");
  const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
  console.log(imageBase64, "this is the image based 64 from the frontend");
  // Assuming the API accepts direct base64 encoded images in the payload,
  // but adjusting since the provided documentation doesn't specify how.
  // You may need to refer to the OpenAI documentation for the exact field structure.
  const headers = {
    Authorization: `Bearer ${process.env.CHAT_GPT_API_KEY}`,
    "Content-Type": "application/json",
  };

  const payload = {
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: "What are the titles of the books in this image?",
      },
      {
        // This assumes the API can accept a base64 encoded image directly,
        // adjust according to the actual API documentation.
        role: "system",
        data: {
          image_base64: imageBase64,
        },
      },
    ],
    max_tokens: 300,
  };

  try {
    const visionResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      }
    );

    const visionData = await visionResponse.json();

    console.log(visionData, "this is the vision data"); // Log the response data for debugging
    res.json(visionData); // Send the response back to the client
  } catch (error) {
    console.error("Error calling GPT-4 with Vision API:", error);
    res.status(500).send("Failed to process image with GPT-4.");
  } finally {
    // Optionally, clean up the uploaded file
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Error deleting uploaded file:", err);
      else console.log("Uploaded file deleted.");
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
