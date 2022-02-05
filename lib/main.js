'use babel';

import sqlProvider from './sql-provider';

export default {
    getProvider() {
        // return a single provider, or an array of providers to use together
        return [sqlProvider];
    },
    config: {
      "schemaFilePath": {
        "description": "Path to your SQL schema declaration file.",
        "type": "string",
        "default": ""
      }
    }
};
