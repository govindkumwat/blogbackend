const mongoose = require('mongoose');

const connectDB = async () => {
 try {
    await mongoose.connect("mongodb+srv://admin:admin@blogapi.jyugptg.mongodb.net/?retryWrites=true&w=majority", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
 } catch (err) {
    console.error(err.message);
    process.exit(1);
 }
};

module.exports = connectDB;