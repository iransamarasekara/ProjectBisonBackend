const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const {S3Client,PutObjectCommand } = require('@aws-sdk/client-s3');
const {getSignedUrl} = require('@aws-sdk/s3-request-presigner');

require("dotenv").config();

const s2Client = new S3Client({ 
    region: 'eu-north-1',
    credentials: {
        accessKeyId:process.env.ACCESS_KEY_ID,
        secretAccessKey:process.env.SECRET_ACCESS_KEY
    }
});

const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');

app.use(express.json());
app.use(cors());

// Database Connection With MongoDB
mongoose.connect(`mongodb+srv://Bison:${process.env.PASS}@cluster0.fwkif6z.mongodb.net/t-shirt-new`);


// async function getObjectURL(key){
//     const params = {
//         Bucket: "moramerch",
//         Key: key,
        
//     }

//     try {
//         const url = await getSignedUrl(s2Client, new GetObjectCommand(params), { expiresIn: 900 });
//         return url;
//     } catch (error) {
//         console.error("Error generating signed URL", error);
//         return null;
//     }
// }

// async function putObject(filename, contentType){
//     const params = {
//         Bucket: "moramerch",
//         Key: 'myfiles/' + filename,
//         contentType: contentType,
//     }

//     const url = await getSignedUrl(s2Client, new PutObjectCommand(params));
//     return url;
// }

async function getPutObjectSignedUrl(filename, contentType) {
    const params = {
        Bucket: "moramerch",
        Key: `myfiles/${filename}`,
        ContentType: contentType,
    };

    const url = await getSignedUrl(s2Client, new PutObjectCommand(params), { expiresIn: 900 });
    return url;
}

async function getPutObjectSignedUrl2(filename, contentType) {
    const params = {
        Bucket: "moramerch",
        Key: `slipfiles/${filename}`,
        ContentType: contentType,
    };

    const url = await getSignedUrl(s2Client, new PutObjectCommand(params), { expiresIn: 900 });
    return url;
}



//API Creation

app.get("/", async (req, res)=>{
    res.send("Express App is Running")
})

// Endpoint to get a signed URL for uploading a file
app.get('/upload', async (req, res) => {
    const filename = "test.mp4";
    const contentType = "video/mp4";
    try {
        const url = await getPutObjectSignedUrl(filename, contentType);
        res.json({ url });
    } catch (error) {
        console.error("Error generating signed URL", error);
        res.status(500).send("Error generating signed URL");
    }
});

// Setting up multer middleware for handling multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Creating upload endpoint for images
app.post("/upload", upload.single('product'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send("No file uploaded.");
    }

    const filename = `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`;
    const contentType = file.mimetype;

    try {
        const url = await getPutObjectSignedUrl(filename, contentType);
        // Here you would typically upload the file to S3 using the signed URL.
        // This is a simplified example:
        const uploadParams = {
            Bucket: "moramerch",
            Key: `myfiles/${filename}`,
            Body: file.buffer,
            ContentType: contentType,
        };
        await s2Client.send(new PutObjectCommand(uploadParams));

        res.json({
            success: 1,
            image_url: `https://moramerch.s3.eu-north-1.amazonaws.com/myfiles/${filename}`
        });
    } catch (error) {
        console.error("Error uploading file to S3", error);
        res.status(500).send("Error uploading file to S3");
    }
});


// //photo upload
// app.get('/upload', async (req, res) =>{
//     let url = await putObject("test.mp4", "video/mp4");
//     console.log(url);
// })

// Image Storage Engine

// const storage = multer.diskStorage({
//     destination: './upload/images',
//     filename:(req, file, cb)=>{
//         return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
//     }
// })

// const upload = multer({storage:storage})

//Creating Upload Endpoint for images

// app.use('/images',express.static('upload/images'))

// app.post("/upload", upload.single('product'),(req,res)=>{
//     res.json({
//         success:1,
//         image_url: `http://localhost:${port}/images/${req.file.filename}`
//     })
// })

// Schema for Creating Products

