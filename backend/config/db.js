import { connect } from "mongoose";

const mongoURI = process.env.MONGO_URI; // use the full URI from .env

const connectDB = async () => {
  try {
    const conn = await connect(mongoURI); // connect using the URI
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
