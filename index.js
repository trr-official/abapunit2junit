#!/usr/bin/env node
// Load dependencies
const { CookieJar } = require('tough-cookie');
const { HttpsCookieAgent, HttpCookieAgent } = require("http-cookie-agent/http")
const xsltProcessor = require('xslt-processor');
const fs = require("fs");
const axios = require("axios")
const path = require("path");
const Config = require("./app/Config.js");
const { XMLParser } = require('fast-xml-parser');

const jar = new CookieJar();
const client = axios.create({ jar });

/**
 * Reads XML files needed to run AUnit Tests and transform to JUnit
 * @return xml file with call to run abap unit test, xsl to transform from  AUnit Result to JUnit Result
 */function readXml(config) {
    const xsltData = fs.readFileSync(path.resolve(__dirname, "./xml/aunit2junit.xsl"));
    const xmlRunAbapUnitBuffer = fs.readFileSync(path.resolve(__dirname, "./xml/runAbapUnit.xml"));
    const xslt = xsltProcessor.xmlParse(xsltData.toString()); // xsltString: string of xslt file contents
    const xmlRunAbapUnit = xmlRunAbapUnitBuffer.toString('utf8')
        .replace("{{package}}", config.configuration.test.package)
        .replace("{{withcoverage}}", !!config.configuration.result.coverageout);
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

const commonOptions = config => ({
    auth: config.configuration.auth,
    responseType: "text",
    httpAgent: new HttpCookieAgent({ cookies: { jar } }),
    httpsAgent: new HttpsCookieAgent({
        cookies: { jar },
        keepAlive: true,
        rejectUnauthorized: !(config.configuration.network.insecure || false)
    }),
})

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

const getCoverage = async (testdata, xCSRFToken, config) => {
    const parser = new XMLParser({ removeNSPrefix: true, ignoreAttributes: false, parseAttributeValue: true })
    const coverageUrl = parser.parse(testdata).runResult.external.coverage["@_uri"]
    const data = fs.readFileSync(path.resolve(__dirname, "./xml/runCoverage.xml"))
        .toString('utf8')
        .replace("{{package}}", config.configuration.test.package)
    const options = {
        ...commonOptions(config),
        method: 'POST',
        url: `${config.configuration.network.url}${coverageUrl}`,
        headers: {
            'x-csrf-token': xCSRFToken,
            'Content-Type': "application/xml",
            'Accept': 'application/xml'
        },
        data
    };
    const resp = await client(options);
    return resp.data
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

const writeFileOrstdout = (name, contents) => {
    if (name === '-') console.log(contents)
    else fs.writeFileSync(name, contents)
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
            writeFileOrstdout(config.configuration.result.abapResultFile, test.data);
        const outXmlString = xsltProcessor.xsltProcess(xml, xslt); // outXmlString: output xml string.
        writeFileOrstdout(config.configuration.result.file, outXmlString)
        if (config.configuration.result.coverageout) {
            const coverage = await getCoverage(test.data, token, config)
            writeFileOrstdout(config.configuration.result.coverageout, coverage);
        }

    } catch (err) {
        console.error("ERROR: " + err.message || JSON.stringify(err));
        process.exit(1)
    }
}

main();