const Product = mongoose.model("Product",{
    id:{
        type: Number,
        required: true,
    },
    name:{
        type: String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type: String,
        required: true,
    },
    new_price:{
        type:Number,
        // required: true,
    },
    old_price:{
        type:Number,
        // required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true,
    },
    description:{
        type:String,
    },
    colors:{
        type:Object,
    },
    image_logo:{
        type:String,
    },
    avl_size:{
        type:Object,
    },
    image_2:{
        type:String,
    },
    image_3:{
        type:String,
    },
    rating:{
        type:Number,
    },
    reviewText:{
        type:Object,
    },
    no_of_rators:{
        type:Number,
    },
    size_guide:{
        type:String,
    },
    acc_no:{
        type:String,
    },
    avl_order_types:{
        type:String,
    },
    bank:{
        type:String,
    },
    acc_name:{
        type:String,
    },
    acc_branch:{
        type:String,
    },
    acc_no2:{
        type:String,
    },
    bank2:{
        type:String,
    },
    acc_name2:{
        type:String,
    },
    acc_branch2:{
        type:String,
    },

})

app.post('/addproduct', async (req,res)=>{
    // let descbox = [];
    // for(let i = 0; i < 50; i++){
    //     let text = '';
    //     let name = '';
    //     let profilephoto = '';
    //     let rating = 0; 

    //     descbox.push({
    //         text,
    //         name,
    //         profilephoto,
    //         rating
    //     })
    // }
    let products = await Product.find({});
    let id;
    if(products.length>0)
    {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }
    else{
        id=1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
        description:req.body.description,
        colors:req.body.colors,
        image_logo:req.body.image_logo,
        avl_size:req.body.avl_size,
        image_2:req.body.image_2,
        image_3:req.body.image_3,
        rating:req.body.rating,
        reviewText:req.body.reviewText,
        no_of_rators:req.body.no_of_rators,
        size_guide:req.body.size_guide,
        acc_no:req.body.acc_no,
        avl_order_types:req.body.avl_order_types,
        bank:req.body.bank,
        acc_name:req.body.acc_name,
        acc_branch:req.body.acc_branch,
        acc_no2:req.body.acc_no2,
        bank2:req.body.bank2,
        acc_name2:req.body.acc_name2,
        acc_branch2:req.body.acc_branch2,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})

// Creating API for deleting products

app.post('/removeproduct', async(req, res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })
})

//creating endpoint for getting related products
app.post('/getrelatedproducts', async (req,res)=>{
    let products = await Product.find({category:req.body.category});
    let related_products = products.slice(-4).reverse();
    console.log("Related products fetched");
    res.send(related_products);
})
//creating API for set available or not
app.post('/setavailablestate',async (req,res)=>{
    console.log("AvailableStateAdded",req.body.itemId);
    let currentProduct = await Product.findOne({id:req.body.itemId});
    currentProduct.available = req.body.available;   
    await Product.findOneAndUpdate({id:req.body.itemId},{available:currentProduct.available});
    res.send("AvailableStateAdded")
})

//creating API for set reviews and ratings
app.post('/addreview',async (req,res)=>{
    console.log("reviewAdded",req.body.itemId);
    let currentProduct = await Product.findOne({id:req.body.itemId});
    currentProduct.reviewText[currentProduct.no_of_rators+1].text = req.body.text;   
    currentProduct.reviewText[currentProduct.no_of_rators+1].name = req.body.name;
    currentProduct.reviewText[currentProduct.no_of_rators+1].profilephoto = req.body.profilephoto;
    currentProduct.reviewText[currentProduct.no_of_rators+1].rating = req.body.rating;    
    currentProduct.rating = (currentProduct.rating * currentProduct.no_of_rators + req.body.rating) / (currentProduct.no_of_rators + 1);                  //.push(req.body.review);
    currentProduct.no_of_rators += 1;
    
    await Product.findOneAndUpdate({id:req.body.itemId},{reviewText:currentProduct.reviewText, no_of_rators:currentProduct.no_of_rators, rating:currentProduct.rating});
    res.send("reviewAdded")
})

