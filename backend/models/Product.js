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



}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)