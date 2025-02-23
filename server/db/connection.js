const mongoose = require('mongoose');
const url = 'mongodb+srv://lavanya:Vilas%4030@cluster0.zm9sj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to DB')).catch((e) => console.log('Error', e))
