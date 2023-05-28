const yargs = require("yargs")

const loadArgv = () => {
    let argv = yargs
        .describe('host', 'Netweaver Host')
        .describe('password', 'Password')
        .describe('username', 'Username')
        .choices('protocol', ['http', 'https'])
        .describe('protocol', "HTTP or HTTPS")
        .default('protocol', process.env.protocol || 'https')
        .describe('insecure', "Allow untrusted ssl certificates")
        .default('insecure', false)
        .describe('package', 'ABAP Package containing the unit tests')
        .describe('out', "Output file")
        .default('out', 'result/output.xml')
        .describe('aunit', 'Save AUnit Result')
        .default('aunit', false)
        .describe('aunitout', "Result from abapunit")
        .default('aunitout', 'result/abapresult.xml')
    const mandatory = ['host', 'username', 'password', 'package'].filter(k => !process.env[k])
    if (mandatory.length) argv.demandOption(mandatory, '')
    return argv.argv
}


var configuration;

function Config() {
    this.configuration = initialize();
}



/**
 * Initialize variables needed
 * @param Setting parameters
 */
function initialize() {
    const argv = loadArgv()
    const getarg = k => argv[k] || process.env[k]
    const config =
    {
        network: {
            host: getarg("host"),
            protocol: getarg("protocol"),
            insecure: getarg("insecure"),
        },
        auth: {
            username: getarg("username"),
            password: getarg("password"),
        },
        test: {
            package: getarg("package"),
        },
        result: {
            file: getarg("out"),
            saveAunit: getarg("aunit"),
            abapResultFile: getarg("aunitout")
        }

    }
    return config;

}


module.exports = Config;