const Owner = require("../models/Owner");
const VIPNumber = require("../models/vipNumber");

exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await Owner.find().sort({ name: 1 }); // 1 for ascending
    res.status(200).json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors.' });
  }
}
// Add a new owner
exports.addVendor = async (req, res) => {
  try {
    const { name, discount, margin } = req.body;
    const newOwner = new Owner({ name, discount, margin });
    await newOwner.save();
    res.json(newOwner);
  } catch (error) {
    res.status(400).json({ error: "Error adding owner" });
  }
};
exports.addVendors = async (req, res) => {
  try {
    const { names } = req.body; // Expecting an array of names
    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: "Invalid names array" });
    }

    // Get existing vendor names
    const existingVendors = await Owner.find({ name: { $in: names } }).select("name");
    const existingNames = existingVendors.map(v => v.name);

    // Filter out already existing names
    const uniqueNames = names.filter(name => !existingNames.includes(name));
    if (uniqueNames.length === 0) {
      return res.status(200).json({ message: "All vendors already exist", added: [] });
    }

    // Insert only unique vendors
    const vendorsToInsert = uniqueNames.map(name => ({ name }));
    const newVendors = await Owner.insertMany(vendorsToInsert);
    res.status(200).json({ message: "Vendors added", added: newVendors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error adding vendors" });
  }
};

// Update margin for an existing owner
exports.updateVendor = async (req, res) => {
  try {
    const { margin } = req.body;
    const updatedOwner = await Owner.findByIdAndUpdate(
      req.params.id,
      { $push: { margins: margin } },
      { new: true }
    );
    res.json(updatedOwner);
  } catch (error) {
    res.status(400).json({ error: "Error updating margin" });
  }
};
// Update margin for an existing owner
exports.stopShowCase = async (req, res) => {
  try {
    const updatedOwner = await Owner.findByIdAndUpdate(
      req.params.id,
      { $set: { showCased: false } },
      { new: true }
    );
    res.json(updatedOwner);
  } catch (error) {
    res.status(400).json({ error: "Error updating margin" });
  }
};
exports.renewShowCase = async (req, res) => {
  try {
    const updatedOwner = await Owner.findByIdAndUpdate(
      req.params.id,
      { $set: { showCased: true } },
      { new: true }
    );
    res.json(updatedOwner);
  } catch (error) {
    res.status(400).json({ error: "Error updating margin" });
  }
};
// Update margin for an existing owner
exports.deleteVendor = async (req, res) => {
  try {
    const id = req.params.id;
    await VIPNumber.deleteMany({ owner: id });
    await Owner.findByIdAndDelete(id);
    return res.status(200).json({ success: true })
  } catch (error) {
    res.status(400).json({ error: "Error updating margin" });
  }
};
exports.updateVendorWithDiscount = async (req, res) => {
  try {
    const { discount } = req.body;
    const updatedOwner = await Owner.findByIdAndUpdate(
      req.params.id,
      { $set: { discount: Number(discount) } },
      { new: true }
    );
    res.json(updatedOwner);
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: "Error updating margin" });
  }
};
exports.updateVendorWithDiscountAndMargin = async (req, res) => {
  try {
    const { discount, margins } = req.body;
    const updatedOwner = await Owner.findByIdAndUpdate(
      req.params.id,
      { $set: { discount: Number(discount), margins: margins } },
      { new: true }
    );
    res.json(updatedOwner);
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: "Error updating margin" });
  }
};