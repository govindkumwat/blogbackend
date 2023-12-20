const mongoose = require('mongoose');

const imageSchema = mongoose.Schema(
    {
        filename: {
            type: String,
            required: [true, 'Please provide a filename'],
        },
        path: {
            type: String,
            required: [true, 'Please provide the path to the image'],
        },
    },
    {
        timestamps: true,
    }
);

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;