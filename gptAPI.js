import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config(); // TODO: remove after importing this file into express
const openai = new OpenAI({
  apiKey: process.env.CHAT_GPT_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

async function main() {
  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: `Please parse the following text from google OCR, into json format,  for likely book titles so the titles can be easily sent to another API for further processing: 8
        8
ty
PREDICTABLY IRRATIONAL
The Hidden Forces That Shape Our Decisions
the personal MBA
Josh
Kaufman master the art of business
HOL
Bronze Age Mindset
NO
PORTFOLIO
PENGUIN
Bronze Pervert
supl
ARIELY
نان ل
0
180
H
HARPER
be
0
`,
      },
    ],
    stream: true,
  });
  for await (const part of stream) {
    process.stdout.write(part.choices[0]?.delta?.content || "");
  }
}

main();
