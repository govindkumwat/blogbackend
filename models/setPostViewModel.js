const mongoose = require('mongoose')

const postViewSchema = mongoose.Schema(
    {
        postId: {
            type: String,
            required: [true, 'Post id is missing']
        },
        totalPageView: {
            type: Number,
            required: [true, 'Page View is required']
        },

    },
    {
        timestamps: true
    }
)

const postView = mongoose.model('PostView', postViewSchema)

module.exports = postView
      

