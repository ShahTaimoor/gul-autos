const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    title: {
        type: String,
       
        trim: true
    },
    description: {
        type: String,
        
    },
    price: {
        type: Number,
    
    },
    stock: {
        type: Number,
    
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        
    },

    picture: {
        secure_url: {
            type: String,
            
        },
        public_id: {
            type: String,
            
        },
    },


    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        
    },

    isFeatured: {
        type: Boolean,
        default: false,
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],

}, { timestamps: true })

// Create compound indexes for common queries
productSchema.index({ category: 1, stock: 1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isFeatured: -1, createdAt: -1 }); // For sorting featured products first

// Performance indexes for search optimization
productSchema.index({ stock: 1 }); // For filtering in-stock products (stock > 0)
productSchema.index({ isFeatured: -1 }); // For featured product sorting
productSchema.index({ stock: 1, isFeatured: -1, createdAt: -1 }); // Compound index for search queries

// Text search index for optimized search functionality
// Note: MongoDB allows only ONE text index per collection
productSchema.index({ 
    title: 'text', 
    description: 'text',
    tags: 'text'
}, {
    weights: {
        title: 10,  // Title matches are more important (higher weight)
        description: 5,  // Description matches have lower weight
        tags: 8  // Tags have high relevance
    },
    name: 'text_search_index'
});

module.exports = mongoose.model('Product', productSchema)