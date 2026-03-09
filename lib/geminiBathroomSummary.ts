const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const MIN_REVIEWS_FOR_AI_SUMMARY = 2;

interface ReviewSummaryInput {
  bathroomName: string;
  building: string;
  floor: number;
  typeLabel: string;
  reviews: Array<{
    rating: number;
    description: string;
  }>;
}

function extractCandidateText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const candidates = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  const parts = candidates?.[0]?.content?.parts ?? [];

  return parts
    .map((part) => part.text ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPrompt(input: ReviewSummaryInput): string {
  const reviewLines = input.reviews
    .map((review, index) => {
      const description =
        review.description.trim().length > 0
          ? review.description.trim()
          : "No written comment.";

      return `Review ${index + 1}: ${review.rating}/5. ${description}`;
    })
    .join("\n");

  return [
    "Summarize the following restroom reviews in 1-2 sentences.",
    "Keep it concise, factual, and grounded only in the reviews.",
    "Mention overall sentiment and practical details only if the reviews support them.",
    "Do not mention usernames, ratings counts, or speculate beyond the reviews.",
    "",
    `Restroom: ${input.bathroomName}`,
    `Building: ${input.building}`,
    `Floor: ${input.floor}`,
    `Type: ${input.typeLabel}`,
    "",
    reviewLines,
  ].join("\n");
}

export async function generateBathroomSummary(
  input: ReviewSummaryInput,
): Promise<string | null> {
  if (!GEMINI_API_KEY || input.reviews.length < MIN_REVIEWS_FOR_AI_SUMMARY) {
    return null;
  }

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(input) }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 90,
        responseMimeType: "text/plain",
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Gemini summary request failed with ${response.status}.`);
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  const summary = extractCandidateText(payload);

  return summary.length > 0 ? summary : null;
}
