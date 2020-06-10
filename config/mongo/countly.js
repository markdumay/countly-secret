/**
 * Retrieves a named environment variable, or a default value if the variable could not be found. The value is read
 * by executing 'printenv' as shell command.
 *
 * @param {*} name Name of the environment variable.
 * @param {*} defVal Default value for the environment variable.
 * @returns An environment variable string.
 */
function getEnvValue(name, defVal) {
    const ret = run("sh", "-c", `printenv ${name} > /tmp/${name}`);
    if (ret != 0) return defVal;
    let val = cat(`/tmp/${name}`);
    return val.replace(/[\r\n]+/gm, "");
}

/**
 * Exits the script with an error message.
 *
 * @param {*} message Error message to be printed.
 */
function terminate(message) {
    print(message);
    quit(1);
}

/**
 * Reads content from a file, or a default value if the file cannot be read.
 *
 * @param {*} fileName Name of the file to be read.
 * @param {*} defVal Default value for the file contents.
 * @returns File contents.
 */
function readFromFile(fileName, defVal) {
    try {
        return cat(fileName);
    }
    catch (e) {
        return defVal;
    }
}

// initialize target database name from the environment variable 'MONGODB_DATABASE'
const dbName = getEnvValue("MONGODB_DATABASE", "");
if (dbName == "") terminate("ERROR: expected environment variable 'MONGODB_DATABASE'")

// retrieve countly database user and password derived from Docker secrets
const user = readFromFile("/run/secrets/countly_mongodb_username", "");
const pwd = readFromFile("/run/secrets/countly_mongodb_password", "");
if (user == "" || pwd == "") terminate("ERROR: credentials 'countly_mongodb_username' and 'countly_mongodb_password' not available")

// create Countly database users
// see: https://support.count.ly/hc/en-us/articles/360037445752-Securing-MongoDB
let targetDB = db.getSiblingDB(`${dbName}`)
targetDB.createUser({ user: user, pwd: pwd, roles: [{ role: "readWrite", db: `${dbName}` }]});

targetDB = db.getSiblingDB(`${dbName}_out`)
targetDB.createUser({ user: user, pwd: pwd, roles: [{ role: "readWrite", db: `${dbName}_out`}]});

targetDB = db.getSiblingDB(`${dbName}_drill`)
targetDB.createUser({ user: user, pwd: pwd, roles: [{ role: "readWrite", db: `${dbName}_drill` }]});

targetDB = db.getSiblingDB(`${dbName}_fs`)
targetDB.createUser({ user: user, pwd: pwd, roles: [{ role: "readWrite", db: `${dbName}_fs` }]});