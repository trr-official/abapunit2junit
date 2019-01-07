// Load dependencies
const xsltProcessor = require('xslt-processor');
const fs = require("fs");
const rp = require('request-promise').defaults({ jar: true });
const path = require("path");
const Config = require("./app/Config.js");



/**
 * Reads XML files needed to run AUnit Tests and transform to JUnit
 * @return xml file with call to run abap unit test, xsl to transform from  AUnit Result to JUnit Result
 */function readXml() {
    const xsltData = fs.readFileSync(path.resolve(__dirname, "./xml/aunit2junit.xsl"));
    const xmlRunAbapUnitBuffer = fs.readFileSync(path.resolve(__dirname, "./xml/runAbapUnit.xml"));
    const xslt = xsltProcessor.xmlParse(xsltData.toString()); // xsltString: string of xslt file contents
    const xmlRunAbapUnit = xmlRunAbapUnitBuffer.toString('utf8').replace("{{package}}", config.configuration.test.package ); 
    return { xmlRunAbapUnit, xslt };
}


/** Run abap unit tests
 * @param csrf token needed for the call
 * @returns Promise with the result
 */
function runAbapUnitTest(xmlRunAbapUnit, xCSRFToken) {
    const optionsRunUnitTest = getRunUnitTestOptions(xmlRunAbapUnit, xCSRFToken);
    return rp(optionsRunUnitTest);
}

function getRunUnitTestOptions(xmlRunAbapUnit, 
    xCSRFToken) {
    return {
        method: 'POST',
        url: config.configuration.network.protocol + '://' + config.configuration.network.host + '/sap/bc/adt/abapunit/testruns',
        auth: {
            user: config.configuration.auth.username,
            password: config.configuration.auth.password
        },
        headers: {
            'x-csrf-token': xCSRFToken,
            'Content-Type': "application/vnd.sap.adt.abapunit.testruns.config.v2+xml",
            'Accept' : 'application/vnd.sap.adt.abapunit.testruns.result.v1+xml'
        },
        body: xmlRunAbapUnit,
        insecure: config.configuration.network.insecure,
        rejectUnauthorized: !config.configuration.network.insecure
    };
}

/** Get CSRF Token by calling GET with x-csrf-token: fetch 
 * @returns Promise with the result of the call
*/
function getCSRFToken() {
    const optionsGetCSRFToken = getCSRFTokenOptions();
    return rp(optionsGetCSRFToken);
}

function getCSRFTokenOptions() {
    return {
        method: "GET",
        url: config.configuration.network.protocol + '://' + config.configuration.network.host + '/sap/bc/adt/abapunit/testruns',
        simple: false,
        resolveWithFullResponse: true,
        auth: {
            user: config.configuration.auth.username,
            password: config.configuration.auth.password
        },
        headers: {
            'X-CSRF-Token': 'fetch'
        },
        insecure: config.configuration.network.insecure,
        rejectUnauthorized: !config.configuration.network.insecure
    };
}

/** Runs the abap unit test and converts them to JUnit format
* 1) Get CSRF Token
* 2) Call Netweaver Server and get abap unit results
* 3) Transform result and save to output.xml
**/
function main() {
    config = new Config();

    const { xmlRunAbapUnit, xslt } = readXml();
    
    csrfTokenPromise = getCSRFToken();

    var runAbapUnitTestPromise = csrfTokenPromise.then(function (response) {
        var csrfToken = response.headers['x-csrf-token'];
        return runAbapUnitTest(xmlRunAbapUnit,csrfToken);
    }
    ).catch(function (err) {
        console.error("ERROR: " + JSON.Stringify(err));
    }
    );

    runAbapUnitTestPromise.then(function (parsedBody) {
        const xml = xsltProcessor.xmlParse(parsedBody); // xsltString: string of xslt file contents
        const outXmlString = xsltProcessor.xsltProcess(xml, xslt); // outXmlString: output xml string.
        fs.writeFileSync(config.configuration.result.file, outXmlString)
    }).catch(function (err) {
        console.error(err);
    });
}

main();