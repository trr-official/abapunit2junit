// Load dependencies
const xsltProcessor = require('xslt-processor');
const fs = require("fs");

const rp = require('request-promise').defaults({ jar: true });

const path = require("path");
const { sapProtocol, sapUserName, sapPassword, sapHost, packageToRun, host } = initialize();
const { xmlRunAbapUnit, xslt } = readXml();

/**
 * Reads XML files needed to run AUnit Tests and transform to JUnit
 * @return xml file with call to run abap unit test, xsl to transform from  AUnit Result to JUnit Result
 */function readXml() {
    const xsltData = fs.readFileSync(path.resolve(__dirname, "./xml/aunit2junit.xsl"));
    const xmlRunAbapUnitBuffer = fs.readFileSync(path.resolve(__dirname, "./xml/runAbapUnit.xml"));
    const xslt = xsltProcessor.xmlParse(xsltData.toString()); // xsltString: string of xslt file contents
    const xmlRunAbapUnit = xmlRunAbapUnitBuffer.toString('utf8').replace("{{package}}", packageToRun === undefined ? "ZDOMAIN" : packageToRun); // Default to ZDomain
    return { xmlRunAbapUnit, xslt };
}

/**
 * Initialize variables needed
 * @param Setting parameters
 */
function initialize() {
    const sapUserName = process.env.SAP_USERNAME;
    const sapPassword = process.env.SAP_PASSWORD;
    const sapHost = process.env.SAP_HOST;
    const sapProtocol = process.env.SAP_PROTOCOL;
    const packageToRun = process.env.SAP_PACKAGE;
    const host = sapProtocol + '://' + sapUserName + ':' + sapPassword + '@' + sapHost

    return { sapProtocol, sapUserName, sapPassword, sapHost, packageToRun, host };
}

/** Run abap unit tests
 * @param csrf token needed for the call
 * @returns Promise with the result
 */
function runAbapUnitTest(xCSRFToken) {
    const optionsRunUnitTest = {
        method: 'POST',
        url: host + '/sap/bc/adt/abapunit/testruns',
        auth: {
            user: sapUserName,
            password: sapPassword
        },
        headers: {
            'x-csrf-token': xCSRFToken,
            'Content-Type': "application/xml"
        },
        body: xmlRunAbapUnit
    };
    return rp(optionsRunUnitTest);
}

/** Get CSRF Token by calling GET with x-csrf-token: fetch 
 * @returns Promise with the result of the call
*/
function getCSRFToken() {
    const optionsGetCSRFToken = {
        method: "GET",
        url: host + '/sap/bc/adt/abapunit/testruns',
        simple: false,                                  // Don't handle 405 as an error
        resolveWithFullResponse: true,                  // Read headers and not only body
        auth: {
            user: sapUserName,
            password: sapPassword
        },
        headers: {
            'X-CSRF-Token': 'fetch'
        }
    };
    return rp(optionsGetCSRFToken);
}

/** Runs the abap unit test and converts them to JUnit format
* 1) Get CSRF Token
* 2) Call Netweaver Server and get abap unit results
* 3) Transform result and save to output.xml
**/
function main() {
    csrfTokenPromise = getCSRFToken();

    var runAbapUnitTestPromise = csrfTokenPromise.then(function (response) {
        var csrfToken = response.headers['x-csrf-token'];
        return runAbapUnitTest(csrfToken);
    }
    ).catch(function (err) {
        console.error(JSON.stringify(err));
    }
    );

    runAbapUnitTestPromise.then(function (parsedBody) {
        const xml = xsltProcessor.xmlParse(parsedBody); // xsltString: string of xslt file contents
        const outXmlString = xsltProcessor.xsltProcess(xml, xslt); // outXmlString: output xml string.
        fs.writeFileSync("output.xml", outXmlString)
    }).catch(function (err) {
        console.error(JSON.stringify(err));
    });
}

main();