import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  try {
    console.log("Testing Transformers...");
    const { pipeline } = await import('@xenova/transformers');
    const embedPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const output = await embedPipeline("test", { pooling: 'mean', normalize: true });
    console.log("Embeddings Array generated!", Array.from(output.data).length);
    
    console.log("Testing Gemini API...");
    const genAI = new GoogleGenerativeAI("AIzaSyCRUhUML8Rr_5dxs_YAop-D1T97xP-1ohA");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const res = await model.generateContent("Say 'hi'");
    console.log("Gemini Output:", res.response.text());
  } catch(e) {
    console.error("Test Failed!", e);
  }
}

test();
