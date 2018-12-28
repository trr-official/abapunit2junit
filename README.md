# Introduction 
Connects to SAP Netweaver and runs abap unit tests for the given package or object

# Getting Started
Run
```
npm install
npm start -- --host=<host> --protocol=<http/https> --user=<user> --password=<password> --package=<package name>
```

# Settings
There are two ways to configure the app. Either by passing command line arguments when starting the app, or by using env-variables. The arguments are always prioritized if both are given.

## Arguments
1. --host=\<url>> - url to SAP server
2. --protocol=\<http/https> - protocol to be used
3. --package=\<name of abap package>
4. --username=\<username>
5. --password=\<password>
6. --insecure  - Enables to connect to https enabled endpoints without valid certificates


## Environmental
It is possible to use env. variables to change configuration, but command line arguments will always be prioritized.
1.	SAP_USERNAME - a username allowed to run abap unit in Netweaver
2.	SAP_PASSWORD - password for the above user
3.	SAP_HOST - sap host, excluding protocol and including port. I.e. saptcu.trrnet.se:8000
4.  SAP_PROTOCOL - protocoll, i.e http or https.
5.  SAP_PACKAGE - Package that should be checked (optional, will default to ZDOMAIN)


