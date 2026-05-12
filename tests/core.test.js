const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

// Mock Sequelize Transaction and DB
jest.mock('../config/database', () => ({
  transaction: jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn(),
    finished: false
  })
}));

jest.mock('../models/Booking', () => ({
  create: jest.fn().mockResolvedValue({ id: 'b-1234', venueId: 1, totalAmount: 100 }),
  findOne: jest.fn().mockResolvedValue(null)
}));
jest.mock('../models/User', () => ({
  findByPk: jest.fn().mockResolvedValue({ id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' }),
  findOne: jest.fn().mockResolvedValue(null)
}));
jest.mock('../models/Venue', () => ({
  findByPk: jest.fn().mockResolvedValue({ id: 1, name: 'Test Venue', ownerId: 2 })
}));
jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(bodyParser.json());
// Mock auth middleware injects user
app.post('/api/bookings', (req, res, next) => { req.user = { id: 1 }; next(); }, bookingController.createBooking);
app.post('/api/auth/register', authController.register);

describe('Core Logic Tests (NFR-TST-01)', () => {
  
  describe('Booking Engine', () => {
    it('should successfully create a booking and return 201', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          venueId: 1,
          date: '2023-10-10',
          timeSlots: ['10:00 AM'],
          totalAmount: 500,
          idempotencyKey: 'test-uuid-123'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.id).toEqual('b-1234');
    });
  });

  describe('Security Policy', () => {
    it('should reject passwords that do not meet complexity requirements (NFR-SEC-02)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'weakpassword',
          firstName: 'John',
          lastName: 'Doe'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('at least 8 characters long');
    });
  });

});
