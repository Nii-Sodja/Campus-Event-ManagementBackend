const mongoose = require('mongoose');
const Event = require('../models/event');
require('dotenv').config();

const events = [
    {
        name: 'Annual Football Tournament',
        date: new Date('2024-04-20'),
        time: '2:00 PM',
        location: 'University Stadium',
        description: 'Annual inter-department football tournament featuring teams from all faculties.',
        type: 'sports',
        capacity: 200,
        availableSeats: 200,
        backgroundImage: '/img8.JPG',
        status: 'upcoming',
        venue: {
            building: 'Sports Complex',
            room: 'Main Field',
            address: 'University Sports Ground'
        }
    },
    {
        name: 'Tech Innovation Workshop',
        date: new Date('2024-04-25'),
        time: '10:00 AM',
        location: 'Engineering Building',
        description: 'Learn about the latest technologies and innovations in software development.',
        type: 'technology',
        capacity: 50,
        availableSeats: 50,
        backgroundImage: '/img25.jpg',
        status: 'upcoming',
        venue: {
            building: 'Engineering Block',
            room: 'Lab 101',
            address: 'Main Campus'
        }
    },
    {
        name: 'Cultural Dance Festival',
        date: new Date('2024-05-01'),
        time: '6:00 PM',
        location: 'Auditorium',
        description: 'Annual cultural dance festival showcasing traditional and modern dance forms.',
        type: 'cultural',
        capacity: 300,
        availableSeats: 300,
        backgroundImage: '/img6.JPG',
        status: 'upcoming',
        venue: {
            building: 'Arts Center',
            room: 'Main Hall',
            address: 'Cultural Complex'
        }
    },
    {
        name: 'Academic Research Symposium',
        date: new Date('2024-05-05'),
        time: '9:00 AM',
        location: 'Conference Center',
        description: 'Research presentation and networking event for academic scholars.',
        type: 'academic',
        capacity: 150,
        availableSeats: 150,
        status: 'upcoming'
    },
    {
        name: 'Spring Social Mixer',
        date: new Date('2024-05-10'),
        time: '7:00 PM',
        location: 'Student Center',
        description: 'Social networking event for students to meet and mingle.',
        type: 'social',
        capacity: 100,
        availableSeats: 100,
        status: 'upcoming'
    },
    {
        name: 'Hackathon 2024',
        date: new Date('2024-05-15'),
        time: '8:00 AM',
        location: 'Computer Science Building',
        description: '24-hour coding competition for innovative solutions.',
        type: 'technology',
        capacity: 80,
        availableSeats: 80,
        status: 'upcoming'
    },
    {
        name: 'Basketball Championship',
        date: new Date('2024-05-20'),
        time: '3:00 PM',
        location: 'Indoor Sports Complex',
        description: 'Inter-university basketball championship finals.',
        type: 'sports',
        capacity: 250,
        availableSeats: 250,
        status: 'upcoming'
    },
    {
        name: 'Art Exhibition',
        date: new Date('2024-05-25'),
        time: '11:00 AM',
        location: 'Art Gallery',
        description: 'Student art exhibition featuring various mediums and styles.',
        type: 'cultural',
        capacity: 120,
        availableSeats: 120,
        status: 'upcoming'
    },
    {
        name: 'Career Fair 2024',
        date: new Date('2024-06-01'),
        time: '10:00 AM',
        location: 'Main Hall',
        description: 'Annual career fair with top employers.',
        type: 'academic',
        capacity: 400,
        availableSeats: 400,
        status: 'upcoming'
    },
    {
        name: 'Summer Beach Party',
        date: new Date('2024-06-05'),
        time: '4:00 PM',
        location: 'University Beach',
        description: 'End of semester beach party celebration.',
        type: 'social',
        capacity: 300,
        availableSeats: 300,
        status: 'upcoming'
    },
    {
        name: 'AI Workshop Series',
        date: new Date('2024-06-10'),
        time: '1:00 PM',
        location: 'Tech Hub',
        description: 'Workshop on artificial intelligence and machine learning.',
        type: 'technology',
        capacity: 60,
        availableSeats: 60,
        status: 'upcoming'
    },
    {
        name: 'Chess Tournament',
        date: new Date('2024-06-15'),
        time: '9:00 AM',
        location: 'Student Lounge',
        description: 'Annual chess tournament open to all skill levels.',
        type: 'sports',
        capacity: 40,
        availableSeats: 40,
        status: 'upcoming'
    },
    {
        name: 'Music Festival',
        date: new Date('2024-06-20'),
        time: '5:00 PM',
        location: 'Outdoor Amphitheater',
        description: 'Live music performances by student bands.',
        type: 'cultural',
        capacity: 500,
        availableSeats: 500,
        status: 'upcoming'
    },
    {
        name: 'Research Conference',
        date: new Date('2024-06-25'),
        time: '8:00 AM',
        location: 'Science Building',
        description: 'International research conference on emerging technologies.',
        type: 'academic',
        capacity: 200,
        availableSeats: 200,
        status: 'upcoming'
    },
    {
        name: 'Game Night',
        date: new Date('2024-07-01'),
        time: '6:00 PM',
        location: 'Recreation Center',
        description: 'Social gaming event featuring various board and video games.',
        type: 'social',
        capacity: 80,
        availableSeats: 80,
        status: 'upcoming'
    },
    {
        name: 'Cybersecurity Seminar',
        date: new Date('2024-07-05'),
        time: '2:00 PM',
        location: 'Lecture Hall',
        description: 'Expert-led seminar on cybersecurity best practices.',
        type: 'technology',
        capacity: 100,
        availableSeats: 100,
        status: 'upcoming'
    },
    {
        name: 'Swimming Competition',
        date: new Date('2024-07-10'),
        time: '10:00 AM',
        location: 'University Pool',
        description: 'Annual swimming competition with multiple categories.',
        type: 'sports',
        capacity: 150,
        availableSeats: 150,
        status: 'upcoming'
    },
    {
        name: 'Theater Production',
        date: new Date('2024-07-15'),
        time: '7:00 PM',
        location: 'Theater Hall',
        description: 'Student theater production of a classic play.',
        type: 'cultural',
        capacity: 200,
        availableSeats: 200,
        status: 'upcoming'
    },
    {
        name: 'Graduation Ceremony',
        date: new Date('2024-07-20'),
        time: '11:00 AM',
        location: 'Main Auditorium',
        description: 'Annual graduation ceremony for the class of 2024.',
        type: 'academic',
        capacity: 1000,
        availableSeats: 1000,
        status: 'upcoming'
    },
    {
        name: 'Alumni Networking Night',
        date: new Date('2024-07-25'),
        time: '6:30 PM',
        location: 'Grand Hall',
        description: 'Networking event connecting current students with alumni.',
        type: 'social',
        capacity: 250,
        availableSeats: 250,
        status: 'upcoming'
    }
];

const seedEvents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing events
        await Event.deleteMany({});
        console.log('Cleared existing events');

        // Insert new events
        const createdEvents = await Event.insertMany(events);
        console.log(`Created ${createdEvents.length} events`);

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding events:', error);
        process.exit(1);
    }
};

seedEvents(); 