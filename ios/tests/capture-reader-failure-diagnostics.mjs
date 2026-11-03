export * from './capture-reader-failure-diagnostics.mts';
import { captureDiagnostics } from './capture-reader-failure-diagnostics.mts';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const report = await captureDiagnostics(process.env);
 console.log(JSON.stringify({status:report.status, diagnostic_only:true, primary_ui_outcome:report.primary_ui_outcome, primary_acceptance_modified:false, commands:report.commands.length, errors:report.errors}));
}
