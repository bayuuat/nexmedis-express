const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const { upload, handleUploadError } = require("../middleware/upload");
const authMiddleware = require("../middleware/auth");
const fs = require("fs").promises;
const path = require("path");

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post with images
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 */
router.post("/", 
  authMiddleware, 
  upload.array("images", 5), 
  handleUploadError,
  async (req, res) => {
	try {
		const { content } = req.body;
		const files = req.files;
		const BASE_URL = `${req.protocol}://${req.get("host")}`;

		const post = await prisma.post.create({
			data: {
				content,
				userId: req.user.id,
				images: {
					create: files.map((file) => ({
						file: BASE_URL + "/uploads/" + file.filename,
					})),
				},
			},
		});

		res.status(201).json({ message: "Post created successfully", postId: post.id });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of posts
 */
router.get("/", authMiddleware, async (req, res) => {
	try {
		const posts = await prisma.post.findMany({
			include: {
				images: true,
				user: {
					select: { username: true, fullname: true },
				},
				likes: {
					where: { userId: req.user.id },
					select: { id: true }
				},
				_count: {
					select: {
						likes: true,
						comments: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Add liked attribute to each post
		const postsWithLikeStatus = posts.map(post => ({
			...post,
			liked: post.likes.length > 0,
			likes: undefined // Remove likes array from response
		}));

		res.json(postsWithLikeStatus);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

/**
 * @swagger
 * /posts/{postId}:
 *   get:
 *     summary: Get a single post
 *     tags: [Posts]
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
 *         description: Post details
 *       404:
 *         description: Post not found
 */
router.get("/:postId", authMiddleware, async (req, res) => {
	try {
		const post = await prisma.post.findFirstOrThrow({
			where: { id: parseInt(req.params.postId) },
			include: {
				images: true,
				user: {
					select: { username: true, fullname: true },
				},
				likes: {
					where: { userId: req.user.id },
					select: { id: true }
				},
				comments: {
					include: {
						user: {
							select: { username: true, fullname: true },
						},
					},
					orderBy: {
						createdAt: "desc",
					},
				},
				_count: {
					select: {
						likes: true,
						comments: true,
					},
				},
			},
		});

		// Add liked attribute
		const postWithLikeStatus = {
			...post,
			liked: post.likes.length > 0,
			likes: undefined // Remove likes array from response
		};

		res.json(postWithLikeStatus);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 */
router.delete("/:id", authMiddleware, async (req, res) => {
	try {
		const post = await prisma.post.findFirst({
			where: {
				id: parseInt(req.params.id),
				userId: req.user.id,
			},
			include: {
				images: true,
			},
		});

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		// Delete image files
		if (post.images) {
			const deleteFilePromises = post.images.map((image) => {
				return fs.unlink(path.join(__dirname, "../../uploads/", image.file)).catch((err) => console.error("Error deleting file:", err));
			});
			await Promise.all(deleteFilePromises);
		}

		// Delete post (will cascade delete images)
		await prisma.post.delete({
			where: { id: post.id },
		});

		res.json({ message: "Post deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
