const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const auth = require('../middleware/auth.middleware');

// Public routes
router.get('/community', communityController.getCommunity);
router.get('/posts', communityController.getPosts);
router.get('/post', communityController.getPostDetail);
router.get('/user-role', communityController.getUserRole);
router.get('/account/:username', communityController.getAccount);

// Protected routes (require authentication)
router.get('/members', auth, communityController.getMembers);
router.get('/roles', auth, communityController.getRoles);
router.post('/role', auth, communityController.updateRole);
router.post('/mute', auth, communityController.muteUser);
router.post('/unmute', auth, communityController.unmuteUser);
router.post('/post', auth, communityController.createPost);
router.post('/pin', auth, communityController.pinPost);
router.post('/unpin', auth, communityController.unpinPost);

module.exports = router;
