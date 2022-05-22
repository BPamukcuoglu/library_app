import "reflect-metadata"
import { DataSource } from "typeorm"
import { Book } from "./entity/Book"
import { BookBelonging } from "./entity/BookBelonging"
import { BookRate } from "./entity/BookRate"
import { User } from "./entity/User"


export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "13241324",
    database: "library_app",
    synchronize: true,
    logging: false,
    entities: [User, Book, BookRate, BookBelonging],
    migrations: [],
    subscribers: [],
})

