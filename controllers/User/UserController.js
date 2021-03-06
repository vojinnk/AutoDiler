const Advertisment = require("../../models/Advertisment");
const User = require("../../models/User");
const Comment = require("../../models/Comment");
const CarModel = require("../../models/Model");
const Brand = require("../../models/Brand");
const Images = require("../../models/Images");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const passport = require("passport");
const nodemailer = require("../../util/sendingMail");
const crypto = require("crypto");
const { Op, Model } = require("sequelize");
const { validationResult } = require('express-validator/check');

const logout = (req, res, next) => {
  req.session = null;
  req.logout();
  res.status(200).send("You are logged out.");
};

const register = async (req, res, next) => {
  const { name, email, password, isAdmin, location } = req.body;
  const token = jwt.sign({ email: req.body.email }, process.env.SECRET);
 
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json(errors.array());
  }

  try {
    
  const user = await User.create({
    name: name,
    email: email,
    password: bcrypt.hashSync(password, 8),
    isAdmin: isAdmin,
    verificationToken: token,
    location: location
  });
  //console.log(token);
  //
  nodemailer.sendConfirmationEmail(name, email, token);
  return res.status(200).json(user);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

};

const login = (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/logSucces",
    failureRedirect: "/login",
    failureFlash: true,
  })(req, res, next);
};


//


const loginSucceded = (req, res, next) => {
 // return res.status(200).send("Great, you are loged in");
  return res.status(200).json(req.user);
}

const verifyEmail = async (req, res, next) => {
  token = req.params.code;

  try {
    const user = await User.findOne({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }
    user.emailVerified = true;
    user.save()
    return res.status(200).json(user);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};


const myAdvertisment = async (req, res, next) => {
  try {
    const result = await Advertisment.findAll({
      where: {
        //userId: req.user.id,
        userId: 94,
      },
      attributes:{exclude:["modelId","userId"]},
      include:[{
        model:CarModel,
        attributes: ["id","name"],
        include:{
            model:Brand,
            attributes: ["id","name"],
        }
    },
    {
      model:Images,
      attributes:["path"]
    },
  ],
  });
    return res.status(200).json(result);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};


const getResetPassword = async (req, res, next) => {
  const email = req.body.email;
  let token = 0;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }

     token = buffer.toString("hex");
  });

  try {
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return res.status(404).send("User with this email does not exist.");
    }
    user.resetToken = token;
    console.log(token);
    user.resetTokenExpiration = Date.now() + 3600000;
    user.save();

    nodemailer.passwordResetLink(user.email, resetToken);

    return res.status(200).send("Reset link sent successfuly!");
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const getNewPassword = async (req, res, next) => {
  const token = req.params.token;

  try {
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiration: {
          [Op.gt]: Date.now(),
        },
      },
    });
    return res.status(200).json(user);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};



const postNewPassword = async (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  try {
    const user = await User.findOne({
      where: {
        resetToken: passwordToken,
        id: userId,
        resetTokenExpiration: {
          [Op.gt]: Date.now(),
        },
      },
    });
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    user.save();
    return res.status(200).json(user);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};




``

  //need to be updated
async function addNewAdd(req,res,next){
  try {
    //let userId=req.user.id;
    let userId= 94;
    let images = req.files;
    let add = await Advertisment.create({
      title:req.body.title,
      description:req.body.description,
      fuel:req.body.fuel,
      cubic:req.body.cubic,
      mileage:req.body.mileage,
      kw:req.body.kw,
      price:req.body.price,
      transmission:req.body.transmission,
      year:req.body.year,
      userId: userId,
      modelId:req.body.model,

    })
    if (images) {
      console.log("test")
      console.log(req.files);
      images.forEach((image) => {
        Images.create({
          path: image.location,
          advertismentId: add.id,
        });
      });
    }
    res.status(201).json(add);
  } catch (error) {
    if(!error.statusCode) error.statusCode=400;
    next(error);
  }
}
  
async function editAdd(req,res,next){
  let id = req.params.addId;
  

  if(!id) next(new Error("Missing params! No id of add to be edited!!"));
  try {
    let add = await Advertisment.findByPk(id);
    
    /*if(add.userId!=req.user.id){
      let err = new Error("You dont have permissions for this action");
      err.statusCode = 401; 
      next(err);
    }*/

    if(req.body.title) add["title"]=req.body.title;
    if(req.body.transmission) add["transmission"]=req.body.transmission;
    if(req.body.fuel) add["fuel"]=req.body.fuel;
    if(req.body.mileage) add["mileage"]=req.body.mileage;
    if(req.body.kw) add["kw"]=req.body.kw;
    if(req.body.cubicCapacity) add["cubic"]=req.body.cubicCapacity;
    if(req.body.year) add["year"]=req.body.year;
    if(req.body.model) add["model"]=req.body.model;
    if(req.body.description) add["description"]=req.body.description;
    if(req.body.price) add["price"]=req.body.price;

    await add.save();
    await add.reload();
    res.status(200).json(add);
  } catch (error) {
      if(!error.statusCode){
        error.statusCode=400;
    }
    next(error);
  }
}


async function deleteAdd(req,res,next){
  let id = req.params.addId;
  try {
    let add = await Advertisment.findByPk(id);

   /* if(add.userId!=req.user.id){
      let err = new Error("You dont have permissions for this action");
      err.statusCode = 401; 
      next(err);
    }*/
    add.destroy();
    res.status(200).json(`Add with id:${id} deleted`);
    

  } catch (error) {
      if(!error.statusCode){
        error.statusCode=400;
    }
    next(error);
  }
}
//comments

async function addComment(req,res,next){
  try {
    let advertismentId = req.params.addId;
    //let userId=req.user.id;
    let userId = 94;
    let comment = await Comment.create({
      text: req.body.text,
      userId: userId,
      advertismentId:advertismentId
    })
    res.status(201).json(comment);
  } catch (error) {
    if(!error.statusCode) error.statusCode=400;
    next(error);
  }  
}


async function deleteComment(res,req,next){
  let id = req.params.commentId;
  try {
    let comment = await Comment.findByPk(id);
    
    comment.destroy();
    res.status(200).json(`Comment with id:${id} deleted`);
  } catch (error) {
      if(!error.statusCode){
        error.statusCode=400;
    }
    next(error);
  }
}


module.exports = {
  logout,
  register,
  login,
  myAdvertisment,
  addNewAdd,
  editAdd,
  deleteAdd,
  addComment,
  deleteComment,
  verifyEmail,
  getResetPassword,
  getNewPassword,
  postNewPassword,
  loginSucceded,
};
