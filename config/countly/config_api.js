/**
* Module for user provided API configurations
* @module api/config
*/

const fs = require("fs");

/**
 * Read a Docker Secret from a specified path. Terminates node execution when the secret cannot be found.
 *
 * @param {*} secretNameAndPath Path and name of the Docker Secret.
 * @returns A Docker Secret string.
 */
function readSecret(secretNameAndPath) {
    try {
        const val = fs.readFileSync(`${secretNameAndPath}`, "utf8");
        return val;
    } catch(err) {
        console.log(`ERROR (API): Docker secret '${secretNameAndPath}' not found`);
        process.exit(1);
    }
};


/** @lends module:api/config */
var countlyConfig = {
    /**
    * MongoDB connection definition and options
    * @type {object} 
    * @property {string} [host=localhost] - host where to connect to mongodb, default localhost
    * @property {array=} replSetServers - array with multiple hosts, if you are connecting to replica set, provide this instead of host
    * @property {string=} replicaName - replica name, must provide for replica set connection to work
    * @property {string} [db=countly] - countly database name, default countly
    * @property {number} [port=27017] - port to use for mongodb connection, default 27017
    * @property {number} [max_pool_size=500] - how large pool size connection per process to create, default 500 per process, not recommended to be more than 1000 per server
    * @property {string=} username - username for authenticating user, if mongodb supports authentication
    * @property {string=} password - password for authenticating user, if mongodb supports authentication
    * @property {object=} dbOptions - provide raw driver database options
    * @property {object=} serverOptions - provide raw driver server options, used for all, single, mongos and replica set servers
    */
    mongodb: {
        username: readSecret("/run/secrets/countly_mongodb_username"),
        password: readSecret("/run/secrets/countly_mongodb_password"),
    },

    /**
    * Default API configuration
    * @type {object} 
    * @property {number} [port=3001] - api port number to use, default 3001
    * @property {string} [host=localhost] - host to which to bind connection
    * @property {number} [max_sockets=1024] - maximal amount of sockets to open simultaneously
    * @property {number} workers - amount of paralel countly processes to run, defaults to cpu/core amount
    * @property {number} [timeout=120000] - nodejs server request timeout, need to also increase nginx timeout too for longer requests
    */
    api: {
        port: 3001,
        host: "127.0.0.1",
        max_sockets: 1024,
        timeout: 120000
    },
    /**
    * Path to use for countly directory, empty path if installed at root of website
    * @type {string} 
    */
    path: "",
    /**
    * Default logging settings
    * @type {object} 
    * @property {string} [default=warn] - default level of logging for {@link logger}
    * @property {array=} info - modules to log for information level for {@link logger}
    */
    logging: {
        info: ["jobs", "push"],
        default: "warn"
    },
    /**
    * Default proxy settings, if provided then countly uses ip address from the right side of x-forwarded-for header ignoring list of provided proxy ip addresses
    * @type {array=} 
    */
    ignoreProxies: [/*"127.0.0.1"*/],

    /**
    * Default settings to be used for {@link module:api/utils/utils.encrypt} and {@link module:api/utils/utils.decrypt} functions and for commandline
    * @type {object}
    * @property {string} key - key used for encryption and decryption
    * @property {string|Buffer} iv - initialization vector to make encryption more secure
    * @property {string} algorithm - name of the algorithm to use for encryption. The algorithm is dependent on OpenSSL, examples are 'aes192', etc. On recent OpenSSL releases, openssl list-cipher-algorithms will display the available cipher algorithms. Default value is aes-256-cbc
    * @property {string} input_encoding - how encryption input is encoded. Used as output for decrypting. Default utf-8.
    * @property {string} output_encoding - how encryption output is encoded. Used as input for decrypting. Default hex.
    */
    encryption: {},

    /**
    * Specifies where to store files. Value "fs" means file system or basically storing files on hard drive. Another currently supported option is "gridfs" storing files in MongoDB database using GridFS. By default fallback to "fs";
    * @type {string} [default=fs]
    */
    fileStorage: "fs",
    /**
    * Specifies after how long time configurations are reloded from data base. Default value is 10000 (10 seconds)
    * @type {integer} [default=10000]
    **/
    reloadConfigAfter: 10000,
};

module.exports = require("./configextender")("API", countlyConfig, process.env);