import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import sendEmail from '../config/sendEmail.js'
import verifyEmailtemplate from '../utils/verifyEmailTemplate.js'
import uploadImageClodinary from '../utils/uploadImageClodinary.js'
import generatedOtp from '../utils/generateOtp.js'
import generateAccessToken from '../utils/generateAccessToken.js'
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js'
import generateRefreshToken from '../utils/generateRefreshToken.js'
export async function registeruserController(req,res){

try{

    const {name , email,password} = req.body

    if(!name  || !email || !password ){
        return res.status(400).json({
            message :"Fill all the fields ",
            error : true,
            success : false
        })
    }

const user = await UserModel.findOne({email})
if(user){
    return res.json({
        message : "Already registered email ",
        error : true,
        success : false 
    })
}

const salt = await bcryptjs.genSalt(10)
const hashPassword = await bcryptjs.hash(password,salt)

const payLoad = {
    name, 
    email,
     password : hashPassword
}
const newuser =new UserModel(payLoad)

const save = await newuser.save()

const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`

const verifyEmail = await sendEmail({
    sendTo : email, 
    subject : "Verification  Email from MERN",
    html : verifyEmailtemplate({
        name,
        url : verifyEmailUrl
    })

})

return res.json({

    message : "User Registered Successfully",
    error : false,
    success : true,
    data : save
})


}catch(error){


    return res.status(500).json({
        message : error.message || error,
        error : true,
        success : false
    })
}

}

export async function verifyEmailController(req,res){

    try{
        const {code }= req.body

        const user = await  UserModel.findOne({_id : code})
        if(!user){
           return res.status(400).json({
                message : "Invalid Code",
                error : true,
                success : false
            })
        }
        const updateUser = await UserModel.updateOne({ _id : code }, {verify_email : true})
        return res.json({

            message : "verification of email done",
            success : true,
            error : false
        })


    }catch(error){
        return res.status(500).json({

            message : error.message || error,
            error : true,
            success : true

        })
    }
}


export async function loginController(req,res){

    try{

        const {email,password } = req.body


        if(!email || !password ){

            return res.status(400).json({
                message : " Provide email and password",
                success : false,
                error : true
            })
        }
        const user = await UserModel.findOne({email})
        if(!user){

            return res.status(500).json({
                message : "User not registered ",
                success : false,
                error : true
            })
        }
        if(user.status != "Active"){
            return res.status(400).json({
                message : "Contact Admin ",
                error : true,
                success : false
            })
        }
        const checkPassword = await bcryptjs.compare(password , user.password)
        if(!checkPassword){
            return res.status(400).json({
                message : "Check Password",
                success : false,
                error : true
            })
        }
        console.log(user._id)

        const accessToken = await generateAccessToken(user._id)
        const refreshToken = await generateRefreshToken(user._id)


            const cookiesOption = {
                httpOnly : true , 
                secure : true,
                sameSite : "None"
            }
        res.cookie('accessToken', accessToken,cookiesOption)
        res.cookie('refreshToken', refreshToken,cookiesOption)
        return res.status(200).json({
            message : "Login Successful ",
            error : false , 
            success : true,
            data : {
                accessToken,
                refreshToken
            }
        })


    }catch(error){

        return res.status(500).json({
            message : error.message || error ,
            success : false,
             error : true
        })
    }
}

export async function logoutController(req,res){
    try {
        const userid = req.userId //middleware

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        res.clearCookie('accessToken',cookiesOption)
        res.clearCookie('refreshToken',cookiesOption)

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userid,{
            refresh_token : ""
        })

        return res.json({
            message : "Logout successfully",
            error : false,
            success : true
        })
    } catch (error) {
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async  function uploadAvatar(req,res){
    try {
        const userId = req.userId // auth middlware
        const image = req.file  // multer middleware

        const upload = await uploadImageClodinary(image)
        
        const updateUser = await UserModel.findByIdAndUpdate(userId,{
            avatar : upload.url
        })

        return res.json({
            message : "upload profile",
            success : true,
            error : false,
            data : {
                _id : userId,
                avatar : upload.url
            }
        })

    } catch (error) {
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}


export async function updateUserDetails(req,res){
    try {
        const userId = req.userId //auth middleware
        const { name, email, mobile, password } = req.body 

        let hashPassword = ""

        if(password){
            const salt = await bcryptjs.genSalt(10)
            hashPassword = await bcryptjs.hash(password,salt)
        }

        const updateUser = await UserModel.updateOne({ _id : userId},{
            ...(name && { name : name }),
            ...(email && { email : email }),
            ...(mobile && { mobile : mobile }),
            ...(password && { password : hashPassword })
        })

        return res.json({
            message : "Updated details successfully",
            error : false,
            success : true,
            data : updateUser
        })


    } catch (error) {
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}
export async function forgotPasswordController(req,res) {
    try {
        const { email } = req.body 

        const user = await UserModel.findOne({ email })

        if(!user){
            return res.status(400).json({
                message : "Email not available",
                error : true,
                success : false
            })
        }

        const otp = generatedOtp()
        const expireTime = new Date() + 60 * 60 * 1000 // 1hr

        const update = await UserModel.findByIdAndUpdate(user._id,{
            forgot_password_otp : otp,
            forgot_password_expiry : new Date(expireTime).toISOString()
        })

        await sendEmail({
            sendTo : email,
            subject : "Forgot password from Binkeyit",
            html : forgotPasswordTemplate({
                name : user.name,
                otp : otp
            })
        })

        return res.json({
            message : "check your email for OTP",
            error : false,
            success : true
        })

    } catch (error) {
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}
export async function verifyForgotPasswordOtp(req,res){
    try {
        const { email , otp }  = req.body

        if(!email || !otp){
            return res.status(400).json({
                message : "Provide required field email, otp.",
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({ email })

        if(!user){
            return res.status(400).json({
                message : "Email not available",
                error : true,
                success : false
            })
        }

        const currentTime = new Date().toISOString()

        if(user.forgot_password_expiry < currentTime  ){ 
            return res.status(400).json({
                message : "Otp is expired",
                error : true,
                success : false
            })
        }

        if(otp !== user.forgot_password_otp){
            return res.status(400).json({
                message : "Invalid otp",
                error : true,
                success : false
            })
        }


        const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
            forgot_password_otp : "",
            forgot_password_expiry : ""
        })
        
        return res.json({
            message : "Verify otp successfully",
            error : false,
            success : true
        })

    } catch (error) {
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}
export async function resetpassword(req,res){
    try {
        const { email , newPassword, confirmPassword } = req.body 

        if(!email || !newPassword || !confirmPassword){
            return res.status(400).json({
                message : "provide required fields email, newPassword, confirmPassword"
            })
        }

        const user = await UserModel.findOne({ email })

        if(!user){
            return res.status(400).json({
                message : "Email is not available",
                error : true,
                success : false
            })
        }

        if(newPassword !== confirmPassword){
            return res.status(400).json({
                message : "New Password and Confirm password are not equal",
                error : true,
                success : false,
            })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(newPassword,salt)

        const update = await UserModel.findOneAndUpdate(user._id,{
            password : hashPassword
        })

        return res.json({
            message : "Password updated successfully.",
            error : false,
            success : true
        })

    } catch (error) {
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async function refreshToken(req,res){
    try {
        const refreshToken = req.cookies.refreshToken || req?.headers?.authorization?.split(" ")[1]  //[ Bearer token]

        if(!refreshToken){
            return res.status(401).json({
                message : "Invalid Refreshtoken",
                error  : true,
                success : false
            })
        }

        const verifyToken = await jwt.verify(refreshToken,process.env.SECRET_KEY_REFRESH_TOKEN)

        if(!verifyToken){
            return res.status(401).json({
                message : "token is expired",
                error : true,
                success : false
            })
        }

        const userId = verifyToken?._id

        const newAccessToken = await generateAccessToken(userId)

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        res.cookie('accessToken',newAccessToken,cookiesOption)

        return res.json({
            message : "New Access token generated",
            error : false,
            success : true,
            data : {
                accessToken : newAccessToken
            }
        })


    } catch (error) {
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}