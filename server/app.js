const express = require('express')
const bcryptjs = require('bcryptjs')

const jwt = require('jsonwebtoken')
const app = express();
const cors = require('cors')



//Connect to DB
require('./db/connection')


//Import files
const Users = require('./models/Users');
const Conversations = require('./models/convesation');
const Messages = require('./models/messages')
//app use
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(cors())


const port = process.env.PORT || 8000

//routes
app.get('/', (req, res) => {
    res.send('welcome')

})


app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body
        if (!fullName || !email || !password) {
            res.status(400).send('Please fill all the fields')
        }
        else {
            const isAlreadyExist = await Users.findOne({ email })
            if (isAlreadyExist) {
                res.status(400).send('User already Exist')
            }
            else {
                const newUser = new Users({ fullName, email })
                bcryptjs.hash(password, 10, (err, hashedPassword) => {
                    newUser.set('password', hashedPassword);
                    newUser.save();

                })
                return res.status(200).json('User registered successfully')
            }
        }

    } catch (error) {
        console.log(error, 'Error')
    }
})


app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            res.status(400).send('Invalid credentials')
        }
        else {
            const user = await Users.findOne({ email })
            if (!user) {
                res.status(400).send('Invalid credentials ')
            }
            else {
                const validateUser = await bcryptjs.compare(password, user.password)
                if (!validateUser) {
                    res.status(400).send('Invalid credentials ')
                }
                else {
                    const payload = {
                        userId: user._id,
                        email: user.email
                    }
                    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'THIS_IS_JWT_SECRET_KEY';

                    jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: 84600 }, async (err, token) => {
                        await Users.updateOne({ _id: user._id }, {
                            $set: { token }
                        })
                        user.save();
                        return res.status(200).json({ user: { id: user._id, email: user.email, fullName: user.fullName }, token: token })


                    })
                }

            }
        }
    } catch (error) {
        console.log(error, 'Error')
    }
})


app.post('/api/conversation', async (req, res) => {
    try {
        const { senderId, receiverId } = req.body
        const newConversation = new Conversations({ members: [senderId, receiverId] })
        await newConversation.save()
        res.status(200).send('Conversation created successfully')
    } catch (error) {
        console.log(error, 'error')
        res.status(500).send('Failed to create conversation');

    }
})

app.get('/api/conversation/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        const conversations = await Conversations.find({ members: { $in: [userId] } })

        const conversationUserData = await Promise.all(conversations.map(async (conversation) => {
            const receiverId = conversation.members.find((member) => member !== userId)
            console.log(receiverId)
            // const user = await Users.findById(receiverId)
            return await Users.findById(receiverId)
        }))
        console.log("conversationdata", conversationUserData)
        res.status(200).json(await conversationUserData)
    } catch (error) {
        console.log(error, 'error')
        res.status(500).send('Failed to retrieve conversations');

    }
})

app.post('/api/message', async (req, res) => {
    try {
        const { conversationId, senderId, message } = req.body
        const newMessage = new Messages({ conversationId, senderId, message })
        await newMessage.save()
        res.status(200).send('Message  sent successfuly')
    }

    catch (error) {
        console.log(error, 'Error')
    }
})

app.get('/api/message/:conversationId', async (req, res) => {
    try {
        const conversationId = req.params.conversationId
        const messages = await Messages.find({ conversationId })
        const messageUserData = Promise.all(messages.map(async (message) => {
            const user = await Users.findById(message.senderId)
            return { user: { email: user.email, fullName: user.fullName }, message: message.message }
        }))
        res.status(200).json(await messageUserData)
    } catch (error) {
        console.log(error, 'error')
    }
})


app.get('/api/users', async (req, res) => {
    try {
        const users = await Users.find()
        const UsersData = Promise.all(users.map(async (user) => {
            return { user: { email: user.email, fullName: user.fullName }, userId: user._id }

        }))
        res.status(200).json(await UsersData)
    } catch (error) {
        console.log('error', error)
    }
})

app.listen(port, () => {
    console.log('listening on port ' + port)
})