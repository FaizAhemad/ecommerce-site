const major = Number(process.versions.node.split('.')[0])

if (major !== 22) {
  console.error(`Unsupported Node.js version ${process.versions.node}. Use Node 22 LTS (see .nvmrc) before starting the development server.`)
  process.exit(1)
}
