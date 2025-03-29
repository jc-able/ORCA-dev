/**
 * Person Routes
 * API endpoints for person-related operations
 */
const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route GET /api/persons
 * @desc Get all persons with optional filtering
 * @access Private
 */
router.get('/', authMiddleware.protect, personController.getAllPersons);

/**
 * @route GET /api/persons/distinct/:field
 * @desc Get distinct values for a field
 * @access Private
 */
router.get('/distinct/:field', authMiddleware.protect, personController.getDistinctValues);

/**
 * @route GET /api/persons/:id/network
 * @desc Get relationship network for a person
 * @access Private
 */
router.get('/:id/network', authMiddleware.protect, personController.getPersonNetwork);

/**
 * @route GET /api/persons/:id
 * @desc Get a single person by ID
 * @access Private
 */
router.get('/:id', authMiddleware.protect, personController.getPersonById);

/**
 * @route POST /api/persons
 * @desc Create a new person
 * @access Private
 */
router.post('/', authMiddleware.protect, personController.createPerson);

/**
 * @route PUT /api/persons/:id
 * @desc Update a person
 * @access Private
 */
router.put('/:id', authMiddleware.protect, personController.updatePerson);

/**
 * @route DELETE /api/persons/:id
 * @desc Delete a person
 * @access Private
 */
router.delete('/:id', authMiddleware.protect, personController.deletePerson);

module.exports = router;
