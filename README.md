## BBB Converter
Tool for converting BigBlueButton presentations to video format [DEMO](https://www.youtube.com/watch?v=X6YP-LovZbE)

## Conversion coverage
- Presentation slides
- Share screen
- Audio
- Cursor pointer
- Drawn shapes
- Poll results
- Slides timestamps

## Requirements
- Node.js
- FFmpeg

## How to use it
- Make sure that you have Node.js installed, and that FFmpeg is added to PATH and present as a terminal command. Run these two commands to check:
```
node --version
ffmpeg -version
```
- Open a terminal inside the project and install the dependencies: `npm install`
- To add a BigBlueButton url, you'll need to open the project code and change it manually (this might be changed in the future)
- Open `src/index.js` and replace the `'BBB_URL_HERE'` placeholder with a BBB presentation link
- Once you're done, save and close the file
- Open a terminal inside the project and run this command: `npm run start`

If you've done everything correctly, the script should start downloading all presentation assets.
Depending on how many items need to be downloaded and generated the conversion time may vary, 
so make sure that you have a stable internet connection and enough storage on your computer (~500 MB).

When the conversion is completed, you'll get a terminal message with the elapsed time and the location of the video file. 
From my testing, a two hour presentation with fast internet and decent PC specs gets converted in around 30 minutes
(it's faster for shorter presentations, or ones with less interactions).

## Config file (config.json)
| Key                     | Value   | Description                                               |
| ----------------------- | ------- | --------------------------------------------------------- |
| consoleLogStatus        | boolean | Display logs of each step                                 |
| ffmpegStatus            | boolean | Display FFmpeg logs                                       |
| reEncodeFinalConcat     | boolean | Enable if the final concatenated video is created broken  |
| cleanUpWhenDone         | boolean | Remove all unnecessary files created during convertsion   |

## Possible issues
- Sometimes it can happen for the script to lose connection mid conversion and crash, just start it again. It'll check if
  the files are present, skip them if they exist and continue from where it last left.
- Avoid spaces in the project folder location.



