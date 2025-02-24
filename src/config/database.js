const { Sequelize } = require("sequelize");
require("dotenv").config();

module.exports = {
	database: process.env.DB_NAME,
	username: process.env.DB_USER,
	password: process.env.DB_PASS,
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	dialect: "postgres",
	logging: false,
};
