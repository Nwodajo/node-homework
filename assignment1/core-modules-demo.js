const os = require('os');
const path = require('path');
const fs = require('fs/promises');

const sampleFilesDir = path.join(__dirname, 'sample-files');

async function run() {
  await fs.mkdir(sampleFilesDir, { recursive: true });


// OS module

console.log('Platform:', os.platform());
  console.log('CPU:', os.cpus()[0].model);
  console.log('Total Memory:', os.totalmem());


// Path module
const joinedPath = path.join(sampleFilesDir, 'folder', 'file.txt');
  console.log('Joined path:', joinedPath);

// fs.promises API
  const demoFile = path.join(sampleFilesDir, 'demo.txt');
  await fs.writeFile(demoFile, 'Hello from fs.promises!');
  const content = await fs.readFile(demoFile, 'utf8');
  console.log('fs.promises read:', content);
}

run();


// Streams for large files- log first 40 chars of each chunk
const fsSync = require('fs');

const stream = fsSync.createReadStream(__filename, {
  encoding: 'utf8',
  highWaterMark: 40,
});

stream.on('data', (chunk) => {
  console.log(chunk.slice(0, 40));
});