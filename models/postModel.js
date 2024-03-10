const mongoose = require('mongoose')

const postSchema = mongoose.Schema(
    {
        userId: {
            type: String,
            required: [true, 'Please enter the userId']
        },
        userName: {
            type: String,
            required: [true, 'Please enter the username']
        },
        title: {
            type: String,
            required: [true, 'Please enter the title']
        },
        description: {
            type: String,   
            required: [true, 'Please enter a description'],
        },
        tags: {
            type:[String]
        },
        thumbs: {
            type: String
        }
    },

    {
        timestamps: true // this will add createdAt and updatedAt fields automatically
    }
)


const Posts = mongoose.model('Posts', postSchema)

module.exports = Posts