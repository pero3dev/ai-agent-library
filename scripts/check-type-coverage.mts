#!/usr/bin/env node
/** Source coverage only. Semantic diagnostics remain the responsibility of the configured typecheck commands. */
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

interface Project { id: string; cwd: string; config: string }
interface Exception { path: string; kind: 'historical' | 'vendor' | 'frozen'; sha256: string; boundary?: string; reason: string }
interface Wrapper { path: string; target: string; kind: 'reexport' | 'side-effect' | 'cli'; sha256?: string }
export interface Contract { schema_version: 1; typescript: string; projects: Project[]; exceptions: Exception[]; wrappers: Wrapper[] }
interface Options { contract?: Contract; compilerForProject?: (cwd: string) => typeof ts }
const sourcePattern = /\.(?:[cm]?[jt]s|[jt]sx)$/i
const declarationPattern = /\.d\.(?:ts|mts|cts)$/i
const javascriptPattern = /\.(?:[cm]?js|jsx)$/i
const hash = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex')
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const relative = (value: unknown): value is string => typeof value === 'string' && !!value && !value.includes('\\') && !/[\x00-\x1f]/.test(value) && !path.posix.isAbsolute(value) && !path.win32.isAbsolute(value) && value.split('/').every(part => !!part && part !== '.' && part !== '..')
const digest = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)

export function readContract(root: string): Contract {
  const raw: unknown = JSON.parse(fs.readFileSync(path.join(root, 'harness/typecheck.json'), 'utf8'))
  if (!object(raw) || raw.schema_version !== 1 || typeof raw.typescript !== 'string' || !Array.isArray(raw.projects) || !raw.projects.length || !Array.isArray(raw.exceptions) || !Array.isArray(raw.wrappers)) throw new Error('Invalid typecheck contract')
  const projects = raw.projects.map((item: unknown): Project => {
    if (!object(item) || typeof item.id !== 'string' || !(item.cwd === '.' || relative(item.cwd)) || !relative(item.config)) throw new Error('Invalid typecheck project')
    return { id: item.id, cwd: item.cwd, config: item.config }
  })
  const exceptions = raw.exceptions.map((item: unknown): Exception => {
    if (!object(item) || !relative(item.path) || !['historical', 'vendor', 'frozen'].includes(String(item.kind)) || !digest(item.sha256) || typeof item.reason !== 'string' || !item.reason.trim()) throw new Error('Invalid typecheck exception')
    if (item.kind === 'frozen' && (!relative(item.boundary) || !declarationPattern.test(item.boundary))) throw new Error('Frozen source needs an explicit declaration boundary')
    if (item.kind !== 'historical' && item.kind !== 'vendor' && item.kind !== 'frozen') throw new Error('Unknown exception kind')
    return { path: item.path, kind: item.kind, sha256: item.sha256, reason: item.reason, ...(typeof item.boundary === 'string' ? { boundary: item.boundary } : {}) }
  })
  const wrappers = raw.wrappers.map((item: unknown): Wrapper => {
    if (!object(item) || !relative(item.path) || !relative(item.target) || !['reexport', 'side-effect', 'cli'].includes(String(item.kind)) || item.kind === 'cli' && !digest(item.sha256)) throw new Error('Invalid compatibility wrapper')
    if (item.kind !== 'reexport' && item.kind !== 'side-effect' && item.kind !== 'cli') throw new Error('Unknown wrapper kind')
    return { path: item.path, target: item.target, kind: item.kind, ...(typeof item.sha256 === 'string' ? { sha256: item.sha256 } : {}) }
  })
  for (const list of [projects.map(item => item.id), projects.map(item => item.config), exceptions.map(item => item.path), wrappers.map(item => item.path)]) if (new Set(list).size !== list.length) throw new Error('Duplicate typecheck contract entry')
  return { schema_version: 1, typescript: raw.typescript, projects, exceptions, wrappers }
}

