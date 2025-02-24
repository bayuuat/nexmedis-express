const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * /comments/{postId}:
 *   post:
 *     summary: Create a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 */
router.post('/:postId', authMiddleware, async (req, res) => {
  try {
    const comment = await prisma.comment.create({
      data: {
        content: req.body.content,
        userId: req.user.id,
        postId: parseInt(req.params.postId)
      },
      include: {
        user: {
          select: { username: true, fullname: true }
        }
      }
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(req.params.postId) },
      include: {
        user: {
          select: { username: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update comment
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await prisma.comment.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(req.params.id) },
      data: { content: req.body.content },
      include: {
        user: {
          select: { username: true, name: true }
        }
      }
    });
    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete comment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await prisma.comment.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    await prisma.comment.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
