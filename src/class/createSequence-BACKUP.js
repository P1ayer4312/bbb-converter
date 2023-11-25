createSequence(dataSorter, presentation) {
  for (let slide of dataSorter.slides) {
    /**
     * @type {typedefs.Chunk}
     */
    const chunk = {};
    // 'offset' is used for correcting chunk timings for elements
    const offset = slide.timestamp.start;
    chunk.height = this.resolution.height;
    chunk.width = Math.round(
      (this.resolution.height * slide.resolution.width) /
        slide.resolution.height
    );
    chunk.timestamp = slide.timestamp;
    // Add padding from the left side of cursors if the slide
    // image width is too small for the wanted resolution
    const padding =
      chunk.width < this.resolution.width
        ? (this.resolution.width - chunk.width) / 2
        : 0;
    const complexFilterBuilder = [];
    const inputBuilder = [presentation.cursorLocation];
    // Center slide if it's smaller than the desired resolution
    const slideDefs =
      `[0]pad=width=${this.resolution.width}:height=${this.resolution.height}:x=-1:y=-1:color=black,setsar=1,` +
      `scale=${this.resolution.width}:${this.resolution.height}:force_original_aspect_ratio=1[v0];[v0]`;

    // Check if there are cursors present
    if (slide.cursors !== null) {
      for (let n = 0; n < slide.cursors.length; n++) {
        const cursor = slide.cursors[n];
        const cursorX = (
          chunk.width * cursor.position.posX +
          padding
        ).toFixed(2);
        const cursorY = (chunk.height * cursor.position.posY).toFixed(2);
        const start = (cursor.timestamp.start - offset).toFixed(2);
        const end = (cursor.timestamp.end - offset).toFixed(2);

        complexFilterBuilder.push(
          (n === 0 ? slideDefs : `[v${n}]`) +
            `[1:v]overlay=${cursorX}:${cursorY}:enable='between(t,${start},${end})'` +
            (n < slide.cursors.length - 1 ? `[v${n + 1}];` : ``)
        );
      }
    } else {
      // Push empty cursor to not break the chain of inputs
      complexFilterBuilder.push(
        `${slideDefs}[1:v]overlay=-20:-20:enable='between(t,0,0)'`
      );
    }

    // Check if there are any shapes present
    if (slide.shapes !== null) {
      const lastCursor = complexFilterBuilder.length;
      for (let n = 0; n < slide.shapes.length; n++) {
        const shape = slide.shapes[n];
        const start = (shape.timestamp.start - offset).toFixed(2);
        const end = (shape.timestamp.end - offset).toFixed(2);

        complexFilterBuilder.push(
          (n === 0
            ? `[v${lastCursor}];[v${lastCursor}]`
            : `[v${lastCursor + n}]`) +
            `[${n + 2}:v]overlay=0:0:enable=` +
            `'between(t,${start},${end})'` +
            (n < slide.shapes.length - 1 ? `[v${lastCursor + n + 1}];` : ``)
        );
        inputBuilder.push(shape.location);
      }
    }

    const complexFilterFileName = `${slide.id}.txt`;
    const complexFilterFileLocation = path.resolve(
      presentation.dataLocation,
      complexFilterFileName
    );
    const slideImageLocation = path.resolve(
      presentation.dataLocation,
      slide.fileName
    );
    const videoChunkLocation = path.resolve(
      presentation.dataLocation,
      `${slide.id}.mp4`
    );
    chunk.id = slide.id;
    chunk.duration = Number(
      (slide.timestamp.end - slide.timestamp.start).toFixed(2)
    );
    chunk.fileLocation = videoChunkLocation;
    chunk.command =
      `ffmpeg -y -loop 1 -r 20 -i ${slideImageLocation} ` +
      `-i ${inputBuilder.join(' -i ')} -t ${chunk.duration} ` +
      `-filter_complex_script ${complexFilterFileLocation} ` +
      `${videoChunkLocation}`;

    fs.writeFileSync(
      complexFilterFileLocation,
      complexFilterBuilder.join('')
    );
    this.sequence.push(chunk);
  }
}