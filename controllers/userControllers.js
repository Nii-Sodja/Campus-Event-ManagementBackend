const User = require('../models/User');

const registerUser = async (req, res) => {
    const { name, email, password, preferences } = req.body;
    

    try {
        const user = new User({ name, email, password, preferences });
        await user.save();
        console.log("User saved")
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error("Something happened")
        res.status(400).json({ message: error.message });
    }
};

module.exports = { registerUser };