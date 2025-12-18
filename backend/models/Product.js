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

}, { timestamps: true })

// Create compound indexes for common queries
productSchema.index({ category: 1, stock: 1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isFeatured: -1, createdAt: -1 }); // For sorting featured products first

// Text search index for Shopify-like search functionality
productSchema.index({ 
    title: 'text', 
    description: 'text' 
}, {
    weights: {
        title: 10,  // Title matches are more important
        description: 5
    },
    name: 'text_search_index'
});

module.exports = mongoose.model('Product', productSchema)