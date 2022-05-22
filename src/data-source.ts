import "reflect-metadata"
import { DataSource } from "typeorm"
import { Book } from "./entity/Book"
import { BookBelonging } from "./entity/BookBelonging"
import { BookRate } from "./entity/BookRate"
import { User } from "./entity/User"
require('dotenv').config({ path: '.env' })

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: "library_app",
    synchronize: true,
    logging: false,
    entities: [User, Book, BookRate, BookBelonging],
    migrations: [],
    subscribers: [],
})

