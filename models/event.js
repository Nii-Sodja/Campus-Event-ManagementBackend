const mongoose = require('mongoose');
const User = require('./users'); // Import the User model

const EventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        unique: true,
        required: true,
        default: () => 'EVT-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    },
    name: { 
        type: String, 
        required: [true, 'Event name is required'],
        trim: true,
        maxLength: [100, 'Event name cannot exceed 100 characters']
    },
    date: { 
        type: Date, 
        required: [true, 'Event date is required'],
        validate: {
            validator: function(value) {
                return value >= new Date(new Date().setHours(0, 0, 0, 0));
            },
            message: 'Event date cannot be in the past'
        }
    },
    time: { 
        type: String, 
        required: [true, 'Event time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/, 'Please enter time in format: HH:MM AM/PM']
    },
    location: { 
        type: String, 
        required: [true, 'Event location is required'],
        trim: true
    },
    description: { 
        type: String,
        trim: true,
        maxLength: [1000, 'Description cannot exceed 1000 characters']
    },
    type: {
        type: String,
        lowercase: true,
        enum: {
            values: ['sports', 'academic', 'social', 'cultural', 'technology'],
            message: '{VALUE} is not a valid event type'
        }
    },
    capacity: { 
        type: Number, 
        required: [true, 'Event capacity is required'],
        min: [1, 'Capacity must be at least 1'],
        max: [1000, 'Capacity cannot exceed 1000'],
        validate: {
            validator: Number.isInteger,
            message: 'Capacity must be a whole number'
        }
    },
    availableSeats: { 
        type: Number,
        min: [0, 'Available seats cannot be negative']
    },
    attendees: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
    }],
    waitlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    backgroundImage: {
        type: String,
        default: '/img29.jpg'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    venue: {
        building: String,
        room: String,
        address: String
    },
    organizer: {
        name: String,
        email: String,
        phone: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals
EventSchema.virtual('isFull').get(function() {
    return this.availableSeats <= 0;
});

EventSchema.virtual('registeredCount').get(function() {
    return this.attendees.length;
});

EventSchema.virtual('waitlistCount').get(function() {
    return this.waitlist.length;
});

EventSchema.virtual('isUpcoming').get(function() {
    return new Date(this.date) > new Date();
});

// Pre-save middleware
EventSchema.pre('save', function(next) {
    if (this.isNew) {
        this.availableSeats = this.capacity;
    }

    const now = new Date();
    const eventDate = new Date(this.date);
    
    if (this.status !== 'cancelled') {
        if (eventDate < now) {
            this.status = 'completed';
        } else if (eventDate.toDateString() === now.toDateString()) {
            this.status = 'ongoing';
        } else {
            this.status = 'upcoming';
        }
    }

    next();
});

// Instance methods
EventSchema.methods.isUserRegistered = function(userId) {
    return this.attendees.some(id => id.equals(userId));
};

EventSchema.methods.isUserWaitlisted = function(userId) {
    return this.waitlist.some(id => id.equals(userId));
};

EventSchema.methods.registerUser = async function(userId) {
    if (this.isUserRegistered(userId)) {
        throw new Error('User already registered for this event');
    }
    
    if (this.availableSeats <= 0) {
        if (!this.isUserWaitlisted(userId)) {
            this.waitlist.push(userId);
            await this.save();
            throw new Error('Event is full. Added to waitlist.');
        }
        throw new Error('Event is full and user is already waitlisted');
    }

    this.attendees.push(userId);
    this.availableSeats -= 1;
    await this.save();

    // Add the event ID to the user's registeredEvents
    await User.findByIdAndUpdate(userId, {
        $addToSet: { registeredEvents: this._id }
    });

    return this;
};

EventSchema.methods.unregisterUser = async function(userId) {
    const attendeeIndex = this.attendees.findIndex(id => id.equals(userId));
    if (attendeeIndex === -1) {
        throw new Error('User not registered for this event');
    }

    this.attendees.splice(attendeeIndex, 1);
    this.availableSeats += 1;

    // If there's someone on the waitlist, automatically register them
    if (this.waitlist.length > 0) {
        const nextUser = this.waitlist.shift();
        this.attendees.push(nextUser);
        this.availableSeats -= 1;
    }

    return this.save();
};

// Static methods
EventSchema.statics.getUpcomingEvents = function() {
    return this.find({
        date: { $gte: new Date() },
        status: { $ne: 'cancelled' }
    }).sort({ date: 1 });
};

EventSchema.statics.getEventsByType = function(type) {
    return this.find({
        type: type.toLowerCase(),
        date: { $gte: new Date() },
        status: { $ne: 'cancelled' }
    }).sort({ date: 1 });
};

EventSchema.statics.searchEvents = function(query) {
    return this.find({
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { location: { $regex: query, $options: 'i' } }
        ],
        date: { $gte: new Date() },
        status: { $ne: 'cancelled' }
    }).sort({ date: 1 });
};

// Indexes
EventSchema.index({ date: 1 });
EventSchema.index({ type: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ createdBy: 1 });
EventSchema.index({ name: 'text', description: 'text', location: 'text' });

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;