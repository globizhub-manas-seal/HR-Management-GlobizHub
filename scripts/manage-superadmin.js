// Root forwarder to hrms-backend-v1/scripts/manage-superadmin.js
const path = require('path');
process.chdir(path.resolve(__dirname, '../hrms-backend-v1'));
require(path.resolve(__dirname, '../hrms-backend-v1/scripts/manage-superadmin.js'));

