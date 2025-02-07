import mongoose from "mongoose";
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandeler from "./error.js";
import { Auction } from "../models/auctionSchema.js";

export const checkAuctionEndTime = catchAsyncErrors(async(req,res,next)=>{
    const {id} = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return next(new ErrorHandeler("Invalid ID formet.",400));
    }
    const auction = await Auction.findById(id);
    if(!Auction){
        return next(new ErrorHandeler("Auction not Found.",404));
    }
    const now = new Date();
    if(new Date(auction.startTime)>now){
        return next(new ErrorHandeler("Auction is not started yet"));
    }
    if(new Date(auction.endTime)<now){
        return next(new ErrorHandeler("Auction is ended."));
    }
    next();
})