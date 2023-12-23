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
- Pan zoom corrections

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
- To add BigBlueButton urls, you'll need to create a text file inside the `links` folder with all presentation links that you want to convert. Follow `example.txt` for more information.
- Once you're done, save and close the file.
- Open a terminal inside the project and run this command: `npm run start`

If you've done everything correctly, the script should start downloading all presentation assets.
Depending on how many items need to be downloaded and generated the conversion time may vary,
so make sure that you have a stable internet connection and enough storage on your computer.

When the conversion is completed, you'll get a terminal message with the elapsed time and the location of the video file.
From my testing, a two hour presentation with fast internet and decent PC specs gets converted in around 30 minutes
(it's faster for shorter presentations, or ones with less interactions).

## Config file (config.json)

| Key                      | Value   | Description                                                      |
| ------------------------ | ------- | ---------------------------------------------------------------- |
| consoleLogStatus         | boolean | Display logs of each step                                        |
| ffmpegStatus             | boolean | Display FFmpeg logs                                              |
| reEncodeFinalConcat      | boolean | Enable if the final concatenated video is created broken         |
| cleanUpWhenDone          | boolean | Remove all unnecessary files created during conversion           |
| createDebugFiles         | boolean | Creates text file with timestamps for each interaction           |
| numShapesExportProcesses | boolean | How many Node.js processes to be created for drawing interaction |

## Possible issues

- Sometimes it can happen for the script to lose connection mid conversion and crash, just start it again. It'll check if the files are present, skip them if they exist and continue from where it last left. If ffmpeg crashes during conversion, you'll need to find the last file that was being created and remove it manually in case the file was not saved properly.

## Development

The project is configured for VS Code, so if you want to attach a debugger you can do that from the `Run and Debug` panel.

There are few available commands for development:

- `npm run fetchDummyData` - Command that triggers a function which downloads all assets needed for the conversion. This can be useful for testing exports and to not ping the main servers each time. In order to download the files, you'll need to go inside `src\function\dev\downloadDummyData.js` and change `presentationUrl` with the link which you want to download data from. When the function is done running, it'll create a folder `src\devDummyData` with all XML files.
- `npm run serve` - Starts a local server that serves the XML files downloaded from the command above.
- `npm run start:local` - Starts the project in local mode that uses the dummy files downloaded from earlier. The `serve` command needs to be running in a separate terminal in the background before running this command.
