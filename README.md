# Introduction

Connects to SAP Netweaver and runs abap unit tests for the given package or object
Outputs a file in junit format

## Getting Started

You can run this directly from npm:

```bash
npx abapunit2junit --host=<host> --protocol=<http/https> --username=<user> --password=<password> --package=<package name>
```

Or install the application once and for all:

```bash
npm install --global abapunit2junit
```

and then run it like any other CLI:

```bash
abapunit2junit --host=<host> --protocol=<http/https> --username=<user> --password=<password> --package=<package name>
```

## Settings

There are two ways to configure the app. Either by passing command line arguments when starting the app, or by using env-variables. The arguments are always prioritized if both are given.

## Arguments

1. --host=\<url>> - url to SAP server
2. --protocol=\<http/https> - protocol to be used
3. --package=\<name of abap package>
4. --username=\<username>
5. --password=\<password>
6. --insecure=\<true/false> - Enables to connect to https enabled endpoints without valid certificates
7. --out - path and name of result file, default result/output.xml
8. --aunit - \<true/false> - Should abap result file be saved, default false
9. --aunitout - path and name of abap result file, default result/abapresult.xml
