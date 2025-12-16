import { ChatOpenAI } from "@langchain/openai";
import {
  CommaSeparatedListOutputParser,
  StringOutputParser,
  JsonOutputParser,
} from "@langchain/core/output_parsers";

// ぱさー
export const strParser = new StringOutputParser();
export const listParser = new CommaSeparatedListOutputParser();
export const jsonParser = new JsonOutputParser();

// opebAIモデル（4o）
export const OpenAi4o = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o",
  temperature: 0.2,
  cache: true,
});

// opebAIモデル（4.1）
export const OpenAi41 = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4.1",
  cache: true,
});