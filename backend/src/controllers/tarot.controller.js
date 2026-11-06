import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { incrementUsageCounter } from "../services/usageStats.service.js";
import { TAROT_ENERGY_COST as ENERGY_COST } from "../lib/energy.js";

const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-5-5";
const TAROT_UNAVAILABLE_MESSAGE =
  "Tính năng xem Tarot tạm thời không khả dụng. Vui lòng thử lại sau.";

// Same shape the frontend already renders: 3 readings + an overall message.
const TAROT_RESULT_SCHEMA = {
  type: "object",
  properties: {
    readings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          card: { type: "string" },
          message: { type: "string" },
          advice: { type: "string" },
        },
        required: ["question", "card", "message", "advice"],
        additionalProperties: false,
      },
    },
    overall_message: { type: "string" },
  },
  required: ["readings", "overall_message"],
  additionalProperties: false,
};

let anthropicClient = null;

// Created lazily so the server still boots (and other features work) without a key.
const getAnthropicClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
};

const logAnthropicError = (error) => {
  if (error instanceof Anthropic.APIError) {
    console.error(
      `Anthropic API error ${error.status ?? "(no status)"}:`,
      error.message
    );
  } else {
    console.error("Anthropic request failed:", error);
  }
};

export function getEnergyStatus(req, res) {
  res.status(200).json({
    energy: req.user.energy,
    max: ENERGY_COST,
    lastRefill: req.user.lastEnergyRefill,
  });
}

export async function consumeTarotEnergy(req, res) {
  try {
    if (req.user.energy < ENERGY_COST) {
      return res.status(400).json({
        message: `Bạn cần ${ENERGY_COST} năng lượng để bốc bài.`,
      });
    }

    req.user.energy = 0;
    req.user.lastEnergyRefill = new Date();
    await req.user.save();

    res.status(200).json({
      success: true,
      energy: req.user.energy,
      max: ENERGY_COST,
      lastRefill: req.user.lastEnergyRefill,
    });
  } catch (error) {
    console.error("Error in consumeTarotEnergy:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function refillTarotEnergy(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastRefill = req.user.lastEnergyRefill
      ? new Date(req.user.lastEnergyRefill)
      : null;
    if (lastRefill) lastRefill.setHours(0, 0, 0, 0);

    const alreadyRefilledToday =
      lastRefill && lastRefill.getTime() === today.getTime();

    if (alreadyRefilledToday && req.user.energy >= ENERGY_COST) {
      return res
        .status(429)
        .json({ message: "Energy already full for today." });
    }

    req.user.energy = ENERGY_COST;
    req.user.lastEnergyRefill = today;
    await req.user.save();

    res.status(200).json({
      success: true,
      energy: req.user.energy,
      max: ENERGY_COST,
      lastRefill: req.user.lastEnergyRefill,
    });
  } catch (error) {
    console.error("Error in refillTarotEnergy:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function getLastTarotReading(req, res) {
  res.status(200).json({
    success: true,
    reading: req.user.lastTarotReading ?? null,
  });
}

export async function clearLastTarotReading(req, res) {
  try {
    req.user.lastTarotReading = undefined;
    await req.user.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in clearLastTarotReading:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getTarotReading(req, res) {
  try {
    const { currentSituation, questions, cards } = req.body || {};

    if (
      !currentSituation ||
      typeof currentSituation !== "string" ||
      !currentSituation.trim()
    ) {
      return res
        .status(400)
        .json({ message: "Please describe your current situation." });
    }

    if (!Array.isArray(questions) || questions.length !== 3) {
      return res.status(400).json({
        message: "Please provide exactly 3 questions as an array.",
      });
    }

    if (!Array.isArray(cards) || cards.length !== 3) {
      return res.status(400).json({
        message: "Please provide exactly 3 selected cards as an array.",
      });
    }

    const client = getAnthropicClient();
    if (!client) {
      console.error("Tarot reading requested but ANTHROPIC_API_KEY is not set");
      return res.status(503).json({ message: TAROT_UNAVAILABLE_MESSAGE });
    }

    const trimmedSituation = currentSituation.trim();

    const system =
      "Bạn là một Tarot reader thấu hiểu nhưng thực tế. Luôn trả lời BẰNG TIẾNG VIỆT, đưa ra lời khuyên rõ ràng và không ba phải.";

    const fmt = (c) => {
      if (!c) return "";
      if (typeof c === "string") return c;
      const name = c?.name || "";
      const reversed = c?.reversed ? " (reversed)" : "";
      return `${name}${reversed}`;
    };

    const userPrompt = `Bối cảnh hiện tại của người hỏi: "${trimmedSituation}"

Hãy phân tích 3 câu hỏi và 3 lá bài tương ứng bên dưới để đưa ra lời khuyên gắn với hoàn cảnh này.

Câu hỏi:
1) ${questions[0]}
2) ${questions[1]}
3) ${questions[2]}

Lá bài đã rút (theo thứ tự câu hỏi):
1) ${fmt(cards[0])}
2) ${fmt(cards[1])}
3) ${fmt(cards[2])}

Luôn trả lời hoàn toàn bằng tiếng Việt.
Trả về JSON với cấu trúc:
{
  "readings": [
    {"question": string, "card": string, "message": string, "advice": string},
    {"question": string, "card": string, "message": string, "advice": string},
    {"question": string, "card": string, "message": string, "advice": string}
  ],
  "overall_message": string
}
Message cho mỗi lá 2-5 câu, phân tích rõ vấn đề, dù tiêu cực hay tích cực. Nếu lá bài đảo chiều (reversed) hãy diễn giải theo nghĩa đảo chiều.`;

    let response;
    try {
      response = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
        max_tokens: 16000,
        system,
        messages: [{ role: "user", content: userPrompt }],
        output_config: {
          format: { type: "json_schema", schema: TAROT_RESULT_SCHEMA },
        },
      });
    } catch (error) {
      logAnthropicError(error);
      return res.status(502).json({ message: TAROT_UNAVAILABLE_MESSAGE });
    }

    if (response.stop_reason === "refusal") {
      console.error(
        "Anthropic declined the tarot request:",
        response.stop_details?.category ?? "unknown category"
      );
      return res.status(502).json({ message: TAROT_UNAVAILABLE_MESSAGE });
    }

    const content = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error(
        `Tarot response was not valid JSON (stop_reason: ${response.stop_reason})`
      );
      parsed = { raw: content };
    }

    req.user.lastTarotReading = {
      currentSituation: trimmedSituation,
      questions,
      cards,
      result: parsed,
      createdAt: new Date(),
    };
    await req.user.save();

    try {
      await incrementUsageCounter("tarot");
    } catch (statsError) {
      console.error("Failed to track tarot usage", statsError);
    }

    res.status(200).json({ success: true, result: parsed });
  } catch (error) {
    console.error("Error in getTarotReading:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
