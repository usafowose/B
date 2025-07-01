#!/usr/bin/env node

/**
 * md2puml: Generate PlantUML diagrams (.puml) from Markdown specs using OpenAI v4+
 *
 * Usage:
 *   $ md2puml -f docs/spec.md -o docs/diagram.puml
 *
 * Requirements:
 *   - Node.js v14+
 *   - An OpenAI API key in the environment: export OPENAI_API_KEY="YOUR_KEY"
 *
 * Install dependencies:
 *   npm install openai commander dotenv
 */

import "dotenv/config";
import fs from "fs";
import { Command } from "commander";
import OpenAI from "openai";

const program = new Command();

program
  .name("md2puml")
  .description(
    "Generate a PlantUML diagram (.puml) from a Markdown spec including data model and primary flows"
  )
  .requiredOption("-f, --file <path>", "Path to the Markdown file")
  .option("-o, --output <path>", "Output .puml file", "diagram.puml");

program.parse(process.argv);
const { file, output } = program.opts();

/**
 * Extract a section by its H2 title (e.g. "## Data Model & Persistence" or "## Primary Flows")
 */
function extractSection(markdown, sectionTitle) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${sectionTitle}`);
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  const endOffset = rest.findIndex((line) => line.startsWith("## "));
  const end = endOffset >= 0 ? start + 1 + endOffset : lines.length;
  return lines.slice(start, end).join("\n");
}

async function generatePUML(markdown) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `
Generate a PlantUML diagram in .puml syntax that represents the data model and primary flows described in this Markdown:

${markdown}

Provide only the .puml code.
`.trim();

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
    const dataModelSection = extractSection(fullMd, "Data Model & Persistence");
    const flowsSection = extractSection(fullMd, "Primary Flows");
    const combinedMd = [dataModelSection, flowsSection]
      .filter(Boolean)
      .join("\n\n");

    if (!combinedMd) {
      console.error(
        "❌ Error: Unable to find 'Data Model & Persistence' or 'Primary Flows' sections in the spec."
      );
      process.exit(1);
    }

    const puml = await generatePUML(combinedMd);
    fs.writeFileSync(output, puml);
    console.log(`✅ Flow diagram written to ${output}`);
  } catch (err) {
    console.error("❌ Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
