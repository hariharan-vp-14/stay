const userModel = require('../models/user.model');
const userService = require('../services/user.services')
const {validationResult} = require('express-validator')
const blackListTokenModel = require('../models/blacklistToken.model')
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



module.exports.registerUser = async(req,res,next) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }

    const { fullname, name, email, password, contactNumber } = req.body;

    const existingUser = await userModel.findOne({email});
    if(existingUser){
        return res.status(400).json({message: 'User already exists'});
    }

        const resolvedName = name
            || (fullname && typeof fullname === 'object' && fullname.firstname && fullname.lastname && `${fullname.firstname} ${fullname.lastname}`)
            || (fullname && typeof fullname === 'object' && (fullname.firstname || fullname.lastname))
            || (typeof fullname === 'string' ? fullname : undefined);

        if (!resolvedName) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const hashPassword = await userModel.hashPassword(password);

        const user = await userService.createUser({
                name: resolvedName,
                email,
                password: hashPassword,
                contactNumber,
        });

    const token = user.generateAuthToken();

    res.cookie('token', token);

    res.status(201).json({token,user});


}

module.exports.loginUser = async(req,res,next) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors:errors.array()});
    }
    
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await userModel.findOne({email}).select('+password');

    if(!user){
        return res.status(401).json({message:'Invalid email or password'});
    }


    if (!user.password) {
        return res.status(500).json({ message: 'User password is not set' });
    }

    const isMatch = await user.comparePassword(password);

    if(!isMatch){
        return res.status(401).json({message:'Invalid email or password'})
    }

    if (user && isMatch) {
  const token = user.generateAuthToken();
  res.cookie('token', token);
  res.status(200).json({ token, user });

  
}
}

module.exports.getUserProfile = async(req,res,next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

    const userProfile = req.user
        ? {
            name: req.user.name,
            email: req.user.email,
            contactNumber: req.user.contactNumber,
          }
        : null;

    res.status(200).json({ token, user: userProfile });
}

module.exports.refreshToken = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    const token = req.user.generateAuthToken();
    res.cookie('token', token);
    return res.status(200).json({ token, user: req.user });
}


module.exports.logoutUser = async(req,res,next) => {
    res.clearCookie('token');
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    await blackListTokenModel.create({token});
    res.status(200).json({message: 'Logged out'});

    
}

// Google Sign-In using ID token from frontend
module.exports.googleAuth = async (req, res, next) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'idToken is required' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(401).json({ message: 'Invalid Google token' });
        }

        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name || email?.split('@')[0];

        if (!email) {
            return res.status(400).json({ message: 'Email not available from Google' });
        }

        let user = await userModel.findOne({ email });

        if (!user) {
            // Generate a random password to satisfy schema requirements
            const randomPassword = await userModel.hashPassword(`${Date.now()}-${googleId}`);
            user = await userModel.create({
                name,
                email,
                password: randomPassword,
                googleId,
            });
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }

        const token = user.generateAuthToken();
        res.cookie('token', token);

        const userProfile = {
            name: user.name,
            email: user.email,
            contactNumber: user.contactNumber,
            googleId: user.googleId,
        };

        return res.status(200).json({ token, user: userProfile });
    } catch (err) {
        return res.status(401).json({ message: 'Google authentication failed', error: err.message });
    }
};