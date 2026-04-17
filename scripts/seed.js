import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const HASH_ROUNDS = 10
const VENDOR_COUNT = 10
const PRODUCE_COUNT = 100
const CUSTOMER_COUNT = 5
const POST_COUNT = 20

const PRODUCE_CATEGORIES = ['Vegetables', 'Fruits', 'Herbs', 'Seeds', 'Gardening Tools']
const PRODUCE_NAMES = [
  'Tomato', 'Spinach', 'Carrot', 'Lettuce', 'Bell Pepper',
  'Cucumber', 'Mango', 'Banana', 'Basil', 'Mint',
  'Sunflower Seeds', 'Pumpkin Seeds', 'Eggplant', 'Okra',
  'Bitter Gourd', 'Bottle Gourd', 'Radish', 'Garlic',
  'Coriander', 'Turmeric Root', 'Green Chili', 'Brinjal',
  'Sweet Potato', 'Lemon', 'Papaya'
]

const AGENCIES = [
  'Bangladesh Organic Certification Board',
  'GreenCert Asia',
  'EcoVerified BD',
  'Organic Trust Foundation',
  'Sustainable Farms Alliance'
]

const GROWTH_STAGES = ['seedling', 'growing', 'flowering', 'harvest-ready']

const FORUM_TAGS = [
  ['organic', 'soil', 'tips'],
  ['urban-farming', 'balcony', 'containers'],
  ['composting', 'fertilizer'],
  ['pest-control', 'natural'],
  ['irrigation', 'water-saving'],
  ['seeds', 'planting-season'],
]

async function wipeDatabase() {
  await prisma.plantLog.deleteMany()
  await prisma.sustainabilityCert.deleteMany()
  await prisma.communityPost.deleteMany()
  await prisma.order.deleteMany()
  await prisma.produce.deleteMany()
  await prisma.rentalSpace.deleteMany()
  await prisma.vendorProfile.deleteMany()
  await prisma.user.deleteMany()
  console.log('🗑️  Existing records cleared.')
}

async function seedAdmin() {
  const hash = await bcrypt.hash('Admin@1234', HASH_ROUNDS)
  const admin = await prisma.user.create({
    data: {
      name: 'Platform Administrator',
      email: 'admin@greenroots.dev',
      password: hash,
      role: 'ADMIN',
      status: 'active',
    },
  })
  console.log('👤 Admin created:', admin.email)
  return admin
}

async function seedVendors() {
  const vendors = []
  const profiles = []

  for (let i = 0; i < VENDOR_COUNT; i++) {
    const hash = await bcrypt.hash('Vendor@1234', HASH_ROUNDS)
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: hash,
        role: 'VENDOR',
        status: 'active',
      },
    })

    const profile = await prisma.vendorProfile.create({
      data: {
        userId: user.id,
        farmName: `${faker.word.adjective({ strategy: 'closest' })} ${faker.word.noun()} Farm`,
        farmLocation: `${faker.location.city()}, Bangladesh`,
        bio: faker.lorem.sentence(),
        certificationStatus: faker.helpers.arrayElement(['PENDING', 'APPROVED', 'REJECTED']),
      },
    })

    vendors.push(user)
    profiles.push(profile)
  }

  console.log(`🌾 ${VENDOR_COUNT} vendor accounts created`)
  return { vendors, profiles }
}

async function seedProduce(vendorProfiles) {
  for (let i = 0; i < PRODUCE_COUNT; i++) {
    const vendor = faker.helpers.arrayElement(vendorProfiles)
    await prisma.produce.create({
      data: {
        vendorId: vendor.id,
        name: faker.helpers.arrayElement(PRODUCE_NAMES),
        description: faker.lorem.sentences(2),
        price: parseFloat(faker.commerce.price({ min: 5, max: 800 })),
        category: faker.helpers.arrayElement(PRODUCE_CATEGORIES),
        certificationStatus: faker.helpers.arrayElement(['PENDING', 'APPROVED']),
        availableQuantity: faker.number.int({ min: 0, max: 250 }),
      },
    })
  }
  console.log(`🥦 ${PRODUCE_COUNT} produce items created`)
}

async function seedCustomers() {
  const customers = []
  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const hash = await bcrypt.hash('Customer@1234', HASH_ROUNDS)
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: hash,
        role: 'CUSTOMER',
        status: 'active',
      },
    })
    customers.push(user)
  }
  console.log(`🛒 ${CUSTOMER_COUNT} customer accounts created`)
  return customers
}

