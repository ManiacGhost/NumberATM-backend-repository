/**
 * Apply discount and margin calculations to a VIP number
 * @param {Object} num - VIP number object with price and owner details
 * @param {Array} margins - Array of margin objects with minPrice, maxPrice, and marginPercent
 * @returns {Object} - Processed number with calculated pricing
 */
const applyPricing = (num, margins) => {
    const basePrice = num.price;
    const discount = num.owner?.discount || 0;
    
    // Calculate discounted price
    const discountedPrice = basePrice - (basePrice * discount * 0.01);
    
    // Find applicable margin
    const marginData = margins.find(
        m => basePrice >= m.minPrice && basePrice <= m.maxPrice
    );
    const marginPercent = marginData ? marginData.marginPercent : 0;
    const marginAmount = (basePrice * marginPercent) / 100;
    
    // Calculate final prices
    const finalPrice = discountedPrice + marginAmount;
    const roundedFinal = Math.round(finalPrice / 10) * 10;
    const roundedOriginal = Math.round((basePrice + marginAmount) / 10) * 10;
    
    // Calculate displayed discount percentage
    const displayedDiscount = roundedOriginal > 0 
        ? ((roundedOriginal - roundedFinal) / roundedOriginal) * 100 
        : 0;
    
    return {
        _id: num._id,
        number: num.number,
        category: num.category,
        price: roundedFinal,
        originalPrice: roundedOriginal,
        displayedDiscount: displayedDiscount.toFixed(1),
        featured: num.featured,
        stock: num.stock,
        createdAt: num.createdAt,
        sum: num.sum,
        total: num.total,
        sum2: num.sum2,
        highLightedNumber: num.highLightedNumber,
        view: num.view
    };
};

module.exports = { applyPricing };