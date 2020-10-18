const organizer = require('./lib/organize-images')
const args = require('minimist')(process.argv.slice(2))._

if (args.length !== 2) {
  console.error('Need to specify a SOURCE and DESTINATION.')
  exitPrompt()
} else {
  imageOrganizer(args[0], args[1])
}

async function imageOrganizer(source, destination) {
  const images = await organizer.allImages(source)
  if (images) {
    organizer.renameFiles(images, destination)
    console.log(`Renamed & moved ${images.length} files to ${destination}`)
  } else {
    console.error('No images found!')
  }
  exitPrompt()
}

function exitPrompt() {
  console.log('Press any key to exit');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', process.exit.bind(process, 0));
}
