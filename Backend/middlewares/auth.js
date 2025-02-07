import { User } from "../models/userSchema.js";
import jwt from "jsonwebtoken";
import ErrorHandeler from "./error.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";


export const isAuthenticated = catchAsyncErrors(async(req,res,next)=>{
   const token =req.cookies.token;
   if(!token){
    return next(new ErrorHandeler("User is not authenticated.",400));
   }
   const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY);
   req.user = await User.findById(decoded.id);
   next();
});

export const isAuthorized =(...roles)=>{
   return (req,res,next)=>{
      if(!roles.includes(req.user.role)){
         return next(new ErrorHandeler(`${req.user.role} not allowed to accss this resource`,403));
      }
      next();
   };
}