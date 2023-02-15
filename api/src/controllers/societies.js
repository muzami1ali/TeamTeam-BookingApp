// SOCIETY CONTROLLER
const prisma = require('../../prisma/prisma.js')


// This function is used to create a new society
async function signup(req, res) {
    // Check that the request body is not empty and contains the correct properties
    if (req.body === undefined || req.body.name === undefined || req.body.userId === undefined) {
        return res.status(409).send({token: null, message: 'Request body cannot be empty'})
    }

    // Check if the user exists
    let user = await prisma.user.findUnique({
        where: {
            userId: req.body.userId
        }
    })

    if (!user) {
        return res.status(409).send({token: null, message: 'User Not Found'})
    }
    // Check if the society already exists
    let society = await prisma.society.findUnique({
        where: {
            name: req.body.name
        }
    })

    if (society) {
        return res.status(409).send({token: null, message: 'Society already exists'})
    }

    // Check that name, email and password are not empty
    if (req.body.name === '') {
        return res.status(409).send({token: null, message: 'Name cannot be empty'})
    }

    // Create a new user
    society = await prisma.society.create({
        data: {
            name: req.body.name,
        }
    });
    committee = await prisma.committee.create({
        data: {
            userId: user.id,
            user: user,
            society: society,
            societyId: society.id,
        }
    });

    // Mail the organisation success

    
    // Send the JWT token in the response
    res.status(200).send()

}


module.exports = {
    signup,
}