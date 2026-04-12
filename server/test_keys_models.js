import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const keys = process.env.GEMINI_API_KEYS.split(',').filter(Boolean);
const modelsToTry = [
  "gemini-2.5-flash", // Just to see if newer model exists implicitly
  "gemini-2.0-flash", // main target
  "gemini-2.0-flash-lite-preview-02-05", // extremely fast/cheap
  "gemini-1.5-flash", // fallback
  "gemini-1.5-flash-8b", // lowest flash
  "gemini-1.5-pro" // very conservative usage
];

async function testMatrix() {
  console.log(`Starting matrix test: ${modelsToTry.length} models x ${keys.length} keys`);
  let foundWorkingCombo = false;

  for (const modelName of modelsToTry) {
    console.log(`\n--- Testing Model: ${modelName} ---`);
    for (let i = 0; i < keys.length; i++) {
      try {
        const genAI = new GoogleGenerativeAI(keys[i]);
        const model = genAI.getGenerativeModel({ model: modelName });
        const res = await model.generateContent("Say 'hello test'");
        console.log(`✅ SUCCESS! Model: ${modelName} | Key Index: ${i+1} | Result: ${res.response.text()}`);
        foundWorkingCombo = true;
        // Don't break, keep testing to see ALL working combos!
      } catch (err) {
        console.error(`❌ FAILED! Model: ${modelName} | Key Index: ${i+1} | Error: ${err.status || err.message}`);
      }
    }
  }

  if (!foundWorkingCombo) {
    console.log("\n❌ NO WORKING COMBINATIONS FOUND.");
  } else {
    console.log("\n✅ Test complete. Working keys found!");
  }
}

testMatrix();
