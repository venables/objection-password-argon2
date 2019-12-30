import ObjectionPassword, {
  generatePasswordHash,
  isArgonHash,
  verifyPassword
} from '../lib/index'
import Knex from 'knex'
import { Model } from 'objection'

const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: ':memory:'
  },
  useNullAsDefault: true
})

Model.knex(knex)

class Dog extends ObjectionPassword()(Model) {
  public static tableName = 'dog';

  public readonly id?: number;
  public name?: string;
  public password?: string;
}

beforeAll(async () => {
  await knex.schema.createTable('dog', table => {
    table.increments()
    table.string('name')
    table.string('password')
  })
})

afterAll(async () => {
  await knex.schema.dropTableIfExists('dog')

  knex.destroy()
})

test('hashes and verifies a password', async () => {
  const password = 'Turtle123!'
  const dog = await Dog.query().insert({ name: 'JJ', password })
  expect(await dog.verifyPassword(password)).toBe(true)
})

test('creates new hash when updating password', async () => {
  const original = 'Turtle123!'
  const updated = 'Monkey69!'

  const dog = await Dog.query().insert({ name: 'JJ', password: original })
  expect(await dog.verifyPassword(original)).toBe(true)

  const updatedDog = await dog
    .$query()
    .patchAndFetchById(dog.id!, { password: updated })
  expect(await updatedDog.verifyPassword(updated)).toBe(true)
})

test("ignores hashing password field when patching a record where password isn't updated", async () => {
  const dog = await Dog.query().insert({ name: 'JJ', password: 'Turtle123!' })
  const passwordHash = dog.password

  const updatedDog = await dog
    .$query()
    .patchAndFetchById(dog.id!, { name: 'Jumbo Jet' })

  expect(updatedDog.password).toEqual(passwordHash)
})

test('do not allow empty password', async () => {
  const password = ''
  await expect(
    Dog.query().insert({ name: 'JJ', password })
  ).rejects.toThrowError(/password must not be empty/)
})

test('allow empty password', async () => {
  class Mouse extends ObjectionPassword({ allowEmptyPassword: true })(Model) {
    public static tableName = 'mouse';

    public name?: string;
    public password?: string;
  }

  await knex.schema.createTable('mouse', table => {
    table.increments()
    table.string('name')
    table.string('password')
  })

  const password = ''
  const mouse = await Mouse.query().insert({ name: 'Ricky', password })

  expect(mouse.password).toBeFalsy()
})

test('throws an error when attempting to hash a argon2 hash', async () => {
  const password =
    '$argon2i$v=19$m=4096,t=3,p=1$yqdvmjCHT1o+03hbpFg7HQ$Vg3+D9kW9+Nm0+ukCzKNWLb0h8iPQdTkD/HYHrxInhA'
  await expect(
    Dog.query().insert({ name: 'JJ', password })
  ).rejects.toThrowError('Argon2 tried to hash another Argon2 hash')
})

test('can override default password field', async () => {
  class Cat extends ObjectionPassword({ passwordField: 'hash' })(Model) {
    public static tableName = 'cat';

    public name?: string;
    public hash?: string;
  }

  await knex.schema.createTable('cat', table => {
    table.increments()
    table.string('name')
    table.string('hash')
  })

  const password = 'Turtle123!'
  const cat = await Cat.query().insert({ name: 'Maude', hash: password })

  expect(cat.hash).toBeTruthy()
  expect(await cat.verifyPassword(password)).toBe(true)
})

test('allows verifying two password strings', async () => {
  expect(await verifyPassword('test', 'test')).toBeTruthy()

  expect(await verifyPassword('test', 'not-the-same')).toBeFalsy()
})

test('allows creating password using argon2', async () => {
  const password = await generatePasswordHash('password')
  const validPassword = isArgonHash(password)
  expect(validPassword).toBeTruthy()
})
