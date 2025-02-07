import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandeler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import {v2 as cloudinary} from "cloudinary";
import { generateToken } from "../utils/jwtToken.js";

export const register = catchAsyncErrors(async(req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandeler("Profile Image Required.", 400));
  }
  const { profileImage } = req.files;
  //console.log("Files received:", req.files.profileImage); 

  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];

  if (!allowedFormats.includes(profileImage.mimetype)) {
    return next(new ErrorHandeler("File format not supported.", 400));
  }

  const {
    userName,
    email,
    password,
    address,
    phone,
    role,
    bankAccountNumber,
    bankAccountHolderName,
    bankAccountIfsc,
    bankName,
    upiId,
    paypalEmail,
  } = req.body;

  if(!userName || !email ||!phone || !password || !address || !role){
   return next(new ErrorHandeler("Please fill the full from.",400));
  }
  if(role === "Auctioneer"){
    if(!bankAccountHolderName || !bankAccountIfsc || !bankAccountNumber || !bankName){
      return next(new ErrorHandeler("Please provide your full bank details.",400));
    }
    if(!upiId){
      return next(new ErrorHandeler("Please provide your UPI id.",400));
    }
    if(!paypalEmail){
      return next(new ErrorHandeler("Please provide your Paypal email.",400));
    }
  }
  const isRegistered =await User.findOne({email});
  if(isRegistered){
   return next (new ErrorHandeler("User already exists.",400));
  }
  const cloudinaryResponse = await cloudinary.uploader.upload(profileImage.tempFilePath,{
   folder :"AUCTION_PLATFORM_USERS",
  });
  if(!cloudinaryResponse || cloudinaryResponse.error){
   console.log("Cloudinary error:",cloudinaryResponse.error || "Unknown cloudinary error."
   );
   return next(new ErrorHandeler("Failed to upload profile image to cloudinary.",500));
  }
  const user =await User.create({
   userName,
   email,
   password,
   address,
   phone,
   role,
   profileImage:{
      public_id:cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
   },
   paymentMethod:{
      bankTransfer:{
          bankAccountNumber,
          bankAccountHolderName,
          bankAccountIfsc,
          bankName,
      },
      upi:{
          upiId,
      },
      paypal:{
          paypalEmail,
      },
  },
  });
  generateToken(user,"User Registerd.",201,res);
});


export const login = catchAsyncErrors(async(req,res,next)=>{
  const {email,password}=req.body;
  if(!email || !password){
    return next(new ErrorHandeler("Please fill all details."));
  }
  const user = await User.findOne({email}).select("+password");
  if(!user){
    return next(new ErrorHandeler("Invalid Email or Password.",400));
  }
  const isPasswordMatch = await user.comparePassword(password);
  if(!isPasswordMatch){
    return next(new ErrorHandeler("Invalid Email or Password.",400));
  }
  generateToken(user,"Login Successfully.",200,res);
});


export const getProfile = catchAsyncErrors(async(req,res,next)=>{
  const user=req.user;
  res.status(200).json({
    success:true,
    user,
  });
});


export const logout = catchAsyncErrors(async(req,res,next)=>{
  res.status(200).cookie("token","",{
    expires: new Date(Date.now()),
    httpOnly: true
  }).json({
    success: true,
    message: "Logout Successfully."
  })
});


export const fetchLeaderboard = catchAsyncErrors(async(req,res,next)=>{
  const users =await User.find({moneySpent :{$gt: 0}});
  const leaderboard =users.sort((a,b)=>b.moneySpent-a.moneySpent);
  res.status(200).json({
    success:true,
    leaderboard,
  });
});