const express = require('express');
const { getAllContacts, markAsRead, submitContactForm, deleteContact } = require('../controllers/contactController');
const { verifyToken } = require('../middlewares/verifyToken');

const router = express.Router();

// Admin endpoints
router.post('/', submitContactForm);
router.get('/',verifyToken, getAllContacts);
router.patch('/:id/read',verifyToken, markAsRead);
router.delete('/:id',verifyToken, deleteContact);

module.exports = router;