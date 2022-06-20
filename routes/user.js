var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
/* GET home page. */
let user;
let cartCount = 0;

router.get('/', async function (req, res, next) {
  user = req.session.user || null
  cartCount = 0;
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id)
  }
  let products = await productHelpers.getAllProducts()
  res.render('user/view-products', { products, admin: false, user, cartCount })
});

router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.loginErr, error: false })
    req.session.loginErr = false;
  }
})
router.get('/signup', (req, res) => {
  res.render('user/signup', { error: false })
})
router.post('/signup', (req, res) => {
  if (!req.body.email || !req.body.password || !req.body.username) {
    res.render('user/signup', { error: true })
  } else {
    userHelpers.doSignup(req.body).then(async (id) => {
      let user = await userHelpers.getOneUser(id)
      req.session.loggedIn = true;
      req.session.user = user;
      res.redirect('/')
    })
  }
})
router.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.render('user/login', { error: true })
  } else {
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
  }
})

router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelpers.getAllCartProducts(req.session.user._id)
  cartCount = null;
  cartCount = await userHelpers.getCartCount(req.session.user._id)
  let total = 0
  products.forEach((el) => {
    let qty = el.quantity;
    let price = el.product.price;
    let sum = qty * price
    total += sum;
  })
  res.render('user/cart', { admin: false, user, products, cartCount, total })
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
router.get('/change-total', async (req, res) => {
  let products = await userHelpers.getAllCartProducts(req.session.user._id)
  let total = 0
  products.forEach((el) => {
    let qty = el.quantity;
    let price = el.product.price;
    let sum = qty * price
    total += sum;
  })
  res.json({ total })
})

router.post('/change-product-quantity', (req, res) => {
  userHelpers.changeProductQuantity(req.body).then((response) => {
    res.json(response)
  })
})

router.post('/remove-product-from-cart', (req, res) => {
  userHelpers.removeProductFromCart(req.body).then((response) => {
    res.json(response)
  })
})
router.get('/place-order', verifyLogin, async (req, res) => {
  user = req.session.user
  let products = await userHelpers.getAllCartProducts(req.session.user._id)
  let total = 0
  products.forEach((el) => {
    let qty = el.quantity;
    let price = el.product.price;
    let sum = qty * price
    total += sum;
  })
  res.render('user/place-order', { user, total, error: false })
})

let latestOrder;
router.post('/place-order', async (req, res) => {
  user = req.session.user
  let products = await userHelpers.getAllCartProducts(req.session.user._id)
  let total = 0
  products.forEach((el) => {
    let qty = el.quantity;
    let price = el.product.price;
    let sum = qty * price
    total += sum;
  })
  if (!req.body.full_name ||
    !req.body.mobile ||
    !req.body.address ||
    !req.body.pincode ||
    !req.body.payment_method) {
    res.json({ status: false, razorpay: false, onlilePayError: false })
  } else {
    latestOrder = await userHelpers.placeOrder(req.body, products, total);
    if (req.body.payment_method === 'COD') {
      res.json({ status: true, razorpay: false, onlilePayError: false })
    } else {
      let razorpayOrder = await userHelpers.generateRazorpay(latestOrder, total);
      if (razorpayOrder.error) {
        res.json({ status: false, razorpay: false, onlilePayError: true })
      } else {
        res.json({ status: false, razorpay: true, razorpayOrder, onlilePayError: false })
      }

    }
  }
})
router.post('/verify-payment', verifyLogin, async (req, res) => {
  try {
    await userHelpers.verifyPayment(req.body)
    await userHelpers.changeOrderStatus(req.body.orderId)
    console.log("first")
    res.json({ status: true, message: 'Payment Success' })
  } catch (err) {
    console.log("failed")
    res.json({ status: false, message: 'Payment Failed' })
  }
})

router.get('/order-complete', verifyLogin, async (req, res) => {
  let { deliveryDetails, payment_method, status, products, total, date } = await userHelpers.getPlacedUserOrder(latestOrder)
  res.render('user/order-complete', { user, date, deliveryDetails, payment_method, status, products, total })
})

router.get('/orders', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getAllOrders(req.session.user._id);
  user = req.session.user || null
  cartCount = 0;
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id)
  }
  console.log(orders)
  res.render("user/orders", { orders, user, cartCount })
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