export function inventorySources(root: string): string[] {
  const names = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 }).split('\0')
  return [...new Set(names.filter(name => sourcePattern.test(name)))].filter(name => {
    if (!relative(name)) throw new Error(`Unsafe source path: ${name}`)
    try { const info = fs.lstatSync(path.join(root, name)); if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Source must be a regular file: ${name}`); return true }
    catch (error) { if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return false; throw error }
  }).sort()
}

function installedCompiler(cwd: string): typeof ts {
  const require = createRequire(path.join(cwd, 'package.json'))
  return require('typescript')
}

function suppressed(compiler: typeof ts, text: string, file: string): boolean {
  // Parser token boundaries distinguish real comments from template/JSX text.
  const source = compiler.createSourceFile(file, text, compiler.ScriptTarget.Latest, true)
  const literalSpans: Array<[number, number]> = []
  const collect = (node: ts.Node): void => {
    if (node.kind === compiler.SyntaxKind.JsxText || node.kind === compiler.SyntaxKind.JsxTextAllWhiteSpaces) literalSpans.push([node.pos, node.end])
    else if (compiler.isStringLiteral(node) || compiler.isRegularExpressionLiteral(node) || node.kind === compiler.SyntaxKind.NoSubstitutionTemplateLiteral || node.kind === compiler.SyntaxKind.TemplateHead || node.kind === compiler.SyntaxKind.TemplateMiddle || node.kind === compiler.SyntaxKind.TemplateTail) literalSpans.push([node.getStart(source), node.end])
    for (const child of node.getChildren(source)) collect(child)
  }
  collect(source)
  let found = false
  const visit = (node: ts.Node): void => {
    if (found) return
    if (node.kind >= compiler.SyntaxKind.FirstToken && node.kind <= compiler.SyntaxKind.LastToken && node.kind !== compiler.SyntaxKind.JsxText && node.kind !== compiler.SyntaxKind.JsxTextAllWhiteSpaces) {
      const comments = [...compiler.getLeadingCommentRanges(text, node.pos) ?? [], ...compiler.getTrailingCommentRanges(text, node.end) ?? []]
      found = comments.some(comment => !literalSpans.some(([start, end]) => comment.pos >= start && comment.pos < end) && /@ts-(?:nocheck|ignore)\b/.test(text.slice(comment.pos, comment.end)))
    }
    if (!found) for (const child of node.getChildren(source)) visit(child)
  }
  visit(source)
  return found
}

/** Frozen CLI bodies are reviewed adapters, never counted as checked implementations. */
export function wrapperShape(text: string, wrapper: Wrapper, compiler: typeof ts = ts): boolean {
  if (!javascriptPattern.test(wrapper.path) || declarationPattern.test(wrapper.target) || !/\.(?:mts|cts|ts|tsx)$/.test(wrapper.target) || path.posix.dirname(wrapper.path) !== path.posix.dirname(wrapper.target)) return false
  if (wrapper.kind === 'cli' && (!wrapper.sha256 || hash(text) !== wrapper.sha256)) return false
  let lexicalError = false
  const scanner = compiler.createScanner(compiler.ScriptTarget.Latest, false, compiler.LanguageVariant.Standard, text, () => { lexicalError = true })
  while (scanner.scan() !== compiler.SyntaxKind.EndOfFileToken) { /* Check unterminated tokens too. */ }
  if (lexicalError) return false
  const source = compiler.createSourceFile(wrapper.path, text, compiler.ScriptTarget.Latest, true, compiler.ScriptKind.JS)
  const target = './' + path.posix.basename(wrapper.target)
  if (wrapper.kind === 'reexport') return source.statements.length === 1 && compiler.isExportDeclaration(source.statements[0]) && source.statements[0].exportClause === undefined && source.statements[0].isTypeOnly === false && source.statements[0].moduleSpecifier !== undefined && compiler.isStringLiteral(source.statements[0].moduleSpecifier) && source.statements[0].moduleSpecifier.text === target
  if (wrapper.kind === 'side-effect') return source.statements.length === 1 && compiler.isImportDeclaration(source.statements[0]) && source.statements[0].importClause === undefined && compiler.isStringLiteral(source.statements[0].moduleSpecifier) && source.statements[0].moduleSpecifier.text === target
  let guarded = 0, importedTarget = false
  for (const statement of source.statements) {
    if (compiler.isImportDeclaration(statement) || compiler.isExportDeclaration(statement)) {
      const specifier = statement.moduleSpecifier
      if (!specifier || !compiler.isStringLiteral(specifier) || ![target, 'node:path', 'node:url'].includes(specifier.text)) return false
      if (specifier.text === target) importedTarget = true
    } else if (compiler.isIfStatement(statement)) {
      if (++guarded !== 1 || statement.elseStatement || statement.expression.getText(source).replace(/\s/g, '') !== 'process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)') return false
    } else return false
  }
  return guarded === 1 && importedTarget
}

export function checkTypeCoverage(root: string, options: Options = {}) {
  root = path.resolve(root)
  const contract = options.contract ?? readContract(root), inventory = inventorySources(root), candidates = new Set(inventory)
  const problems: string[] = [], implementationProjects = new Map<string, Set<string>>(), declarations = new Set<string>()
  const programs: Array<{id: string; compiler: string; implementations: number; declarations: number}> = []
  const canonical = (file: string) => path.relative(root, path.resolve(file)).split(path.sep).join('/')
  const strictFlags = ['noImplicitAny', 'noImplicitThis', 'strictNullChecks', 'strictFunctionTypes', 'strictBindCallApply', 'strictPropertyInitialization', 'alwaysStrict', 'useUnknownInCatchVariables', 'strictBuiltinIteratorReturn'] as const
  for (const project of contract.projects) {
    const compiler = (options.compilerForProject ?? installedCompiler)(path.resolve(root, project.cwd))
    if (compiler.version !== contract.typescript) { problems.push(`${project.id}: expected TypeScript ${contract.typescript}, found ${compiler.version}`); continue }
    const configFile = path.join(root, project.config), config = compiler.readConfigFile(configFile, compiler.sys.readFile)
    if (config.error) { problems.push(`${project.id}: cannot read config`); continue }
    const parsed = compiler.parseJsonConfigFileContent(config.config, compiler.sys, path.dirname(configFile), undefined, configFile)
    if (parsed.errors.length) { problems.push(`${project.id}: invalid or empty config`); continue }
    if (parsed.options.strict !== true || parsed.options.noEmit !== true || parsed.options.noCheck === true || strictFlags.some(flag => parsed.options[flag] === false)) { problems.push(`${project.id}: strict/noEmit must remain enabled without noCheck`); continue }
    const program = compiler.createProgram({ rootNames: parsed.fileNames, options: parsed.options, projectReferences: parsed.projectReferences })
    let implemented = 0, declared = 0
    for (const source of program.getSourceFiles()) {
      const file = canonical(source.fileName)
      if (!candidates.has(file) || program.isSourceFileFromExternalLibrary(source)) continue
      if (source.isDeclarationFile) { if (parsed.options.skipLibCheck !== true) { declarations.add(file); declared++ }; continue }
      if (javascriptPattern.test(file) && (parsed.options.allowJs !== true || parsed.options.checkJs !== true)) continue
      const owners = implementationProjects.get(file) ?? new Set<string>(); owners.add(project.id); implementationProjects.set(file, owners); implemented++
    }
    programs.push({ id: project.id, compiler: compiler.version, implementations: implemented, declarations: declared })
  }
  const wrappers = new Map(contract.wrappers.map(item => [item.path, item])), exceptions = new Map(contract.exceptions.map(item => [item.path, item]))
  for (const [file, wrapper] of wrappers) {
    if (!candidates.has(file)) problems.push(`Stale wrapper entry: ${file}`)
    if (!implementationProjects.has(wrapper.target)) problems.push(`Wrapper target is not a checked implementation: ${file} -> ${wrapper.target}`)
  }
  for (const [file, exception] of exceptions) {
    if (!candidates.has(file)) problems.push(`Stale exception entry: ${file}`)
    if (exception.boundary && !declarations.has(exception.boundary)) problems.push(`Frozen declaration boundary is not in a strict program: ${file}`)
  }
  const counts = { implementations: 0, declarations: 0, wrappers: 0, historical: 0, vendor: 0, frozen: 0, unclassified: 0 }
  for (const file of inventory) {
    const bytes = fs.readFileSync(path.join(root, file)), text = bytes.toString('utf8'), exception = exceptions.get(file), wrapper = wrappers.get(file)
    if (!exception && suppressed(ts, text, file)) problems.push(`Type suppression is forbidden: ${file}`)
    if (exception) { counts[exception.kind]++; if (hash(bytes) !== exception.sha256) problems.push(`Exception hash changed: ${file}`); continue }
    if (wrapper) { counts.wrappers++; if (!wrapperShape(text, wrapper)) problems.push(`Compatibility wrapper changed or exceeds its fixed AST: ${file}`); continue }
    if (declarations.has(file)) { counts.declarations++; continue }
    if (implementationProjects.has(file)) { counts.implementations++; continue }
    counts.unclassified++; problems.push(`Unclassified source: ${file}`)
  }
  return { schema_version: 1, verified: problems.length === 0, evidence: 'strict-program-source-coverage', semantic_diagnostics: 'separate-typecheck-commands', wrapper_verification: 'fixed-ast-and-cli-hash', inventory: inventory.length, counts, programs, problems }
}

export function main(argv = process.argv.slice(2)) {
  if (argv.length > 2 || argv.length && (argv[0] !== '--root' || !argv[1])) throw new Error('Usage: check-type-coverage.mjs [--root PATH]')
  const root = argv[1] ?? fileURLToPath(new URL('..', import.meta.url))
  const result = checkTypeCoverage(root)
  console.log(JSON.stringify(result, null, 2))
  if (!result.verified) process.exitCode = 1
  return result
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
