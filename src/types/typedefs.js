/**
 * @namespace typedefs
 */

/**
 * Resolution of the video
 * @typedef {Object} Resolution
 * @property {Number} width
 * @property {Number} height
 */

/**
 * @typedef {Object} Timestamp
 * @property {Number} start
 * @property {Number} end
 */

/**
 * @typedef {Object} Position
 * @property {Number} posX
 * @property {Number} posY
 */

/**
 * @typedef {Object} Shape
 * @property {String} id
 * @property {Timestamp} timestamp
 * @property {String} location
 */

/**
 * @typedef {Object} Cursor
 * @property {Timestamp} timestamp
 * @property {Position} position
 */

/**
 * @typedef {Object} Slide
 * @property {String} id Slide name
 * @property {String} fileName Image file name
 * @property {Timestamp} timestamp Slide start and end point
 * @property {Resolution} resolution Slide resolution
 * @property {String} url Url to where the slide image is located
 * @property {(Array.<Shape>|null)} shapes Array of drawn shapes during presentation
 * @property {(Array.<Cursor>|null)} cursors Array of cursor movements during presentation
 */

/**
 * Used for storing information about data for a certain slide
 * when creating a sequence
 * @typedef {Object} Chunk
 * @property {String} id
 * @property {Number} width
 * @property {Number} height
 * @property {Timestamp} timestamp
 * @property {String} command FFMPEG command
 * @property {Number} duration Chunk duration in seconds
 * @property {String} fileLocation
 */

/**
 * Values inside the 'event' object for deskshare
 * @typedef {Object} DeskshareRecordingEventValues
 * @property {String} start_timestamp Number
 * @property {String} stop_timestamp Number
 * @property {String} video_height Number
 * @property {String} video_width Number
 */

/**
 * 'deskshare.xml' definition
 * @typedef {Object} DeskshareXML
 * @property {{event: DeskshareRecordingEventValues | Array.<DeskshareRecordingEventValues> | undefined}} recording
 */

/**
 * Timestamps and durations for sharescreen chunks
 * @typedef {Object} SharescreenChunks
 * @property {Number} start
 * @property {Number} end
 * @property {Number} duration
 * @property {String} fileLocation
 * @property {String} fileName
 */

module.exports.unused = {};