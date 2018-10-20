import program from 'commander'
import path from 'path'
import fs from 'fs'
import prompts from 'prompts'
import download from 'download'
import { sprintf } from 'sprintf-js'
import fetch from 'node-fetch'

program.version('0.0.1')
program.command('help').alias('h')

// Command to list all open datasets
program
  .command('list')
  .alias('l')
  .description('List all open datasets')
  .action(async () => {
    const list = await fetch('https://data.gov.sg/api/action/package_list')
    const listJSON = await list.json()
    listJSON.result.map((obj, idx) => {
      console.log(sprintf('ID: %2.2d Name: %s', idx, obj))
    })
  })

// Command to download a specific package
program
  .command('download <package> <dest>')
  .alias('d')
  .description(
    'download a specific package from government open data and save it to the dest directory',
  )
  .action(async (pkg, dest) => {
    const packageUrl = `https://data.gov.sg/api/action/package_show?id=${pkg}`
    const packageResult = await fetch(packageUrl)
    // Check if the package name is valid
    if (packageResult.status == 404) {
      console.error(`Could not find any package with the name ${pkg}`)
      process.exit()
    }
    const packageJSON = await packageResult.json()
    const {
      result: { resources },
    } = packageJSON
    resources.map((obj, idx) => {
      console.log(`(${idx}) - ${obj.name}`)
    })
    // Check whether the path is a directory
    try {
      const stats = fs.statSync(path.resolve(dest))
      if (!stats.isDirectory()) {
        // Not directory
        console.error(`Could not find directory (${dest})`)
        process.exit()
      }
    } catch {
      // Neither directory nor file
      console.error(`Could not find directory (${dest})`)
      process.exit()
    }
    // Prompt user to check which package the user wants to download
    const userResponse = await prompts({
      type: 'number',
      name: 'value',
      message: 'Which file you want to download?',
      validate: value => (value > resources.length ? 'Out of range' : true),
    })
    let { value } = userResponse
    let { format, name, url } = resources[value]
    let ext = ''
    // If the format is API - The data will be in JSON (no file ext)
    if (format == 'API') {
      ext = 'json'
    } else {
      // Get the extension
      const urlSplit = url.split('.')
      ext = urlSplit[urlSplit.length - 1]
    }
    // Get the file path which we will save the data
    const filePath = path.resolve(dest, `${name}.${ext}`)
    // Write to file path
    download(url).pipe(fs.createWriteStream(filePath))
  })

program
  .description(
    'CLI that allows you to view singapore government open datasets using node cli.',
  )
  .parse(process.argv)
