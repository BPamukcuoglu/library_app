import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class BookRate {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    book_id: number

    @Column()
    user_id: number

    @Column()
    rate: number

}
