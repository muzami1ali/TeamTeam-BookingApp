// LOGIN CONTROLLER
const prisma = require('../../prisma/prisma.js')
const jwt = require('jsonwebtoken')

// This function is used to login a user
async function login(email, password, res) {
    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    })
    if (user) {
        if (user.password === password) {
            const token = jwt.sign({ id: user.id }, process.env.TOKEN_SECRET, {
                expiresIn: 86400 // expires in 24 hours
            })
            res.status(200).send({token: token })
        } else {
            res.status(401).send({token: null, message: 'Invalid password'})
        }
    } else {
        res.status(404).send({token: null, message: 'User not found'})
    }
}

// This function is used to verify a JWT token
async function verify(token, res) {
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({token: null, message: 'Unauthorized'})
        }
        res.status(200).send({token: token})
    })
}

// This function is used to logout a user
async function logout(token, res) {
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({token: null, message: 'Unauthorized'})
        }
        res.status(200).send({token: null})
    })
}

// This function is used to reset a user's password, the new password is sent in the request body
async function reset(req, res) {
    // Verify the JWT token
    jwt.verify(req.body.token, process.env.TOKEN_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).send({token: null, message: 'Unauthorized'})
        }

        // If the users password is the same as the old password, return an error
        let user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            }
        })
        if (user.password === req.body.new_password) {
            return res.status(409).send({token: null, message: 'New password cannot be the same as the old password'})
        }

        // If the new password is empty, return an error
        if (req.body.new_password === '') {
            return res.status(409).send({token: null, message: 'New password cannot be empty'})
        }

        // Update the user's password
        user = await prisma.user.update({
            where: {
                id: decoded.id
            },
            data: {
                password: req.body.new_password
            }
        })
        // Create a new JWT token
        const token = jwt.sign({ id: user.id }, process.env.TOKEN_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })
        res.status(200).send({token: token})
    })
}

// This function is used to sign up a new user
async function signup(email, password, res) {
    // Check if the user already exists
    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    })
    if (user) {
        res.status(409).send({token: null, message: 'User already exists'})
    } else {
        // Check that neither the email or password are empty
        if (email === '' || password === '') {
            res.status(409).send({token: null, message: 'Email and password cannot be empty'})
        }

        // Create a new user
        const newUser = await prisma.user.create({
            data: {
                email: email,
                password: password
            }
        })
        // Create a new JWT token
        const token = jwt.sign({ id: newUser.id }, process.env.TOKEN_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        })
        res.status(200).send({token: token})
    }
}





module.exports = {
    login,
    verify,
    logout,
    reset,
    signup
}