app.post('/addrating',async (req,res)=>{
    console.log("ratingAdded",req.body.itemId);
    let currentProduct = await Product.findOne({id:req.body.itemId});
    currentProduct.rating = req.body.rating;
    currentProduct.no_of_rators += 1;
    await Product.findOneAndUpdate({id:req.body.itemId},{rating:currentProduct.rating, no_of_rators:currentProduct.no_of_rators});
    res.send("ratingAdded")
})



// Creating API for getting all products

app.get('/allproducts',async (req, res)=>{
    let products = await Product.find({});
    products = products.reverse();
    console.log("All Products Fetched");
    res.send(products);
})

// Shema creating for User model

const Users = mongoose.model('Users', {
    email:{
        type:String,
    },
    name:{
        type:String,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    index:{
        type:String,
        required:true,
    },
    faculty:{
        type:String,
        required:true,
    },
    department:{
        type:String,
        required:true,
    },
    batch:{
        type:String,
        required:true,
    },
    profile_pic:{
        type:String,
    },
    isVerified:{
        type:Boolean,
        default:false,
    }
})



// creating endpoint for registering user
app.post('/signup', async(req, res)=>{

    let users = await Users.find({});
    let id;
    if(users.length>0)
    {
        id = users.length+1;
    }
    else{
        id=1;
    }

    let check = await Users.findOne({email:req.body.email});
    let check1 = await Users.findOne({name:req.body.name});
    let check2 = await Users.findOne({password:req.body.password});
    let check3 = await Users.findOne({index:req.body.index});
    
    if(check){
        return res.status(400).json({success:false,errors:"existing user found with same email address."})
    }
    if(check1){
        return res.status(400).json({success:false,errors:"existing user found with same username. enter your full name."})
    }
    if(check2){
        return res.status(400).json({success:false,errors:"try another password."})
    }
    if(check3){
        return res.status(400).json({success:false,errors:"existing user found with same index. please contact via whatsApp."})
    }
    let cart =[];
    for(let i =0; i < 300; i++){
        let q = 0;
        let size =[];
        let color =[];
        cart.push({
            q,
            size,
            color,
        })
    }
    const user = new Users({
        name: req.body.username,
        // email: req.body.email,
        email: String(id),
        password: req.body.password,
        cartData: cart,
        index: req.body.index,
        faculty: req.body.faculty,
        department: req.body.department,
        batch: req.body.batch,
        profile_pic: req.body.profile_pic,
        isVerified: false,
    });

    // const token = jwt.sign({ user: userData }, 'secret_ecom', { expiresIn: '1h' });

    await user.save();

    const data = {
        user:{
            id:user.id,
            email:req.body.email
        }
    }
    const token = jwt.sign(data, 'secret_ecom', { expiresIn: '24h' });
    // res.json({success:true,token})

    /** send mail to user */
    // let testAccount = await nodemailer.createTestAccount();
    let config = {
        service : 'gmail',
        auth : {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    }

    // const transporter = nodemailer.createTransport({
    //     host: "smtp.ethereal.email",
    //     port: 587,
    //     secure: false, // Use `true` for port 465, `false` for all other ports
    //     auth: {
    //       user: testAccount.user,
    //       pass: testAccount.pass,
    //     },
    //   });

    const transporter = nodemailer.createTransport(config);
    const verificationUrl = `https://moramerc.lk/verify-email?token=${token}`;


    let message = {
    from: 'MORAMERC', // sender address
    to: req.body.email, // list of receivers
    subject: "Register for MORAMERC", // Subject line
    text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
    html: `Please verify your email by clicking on the following link: <a href="${verificationUrl}">${verificationUrl}</a>`,
    }

    transporter.sendMail(message, (err, info) => {
        if (err) {
            console.error('Error sending email', err);
            return res.status(500).json({ success: false, errors: 'Error sending verification email' });
        } else {
            console.log('Verification email sent', info.response);
            res.json({ success: true, token });
        }
    });
    // .then(()=>{
    // const token = jwt.sign(data, 'secret_ecom');
    // return res.status(201).json({ 
    //     msg: "you should raceive an email", 
    //     success:true,
    //     token,
    // })
    // }).catch(error => {
    // return res.status(500).json({error})
    // })

    /** end of sending mail  */

    
})

app.get('/verify-email', async (req, res) => {
    const token = req.query.token;

    if (!token) {
        console.log('Invalid or missing token');
        return res.status(400).json({ error: 'Invalid or missing token' });
    }

    try {
        const decoded = jwt.verify(token, 'secret_ecom');
        const user = await Users.findById(decoded.user.id);
        if (!user) {
            console.log('User not found');
            return res.status(400).json({ error: 'User not found' });
        }

        user.isVerified = true;
        user.email = decoded.user.email;
        await user.save();
        console.log('Email verified successfully!');
        res.status(200).json({ message: 'Email verified successfully!' });
    } catch (err) {
        console.log('Invalid or expired token');
        return res.status(400).json({ error: 'Invalid or expired token' });
    }
});


///////////////////////////////////////////////////////////
// Creating API for getting all users

// app.get('/allusers',async (req, res)=>{
//     let users = await Users.find({});
//     console.log("All Users Fetched");
//     res.send(users);
// })

// Creating API for remove user

app.post('/removeuser', async(req, res)=>{
    await Users.findOneAndDelete({email:req.body.email});
    console.log("User Removed");
    res.json({
        success:true,
        email:req.body.email
    })
})


////////////////////////////////////////////////////////////////////

// creating endpoint for user login

app.post('/login',async (req, res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password===user.password;
        if(passCompare && user.isVerified){
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else{
            res.json({success:false, errors:"Wrong Email or Password"});
        }
    }
    else{
        res.json({success:false, errors:"Wrong Email or Password"})
    }
})

//creating endpoint for newcollection data
app.get('/newcollections', async (req, res)=>{
    let products = await Product.find({});

    let newcollection = products.slice(-8).reverse();
    console.log("NewCollection Fetched");
    res.send(newcollection);
})

//creating endpoint for popular in mora section
app.get('/popularinmora', async (req,res)=>{
    let products = await Product.find({category:'t-shirts'});
    let popular_in_mora = products.slice(-4).reverse();
    console.log("Popular in mora fetched");
    res.send(popular_in_mora);
})

// creating middelware to fetch user
    const fetchUser = async (req,res,next)=>{
        const token = req.header('auth-token');
        if(!token){
            res.status(401).send({errors:"Please authenticate using valid token"})
        }
        else{
            try{
                const data = jwt.verify(token,'secret_ecom');
                req.user = data.user;
                next();
            }catch(error){
                res.status(401).send({errors:"Please authenticate using valid token"})
            }
        }
    }

//creating endpoint for adding products in cartdata
app.post('/addtocart',fetchUser,async (req,res)=>{
    console.log("added",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId].q +=1;
    userData.cartData[req.body.itemId].size.push(req.body.sizeId);
    userData.cartData[req.body.itemId].color.push(req.body.colorId);
    await Users.findByIdAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added")
})

//creating end point for add profile photo
app.post('/addprofilephoto',fetchUser,async (req,res)=>{
    console.log("dpAdded",req.body.itemId);
    let currentUser = await Users.findOne({_id:req.user.id});
    currentUser.profile_pic = req.body.profile_pic;
    await Users.findByIdAndUpdate({_id:req.user.id},{profile_pic:currentUser.profile_pic});
    res.send("dpAdded")
})

//creating endpoint for change password
app.post('/changepassword',fetchUser,async (req,res)=>{
    console.log("changed");
    let userData = await Users.findOne({_id:req.user.id});
    userData.password = req.body.password;
    await Users.findByIdAndUpdate({_id:req.user.id},{password:userData.password});
    res.send({success:true})
})


//creating end point to remove product from cartdata
app.post('/removefromcart',fetchUser,async (req,res)=>{
    console.log("removed",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId].q>0)
    userData.cartData[req.body.itemId].q -=1;
    delete userData.cartData[req.body.itemId].size[req.body.sizeId];
    delete userData.cartData[req.body.itemId].color[req.body.sizeId];//both are equal positions
    await Users.findByIdAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")
})
//////////////////////////////////////////////////////////////////////////////////////////////////

//creating end point to remove all  products from cartdata
app.post('/removeallfromcart',fetchUser,async (req,res)=>{
    console.log("Allremoved",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId].q>0)
    userData.cartData[req.body.itemId].q =0;
    userData.cartData[req.body.itemId].size =[];
    userData.cartData[req.body.itemId].color =[];
    await Users.findByIdAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")
})

