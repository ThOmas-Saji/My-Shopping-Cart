const db = require('../config/connect')
const { USERS_COLLECTION, CART_COLLECTION, PRODUCTS_COLLECTION, ORDER_COLLECTION } = require('../config/collections')
const bcrypt = require('bcrypt')
const Razorpay = require('razorpay')
const crypto = require('crypto');
const { resolve } = require('path');
const objectId = require('mongodb').ObjectId

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 8);
      db.get().collection(USERS_COLLECTION).insertOne(userData).then((data) => {
        let res = data.insertedId.toString()
        res = res.split('(')
        resolve(res[0]);
      })
    })
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db.get().collection(USERS_COLLECTION).findOne({ email: userData.email })
      if (!user) {
        resolve({ status: false, message: 'Email or Passoword is wrong !' })
      } else {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false, message: 'Email or Passoword is wrong !' })
          }
        })
      }
    })
  },
  getOneUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(USERS_COLLECTION).findOne({ _id: objectId(userId) }).then((response) => {
        resolve(response);
      })
    })
  },
  addToCart: (productId, userId) => {
    let productObj = {
      item: objectId(productId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(CART_COLLECTION).findOne({ user: objectId(userId) })
      if (userCart) {
        let productExist = userCart.products.findIndex(product => product.item == productId)
        if (productExist != -1) {
          db.get().collection(CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(productId) }, {
            $inc: {
              'products.$.quantity': 1
            }
          }).then((response) => {
            resolve({ stauts: true });
          })
        }
        else {
          db.get().collection(CART_COLLECTION).updateOne({ user: objectId(userId) }, {
            $push: { products: productObj }
          }).then(() => {
            resolve({ stauts: true });
          })
        }
      } else {
        let cart = {
          user: objectId(userId),
          products: [productObj]
        }
        db.get().collection(CART_COLLECTION).insertOne(cart).then(() => {
          resolve({ stauts: true });
        })
      }
    })
  },
  getAllCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db.get().collection(CART_COLLECTION).aggregate([
        {
          $match: {
            user: objectId(userId)
          }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: PRODUCTS_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: "product"

          },
        }, {
          $project: {
            item: 1,
            quantity: 1,
            product: {
              $arrayElemAt: ['$product', 0]
            }
          }
        }
      ]).toArray()
      resolve(cartItems);
    })
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0
      let user = await db.get().collection(CART_COLLECTION).findOne({ user: objectId(userId) })
      if (user) {
        count = user.products.length;
      }
      resolve(count);
    })
  },
  changeProductQuantity: ({ cartId, productId, count, quantity }) => {
    count = Number(count)
    quantity = Number(quantity)
    return new Promise((resolve, reject) => {
      if (count == -1 && quantity == 1) {
        db.get().collection(CART_COLLECTION).updateOne({ _id: objectId(cartId) }, {
          $pull: { products: { item: objectId(productId) } }
        }).then((response) => {
          resolve({ removeProduct: true })
        })
      } else {
        db.get().collection(CART_COLLECTION).updateOne({ _id: objectId(cartId), 'products.item': objectId(productId) }, {
          $inc: {
            'products.$.quantity': count
          }
        }).then((response) => {
          resolve(true);
        })
      }
    })
  },
  removeProductFromCart: ({ cartId, productId }) => {
    return new Promise((resolve, reject) => {
      db.get().collection(CART_COLLECTION).updateOne({ _id: objectId(cartId) }, {
        $pull: { products: { item: objectId(productId) } }
      }).then((response) => {
        resolve(true)
      })
    })
  },
  getPlacedUserOrder: (cartId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(ORDER_COLLECTION).findOne({ _id: objectId(cartId) });
      resolve(orders);
    })
  },
  placeOrder: ({ full_name,
    mobile,
    email,
    address,
    pincode,
    userId,
    payment_method }, products, total) => {
    let status = payment_method === 'COD' ? 'Placed' : 'Pending';
    let date = new Date();
    let orderObj = {
      deliveryDetails: {
        full_name,
        address, mobile, pincode, email
      },
      userId: objectId(userId),
      payment_method,
      status,
      products,
      total,
      date
    }
    return new Promise(async (resolve, reject) => {
      let response = await db.get().collection(ORDER_COLLECTION).insertOne(orderObj)
      await db.get().collection(CART_COLLECTION).findOneAndDelete({ user: objectId(userId) })
      let res = response.insertedId.toString()
      res = res.split('(')
      resolve(res[0]);
    })
  },
  getAllOrders: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(ORDER_COLLECTION).aggregate([
        {
          $match: {
            userId: objectId(userId)
          }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity',
          }
        },
        {
          $lookup: {
            from: PRODUCTS_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: "product"

          },
        }, {
          $project: {
            item: 1,
            quantity: 1,
            product: {
              $arrayElemAt: ['$product', 0]
            }
          }
        }
      ]).toArray().then((response) => {
        resolve(response);
      })
    })
  },
  generateRazorpay: (orderId, total) => {
    let instance = new Razorpay({
      key_id: process.env.KEY_ID,
      key_secret: process.env.KEY_SECRET,
    });
    return new Promise(async (resolve, reject) => {
      let options = {
        amount: total,
        currency: 'INR',
        receipt: orderId
      }
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log("Error"+err)
          resolve({error:true})
        } else {
          resolve(order)
        }
      })
    })
  },
  verifyPayment : (deatils)=>{
    return new Promise(async(resolve, reject) =>{
      let hmac = crypto.createHmac('sha256', process.env.SHA256_SECRET_KEY)
      hmac.update(deatils['response[razorpay_order_id]']+'|'+deatils['response[razorpay_payment_id]'])
      hmac = hmac.digest('hex');
      if(hmac == deatils['response[razorpay_signature]']){
        resolve()
      }else{
        reject()
      }
    })
  },
  changeOrderStatus: (orderId) => {
    return new Promise( async(resolve, reject)=>{
      await db.get().collection(ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
        $set:{
          status: "Placed"
        }
      })
      resolve()
    })
  }
}