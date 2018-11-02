const xsltProcessor = require('xslt-processor');
 
const fs = require("fs");
const request = require("request");
const path = require("path");
var sapUserName = process.env.SAP_USERNAME;
var sapPassword = process.env.SAP_PASSWORD;
var sapHost = process.env.SAP_HOST;

// Get csrf-token
var optionsGetCSRFToken = {
    url: 'http://'+sapUserName+':'+sapPassword+'@'+sapHost +'/sap/bc/adt/abapunit/testruns?$format=json',
    headers: {
      'x-csrf-token': 'fetch'
    }
  };
  
  

  request(optionsGetCSRFToken, callbackGetCXRFToken);

// Read xsl
var xsltData = fs.readFileSync(path.resolve(__dirname, "./aunit2junit.xsl"));

// Read xml
var xmlData = fs.readFileSync(path.resolve(__dirname, "./input.xml"));

const xml = xsltProcessor.xmlParse(xmlData.toString()); // xmlString: string of xml file contents
const xslt = xsltProcessor.xmlParse(xsltData.toString()); // xsltString: string of xslt file contents
const outXmlString = xsltProcessor.xsltProcess(xml, xslt); // outXmlString: output xml string.
//console.log(outXmlString);


function callbackGetCXRFToken(error, response, body) {
    if (!error && response.statusCode == 405 ) {
        console.log( response.headers['x-csrf-token']);
        runAbapUnitTest(response.headers['x-csrf-token']);
    } else {
        console.error(response.statusCode );
    }
}

function runAbapUnitTest(xCSRFToken) {
    console.log(xCSRFToken);
    var optionsRunUnitTest = {
        method: 'POST',
        url: 'http://'+sapUserName+':'+sapPassword+'@'+sapHost +'/sap/bc/adt/abapunit/testruns',
        headers: {
            'x-csrf-token': xCSRFToken,
        },
        multipart: {
            chunked: false,
            data: [
              {
                'content-type': 'text/xml',
                body: '<?xml version="1.0" encoding="UTF-8"?><aunit:runConfiguration xmlns:aunit="http://www.sap.com/adt/aunit"><external><coverage active="false"></coverage></external><adtcore:objectSets xmlns:adtcore="http://www.sap.com/adt/core"><objectSet kind="inclusive"><adtcore:objectReferences><adtcore:objectReference adtcore:uri="/sap/bc/adt/oo/classes/zcl_zd_age_rule_dagar"/></adtcore:objectReferences></objectSet></adtcore:objectSets></aunit:runConfiguration>'
              }
            ]
          }
    };

    request(optionsRunUnitTest, callbackRunUnitTest)
  }

  function callbackRunUnitTest(error, response, body) {
    if (!error & response.statusCode == 200 ) {
       console.log(body);
    } else {
        console.error(response.statusCode );
    }
}