import ErrorHandler from "../utils/errorHandler.js";

export const error=(err,req,res,next)=>{
    err.statusCode=err.statusCode || 500
    err.message= err.message || "Internal Sever Error";

    //WRONG MONGODB ID ERROR
    if(err.name==="CastError"){
        const message=`Resource Not Found! ${err.path}`;
        err=new ErrorHandler(message,400)
    }

    console.log(err,"error.js");
    
    res.status(err.statusCode).json({
        success:false,
        error:err.message
    })
}