////////////////////////////////////////////////////////////////////////////////////////////////////

//creating endpoint to get cart data
app.post('/getcart',fetchUser,async (req,res)=>{
    console.log("GetCart");
    let userData = await Users.findOne({_id:req.user.id});
    if(userData){
        res.json(userData.cartData);
    }
})

///////////////////////////////////////////////////////////////

//creating API for get user

app.post('/getuser',fetchUser,async (req,res)=>{
    console.log("GetUser");
    let userEmail = await Users.findOne({_id:req.user.id});
    res.json(userEmail.email);
})

//creating API for get user by email///////////////////////////////////////////////////////////////////////////////////////////

app.post('/getuserbymail', async (req, res) => {
    console.log("GetUser By Mail");
    // Use projection to exclude the password field from the result
    let user = await Users.findOne({email: req.body.email}, {password: 0});
    res.json(user);
});

// Image Storage Engine for slips


const storage_slip = multer.memoryStorage();
const upload_slip = multer({ storage: storage_slip });

// Creating upload endpoint for images
app.post("/slipupload", upload_slip.single('order'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send("No file uploaded.");
    }

    const filename = `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`;
    const contentType = file.mimetype;

    try {
        const url = await getPutObjectSignedUrl2(filename, contentType);
        // Here you would typically upload the file to S3 using the signed URL.
        // This is a simplified example:
        const uploadParams = {
            Bucket: "moramerch",
            Key: `slipfiles/${filename}`,
            Body: file.buffer,
            ContentType: contentType,
        };
        await s2Client.send(new PutObjectCommand(uploadParams));

        res.json({
            success: 1,
            image_url: `https://moramerch.s3.eu-north-1.amazonaws.com/slipfiles/${filename}`
        });
    } catch (error) {
        console.error("Error uploading file to S3", error);
        res.status(500).send("Error uploading file to S3");
    }
});






