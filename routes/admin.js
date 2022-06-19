var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products.hbs', { admin: true, products })
  }).catch((err) => {
    console.log("eRROR")
  })
});

router.get('/add-product', (req, res) => {
  res.render('admin/add-product', { admin: true })
})

router.post('/add-product', (req, res) => {
  productHelpers.addProducts(req.body, (id) => {
    let image = req.files.image;
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-product', { admin: true });
      } else {
        console.log(err)
      }
    })

  })
  return;
})

router.get('/delete-product/:id', (req, res) => {
  productHelpers.deleteProduct(req.params.id).then((response) => { })
  res.redirect('/admin')
})
router.get('/edit-product/:id', async(req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit-product', {product, admin:true})
})

router.post('/edit-product/:id', (req, res)=> {
  productHelpers.updateProduct(req.params.id, req.body).then(()=>{

  })
  res.redirect('/admin')
  if(req.files.image){
    let  image = req.files.image;
    image.mv('./public/product-images/' + req.params.id + '.jpg');
  }
})
module.exports = router;
