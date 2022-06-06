var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var fs = require("fs");
var uuid = require('uuid');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Mock database data
if (process.env.NODE_ENV === "test") {
   var databaseName = 'db/test_mockdb.json'
} else if (process.env.NODE_ENV === "development") {
   var databaseName = 'db/mockdb.json'
}

// Products
// Get all products
app.get('/products', async (req, res) => {
   fs.readFile(databaseName, 'utf8', (error, data) => {
      if (error) {
         throw error
      }

      // Filter by query strings
      if (req.query?.name) {
         res.send(JSON.parse(data).products.filter(product => product.name === req.query.name))
      } else {
         res.send(JSON.parse(data).products)
      }
   })
})

// Create product
app.post('/products', (req, res) => {
   if (req.body?.name && req.body?.unit_price) {
      fs.readFile(databaseName, (error, data) => {
         if (error) {
            throw error
         }

         var object = JSON.parse(data)
         var newProduct = {
            id: uuid.v4(),
            name: req.body.name,
            unit_price: req.body.unit_price
         }
         object.products.push(newProduct)
         fs.writeFile(databaseName, JSON.stringify(object), () => {
            res.send(newProduct)
         })
      })
   } else {
      res.status(400).end()
   }
})

// Customers
// Get all customers
app.get('/customers', (req, res) => {
   fs.readFile(databaseName, 'utf8', (error, data) => {
      if (error) {
         throw error
      }
      // Filter by query strings
      if (req.query?.name) {
         res.send(JSON.parse(data).customers.filter(customer => customer.name === req.query.name))
      } else {
         res.send(JSON.parse(data).customers)         
      }
   })
})

// Create customer
app.post('/customers', (req, res) => {
   if (req.body?.name && req.body?.address) {
      fs.readFile(databaseName, (error, data) => {
         if (error) {
            throw error
         }

         var object = JSON.parse(data)
         var newCustomer = {
            id: uuid.v4(),
            name: req.body.name,
            address: req.body.address
         }
         object.customers.push(newCustomer)
         fs.writeFile(databaseName, JSON.stringify(object), () => {
            res.send(newCustomer)
         })
      })
   } else {
      res.status(400).end()
   }
})

// Purchases
// Get all purchases
app.get('/purchases', (req, res) => {
   fs.readFile(databaseName, 'utf8', (error, data) => {
      if (error) {
         throw error
      }
      // Filter by query strings
      if (req.query?.customerId) {
         res.send(JSON.parse(data).purchases.filter(purchase => purchase.customerId === req.query.customerId))
      }
      else if (req.query?.productId) {
         var foundPurchases = []
         var purchaseIds = JSON.parse(data).purchase_products.filter(purchaseProduct => purchaseProduct.productId === req.query.productId).map(purchaseProduct => purchaseProduct.purchaseId)
         if (purchaseIds && purchaseIds.length > 0) {
            foundPurchases = JSON.parse(data).purchases.filter(purchase => purchaseIds.includes(purchase.id))
         }
         res.send(foundPurchases)
      } else {
         res.send(JSON.parse(data).purchases)
      }
   })
})

// Create purchase
app.post('/purchases', (req, res) => {
   if (req.body?.customerId && req.body?.productIds?.length > 0) {
      fs.readFile(databaseName, (error, data) => {
         // Customer and products exist?
         var data = JSON.parse(data)
         const foundCustomer = data.customers.find(customer => customer.id === req.body.customerId)
         var productsExist = true
         req.body.productIds.map(id => {
            if (!data.products.find(product => product.id === id)) {
               productsExist = false
            }
         })

         if (!foundCustomer || !productsExist) {
            res.status(400).end()
            return
         }

         var object = data
         var purchaseId = uuid.v4()
         var thisDate = new Date()
         var newPurchase = {
            id: purchaseId,
            customerId: req.body.customerId,
            date: thisDate.getFullYear() + "-" + ("0" + thisDate.getMonth()).slice(-2) + "-" + ("0" + thisDate.getDate()).slice(-2)
         }         
         object.purchases.push(newPurchase)
         // Coupling table for many2many
         req.body.productIds.map(id => {
            var newPurchaseProduct = {
               id: uuid.v4(),
               purchaseId,
               productId: id
            }
            object.purchase_products.push(newPurchaseProduct)
         })
         fs.writeFile(databaseName, JSON.stringify(object), () => {
            res.send(newPurchase)
         })
      })
   } else {
      res.status(400).end()
   }
})

module.exports = app