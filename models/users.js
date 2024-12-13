const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxLength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    preferences: {
        sports: {
            type: Boolean,
            default: false
        },
        academic: {
            type: Boolean,
            default: false
        },
        social: {
            type: Boolean,
            default: false
        },
        cultural: {
            type: Boolean,
            default: false
        },
        technology: {
            type: Boolean,
            default: false
        }
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    registeredEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
    lastLogin: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Pre-save middleware to hash passwords
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Password comparison method
userSchema.methods.matchPassword = async function(enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

// Update preferences method
userSchema.methods.updatePreferences = async function(newPreferences) {
    try {
        this.preferences = {
            ...this.preferences,
            ...newPreferences
        };
        return await this.save();
    } catch (error) {
        throw new Error('Error updating preferences');
    }
};

// Event registration check method
userSchema.methods.hasRegisteredForEvent = function(eventId) {
    return this.registeredEvents.some(id => 
        id.toString() === eventId.toString()
    );
};

// Event registration method
userSchema.methods.registerForEvent = async function(eventId) {
    try {
        if (!this.hasRegisteredForEvent(eventId)) {
            this.registeredEvents.push(eventId);
            await this.save();
            return true;
        }
        return false;
    } catch (error) {
        throw new Error('Error registering for event');
    }
};

// Event unregistration method
userSchema.methods.unregisterFromEvent = async function(eventId) {
    try {
        if (this.hasRegisteredForEvent(eventId)) {
            this.registeredEvents = this.registeredEvents.filter(id => 
                id.toString() !== eventId.toString()
            );
            await this.save();
            return true;
        }
        return false;
    } catch (error) {
        throw new Error('Error unregistering from event');
    }
};

// Static method to get active users
userSchema.statics.getActiveUsers = function() {
    return this.find({ status: 'active' });
};

// Virtual for full user details
userSchema.virtual('userDetails').get(function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        isAdmin: this.isAdmin,
        preferences: this.preferences,
        registeredEventsCount: this.registeredEvents.length,
        status: this.status,
        lastLogin: this.lastLogin
    };
});

const User = mongoose.model('User', userSchema);

module.exports = User;