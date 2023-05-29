const argv = require("yargs")
    .describe('host', 'Netweaver Host')
    .describe('password', 'Password')
    .describe('username', 'Username')
    .choices('protocol', ['http', 'https'])
    .describe('protocol', "HTTP or HTTPS")
    .default('protocol', process.env.protocol || 'https')
    .describe('insecure', "Allow untrusted ssl certificates")
    .default('insecure', false)
    .describe('package', 'ABAP Package containing the unit tests')
    .describe('out', "Output file (- for stdout, needs to be set with = rather than space)")
    .default('out', 'result/output.xml')
    .describe('aunit', 'Save AUnit Result')
    .default('aunit', false)
    .describe('aunitout', "Result from abapunit  (- for stdout, needs to be set with = rather than space)")
    .default('aunitout', 'result/abapresult.xml')
    .describe('url', 'Netweaver base URL (alternative to host and protocol)')
    .describe('coverageout', "Test coverage file  (- for stdout, needs to be set with = rather than space)")
    .demandOption(['username', 'password', 'package'].filter(x => !process.env[x]), '')


var configuration;

function Config() {
    this.configuration = initialize();
}


const getUrl = parser => {

    const { url, host, protocol } = parser
    const { url: eurl, host: ehost, protocol: eprotocol } = process.env
    if (url) return url
    if ((host || protocol) && (protocol || eprotocol) && (host || ehost)) return `${protocol || eprotocol}://${host || ehost}`
    if (eurl) return eurl
    argv.showHelp(s => {
        console.log(`Please specify a base URL or a host and protocol\n\n${s}`)
        process.exit(1)
    })

}


/**
 * Initialize variables needed
 * @param Setting parameters
 */
function initialize() {
    const parser = argv.argv
    const getarg = k => parser[k] || process.env[k]
    const config =
    {
        network: {
            url: getUrl(parser),
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
            abapResultFile: getarg("aunitout"),
            coverageout: getarg("coverageout")
        }

    }
    return config;
}


module.exports = Config;