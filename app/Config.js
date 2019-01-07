const argv = require("yargs")
    .describe('host', 'Netweaver Host')
    .describe('password','Password')
    .describe('username','Username')
    .choices('protocol',['http','https'])
    .describe('protocol',"HTTP or HTTPS")
    .default('protocol','https')
    .describe('insecure', "Allow untrusted ssl certificates")
    .describe('package', 'ABAP Package containing the unit tests')
    .demandOption(['host', 'username','password','package'], '').argv;

var configuration;

function Config(  ) {
    this.configuration = initialize();
}



/**
 * Initialize variables needed
 * @param Setting parameters
 */
function initialize(  ) {
    const config =
        {
            network : {
                host : argv.host || process.env.SAP_HOST,
                protocol : argv.protocol || process.env.SAP_PROTOCOL,
                insecure :  argv.insecure  || false   // Do not accept invalid ssl certificates
            },
            auth : {
                username : argv.username || process.env.SAP_USERNAME,
                password : argv.password || process.env.SAP_PASSWORD
            },
            test : {
                package: argv.package || process.env.SAP_PACKAGE
            },
            result :{
                file : argv.out || 'result/output.xml'
            }

        }
        return config; 
    
}


module.exports = Config;