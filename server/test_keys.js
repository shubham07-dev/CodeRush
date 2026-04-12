import { GoogleGenerativeAI } from '@google/generative-ai';

const keys = [
  "AIzaSyCRUhUML8Rr_5dxs_YAop-D1T97xP-1ohA",
  "AIzaSyBgziUcPRRK2LYsVsuWakJyQIB_YVN2O_I",
  "AIzaSyD_OGfY9SkipMRTzSlJBWtZWew6vcno7K0",
  "AIzaSyA7zYjxPLMeSRl8qFPhnnwFDd4LFt6d42c"
];

async function testKeys() {
  for (let i = 0; i < keys.length; i++) {
    console.log(`Testing key ${i + 1}...`);
    try {
      const genAI = new GoogleGenerativeAI(keys[i]);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
      const res = await model.generateContent("Say hi");
      console.log(`Key ${i+1} Success! Output:`, res.response.text());
    } catch(err) {
      console.error(`Key ${i+1} Failed:`, err.status, err.message);
    }
  }
}

testKeys();
