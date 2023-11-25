/**
 * @namespace typedefs
 */

/**
 * @typedef {import("../class/PresentationInfo")} PresentationInfo
 * @typedef {import("../class/DataSorter")} DataSorter
 * @typedef {import("../class/VideoCreator")} VideoCreator
 */

/**
 * Resolution of the video
 * @typedef {object} Resolution
 * @prop {number} width
 * @prop {number} height
 */

/**
 * @typedef {object} Timestamp
 * @prop {number} start
 * @prop {number} end
 */

/**
 * @typedef {object} Position
 * @prop {number} posX
 * @prop {number} posY
 */

/**
 * @typedef {object} Shape
 * @prop {string} id
 * @prop {Timestamp} timestamp
 * @prop {string} location
 */

/**
 * @typedef {object} Cursor
 * @prop {Timestamp} timestamp
 * @prop {Position} position
 */

/**
 * @typedef {object} Slide
 * @prop {string} id Slide name
 * @prop {string} fileName Image file name
 * @prop {Timestamp} timestamp Slide start and end point
 * @prop {Resolution} resolution Slide resolution
 * @prop {string} url Url to where the slide image is located
 * @prop {Shape[] | null} shapes Array of drawn shapes during presentation
 * @prop {Cursor[] |null} cursors Array of cursor movements during presentation
 */

/**
 * Used for storing information about data for a certain slide
 * when creating a sequence
 * @typedef {object} Chunk
 * @prop {string} id
 * @prop {number} width
 * @prop {number} height
 * @prop {Timestamp} timestamp
 * @prop {string} command FFMPEG command // TODO: Might need to be removed
 * @prop {string[][]} commands
 * @prop {number} duration Chunk duration in seconds
 * @prop {string} fileLocation  // TODO: Might need to be removed
 * @prop {string[]} filesLocations
 */

/**
 * Values inside the 'event' object for deskshare
 * @typedef {object} DeskshareRecordingEventValues
 * @prop {string} start_timestamp number
 * @prop {string} stop_timestamp number
 * @prop {string} video_height number
 * @prop {string} video_width number
 */

/**
 * 'deskshare.xml' definition
 * @typedef {object} DeskshareXML
 * @prop {{event: DeskshareRecordingEventValues | DeskshareRecordingEventValues[] | undefined}} recording
 */

/**
 * Timestamps and durations for sharescreen chunks
 * @typedef {object} SharescreenChunks
 * @prop {number} start
 * @prop {number} end
 * @prop {number} duration
 * @prop {string} fileLocation
 * @prop {string} fileName
 */

/**
 * Child process props
 * @typedef {object} CreateShapeExportProcessesProps
 * @prop {string} filePath
 * @prop {Resolution} resolution
 * @prop {Slide[]} slides
 * @prop {import("../class/PresentationInfo")} presentation
 */

/**
 * Shapes export function params
 * @callback ExportShapesToPngFuncProps
 * @param {PresentationInfo} presentation
 * @param {Resolution} resolution
 * @param {Slide[] | null} slides
 */

module.exports.unused = {};
