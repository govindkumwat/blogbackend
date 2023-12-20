const mongoose = require('mongoose')

const postSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please enter the title']
        },
        description: {
            type: String,   
            required: [true, 'Please enter a description'],
        },
        category: {
            type:[String]
        }
    },

    {
        timestamps: true // this will add createdAt and updatedAt fields automatically
    }
)


const Posts = mongoose.model('Posts', postSchema)

module.exports = Posts