// const storage_slip = multer.diskStorage({
//     destination: './slipupload/slipimages',
//     filename:(req, file, cb)=>{
//         return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)

//     }
// })

// const upload_slip = multer({storage:storage_slip})

//Creating Upload Endpoint for slip images

// app.use('/slipimages',express.static('slipupload/slipimages'))

// app.post("/slipupload", upload_slip.single('order'),(req,res)=>{
//     res.json({
//         success:1,
//         image_url: `http://localhost:${port}/slipimages/${req.file.filename}`
//     })
// })

// schema for creating Orders

const Order = mongoose.model("Order",{
    id:{
        type: Number,
        required: true,
    },
    uder_id:{
        type: String,//this is email of the user
        required:true,
    },
    slip_image:{
        type:String,
    },
    num_purchase_products:{
        type: Number,
        required: true,
    },
    product_size:{
        type:Object,///////////////////////////////
        required:true,
    },
    product_color:{
        type:Object,///////////////////////////////
        required:true,
    },
    whatsApp:{
        type:String,
        required: true,
    },
    product_id:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    order_type:{
        type:String,
        required:true,
    },
    total:{
        type:Number,
        required: true,
    },
    username:{
        type:String,
        required:true,
    },
    productname:{
        type:String,
        required:true,
    },
    index:{
        type:String,
    },
    batch:{
        type:String,
    },
    faculty:{
        type:String,
    },
    department:{
        type:String,
    },
})

 

