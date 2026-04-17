import dotenv from 'dotenv'
dotenv.config()

import app from './src/app.js'

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`\n🌿 GreenRoots API`)
  console.log(`   Server  → http://localhost:${PORT}`)
  console.log(`   Docs    → http://localhost:${PORT}/api/docs`)
  console.log(`   Health  → http://localhost:${PORT}/health\n`)
})
