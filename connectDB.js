const mongoose = require('mongoose');

const connectDB = async () => {
 try {
    await mongoose.connect("mongodb+srv://callmesudo:callmesudo@cluster0.m22f7ap.mongodb.net/?retryWrites=true&w=majority", {
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