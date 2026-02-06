const Wishlist = require('../models/Wishlist');

// Add to Wishlist
exports.addToWishlist = async (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ message: 'userId and productId are required' });
  }

  const exists = await Wishlist.findOne({ user: userId, product: productId });
  if (exists) {
    return res.status(400).json({ message: 'Product already in wishlist' });
  }

  const wishlistItem = new Wishlist({
    user: userId,           // ✅ map correctly
    product: productId      // ✅ map correctly
  });

  await wishlistItem.save();

  res.status(201).json({ message: 'Added to wishlist', wishlistItem });
};


// Get Wishlist
exports.getWishlist = async (req, res) => {
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ message: 'userId is required' });

  try {
    const items = await Wishlist.find({ user: userId }).populate('product');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getWishlistByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const wishlistItems = await Wishlist.find({ user: userId }).populate('product');
    const products = wishlistItems.map(item => item.product);
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching wishlist", error: err.message });
  }
};


// Remove from Wishlist
exports.removeFromWishlist = async (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ message: 'userId and productId are required' });
  }

  try {
    const deleted = await Wishlist.findOneAndDelete({ user: userId, product: productId });
    if (!deleted) {
      return res.status(404).json({ message: 'Item not found in wishlist' });
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
