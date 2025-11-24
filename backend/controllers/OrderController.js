const Order = require("../models/Order")

// ...existing code...
exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { deleted: { $ne: true } };

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        // Add one day, then subtract 5 hours 30 minutes for IST
        const end = new Date(req.query.endDate);
        end.setDate(end.getDate() + 1);
        end.setHours(end.getHours() - 5, end.getMinutes() - 30, 0, 0);
        filter.createdAt.$lt = end;
      }
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { orderId: searchRegex },
        { numbers: { $elemMatch: { $regex: searchRegex } } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("items.vipNumber"),
      Order.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
};
// ...existing code...

exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ orderId: id, deleted: { $ne: true } })
      .populate('items.vipNumber');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.status(200).json({ success: true, order });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.UpdateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    // Fetch order with items and VIP numbers
    const order = await Order.findOne({ orderId }).populate("items.vipNumber");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Handle refunded case
    if (status === "Refunded") {
      order.paymentStatus = "Refunded";

      // Restore stock
      for (const item of order.items) {
        if (item.vipNumber) {
          await item.vipNumber?.updateOne({ $set: { stock: 1 } });
        }
      }

      await order.save();
      return res.status(200).json({
        success: true,
        order,
        message: "Order status updated to Refunded, and stock restored.",
      });
    }

    // Prevent double payment
    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid.",
      });
    }

    // Check stock availability
    const outOfStock = order.items.some(item => item.vipNumber?.stock === 0);

    let message;
    if (outOfStock) {
      message = "Marked as Paid, but one or more VIP numbers were already out of stock.";
    } else {
      message = "Marked as Paid and VIP numbers allocated successfully.";
    }

    // Decrement stock
    for (const item of order.items) {
      if (item.vipNumber) {
        await item.vipNumber?.updateOne({ $set: { stock: 0 } });
      }
    }

    // Update payment status
    order.paymentStatus = status || "Paid";
    await order.save();

    return res.status(200).json({ success: true, order, message });
  } catch (e) {
    console.error("UpdateStatus Error:", e);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while updating the order.",
      error: e.message,
    });
  }
};


exports.getOrderbyUser = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user?.id,
      deleted: { $ne: true }
    }).populate('items.vipNumber');

    res.status(200).json({ success: true, orders });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// Hard delete - permanently remove
exports.hardDeleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOneAndDelete({ orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.status(200).json({ message: 'Order permanently deleted.' });
  } catch (error) {
    console.error('Hard delete error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.softDeleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(orderId)
    const order = await Order.findOneAndUpdate(
      { orderId },
      { deleted: true },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.status(200).json({ message: 'Order soft-deleted successfully.', order });
  } catch (error) {
    console.error('Soft delete error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};