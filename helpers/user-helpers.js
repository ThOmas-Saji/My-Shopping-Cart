const db = require('../config/connect')
const { USERS_COLLECTION, CART_COLLECTION, PRODUCTS_COLLECTION, ORDER_COLLECTION } = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('../app')
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
        return console.log('Login Failed')
      } else {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false })
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
  getPlacedUserOrder: (userId) => {
    
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(ORDER_COLLECTION).findOne({ userId: objectId(userId) });
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
      resolve();
    })
  }
}