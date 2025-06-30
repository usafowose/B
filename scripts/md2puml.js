#!/usr/bin/env node

/**
 * md2puml: Generate PlantUML flow diagrams (.puml) from Markdown specs using OpenAI v4+
 *
 * Usage:
 *   $ md2puml -f docs/spec.md -o docs/diagram.puml
 *
 * Requirements:
 *   - Node.js v14+
 *   - An OpenAI API key in the environment: export OPENAI_API_KEY="YOUR_KEY"
 *
 * Install dependencies:
 *   npm install openai commander
 */
import "dotenv/config";

import fs from "fs";
import { Command } from "commander";
import OpenAI from "openai";

const program = new Command();

program
  .name("md2puml")
  .description("Generate a PlantUML flow diagram (.puml) from a Markdown spec")
  .requiredOption("-f, --file <path>", "Path to the Markdown file")
  .option("-o, --output <path>", "Output .puml file", "diagram.puml");

program.parse(process.argv);
const { file, output } = program.opts();

/**
 * Extract the "## Primary Flows" section or fallback to full doc
 */
function extractFlowsSection(markdown) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((l) => l.trim() === "## Primary Flows");
  if (start < 0) return markdown;
  const endOffset = lines
    .slice(start + 1)
    .findIndex((l) => l.startsWith("## "));
  const end = endOffset >= 0 ? start + 1 + endOffset : lines.length;
  return lines.slice(start, end).join("\n");
}

async function generatePUML(markdown) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `Generate a PlantUML flow diagram in .puml syntax that represents the primary flows and data objects from the following Markdown:

${markdown}

Provide only the .puml code.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return response.choices[0].message.content.trim();
}

(async () => {
  try {
    const fullMd = fs.readFileSync(file, "utf-8");
    const targetMd = extractFlowsSection(fullMd);
    const puml = await generatePUML(targetMd);
    fs.writeFileSync(output, puml);
    console.log(`✅ Flow diagram written to ${output}`);
  } catch (err) {
    console.error("❌ Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
