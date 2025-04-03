var express = require('express');
const slugify = require('slugify'); // Add slugify library
const { ConnectionCheckOutFailedEvent } = require('mongodb');
let router = express.Router();
let categoryModel = require('../schemas/category'); // ĐẢM BẢO CÓ DÒNG NÀY
let productModel = require('../schemas/product');   // ĐẢM BẢO CÓ DÒNG NÀY
function buildQuery(obj){
  console.log(obj);
  let result = {};
  if(obj.name){
    result.name=new RegExp(obj.name,'i');
  }
  result.price = {};
  if(obj.price){
    if(obj.price.$gte){
      result.price.$gte = obj.price.$gte;
    }else{
      result.price.$gte = 0
    }
    if(obj.price.$lte){
      result.price.$lte = obj.price.$lte;
    }else{
      result.price.$lte = 10000;
    }
  }else{
    result.price.$gte = 0;
    result.price.$lte = 10000;
  }
  console.log(result);
  return result;
}

/* GET users listing. */
router.get('/', async function(req, res, next) {
  

  let products = await productModel.find(buildQuery(req.query)).populate("category");

  res.status(200).send({
    success:true,
    data:products
  });
});
router.get('/:id', async function(req, res, next) {
  try {
    let id = req.params.id;
    let product = await productModel.findById(id);
    res.status(200).send({
      success:true,
      data:product
    });
  } catch (error) {
    res.status(404).send({
      success:false,
      message:"khong co id phu hop"
    });
  }
});

router.get('/slug/:category/:product', async function(req, res, next) {
  try {
    let categorySlug = req.params.category;
    let productSlug = req.params.product;

    let category = await categoryModel.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found"
      });
    }

    let product = await productModel.findOne({ slug: productSlug, category: category._id });
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).send({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

router.post('/', async function(req, res, next) {
  try {
    let cate = await CategoryModel.findOne({ name: req.body.category });
    if (cate) {
      let newProduct = new productModel({
        name: req.body.name,
        slug: slugify(req.body.name, { lower: true }), // Generate slug
        price: req.body.price,
        quantity: req.body.quantity,
        category: cate._id
      });
      await newProduct.save();
      res.status(200).send({
        success: true,
        data: newProduct
      });
    } else {
      res.status(404).send({
        success: false,
        data: "cate khong dung"
      });
    }
  } catch (error) {
    res.status(404).send({
      success: false,
      message: error.message
    });
  }
});

router.put('/:id', async function(req, res, next) {
  try {
    let updateObj = {};
    let body = req.body;
    if (body.name) {
      updateObj.name = body.name;
      updateObj.slug = slugify(body.name, { lower: true }); // Update slug if name changes
    }
    if(body.price){
      updateObj.price = body.price;
    }
    if(body.quantity){
      updateObj.quantity = body.quantity;
    }
    if(body.category){
      let cate = await CategoryModel.findOne({name:req.body.category});
      if(!cate){
        res.status(404).send({
          success:false,
          message:error.message
        });
      }
    }
    let updatedProduct = await productModel.findByIdAndUpdate(req.params.id,
      updateObj,
      {new:true})
    res.status(200).send({
      success:true,
      data:updatedProduct
    });
  } catch (error) {
    res.status(404).send({
      success:false,
      message:error.message
    });
  }
});
router.delete('/:id', async function(req, res, next) {
  try {
    let product = await productModel.findById(req.params.id);
    if(product){
      let deletedProduct = await productModel.findByIdAndUpdate(req.params.id,
        {
          isDeleted:true
        },
        {new:true})
        res.status(200).send({
          success:true,
          data:deletedProduct
        });
    }else{
      res.status(404).send({
        success:false,
        message:"ID khong ton tai"
      });
    }
  } catch (error) {
    res.status(404).send({
      success:false,
      message:error.message
    });
  }
});

// Lấy tất cả sản phẩm theo category slug
router.get('/slug/:category', async (req, res) => {
    try {
        let category = await categoryModel.findOne({ slug: req.params.category });
        if (!category) {
            return res.status(404).send({ success: false, message: "Danh mục không tồn tại" });
        }

        let products = await productModel.find({ category: category._id });
        res.status(200).send({ success: true, data: products });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

// Lấy sản phẩm theo category slug và product slug
router.get('/slug/:category/:product', async (req, res) => {
    try {
        let category = await categoryModel.findOne({ slug: req.params.category });
        if (!category) {
            return res.status(404).send({ success: false, message: "Danh mục không tồn tại" });
        }

        let product = await productModel.findOne({ slug: req.params.product, category: category._id });
        if (!product) {
            return res.status(404).send({ success: false, message: "Sản phẩm không tồn tại" });
        }

        res.status(200).send({ success: true, data: product });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

module.exports = router;