const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const User = require('../models/users');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Validation middleware
const validateEventInput = (req, res, next) => {
    const { name, date, time, location, capacity, type } = req.body;
    
    if (!name || !date || !time || !location || !capacity || !type) {
        return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (capacity < 0) {
        return res.status(400).json({ message: 'Capacity must be a positive number' });
    }

    const validTypes = ['sports', 'academic', 'social', 'cultural', 'technology'];
    if (!validTypes.includes(type.toLowerCase())) {
        return res.status(400).json({ 
            message: 'Invalid event type. Must be one of: ' + validTypes.join(', ')
        });
    }

    next();
};

// Get all events with optional search and filter
router.get('/getEvents', async (req, res) => {
    try {
        const { search, type, date } = req.query;
        let query = {};

        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Type filter
        if (type) {
            query.type = type.toLowerCase();
        }

        // Date filter
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.date = { $gte: startDate, $lt: endDate };
        }

        const events = await Event.find(query)
            .sort({ date: 1 })
            .populate('attendees', 'name email');
            
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get filtered events by user preferences
router.get('/filtered', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const preferredTypes = Object.entries(user.preferences)
            .filter(([_, value]) => value)
            .map(([key]) => key);

        const events = await Event.find({
            type: { $in: preferredTypes },
            date: { $gte: new Date() } // Only future events
        }).sort({ date: 1 });

        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single event
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('attendees', 'name email');
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create event
router.post('/createEvent',async (req, res) => {
    try {
        // if (!req.user.isAdmin) {
        //     return res.status(403).json({ message: 'Access denied. Admin only.' });
        // }

        const event = new Event({
            ...req.body,
            type: req.body.type.toLowerCase(),
            availableSeats: req.body.capacity,
            attendees: [],
            createdBy: req.body.createdBy
        });

        const savedEvent = await event.save();
        res.status(201).json(savedEvent);
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
});

// Update event
router.put('/updateEvent/:id', [auth, validateEventInput], async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Prevent changing capacity to less than current attendees
        if (req.body.capacity < event.attendees.length) {
            return res.status(400).json({ 
                message: 'Cannot reduce capacity below current attendee count' 
            });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                type: req.body.type.toLowerCase(),
                availableSeats: req.body.capacity - event.attendees.length
            },
            { new: true }
        );
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete event
router.delete('/deleteEvent/:id', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Notify registered users about event cancellation
        // This would be a good place to add email notifications
        
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Register for event
router.post('/register/:id', auth, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const userId = req.user._id;

        // Check if already registered
        const isRegistered = event.attendees.includes(userId);
        if (isRegistered) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        // Start a session for atomic operations
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Add user to event attendees
            event.attendees.push(userId);
            if (typeof event.availableSeats === 'number') {
                event.availableSeats -= 1;
            }
            await event.save({ session });

            // Add event to user's registeredEvents
            await User.findByIdAndUpdate(
                userId,
                { $addToSet: { registeredEvents: event._id } },
                { session }
            );

            await session.commitTransaction();
            
            console.log('Registration successful:', {
                eventId: event._id,
                userId: userId,
                attendeesCount: event.attendees.length
            });

            res.json(event);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error('Registration error:', {
            message: error.message,
            eventId: req.params.id,
            userId: req.user?._id
        });
        res.status(400).json({ message: error.message });
    }
});

// Unregister from event
router.post('/unregister/:id', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const userId = req.user._id;
        const attendeeIndex = event.attendees.indexOf(userId);
        
        if (attendeeIndex === -1) {
            return res.status(400).json({ message: 'Not registered for this event' });
        }

        if (new Date(event.date) < new Date()) {
            return res.status(400).json({ message: 'Cannot unregister from past events' });
        }

        event.attendees.splice(attendeeIndex, 1);
        event.availableSeats += 1;
        
        const updatedEvent = await event.save();

        // Update user's registered events
        await User.findByIdAndUpdate(userId, {
            $pull: { registeredEvents: event._id }
        });

        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user's registered events
router.get('/user/registered', auth, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        console.log('Fetching events for user:', req.user._id);

        // First get the user with populated events
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get all events where user is registered (either in attendees or registeredEvents)
        const events = await Event.find({
            $or: [
                { _id: { $in: user.registeredEvents || [] } },
                { attendees: req.user._id }
            ],
            date: { $gte: new Date() }
        }).sort({ date: 1 });

        console.log('Found events:', {
            userId: req.user._id,
            eventCount: events.length,
            eventIds: events.map(e => e._id)
        });

        res.json(events);
    } catch (error) {
        console.error('Error in /user/registered:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?._id
        });
        res.status(500).json({ 
            message: 'Error fetching registered events',
            details: error.message
        });
    }
});

module.exports = router;