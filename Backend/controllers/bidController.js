import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js"
import ErrorHandeler from "../middlewares/error.js"
import { Auction } from "../models/auctionSchema.js";
import { Bid } from "../models/bidSchema.js";
import {User} from "../models/userSchema.js";

export const placeBid = catchAsyncErrors(async(req,res,next)=>{
    const {id} = req.params;
    const auctionItem = await Auction.findById(id);
    if(!auctionItem){
        return next(new ErrorHandeler("Auction Item not found.",404));
    }

    const {amount} = req.body;
    if(!amount){
        return next(new ErrorHandeler("Please place your bid",404));
    }
    if(amount <= auctionItem.currentBid){
        return next(new ErrorHandeler("Bid amount must greater than the current bid.",404));
    }
    if(amount < auctionItem.startingBid){
        return next(new ErrorHandeler("Bid amount must greater than or equal to  the starting bid.",404));
    }
    
    try{
        const existingBid = await Bid.findOne({
            "bidder.id": req.user._id,
            auctionItem : auctionItem._id,
        });
        const existingBidInAuction = auctionItem.bids.find((bid)=>bid.userId.toString() == req.user._id.toString());
        if(existingBid && existingBidInAuction){
            existingBidInAuction.amount = amount;
            existingBid.amount=amount;
            await existingBidInAuction.save();
            await existingBid.save();
            auctionItem.currentBid = amount;
        }
        else{
            const bidderDetail = await User.findById(req.user._id);
            const bid = await Bid.create({
                amount,
                bidder:{
                    id: bidderDetail._id,
                    userName: bidderDetail.userName,
                    profileImage: bidderDetail.profileImage?.url
                },
                auctionItem: auctionItem._id,
            });
            auctionItem.bids.push({
                userId: req.user._id,
                userName: bidderDetail.userName,
                profileImage: bidderDetail.profileImage?.url,
                amount,
            });
            auctionItem.currentBid = amount;
        }
        await auctionItem.save();

        res.status(201).json({
            success: true,
            message: "Bid Placed",
            currentBid: auctionItem.currentBid,
        });
    }catch(error){
       return next(new ErrorHandeler(error.message || "Failed to place bid.",500));
    }

});