const mongoose = require('mongoose')

const commentSchema = mongoose.Schema(
    {
        id: {
            type: String,
            required: [true, 'Please enter the title']
        },
        comment: {
            type: String,   
            required: [true, 'Please enter a description'],
        },
        name: {
            type: String,
            required: [true, 'Please enter name'],
        },
        email: {
            type: String,
            required: [true, 'Please enter email'],
        }
    },

    {
        timestamps: true // this will add createdAt and updatedAt fields automatically
    }
)


const Comment = mongoose.model('Comments', commentSchema)

module.exports = Comment