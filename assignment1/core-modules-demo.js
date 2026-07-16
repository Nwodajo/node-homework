const os = require('os');
const path = require('path');
const fs = require('fs').promises;

async function run() {
  const sampleFilesDir = path.join(__dirname, 'sample-files');

  // Make sure sample-files exists
  await fs.mkdir(sampleFilesDir, { recursive: true });

  // OS module
  console.log('Platform:', os.platform());
  console.log('CPU:', os.cpus()[0].model);
  console.log('Total Memory:', os.totalmem());

  // Path module
  const demoTxt = path.join(sampleFilesDir, 'demo.txt');
  console.log('Joined path:', demoTxt);

  // fs.promises API
  await fs.writeFile(
    demoTxt,
    'Hello from fs.promises!',
    'utf8'
  );

  const content = await fs.readFile(demoTxt, 'utf8');
  console.log('fs.promises read:', content);
}

run();