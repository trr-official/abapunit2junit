// Load dependencies
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const xsltProcessor = require('xslt-processor');
const fs = require("fs");
const axios = require("axios")
const path = require("path");
const Config = require("./app/Config.js");
const https = require('https');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));
/**
 * Reads XML files needed to run AUnit Tests and transform to JUnit
 * @return xml file with call to run abap unit test, xsl to transform from  AUnit Result to JUnit Result
 */function readXml(config) {
    const xsltData = fs.readFileSync(path.resolve(__dirname, "./xml/aunit2junit.xsl"));
    const xmlRunAbapUnitBuffer = fs.readFileSync(path.resolve(__dirname, "./xml/runAbapUnit.xml"));
    const xslt = xsltProcessor.xmlParse(xsltData.toString()); // xsltString: string of xslt file contents
    const xmlRunAbapUnit = xmlRunAbapUnitBuffer.toString('utf8').replace("{{package}}", config.configuration.test.package);
    return { xmlRunAbapUnit, xslt };
}


/** Run abap unit tests
 * @param csrf token needed for the call
 * @returns Promise with the result
 */
function runAbapUnitTest(xmlRunAbapUnit, xCSRFToken, config) {
    const optionsRunUnitTest = getRunUnitTestOptions(xmlRunAbapUnit, xCSRFToken, config);
    return client(optionsRunUnitTest);
}

const commonOptions = config => {
    const opts = {
        auth: config.configuration.auth,
        responseType: "text"
    }
    if (config.configuration.network.insecure) opts.httpsAgent = new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false
    })
    return opts
}

function getRunUnitTestOptions(xmlRunAbapUnit, xCSRFToken, config) {
    return {
        ...commonOptions(config),
        method: 'POST',
        url: `${config.configuration.network.url}/sap/bc/adt/abapunit/testruns`,
        headers: {
            'x-csrf-token': xCSRFToken,
            'Content-Type': "application/vnd.sap.adt.abapunit.testruns.config.v2+xml",
            'Accept': 'application/vnd.sap.adt.abapunit.testruns.result.v1+xml'
        },
        data: xmlRunAbapUnit
    };
}

/** Get CSRF Token by calling GET with x-csrf-token: fetch 
 * @returns Promise with the result of the call
*/
async function getCSRFToken(config) {
    const optionsGetCSRFToken = getCSRFTokenOptions(config);
    const resp = await client(optionsGetCSRFToken);
    return resp.headers['x-csrf-token']
}

function getCSRFTokenOptions(config) {
    return {
        ...commonOptions(config),
        method: "GET",
        url: `${config.configuration.network.url}/sap/bc/adt/compatibility/graph`,
        headers: { 'X-CSRF-Token': 'fetch' }
    };
}

/** Runs the abap unit test and converts them to JUnit format
* 1) Get CSRF Token
* 2) Call Netweaver Server and get abap unit results
* 3) Transform result and save to output.xml
**/
async function main() {

    try {
        const config = new Config();
        const { xmlRunAbapUnit, xslt } = readXml(config);
        const token = await getCSRFToken(config);
        const test = await runAbapUnitTest(xmlRunAbapUnit, token, config)
        const xml = xsltProcessor.xmlParse(test.data); // xsltString: string of xslt file contents
        if (config.configuration.result.saveAunit)
            fs.writeFileSync(config.configuration.result.abapResultFile, parsedBody);
        const outXmlString = xsltProcessor.xsltProcess(xml, xslt); // outXmlString: output xml string.
        fs.writeFileSync(config.configuration.result.file, outXmlString)

    } catch (err) {
        console.error("ERROR: " + err.message || JSON.stringify(err));
        process.exit(1)
    }
}

main();