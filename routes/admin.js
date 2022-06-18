var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function (req, res, next) {
  const prod = [{
    product_name: "OPPO A15s",
    price: 3394,
    image_url: 'https://m.media-amazon.com/images/I/7136zgtNmJL._SX522_.jpg'
  }, {
    product_name: "iQOO Neo 6 5G",
    price: 1633,
    image_url: 'https://m.media-amazon.com/images/I/71WS-0ITj7L._SX522_.jpg'
  }, {
    product_name: "realme narzo 50",
    price: 1608,
    image_url: 'https://m.media-amazon.com/images/I/81gRC3KTeaL._SX522_.jpg'
  }, {
    product_name: "TiQOO Z6 Pro 5G",
    price: 3589,
    image_url: 'https://m.media-amazon.com/images/I/61E4zA32FrL._SX522_.jpg'
  }, {
    product_name: "realme narzo 50A",
    price: 612,
    image_url: 'https://m.media-amazon.com/images/I/81Ke5qtC6oL._SX522_.jpg'
  }, {
    product_name: "iQOO Z6 44W",
    price: 1685,
    image_url: 'https://m.media-amazon.com/images/I/61AFUMyh5QL._SY679_.jpg'
  }, {
    product_name: "Tecno Spark 8 Pro",
    price: 2096,
    image_url: 'https://m.media-amazon.com/images/I/81Q+kokB8GL._SY679_.jpg'
  }, {
    product_name: "Tecno Spark 8T",
    price: 2274,
    image_url: 'https://m.media-amazon.com/images/I/71AWvZMY6LL._SX522_.jpg'
  }, {
    product_name: "Lava Agni 5G |64 MP AI",
    price: 1993,
    image_url: 'https://m.media-amazon.com/images/I/714CC75KiyL._SY679_.jpg'
  }, {
    product_name: "Apple iPhone 13",
    price: 862,
    image_url: 'https://m.media-amazon.com/images/I/71xb2xkN5qL._SX522_.jpg'
  }]
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products.hbs', { admin: true, products })
  }).catch((err)=>{
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
        res.render('admin/add-product');
      } else {
        console.log(err)
      }
    })

  })
  return;
})

module.exports = router;
