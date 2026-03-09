import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

if (!connectionString) {
  throw new Error("Missing DATABASE_URL.");
}

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY.");
}

const endpoint =
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

function formatBathroomType(type) {
  switch (type) {
    case "accessible":
      return "Accessible";
    case "female":
      return "Female";
    case "male":
      return "Male";
    default:
      return "Gender Neutral";
  }
}

function buildPrompt(bathroom, reviews) {
  return [
    "Summarize the following restroom reviews in 1-2 sentences.",
    "Keep it concise, factual, and grounded only in the reviews.",
    "Mention overall sentiment and practical details only if the reviews support them.",
    "Do not mention usernames, ratings counts, or speculate beyond the reviews.",
    "",
    `Restroom: ${bathroom.name}`,
    `Building: ${bathroom.building}`,
    `Floor: ${bathroom.floor}`,
    `Type: ${formatBathroomType(bathroom.type)}`,
    "",
    ...reviews.map((review, index) => {
      const description =
        typeof review.description === "string" && review.description.trim().length > 0
          ? review.description.trim()
          : "No written comment.";

      return `Review ${index + 1}: ${review.rating}/5. ${description}`;
    }),
  ].join("\n");
}

function extractSummary(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];

  return parts
    .map((part) => part?.text ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

const pool = new Pool({ connectionString });

try {
  const { rows: bathrooms } = await pool.query(`
    SELECT
      b.id,
      b.name,
      b.building,
      b.floor,
      b.type
    FROM "Bathroom" b
    JOIN "Review" r ON r.bathroom_id = b.id
    GROUP BY b.id, b.name, b.building, b.floor, b.type
    HAVING COUNT(r.id) >= 2
    ORDER BY COUNT(r.id) DESC, b.name ASC
  `);

  for (const bathroom of bathrooms) {
    const { rows: reviews } = await pool.query(
      `
        SELECT rating, description
        FROM "Review"
        WHERE bathroom_id = $1
        ORDER BY created_at DESC
      `,
      [bathroom.id],
    );

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(bathroom, reviews) }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 90,
          responseMimeType: "text/plain",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Gemini failed for ${bathroom.name}: ${response.status} ${await response.text()}`,
      );
    }

    const payload = await response.json();
    const summary = extractSummary(payload);

    await pool.query(
      `
        UPDATE "Bathroom"
        SET
          "reviewSummary" = $1,
          "reviewSummaryReviewCount" = $2,
          "reviewSummaryUpdatedAt" = NOW()
        WHERE id = $3
      `,
      [summary || null, reviews.length, bathroom.id],
    );

    console.log(`${bathroom.name}: ${summary}`);
  }
} finally {
  await pool.end();
}
