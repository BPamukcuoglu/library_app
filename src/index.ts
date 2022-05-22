import * as express from "express"
import * as bodyParser from "body-parser"
import { Request, Response } from "express"
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import { Book } from "./entity/Book"
import { BookBelonging } from "./entity/BookBelonging"
import { BookRate } from "./entity/BookRate"
import { body, validationResult } from 'express-validator';
import { createDatabase } from "typeorm-extension";


createDatabase({ ifNotExist: true }).then(() => {

    AppDataSource.initialize().then(async () => {

        const app = express()
        app.use(bodyParser.json())
        const userRepository = AppDataSource.getRepository(User);
        const bookRepository = AppDataSource.getRepository(Book);
        const bookBelongingRepository = AppDataSource.getRepository(BookBelonging);
        const bookRateRepository = AppDataSource.getRepository(BookRate);

        app.get("/", (req: Request, res: Response) => {
            res.send("Library App! Bedirhan Pamukcuoglu");
        });

        app.get("/users", async (req: Request, res: Response) => {
            try {
                const users = await userRepository.find();
                users.length
                    ? res.status(200).json(users)
                    : res.status(400).json("No user!")
            } catch (error) {

            }
        });

        app.get("/users/:id", async (req: Request, res: Response) => {
            try {
                const id = req.params.id
                const user = await userRepository.findOneBy({ id })

                if (user && user.id) {
                    const books = { past: [], present: [] };
                    const previous_books = await bookRateRepository
                        .createQueryBuilder("rate")
                        .leftJoinAndMapOne("rate.book", Book, "booking", 'rate.book_id = booking.id')
                        .where("rate.user_id = :user_id", { user_id: id })
                        .getMany();

                    const active_books = await bookBelongingRepository
                        .createQueryBuilder("belonging")
                        .leftJoinAndMapOne("belonging.book", Book, "booking", 'belonging.book_id = booking.id')
                        .where("belonging.user_id = :user_id", { user_id: id })
                        .getMany();

                    previous_books.map((bookRate: any) => {
                        books.past.push({ name: bookRate.book.name, userScore: bookRate.rate })
                    })

                    active_books.map((bookBelonging: any) => {
                        books.present.push({ name: bookBelonging.book.name })
                    })

                    res.status(200).json({ user, "books": books });
                } else {
                    res.status(404).json("User does not exist!");
                }
            } catch (error) {
                console.log(error)
                res.status(500).json("Internal server error!");
            }


        });

        app.post("/users", body('name').isString(), async (req: Request, res: Response) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ message: "Validation errors!", errors })
                return;
            }
            try {
                const name = req.body.name;
                const user = userRepository.create({ name });
                await userRepository.save(user);
                res.status(201).json({ name: user.name });
            } catch (error) {
                console.log(error)
                res.status(500).json("Internal server error");
            }
        });


        app.get("/books", async (_: Request, res: Response) => {
            try {
                const books = await bookRepository.find();
                books.length
                    ? res.status(200).json(books)
                    : res.status(400).json("What kind of a library is this ? Not a single book exists!")
            } catch (error) {
                console.log(error)
                res.status(500).json("Internal server error!");
            }
        })

        app.get("/books/:id", async (req: Request, res: Response) => {
            try {
                const id = req.params.id;
                const book = await bookRepository.findOneBy({ id });
                if (book) {
                    const bookrates = await bookRateRepository.findBy({ book_id: id });
                    let score = 0;
                    bookrates.map(rate => { score += rate.rate })
                    bookrates.length ? score /= bookrates.length : score = -1;
                    res.status(200).json({ id: book.id, name: book.name, score });
                } else {
                    res.status(404).json("Requested book does not exist!");
                }
            } catch (error) {
                res.status(500).json("Internal server error")
            }
        })

        app.post("/books", body('name').isString(), async (req: Request, res: Response) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ message: "Validation errors!", errors })
                return;
            }
            try {
                const name = req.body.name;
                const book = bookRepository.create({ name })
                await bookRepository.save(book);
                res.status(201).json({ book: book.name });
            } catch (error) {
                res.status(500).json("Internal server error!");
            }
        });


        app.post("/users/:userid/borrow/:bookid", async (req: Request, res: Response) => {
            try {
                const user_id = req.params.userid;
                const book_id = req.params.bookid;
                const book = await bookRepository.findOneBy({ id: book_id });
                const user = await userRepository.findOneBy({ id: user_id })
                if (book && user) {
                    const bookBelonging = await bookBelongingRepository.findOneBy({ book_id });
                    if (!bookBelonging) {
                        const bookBelonging = bookBelongingRepository.create({ book_id, user_id });
                        await bookBelongingRepository.save(bookBelonging);
                        res.status(204).json("OK");
                    } else {
                        res.status(401).json("Book is occupied!")
                    }
                } else {
                    user ? res.status(404).json("User doesn't exist!") : res.status(404).json("Requested book doesn't exist!")
                }
            } catch (error) {
                console.log(error)
                res.status(500).json("Internal server error!")
            }
        });


        app.post("/users/:userid/return/:bookid", body('score').isNumeric(), async (req: Request, res: Response) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ message: "Validation errors!", errors })
                return;
            }
            try {
                const user_id = req.params.userid;
                const book_id = req.params.bookid;
                const score = req.body.score;
                const bookBelonging = await bookBelongingRepository.findOneBy({ user_id, book_id });

                if (bookBelonging) {
                    await bookBelongingRepository.delete(bookBelonging);
                    const bookRate = bookRateRepository.create({ book_id, user_id, rate: score });
                    await bookRateRepository.save(bookRate);
                    res.status(204).json("OK");
                } else {
                    res.status(404).json("Can not return the book!");
                }
            } catch (error) {
                console.log(error)
                res.status(500, "Internal server error!");
            }
        });


        app.listen(3000)

    }).catch(error => console.log(error))
})

