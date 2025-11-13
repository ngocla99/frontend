/**
 * Replicate Model Keep-Alive Edge Function
 *
 * Purpose: Keeps the ngocla99/face-analysis model warm by sending periodic prediction requests.
 * This prevents cold starts (3-8 minutes) by ensuring the container stays active.
 *
 * Schedule: Runs every 3 minutes via pg_cron (480 calls/day)
 * Cost: ~$0.00083 per call × 480 = ~$9.60/month
 *
 * Model: ngocla99/face-analysis (Advanced Face Analysis)
 * Version: eca7af967ef6eb1d8b3c02274421eaff1ebaa9a5ab9a1404d9b0eccfb29a8e48
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Lightweight test image URL (animal image for fast error response)
// Using animal ensures quick response with "no face detected" error
// This keeps container warm without expensive face processing
const TEST_IMAGE_URL = "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop"; // Cat image

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log("[Keep-Alive] Starting Replicate model ping...");

    // Get Replicate API token from environment
    const replicateApiToken = Deno.env.get("REPLICATE_API_TOKEN");
    if (!replicateApiToken) {
      throw new Error("REPLICATE_API_TOKEN environment variable not set");
    }

    // Create prediction to keep model warm
    const predictionResponse = await fetch(
      "https://api.replicate.com/v1/predictions",
      {
        method: "POST",
        headers: {
          "Authorization": `Token ${replicateApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "eca7af967ef6eb1d8b3c02274421eaff1ebaa9a5ab9a1404d9b0eccfb29a8e48",
          input: {
            image: TEST_IMAGE_URL,
          },
        }),
      }
    );

    if (!predictionResponse.ok) {
      const errorText = await predictionResponse.text();
      throw new Error(
        `Replicate API error (${predictionResponse.status}): ${errorText}`
      );
    }

    const prediction = await predictionResponse.json();
    const duration = Date.now() - startTime;

    console.log(
      `[Keep-Alive] ✓ Prediction created: ${prediction.id} (${duration}ms)`
    );
    console.log(`[Keep-Alive] Status: ${prediction.status}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Keep-alive ping sent successfully",
        prediction: {
          id: prediction.id,
          status: prediction.status,
          model: "ngocla99/face-analysis",
        },
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error("[Keep-Alive] ✗ Error:", error.message);
    console.error("[Keep-Alive] Stack:", error.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
