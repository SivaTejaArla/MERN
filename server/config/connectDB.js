import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()


if(!process.env.MONGODB_URI){

    throw new Error ( "Please include MONGODB Connection URI ")
}

async function connectDB() {

    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("MongoDB connected ")

    }catch (error ){
        console.log("Mongo DB connection failed ");
        process.exit(1);
    }
}


export default connectDB