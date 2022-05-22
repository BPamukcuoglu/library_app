import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class BookBelonging {

    @PrimaryGeneratedColumn("increment")
    id: number

    @Column()
    book_id: number

    @Column()
    user_id: number

}
