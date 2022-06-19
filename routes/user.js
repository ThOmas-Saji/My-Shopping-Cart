var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
/* GET home page. */
let user;

router.get('/', function (req, res, next) {
  user = req.session.user || null
  let cartCount = null;
  if (user) {
    userHelpers.getCartCount(user._id).then((response) => {
      cartCount = response
    })
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, admin: false, user, cartCount });
  }).catch((err) => {
    console.log('ERRoR')
  })
});

router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.loginErr })
    req.session.loginErr = false;
  }
})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})
router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then(async (id) => {
    let user = await userHelpers.getOneUser(id)
    req.session.loggedIn = true;
    req.session.user = user;
    res.redirect('/')
  })
})
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect('/')
    } else {
      req.session.loginErr = true
      res.redirect('/login')
    }
  })
})

router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelpers.getAllCartProducts(req.session.user._id)
  res.render('user/cart', { admin: false, user, products })
})

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')
})

router.get('/add-to-cart/:id', (req, res) => {

  userHelpers.addToCart(req.params.id, req.session.user._id).then((response) => {
    res.json({ status: true })
  })

})


//middleware for checking user logged in or not
function verifyLogin(req, res, next) {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/signup')
  }
}

module.exports = router;
