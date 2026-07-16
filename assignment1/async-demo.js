const fs = require('fs');
const path = require('path');

const sampleDir = path.join(__dirname, 'sample-files');
const sampleFile = path.join(sampleDir, 'sample.txt');

if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

fs.writeFileSync(sampleFile, 'Hello, async world!');

// 1. Callback style
fs.readFile(sampleFile, 'utf8', (err, data) => {
  if (err) {
    console.log(err.message);
    return;
  }

  console.log('Callback read:', data);
});

// Callback hell example:
/*
fs.readFile(sampleFile, 'utf8', (err, data) => {
  fs.readFile(sampleFile, 'utf8', (err, data) => {
    fs.readFile(sampleFile, 'utf8', (err, data) => {
      console.log(data);
    });
  });
});
*/

// 2. Promise style
fs.promises
  .readFile(sampleFile, 'utf8')
  .then((data) => {
    console.log('Promise read:', data);
  })
  .catch((err) => {
    console.log(err.message);
  });

// 3. Async/Await style
async function runAsync() {
  try {
    const data = await fs.promises.readFile(sampleFile, 'utf8');
    console.log('Async/Await read:', data);
  } catch (err) {
    console.log(err.message);
  }
}

runAsync();