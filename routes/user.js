var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
/* GET home page. */
let user;

router.get('/', function (req, res, next) {
  user = req.session.user || null
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, admin: false, user });
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
  userHelpers.doSignup(req.body).then((data) => {
    console.log(data)
    res.render('user/signup')
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

router.get('/cart', verifyLogin, (req, res) => {
  res.render('user/cart', { admin: false, user })
})

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')
})


//middleware for checking user logged in or not
function verifyLogin(req, res, next) {
  if (req.session.loggedIn) {
    next()
  } else {
    res.render('user/signup')
  }
}

module.exports = router;
