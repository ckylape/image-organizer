const ExifImage  = require('exif').ExifImage
const fs = require('fs-extra')
const path = require('path')
const moment = require('moment')
const globby = require('globby')
const slash = require('slash')

module.exports = new class {
  renameFiles(files, destination) {
    for(const f of files) {
      const updated = path.join(destination, f.new)
      fs.mkdirSync(path.dirname(updated), { recursive: true })
      fs.renameSync(f.current, updated)
    }
  }

  getExif(file) {
    return new Promise(resolve => {
      ExifImage(file, (err, data) => {
        if (err) {
          resolve({})
        } else {
          resolve(data.image)
        }
      })
    })
  }

  async newFilenameWithDate(file) {
    try {
      let newFilename
      let foundDate

      // first try using exif data
      const tags = await this.getExif(file)
      if ('ModifyDate' in tags) {
        foundDate = moment(tags.ModifyDate, 'YYYY:MM:DD HH:mm:ss')
      }
      if ('DateTimeOriginal' in tags) {
        foundDate = moment(tags.DateTimeOriginal, 'YYYY:MM:DD HH:mm:ss')
      }

      // if not, try using regex
      const patterns = [
        { r: /\d{8}[-|_]\d{6}/, f: 'YYYYMMDD_HHmmss' },
        { r: /\d{4}[-|_]\d{2}[-|_]\d{2}[-|_]\d{2}[-|_]\d{2}/, f: 'YYYY_MM_DD_HH_mm_ss' }
      ]
      if (!foundDate) {
        for(const pattern of patterns) {
          const m = file.match(pattern.r)
          if (m && !foundDate) {
            foundDate = moment(m[0].replace('-', '_'), pattern.f)
          }
        }
      }

      // cleanup the data
      if (foundDate) {
        const newDir = foundDate.format('YYYY/MM/')
        newFilename = newDir + foundDate.format('YYYYMMDD_HHmmss') + path.extname(file)
      }

      return newFilename
    } catch (error) {
      console.log(error.message)
      throw error
    }
  }

  async allImages(directory) {
    try {
      const images = await globby(slash(directory), {
        expandDirectories: {
          extensions: ['jpg', 'gif', 'webp', 'flif', 'cr2', 'tif', 'bmp', 'ico', 'bpg', 'jp2', 'jpm', 'jpx', 'png', 'dcm']
        }
      })

      const updates = []

      for(const file of images) {
        const newfile = await this.newFilenameWithDate(file)
        if (newfile) {
          updates.push({ current: file, new: newfile })
        } else {
          console.log(`Skipped: ${file}`)
        }
      }

      return updates
    } catch (e) {
      console.error(e)
    }
  }
}

