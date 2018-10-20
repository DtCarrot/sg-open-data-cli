import program from 'commander'
import path from 'path'
import fs from 'fs'
import prompts from 'prompts'
import download from 'download'
import { sprintf } from 'sprintf-js'
import fetch from 'node-fetch'

console.log('Running')
program.version('0.0.1').description('Contact management system')

program
  .command('list')
  .alias('a')
  .description('Add a contact')
  .action(async () => {
    const list = await fetch('https://data.gov.sg/api/action/package_list')
    const listJSON = await list.json()
    listJSON.result.map((obj, idx) => {
      console.log(sprintf('ID: %2.2d Name: %s', idx, obj))
    })
  })

program
  .command('download <package> <dest>')
  .alias('a')
  .description('download')
  .action(async (pkg, dest) => {
    const packageUrl = `https://data.gov.sg/api/action/package_show?id=${pkg}`
    const packageResult = await fetch(packageUrl)
    console.log('Result: ', packageResult)
    const packageJSON = await packageResult.json()
    const {
      result: { resources },
    } = packageJSON
    console.log(`There are ${resources.length} resources`)
    resources.map((obj, idx) => {
      console.log(`${idx} - ${obj.name}`)
    })
    const userResponse = await prompts({
      type: 'number',
      name: 'value',
      message: 'Which file you want to download?',
      validate: value => (value > resources.length ? 'Out of range' : true),
    })
    console.log('Response: ', userResponse)
    let { value } = userResponse
    let { format, name, url } = resources[value]
    console.log('Url: ', name)
    const urlSplit = url.split('.')
    let ext = urlSplit[urlSplit.length - 1]
    if (format == 'API') {
      ext = 'json'
    }
    const filePath = path.resolve(dest, `${name}.${ext}`)
    download(url).pipe(fs.createWriteStream(filePath))
  })

program.parse(process.argv)
