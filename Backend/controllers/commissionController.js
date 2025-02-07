import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandeler from "../middlewares/error.js";
import { Auction } from "../models/auctionSchema.js";
import {PaymentProof} from "../models/commissionProofSchema.js";
import {User} from "../models/userSchema.js";
import {v2 as cloudinary} from "cloudinary";

export const calculateCommission = async (auctionId)=>{
    const auction = await Auction.findById(auctionId);
    if(!mongoose.Types.ObjectId.isValid(auctionId)){
        return next(new ErrorHandeler("Invalid Auction Id format.",400));
    }
    const commissionRate = 0.05;
    const commission = auction.currentBid * commissionRate;
    return commission; 
}


export const proofOfCommission = catchAsyncErrors(async(req,res,next)=>{
   if(!req.files || Object.keys(req.files).length ===0){
     return next(new ErrorHandeler("Payment Proof document is required.",400));
   }
   const {proof} = req.files;
   const {amount, comment} = req.body;
   const user = await User.findById(req.user._id);

   if(!amount || !comment){
    return next(
        new ErrorHandeler("Amount & comment are required fields.",400)
    );
   }
    if(user.unpaidCommission === 0){
        return res.status(200).json({
           success: true,
           message: "You don't have any unpaid commision.",
        });
    }
    if(user.unpaidCommission < amount){
        return next(new ErrorHandeler(`The amount exceeds your unpaid commision balance. Please enter an amount up to ${user.unpaidCommission}`,403));
    }

    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedFormats.includes(proof.mimetype)) {
      return next(new ErrorHandeler("ScreenShot format not supported.", 400));
    }
    const cloudinaryResponse = await cloudinary.uploader.upload(proof.tempFilePath,{
        folder :"AUCTION_PLATFORM_PAYMENT_PROOFS",
    });
    if(!cloudinaryResponse || cloudinaryResponse.error){
        console.log("Cloudinary error:",cloudinaryResponse.error || "Unknown cloudinary error."
        );
        return next(new ErrorHandeler("Failed to upload payment proof.",500));
    }   
    const commissionProof = await PaymentProof.create({
        userId: req.user._id,
        proof:{
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        },
        amount,
        comment,
    });
    res.status(201).json({
        success: true,
        message: "Your proof has been submitted sucessfully. We will review it and respond you within 24 hours.",
        commissionProof,
    });
});