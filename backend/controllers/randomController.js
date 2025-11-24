const VIPNumber = require("../models/vipNumber");

const getRandomVipNumbers = async (min = 50, max = 100) => {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;

    const randomNumbers = await VIPNumber.aggregate([
        { $sample: { size: count } }
    ]);

    return randomNumbers;
};
exports.RandomVipNumbers = async (req, res) => {
    try {
        const numbers = await getRandomVipNumbers();
        res.json(numbers);
    } catch (err) {
        console.error("Error fetching random VIP numbers:", err);
        res.status(500).json({ message: "Server Error" });
    }
}