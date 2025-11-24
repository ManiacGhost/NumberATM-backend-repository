const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const City = require('../models/City');
const VIPNumber = require('../models/vipNumber');

router.get('/', async (req, res) => {
  try {
    const baseUrl = 'https://www.numberatm.com';

    const staticUrls = [
      '/', '/about-us', '/contact', '/how-it-works', '/service',
      '/Privacy-Policy', '/Terms-and-Condition', '/Returns-and-Refund-Policy',
      '/vip-numbers', '/numerology-vip-numbers', '/favorites', '/orders', '/profile', '/clientele'
    ];

    const categories = [
      "Numerology-Without-2-4-8", "PENTA-NUMBERS", "HEXA-NUMBER", "SEPTA-9XY-AAA-AAA-A",
      "OCTA-NUMBERS", "ENDING-AAAA-NUMBERS", "AB-AB-XXXXXX-1212", "ABC-ABC-NUMBERS",
      "MIRROR-NUMBERS", "SEMI-MIRROR-NUMBERS", "123456-NUMBERS", "786-NUMBERS",
      "11-12-13-NUMBERS", "UNIQUE-NUMBERS", "AAA-BBB", "XY-XY-XY-NUMBERS",
      "DOUBLING-NUMBERS", "ENDING-AAA-NUMBERS", "AB-XYXYXYXY", "ABCD-ABCD-NUMBERS",
      "AAAA-BBBB-NUMBERS", "3-DIGITS-NUMBER", "AB-AB-XY-XY", "AAA-XY-AAA",
      "AOOB-COOD-ABOO-CDOO-OOOAB", "AAAA-MIDDLE", "AO-BO-CO-DO-EO",
      "AAA-MIDDLE", "AOO-BOO-AOO-BOO-COO", "START-A-OOO-B-END-A-OOO-B", "AAAA-XY-AAAA"
    ];

    const cities = await City.find({}, 'slug');
    const blogs = await Blog.find({}, 'slug updatedAt');
    const numbers = await VIPNumber.find(
      { stock: 1 },   // filter: stock equals 1
      'number updatedAt'        // projection: return only the "number" field
    );

    res.set('Content-Type', 'application/xml');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    staticUrls.forEach(url => {
      xml += `<url><loc>${baseUrl}${url}</loc></url>\n`;
    });

    categories.forEach(category => {
      xml += `<url><loc>${baseUrl}/numerology-vip-numbers?category=${encodeURIComponent(category)}</loc></url>\n`;
    });

    cities.forEach(city => {
      xml += `<url><loc>${baseUrl}/${city.slug}</loc></url>\n`;
    });

    blogs.forEach(blog => {
      const lastmod = blog.updatedAt ? blog.updatedAt.toISOString().split('T')[0] : today;
      xml += `<url><loc>${baseUrl}/vip-numbers/${blog.slug}</loc><lastmod>${lastmod}</lastmod></url>\n`;
    });

    numbers.forEach(number => {
      const lastmod = number.updatedAt ? number.updatedAt.toISOString().split('T')[0] : today;
      xml += `<url><loc>${baseUrl}/vip-number/${number.number}</loc><lastmod>${lastmod}</lastmod></url>\n`;
    });

    xml += '</urlset>';

    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation failed:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
