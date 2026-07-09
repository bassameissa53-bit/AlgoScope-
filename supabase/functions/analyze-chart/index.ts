import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ANALYSIS_PROMPT = `You are an expert financial market technical analyst specializing in price action and market structure analysis. Analyze the provided chart image and generate trading signals.

Your analysis methodology focuses on:
1. Market Structure Analysis - Identify higher highs, higher lows, lower highs, lower lows
2. Key Support and Resistance Levels
3. Liquidity Zones - Areas where stop losses are likely clustered
4. Fair Value Gaps - Imbalances in price that tend to get filled
5. Order Flow - Direction of smart money
6. Trend Direction and Strength

Based on your analysis, provide:
1. Direction: BUY or SELL (choose one definitively)
2. Entry Price: The optimal entry point
3. Stop Loss: A logical protective stop level
4. Take Profit 1: First target (conservative)
5. Take Profit 2: Second target (moderate)
6. Take Profit 3: Third target (aggressive)
7. Confidence Score: 0-100 based on setup quality
8. Trading Pair: If identifiable from the chart (e.g., EUR/USD, XAUUSD, BTC/USD)
9. Notes: Brief explanation of the key factors (2-3 sentences max)

IMPORTANT RULES:
- All prices should be realistic numbers based on what you see in the chart
- Stop Loss should be placed at a logical level (recent swing high/low)
- Take Profits should follow risk-reward principles (minimum 1:1.5 for TP1)
- Be decisive - always give a clear BUY or SELL recommendation
- Confidence should reflect the clarity and quality of the setup

Respond in JSON format only:
{
  "direction": "BUY" or "SELL",
  "entry": "price",
  "stopLoss": "price",
  "takeProfit1": "price",
  "takeProfit2": "price",
  "takeProfit3": "price",
  "confidence": number,
  "tradingPair": "pair or null",
  "notes": "brief analysis"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI Gateway with vision model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: ANALYSIS_PROMPT,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No analysis returned from AI");
    }

    // Parse JSON from the response (handle markdown code blocks)
    let analysisJson = content;
    if (content.includes("```json")) {
      analysisJson = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      analysisJson = content.split("```")[1].split("```")[0].trim();
    }

    const analysis = JSON.parse(analysisJson);

    // Validate required fields
    if (!analysis.direction || !analysis.entry || !analysis.stopLoss || !analysis.takeProfit1) {
      throw new Error("Incomplete analysis returned");
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Analysis failed" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
