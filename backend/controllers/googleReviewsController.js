const axios = require("axios");

// Your business's Google Place ID (set once)
const BUSINESS_PLACE_ID = process.env.BUSINESS_PLACE_ID || "ChIJG_mSfWEBDTkRDgYYSRcq1vQ";

// Your Maps API key
const GOOGLE_API_KEY =
  process.env.GOOGLE_API_KEY || "AIzaSyDc8bvuZSJZF1TsIsbC4cBZaYTE6_dBT40";

// Fetch reviews directly
async function getBusinessReviews() {
  const url = "https://maps.googleapis.com/maps/api/place/details/json";
  const params = {
    place_id: BUSINESS_PLACE_ID,
    fields: "name,rating,reviews",
    key: GOOGLE_API_KEY,
  };

  const resp = await axios.get(url, { params });
  return resp.data;
}

// GET /api/reviews → always return your own reviews
exports.getReviews = async (req, res) => {
  try {
    const details = await getBusinessReviews();

    if (!details || details.status !== "OK") {
      return res
        .status(500)
        .json({ message: "Failed to fetch business reviews", details });
    }

    const result = details.result || {};

    res.json({
      place_id: BUSINESS_PLACE_ID,
      name: result.name,
      rating: result.rating,
      reviews: result.reviews || [],
    });
  } catch (err) {
    console.error("Error:", err?.response?.data || err.message);
    res.status(500).json({
      message: "Internal server error",
      error: err?.message || err,
    });
  }
};
