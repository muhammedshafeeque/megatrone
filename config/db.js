import { connect, getDatabase } from 'arango-typed';

const connectDB = async () => {
  try {
    await connect({
      url: process.env.DB_URL,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
    });
    
    const db = getDatabase();
    console.log("ArangoDB connected");
    return db;
  } catch (error) {
    console.error("ArangoDB connection error:", error);
    throw error; 
  }
};

export default connectDB;