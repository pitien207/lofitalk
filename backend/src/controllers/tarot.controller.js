import "dotenv/config";

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
    req.user.energy = ENERGY_COST;
    req.user.lastEnergyRefill = new Date();
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
    const { questions, cards } = req.body || {};

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

    const system =
      "You are an insightful but grounded tarot reader. Offer practical, positive guidance without superstition.";

    const fmt = (c) => {
      if (!c) return "";
      if (typeof c === "string") return c;
      const name = c?.name || "";
      const reversed = c?.reversed ? " (reversed)" : "";
      return `${name}${reversed}`;
    };

    const userPrompt = `Create a tarot reading for these 3 questions and 3 drawn cards.
Questions:
1) ${questions[0]}
2) ${questions[1]}
3) ${questions[2]}

Cards (order matches the questions):
1) ${fmt(cards[0])}
2) ${fmt(cards[1])}
3) ${fmt(cards[2])}

Return a compact JSON object with this shape:
{
  "readings": [
    {"question": string, "card": string, "message": string, "advice": string},
    {"question": string, "card": string, "message": string, "advice": string},
    {"question": string, "card": string, "message": string, "advice": string}
  ],
  "overall_message": string
}
Messages should be 2-4 sentences each, actionable and encouraging. If a card is marked as reversed, reflect its reversed meaning in the interpretation.`;

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
      questions,
      cards,
      result: parsed,
      createdAt: new Date(),
    };
    await req.user.save();

    res.status(200).json({ success: true, result: parsed });
  } catch (error) {
    console.error("Error in getTarotReading:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
