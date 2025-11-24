const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const path = require('path');
const fs = require('fs');
const compression = require("compression");
const vipNumberRoutes = require("./routes/vipNumberRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const cartRoutes = require("./routes/cartRoutes");
const favRoutes = require("./routes/FavRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const posterRoutes = require("./routes/posterRoutes");
const storeImagesRoutes = require("./routes/storeImageRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const logoRoutes = require("./routes/logoRoutes");
const promoRoutes = require("./routes/promoRoutes");
const contactRoutes = require("./routes/contactRoutes");
const enquiryRoutes = require("./routes/enquiryROutes");
const marginRoutes = require("./routes/marginRoutes");
const cityRoutes = require("./routes/cityRoutes");
const blogRoutes = require("./routes/blogRoutes");
const metaRoutes = require("./routes/metaRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const sitemap = require("./routes/sitemap");
const airpayRoutes = require("./routes/airpayRoutes");
const invoiceRoutes = require("./routes/InvoiceRoutes");
const { errorHandler } = require("./middlewares/errorHandler");
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
const Order = require("./models/Order");
const Meta = require("./models/Meta");
const Blog = require("./models/Blog");
const City = require("./models/City");
const asyncHandler = require('./utils/asyncHandler')
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],  // Allow these HTTP methods
  allowedHeaders: '*',  // Allow these headers
}));
// Routes

app.use("/api/vip-numbers", vipNumberRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/fav", favRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/posters", posterRoutes);
app.use("/api/store-images", storeImagesRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/logos", logoRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/margins", marginRoutes);
app.use("/api/city", cityRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/sitemap.xml", sitemap);
app.use("/sitemap", sitemap);
app.use("/api/airpay", airpayRoutes);
app.use(compression());
app.get('/sendtoairpay', asyncHandler(async (req, res) => {
  const { orderid } = req.query;

  // 🔥 Fetch Order from DB
  const orderData = await Order.findOne({ orderId: orderid });
  if (!orderData) {
    return res.status(404).send("Order not found");
  }

  var mid = process.env.AIRPAY_MERCHANT_ID;
  var username = process.env.AIRPAY_USERNAME;
  var password = process.env.AIRPAY_PASSWORD;
  var now = new Date();
  var secret = process.env.AIRPAY_SECRET_KEY;
  var sha256 = require('sha256');
  var dateformat = require('dateformat');
  alldata = orderData.email + orderData.firstName + orderData.lastName + orderData.streetAddress + orderData.city + orderData.state + orderData.country + orderData.totalPrice + orderid;
  udata = username + ':|:' + password;
  privatekey = sha256(secret + '@' + udata);
  keySha256 = sha256(username + "~:~" + password);
  aldata = alldata + dateformat(now, 'yyyy-mm-dd');
  //console.log(aldata);
  checksum = sha256(keySha256 + '@' + aldata); //md5(aldata+privatekey);
  fdata = orderData;

  // ✅ `.jade` (Pug) को डेटा भेजो
  res.render('sendtoairpay', {
    mid,
    data: fdata,
    privatekey,
    checksum
  });
}));
// Serve API 404 fallback before wildcard
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
// app.use(express.static(frontendPath, {
//   maxAge: '1y', // Cache static files for 1 year
//   etag: false,
// }));
app.use((req, res, next) => {
  const filePath = path.join(frontendPath, req.path);

  if (req.path === '/') return next(); // Don't serve index.html here

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      return res.sendFile(filePath);
    }
    next(); // File not found → go to next middleware
  });
});
app.use(express.static(path.join(__dirname, 'static')));

// ✅ API route (keep this before the wildcard)
app.get('/api/*', (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// ✅ Wildcard route for client-side routing AFTER static
app.get('*', async (req, res) => {
  const indexFilePath = path.join(frontendPath, 'index.html');
  const route = req.path;
  //console.log("Route Path:", route);

  fs.readFile(indexFilePath, 'utf-8', async (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).send('An error occurred while loading the page.');
    }
    const fullUrl = 'https://www.numberatm.com' + req.originalUrl;
    let meta = await Meta.findOne({ route });
    // console.log(route,route.split("/").length)
    if (!meta) {
      if (route.includes('/vip-number/')) {
        meta = await Meta.findOne({ route: '/vip-number/' });
        const number = route.split("/")[2];
        meta.title = number + " | " + meta.title;
      }
      else if (route.includes('/vip-numbers-in')) {
        meta = await Meta.findOne({ route: '/vip-numbers-in' });
        if (!meta) {
          meta = await Meta.findOne({ route: '/' });
        }
        const city = await City.findOne({ slug: route.split("/")[1] }).lean();
        meta = { ...city, title: city.title + " | " + meta?.title };
        // //console.log(meta);
      }
      else if (route.includes('/vip-numbers') && route.split('/').length >= 3 && route.split('/')?.[2]!=='') {
        const slug = route.split("/")[2];
        const blog = await Blog?.findOne({ slug });
        meta = { title: blog?.metaTitle || blog?.title, description: blog?.metaDescription || blog?.content, tags: blog?.metaKeywords }
        console.log(route)
      }
      else meta = await Meta.findOne({ route: '/' });
    }
    if (meta) {
      data = data
        .replace(/__TITLE__/g, meta.title)
        .replace(/__KEYWORDS__/g, meta.tags)
        .replace(/__DESCRIPTION__/g, meta.description)
        .replace(/__DESCRIPTION__/g, meta.description)
        .replace(/__ROUTE__/g, route)
        .replace(/__CANONICAL_URL__/g, fullUrl);
      // .replace(/default-image.jpg/g, meta.breadcum);
    }

    res.set('Content-Type', 'text/html');
    res.send(data);
  });
});

// 404 handler (for SSR only after all routes are matched)
// app.use((req, res) => {
//   res.status(404).send('Page not found');
// });
app.use(function (req, res, next) {
  next(createError(404));
});
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

module.exports = app;
