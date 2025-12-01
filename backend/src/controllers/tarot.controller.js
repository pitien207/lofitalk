import "dotenv/config";
import { incrementUsageCounter } from "../services/usageStats.service.js";

const ENERGY_COST = 7;

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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ message: "Missing OPENAI_API_KEY on server" });
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

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res
        .status(500)
        .json({ message: "OpenAI request failed", detail: text });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
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