async function seedOrders(customers, vendorProfiles) {
  for (const customer of customers) {
    const vendor = faker.helpers.arrayElement(vendorProfiles)
    const produce = await prisma.produce.findFirst({ where: { vendorId: vendor.id } })
    if (!produce) continue

    await prisma.order.create({
      data: {
        userId: customer.id,
        produceId: produce.id,
        vendorId: vendor.id,
        quantity: faker.number.int({ min: 1, max: 5 }),
        status: faker.helpers.arrayElement(['PENDING', 'CONFIRMED', 'DELIVERED']),
      },
    })
  }
  console.log('📦 Sample orders created')
}

async function seedForumPosts(allUsers) {
  for (let i = 0; i < POST_COUNT; i++) {
    const user = faker.helpers.arrayElement(allUsers)
    await prisma.communityPost.create({
      data: {
        userId: user.id,
        title: faker.lorem.sentence({ min: 4, max: 8 }).replace('.', ''),
        postContent: faker.lorem.paragraphs(2),
        tags: faker.helpers.arrayElement(FORUM_TAGS),
      },
    })
  }
  console.log(`💬 ${POST_COUNT} forum posts created`)
}

async function seedRentalSpaces(vendorProfiles) {
  for (const vendor of vendorProfiles) {
    await prisma.rentalSpace.create({
      data: {
        vendorId: vendor.id,
        location: `${faker.location.streetAddress()}, ${faker.location.city()}, Bangladesh`,
        size: faker.helpers.arrayElement(['3x3 m', '5x5 m', '10x10 m', '20x10 m', '50x20 m']),
        pricePerMonth: parseFloat(faker.commerce.price({ min: 200, max: 8000 })),
        availability: faker.datatype.boolean(),
        description: faker.lorem.sentence(),
      },
    })
  }
  console.log('🏡 Rental spaces created')
}

async function seedCertifications(vendorProfiles) {
  for (const vendor of vendorProfiles) {
    const certDate = faker.date.past({ years: 2 })
    await prisma.sustainabilityCert.create({
      data: {
        vendorId: vendor.id,
        certifyingAgency: faker.helpers.arrayElement(AGENCIES),
        certificationDate: certDate,
        expiryDate: new Date(certDate.getFullYear() + 2, certDate.getMonth(), certDate.getDate()),
        status: faker.helpers.arrayElement(['PENDING', 'APPROVED', 'REJECTED']),
      },
    })
  }
  console.log('📜 Sustainability certifications created')
}

async function seedPlantLogs(customers, vendorProfiles) {
  for (const customer of customers) {
    const vendor = faker.helpers.arrayElement(vendorProfiles)
    const produce = await prisma.produce.findFirst({ where: { vendorId: vendor.id } })
    if (!produce) continue

    const logsCount = faker.number.int({ min: 1, max: 4 })
    for (let i = 0; i < logsCount; i++) {
      await prisma.plantLog.create({
        data: {
          userId: customer.id,
          produceId: produce.id,
          stage: faker.helpers.arrayElement(GROWTH_STAGES),
          healthScore: faker.number.int({ min: 40, max: 100 }),
          notes: faker.lorem.sentence(),
          loggedAt: faker.date.recent({ days: 30 }),
        },
      })
    }
  }
  console.log('🌱 Plant tracking logs created')
}

async function main() {
  console.log('\n🌿 GreenRoots — Seeding database...\n')

  await wipeDatabase()

  const _admin = await seedAdmin()
  const { vendors, profiles } = await seedVendors()
  const customers = await seedCustomers()

  await seedProduce(profiles)
  await seedOrders(customers, profiles)
  await seedForumPosts([...vendors, ...customers])
  await seedRentalSpaces(profiles)
  await seedCertifications(profiles)
  await seedPlantLogs(customers, profiles)

  console.log('\n✅ Seeding complete!')
  console.log('─────────────────────────────────────────────')
  console.log('  Admin      →  admin@greenroots.dev  /  Admin@1234')
  console.log('  Vendor     →  (check DB)            /  Vendor@1234')
  console.log('  Customer   →  (check DB)            /  Customer@1234')
  console.log('─────────────────────────────────────────────\n')
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
