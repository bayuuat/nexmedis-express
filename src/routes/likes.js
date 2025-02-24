const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * /likes/{postId}:
 *   post:
 *     summary: Like a post
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Like created successfully
 */
router.post('/:postId', authMiddleware, async (req, res) => {
  try {
    const like = await prisma.like.create({
      data: {
        userId: req.user.id,
        postId: parseInt(req.params.postId)
      }
    });
    res.status(201).json(like);
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'Post already liked' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

/**
 * @swagger
 * /likes/post/{postId}:
 *   get:
 *     summary: Get likes for a post
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of likes
 */
router.get('/post/:postId', async (req, res) => {
  try {
    const likes = await prisma.like.findMany({
      where: { postId: parseInt(req.params.postId) },
      include: { user: { select: { username: true, name: true } } }
    });
    res.json(likes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /likes/{postId}:
 *   delete:
 *     summary: Remove like from a post
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Like removed successfully
 */
router.delete('/:postId', authMiddleware, async (req, res) => {
  try {
    await prisma.like.delete({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId: parseInt(req.params.postId)
        }
      }
    });
    res.json({ message: 'Like removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
