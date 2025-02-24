import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	// Hash password
	const hashedPassword = await bcrypt.hash("password123", 10);

	// Create users
	const user1 = await prisma.user.upsert({
		where: { username: "john.doe" },
		update: {},
		create: {
			username: "john.doe",
			fullname: "John Doe",
			password: hashedPassword,
			posts: {
				create: [
					{
						content: "First post content",
						images: { create: [{ file: "sample1.jpg" }, { file: "sample2.jpg" }] },
					},
					{
						content: "Second post content",
						images: { create: [{ file: "sample3.jpg" }] },
					},
				],
			},
		},
	});

	const user2 = await prisma.user.upsert({
		where: { username: "jane.doe" },
		update: {},
		create: {
			username: "jane.doe",
			fullname: "Jane Doe",
			password: hashedPassword,
			posts: {
				create: [
					{
						content: "Jane's first post",
						images: { create: [{ file: "sample4.jpg" }] },
					},
				],
			},
		},
	});

	// Create likes
	await prisma.like.createMany({
		data: [
			{ userId: user1.id, postId: 1 },
			{ userId: user2.id, postId: 1 },
			{ userId: user1.id, postId: 2 },
		],
	});

	// Create comments
	await prisma.comment.createMany({
		data: [
			{ content: "Nice post!", userId: user1.id, postId: 1 },
			{ content: "Great content!", userId: user2.id, postId: 2 },
		],
	});

	console.log({ user1, user2 });
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
