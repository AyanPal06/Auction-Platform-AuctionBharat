import mongoose from "mongoose";

export const connection =()=>{
  mongoose.connect(process.env.MONGO_URI,{
    dbName: "AUCTION_PLATFORM"
  }).then(()=>{
    console.log("MongoDB connected successfully.");
  }).catch(err=>{
    console.log(`Error occured while connecting to MongoDB:${err}`);
  })
}