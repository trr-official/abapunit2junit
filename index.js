// Load dependencies
const xsltProcessor = require('xslt-processor');
const argv = require('yargs').argv
const fs = require("fs");
const rp = require('request-promise').defaults({ jar: true });
const path = require("path");
const config  = initialize();
const { xmlRunAbapUnit, xslt } = readXml();


/**
 * Reads XML files needed to run AUnit Tests and transform to JUnit
 * @return xml file with call to run abap unit test, xsl to transform from  AUnit Result to JUnit Result
 */function readXml() {
    const xsltData = fs.readFileSync(path.resolve(__dirname, "./xml/aunit2junit.xsl"));
    const xmlRunAbapUnitBuffer = fs.readFileSync(path.resolve(__dirname, "./xml/runAbapUnit.xml"));
    const xslt = xsltProcessor.xmlParse(xsltData.toString()); // xsltString: string of xslt file contents
    const xmlRunAbapUnit = xmlRunAbapUnitBuffer.toString('utf8').replace("{{package}}", config.test.package ); // Default to ZDomain
    return { xmlRunAbapUnit, xslt };
}

/**
 * Initialize variables needed
 * @param Setting parameters
 */
function initialize() {
    console.log("Entering initialize");
    console.log(JSON.stringify(argv));
    const config =
    {
        network : {
            host : process.env.SAP_HOST,
            protocol : process.env.SAP_PROTOCOL,
            insecure :  argv.insecure  || false   // Accept invalid ssl certificates
        },
        auth : {
            username : process.env.SAP_USERNAME,
            password : process.env.SAP_PASSWORD
        },
        test : {
            package: process.env.SAP_PACKAGE || 'ZDOMAIN'
        }

    }
    console.log(JSON.stringify(config));
    return config; //{ sapProtocol, sapUserName, sapPassword, sapHost, packageToRun, host };
}

/** Run abap unit tests
 * @param csrf token needed for the call
 * @returns Promise with the result
 */
function runAbapUnitTest(xCSRFToken) {
    const optionsRunUnitTest = getRunUnitTestOptions(xCSRFToken);
    return rp(optionsRunUnitTest);
}

function getRunUnitTestOptions(xCSRFToken) {
    return {
        method: 'POST',
        url: config.network.protocol + '://' + config.network.host + '/sap/bc/adt/abapunit/testruns',
        auth: {
            user: config.auth.username,
            password: config.auth.password
        },
        headers: {
            'x-csrf-token': xCSRFToken,
            'Content-Type': "application/xml"
        },
        body: xmlRunAbapUnit,
        insecure: config.network.insecure,
        rejectUnauthorized: !config.network.insecure
    };
}

/** Get CSRF Token by calling GET with x-csrf-token: fetch 
 * @returns Promise with the result of the call
*/
function getCSRFToken() {
    console.log(JSON.stringify(config));
    const optionsGetCSRFToken = getCSRFTokenOptions();
    return rp(optionsGetCSRFToken);
}

function getCSRFTokenOptions() {
    return {
        method: "GET",
        url: config.network.protocol + '://' + config.network.host + '/sap/bc/adt/abapunit/testruns',
        simple: false,
        resolveWithFullResponse: true,
        auth: {
            user: config.auth.username,
            password: config.auth.password
        },
        headers: {
            'X-CSRF-Token': 'fetch'
        },
        insecure: config.network.insecure,
        rejectUnauthorized: !config.network.insecure
    };
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
        const xml = xmlParse(parsedBody); // xsltString: string of xslt file contents
        const outXmlString = xsltProcess(xml, xslt); // outXmlString: output xml string.
        writeFileSync("output.xml", outXmlString)
    }).catch(function (err) {
        console.error(JSON.stringify(err));
    });
}

main();