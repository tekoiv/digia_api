const supertest = require('supertest')
const app = require('../server')
const uuid = require('uuid')
const api = supertest(app)

// Products endpoint

test('Should post to products', async () => {
    const response = await api.post('/products')
        .send({ name: "Test product", unit_price: 20.00 })
    
    expect(response.status).toBe(200)
    expect(response.body.name).toBe("Test product")
    expect(response.body.id).not.toBeNull()
})

test('Should get products', async () => {
    const response = await api.get('/products')

    expect(response.status).toBe(200)
})

test('Should not add invalid product', async () => {
    const response = await api.post('/products')
        .send({ name: "Unit price missing" })

    expect(response.status).toBe(400)
})

test('Should find product by name', async () => {
    // Exact match for clarity
    var someUniqueName = uuid.v4()
    const newProduct = await api.post('/products').send({ name: someUniqueName, unit_price: 20 }).expect(200)
    const foundProducts = await api.get('/products').query({ name: someUniqueName }).expect(200)
    expect(foundProducts.body.length).toBe(1)
    expect(foundProducts.body[0].name).toBe(someUniqueName)

    // No product with this name found
    var someOtherUniqueName = uuid.v4()
    const foundProducts2 = await api.get('/products').query({ name: someOtherUniqueName }).expect(200)
    expect(foundProducts2.body.length).toBe(0)
})

// Customers endpoint

test('Should post to customers', async () => {
    const response = await api.post('/customers')
        .send({ name: "Test customer", address: "Test address" })

    expect(response.status).toBe(200)
    expect(response.body.name).toBe("Test customer")
    expect(response.body.id).not.toBeNull()
})

test('Should get customers', async () => {
    const response = await api.get('/customers')

    expect(response.status).toBe(200)
})

test('Should not add invalid customer', async () => {
    const response = await api.post('/customers')
        .send({ name: "Address is missing" })

    expect(response.status).toBe(400)
})

test('Should find customer by name', async () => {
    // Exact match for clarity
    var someUniqueName = uuid.v4()
    await api.post('/customers').send({ name: someUniqueName, address: "Something" }).expect(200)
    const foundCustomers = await api.get('/customers').query({ name: someUniqueName }).expect(200)
    expect(foundCustomers.body.length).toBe(1)
    expect(foundCustomers.body[0].name).toBe(someUniqueName)

    // No customer with this name found
    var someOtherUniqueName = uuid.v4()
    const foundCustomers2 = await api.get('/customers').query({ name: someOtherUniqueName }).expect(200)
    expect(foundCustomers2.body.length).toBe(0)
})

// Purchases endpoint

test('Should create purchase and required associations', async () => {
    // Create test customer
    const newCustomer = await api.post('/customers').send({ name: "Test customer 22", address: "Test address 22" })
    const customer = newCustomer.body

    // Create test products
    const newProduct1 = await api.post('/products').send({ name: "Test product 200", unit_price: 20 })
    const product1 = newProduct1.body

    const newProduct2 = await api.post('/products').send({ name: "Test product 201", unit_price: 20 })
    const product2 = newProduct2.body

    const response = await api.post('/purchases')
        .send({ productIds: [product1.id, product2.id], customerId: customer.id })
        .expect(200)
    
    expect(response.body.customerId).toBe(customer.id)
})

test('Should get purchases', async () => {
    const response = await api.get('/purchases')
    expect(response.status).toBe(200)
})

test('Should not create purchase with missing fields', async () => {
    const response = await api.post('/purchases').send({ customerId: 1 })

    expect(response.status).toBe(400)
})

test('Should not create purchase with non-existent customer or products', async () => {
    const response = await api.post('/purchases').send({ customerId: "kdaou734orjslethaw0e", productIds: ["394809q73ejalu34ase"] })

    expect(response.status).toBe(400)
})

test('Should get purchases by customer and by product', async () => {
    // Create test purchase
    const newCustomer = await api.post('/customers').send({ name: "Test customer 28392", address: "Test address Kalajoki" }).expect(200)
    const customer = newCustomer.body
    // Create test products
    const newProduct1 = await api.post('/products').send({ name: "Test product 200", unit_price: 20 })
    const product1 = newProduct1.body

    const newProduct2 = await api.post('/products').send({ name: "Test product 201", unit_price: 20 })
    const product2 = newProduct2.body
    // Create test purchases
    await api.post('/purchases').send({ customerId: customer.id, productIds: [product1.id] })
    // This purchase should be found with the customer id
    const foundPurchases1 = await api.get('/purchases').query({ customerId: customer.id }).expect(200)
    expect(foundPurchases1.body.length).toBe(1)
    // Add the other purchase
    await api.post('/purchases').send({ customerId: customer.id, productIds: [product2.id] })
    const foundPurchases2 = await api.get('/purchases').query({ customerId: customer.id }).expect(200)
    expect(foundPurchases2.body.length).toBe(2)

    // Try to get with non-existent product
    const foundPurchases3 = await api.get('/purchases').query({ productId: "r39ujalerpeszm" }).expect(200)
    expect(foundPurchases3.body.length).toBe(0)
    // Try one that we made
    const foundPurchases4 = await api.get('/purchases').query({ productId: product1.id }).expect(200)
    expect(foundPurchases4.body.length).toBe(1)
})