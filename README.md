# Introduction 
Connects to SAP Netweaver and runs abap unit tests for the given package or object

# Getting Started
This script relies on system environment variables for settings

_Mandatory settings_
1.	SAP_USERNAME - a username allowed to run abap unit in Netweaver
2.	SAP_PASSWORD - password for the above user
3.	SAP_HOST - sap host, excluding protocol and including port. I.e. saptcu.trrnet.se:8000
4.  SAP_PROTOCOL - protocoll, i.e http or https.

_Optional settings_
5.  SAP_PACKAGE - Package that should be checked (optional, will default to ZDOMAIN)

In windows: set SAP_USERNAME=kalle

# Build and Test
Run index.js

# Contribute
Fork the repository, make your change and submit a pull request.