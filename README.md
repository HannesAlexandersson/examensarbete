to create new tables with prisma create an model and push to the db: 
ex: 

model newTable {
  id         Int      @id @default(autoincrement())
  first_row_id Int
  second_id   Int
  Info   Infos @relation(fields: [Info_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_contact")
  Staff      Staff    @relation(fields: [staff_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_staff")

  @@schema("public")
}

npx prisma db push

