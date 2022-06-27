var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');


router.get('/', verifyAdmin, function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products.hbs', { admin: req.session.adminLoggin, products, adminLoggin:true })
  }).catch((err) => {
    console.log("eRROR")
  })
});

router.get('/admin-login', (req, res) => {
  res.render('admin/admin-login', { admin: true, adminLoggin: false })
})
router.get('/admin-logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin')
})

router.post('/admin-login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.render('admin/admin-login', { error: true, admin: true, adminLoggin:true })
  } else {
    if (
      req.body.email === process.env.ADMIN_EMAIL && req.body.password === process.env.ADMIN_PASS) {
      req.session.admin = req.body;
      req.session.adminLoggin = true;
      res.redirect('/admin')
    } else {
      res.render('admin/admin-login', { loginErr: true, admin: true })
    }
  }
})

router.get('/add-product', (req, res) => {
  res.render('admin/add-product', { admin: req.session.adminLoggin, adminLoggin:true })
})

router.post('/add-product', (req, res) => {
  productHelpers.addProducts(req.body, (id) => {
    let image = req.files.image;
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-product', { admin: req.session.adminLoggin, adminLoggin:true });
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
router.get('/edit-product/:id', async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit-product', { product, admin: req.session.adminLoggin , adminLoggin:true})
})

router.post('/edit-product/:id', (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then(() => {

  })
  res.redirect('/admin')
  if (req.files.image) {
    let image = req.files.image;
    image.mv('./public/product-images/' + req.params.id + '.jpg');
  }
})

// middleware for checking admin logged in or not
function verifyAdmin(req, res, next) {
  if (req.session.adminLoggin) {
    next();
  } else {
    res.redirect('admin/admin-login');
  }
}

module.exports = router;
