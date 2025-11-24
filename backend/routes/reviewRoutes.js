const express = require('express');
const router = express.Router();
const { getReviews } = require('../controllers/googleReviewsController');

// GET /api/reviews?place_id=... or ?place_name=...&max=5
router.get('/', getReviews);

// Alias: GET /api/reviews/search?query=... (query is same as place_name)
router.get('/search', (req, res, next) => {
	// map `query` -> `place_name` so controller can handle it
	if (req.query && req.query.query && !req.query.place_name) {
		req.query.place_name = req.query.query;
	}
	return getReviews(req, res, next);
});

module.exports = router;