app.post('/orderconfirmation', async (req,res)=>{
    let orders = await Order.find({});
    let id;
    if(orders.length>0)
    {
        let last_order_array = orders.slice(-1);
        let last_order = last_order_array[0];
        id = last_order.id+1;
    }
    else{
        id=1;
    }
    const order = new Order({
        id:id,
        uder_id:req.body.uder_id,
        slip_image:req.body.slip_image,
        num_purchase_products:req.body.num_purchase_products,
        product_size:req.body.product_size,
        product_color:req.body.product_color,
        whatsApp:req.body.whatsApp,
        product_id:req.body.product_id,
        order_type:req.body.order_type,
        total:req.body.total,
        username:req.body.username,
        productname:req.body.productname,
        index:req.body.index,
        batch:req.body.batch,
        faculty:req.body.faculty,
        department:req.body.department,
    });
    console.log(order);
    await order.save();
    console.log("Saved");
    res.json({
        success:true,
        user_id:req.body.uder_id,
    });

    /** sent a mail when order */

    let config = {
        service:'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    }
    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
        theme:'default',
        product:{
            name:'MORAMERC',
            link: 'https://mailgen.js/'
        }
    })

    let desc = 'You have '+req.body.order_type+" "+req.body.num_purchase_products+" "+req.body.productname;

    let response = {
        body:{
          name:req.body.username,
          intro:  "Your bill has arrived!",
          table: {
            data:[
                {
                    item: req.body.productname,
                    description: desc,
                    price : req.body.total,
                }
            ]
          },
          outro: 'Thank you for order from us!'
        }
    }

    let mail = MailGenerator.generate(response)

    let message = {
        from : process.env.EMAIL,
        to : req.body.uder_id,
        subject : 'Place your Order',
        html: mail
    }

    transporter.sendMail(message);
    // .then(()=>{
    //     return res.status(200).json({
    //         mas:"You should recieve an email",
    //         success:true,
    //         user_id:req.body.uder_id,
    //     })
    // }).catch(error => {
    //     return res.status(500).json({ error});
    // });
    /** end of mail */
    
    
})

//creating endpoint for getting orders by product id
//shold pass product id in request
app.post('/getordersusingid', async (req,res)=>{
    let orders = await Order.find({product_id:req.body.product_id});
    console.log("Get that product orders");
    res.json(orders);
})

//creating endpoint for getting orders of a user
app.post('/getordersofuser', async (req,res)=>{
    let orders = await Order.find({uder_id:req.body.uder_id});
    console.log("Get that user's order");
    res.json(orders);
})

// Creating API for deleting orders by product id

app.post('/removeorder', async(req, res)=>{
    let orders = await Order.find({product_id:req.body.product_id});
    for(i=0;i<orders.length;i++){
        await Order.findOneAndDelete({product_id:req.body.product_id});
    }
    console.log("Removed");
    res.json({
        success:true,
        product_id:req.body.product_id
    })
})


///////////////////////////////////////////////////////////////////////////////////////////////

const Advertisements = mongoose.model("Adverticements", {
    adid:{
        type: String,
        required: true,
    },
    ad_image:{
        type: String,
    },
    ad_category:{
        type: String,
    }
})

app.post('/addAdertisement', async(req, res)=>{

    let adds = await Advertisements.find({});
    let id;
    if(adds.length>0)
    {
        let last_add_array = adds.slice(-1);
        let last_add = last_add_array[0];
        id = last_add.id+1;
    }
    else{
        id=1;
    }

    const add = new Advertisements({
        adid:id,
        ad_image:req.body.ad_image,
        ad_category: req.body.ad_category,
    })

    await add.save();

    res.json({
        success:true,
        name:req.body.name,
    });
})

//creating endpoint for get all advertisements

app.get('/alladvertisements',async (req, res)=>{
    let adds = await Advertisements.find({});
    adds = adds.reverse();
    console.log("All Advertisements Fetched");
    res.send(adds);
})

app.listen(port, (error)=>{
    if(!error){
        console.log("Server Running on Port "+port)
    }
    else{
        console.log("Error : "+error)
    }
})
