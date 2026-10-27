from pathlib import Path
from manifest_schema import verify_manifest
import datetime,hashlib,json,os,platform,plistlib,re,shutil,signal,subprocess,time,uuid
WORK=Path(os.environ['CORE_WORK'])
REPO=Path(os.environ['CORE_SOURCE_REPO'])
INPUT=WORK/'input-manifest.json'
frozen_input=None
CORPUS=REPO/'ios/AILibrary/Content'
LOCK=Path('/private/tmp/ailibrary-ios-sdk-typecheck-20261025.lock')
NODE=os.environ['NODE_BINARY']
CACHE=WORK/'results/module-cache';TMP=WORK/'outer-tmp';CONTEXT=WORK/'results/.process-tmp'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
write=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
owner={'owner':'/root/ios_core_performance_candidate','token':uuid.uuid4().hex,'pid':os.getpid(),'created_at':now(),'task':'separately reviewed Hosted profile; one alias-equivalent direct Node CLI compile and19 processes only'}
proof={'schema_version':1,'status':'preparing','started_at':now(),'authority':'Private Hosted-profile candidate; execution requires separate final source/payload review and root dispatch authorization.',
 'wrapper_scope':'Validated exact manual alias/shell expansion; direct exec Node preserves owner PID. npm wrapper is NOT executed. Source8 unchanged; new Hosted16.4 profile is not comparable with b79 local16.2 history.',
 'limits':{'start_free_bytes':3800000000,'floor_free_bytes':3200000000,'all_private_cache_and_output_bytes':256*1024*1024,'whole_execution_seconds':180,'owned_process_tree_sum_RSS_bytes':int(1.5*1024**3),'combined_wrapper_output_bytes':8*1024*1024,'combined_compile_output_bytes':1024*1024},
 'lock':owner,'preflight_compilers':[],'owned_process_identities':{},'owned_child_environment_observations':{},'resource_abort':None,'cleanup_actions':[],'unperformed':['XCTest','iOS','SwiftUI','Simulator','physical device','launchClock','Corpus generation during the guarded CLI interval (standard generation and independent consumer/source audits happen before this guard)','Shared source/ref mutation']}
lock_identity=None;child=None;start=time.monotonic();minfree=None;peakbytes=0;peaklogical=0;peakrss=0;known_groups=set();known_pids=set();context_identity=None

def processes():
 q=subprocess.run(['/bin/ps','-axo','pid=,ppid=,pgid=,rss=,comm='],capture_output=True,text=True,timeout=5,check=True)
 rows={}
 for line in q.stdout.splitlines():
  fields=line.strip().split(None,4)
  if len(fields)==5:
   pid,ppid,pgid,rss=map(int,fields[:4]);rows[pid]={'pid':pid,'ppid':ppid,'pgid':pgid,'rss_bytes':rss*1024,'comm':fields[4]}
 return rows

def descendants(rows,seed):
 result={seed}
 while True:
  extra={pid for pid,row in rows.items() if row['ppid'] in result}
  if extra<=result:return result
  result|=extra

def owned_snapshot():
 global peakrss
 rows=processes()
 owned=descendants(rows,os.getpid())
 # Include former descendants still in groups discovered through the wrapper.
 if child:
  wrapper_tree=descendants(rows,child.pid)
  for pid in wrapper_tree:
   if pid in rows:
    row=rows[pid];known_pids.add(pid)
    if row['pgid']==child.pid or row['pgid'] in wrapper_tree:known_groups.add(row['pgid'])
 for pid,row in rows.items():
  if row['pgid'] in known_groups:owned.add(pid);known_pids.add(pid)
 for pid in owned:
  if pid in rows:
   row=rows[pid]
   key=str(pid)
   if key not in proof['owned_process_identities']:proof['owned_process_identities'][key]={'pid':pid,'ppid_first_seen':row['ppid'],'pgid_first_seen':row['pgid'],'comm':row['comm'],'first_seen_elapsed_seconds':round(time.monotonic()-start,3)}
 for pid in owned:
  if pid in rows and child and pid!=child.pid and Path(rows[pid]['comm']).name in ['swiftc','swift-driver','swift-frontend','published-core-benchmark','git','ld']:
   observe_child_environment(rows[pid])
 rss=sum(rows[pid]['rss_bytes'] for pid in owned if pid in rows)
 peakrss=max(peakrss,rss)
 return rows,rss

def usage():
 allocated=logical=0
 for folder,dirs,files in os.walk(WORK):
  for name in files:
   p=Path(folder)/name
   try:st=p.lstat()
   except FileNotFoundError:continue
   allocated+=st.st_blocks*512;logical+=st.st_size
 return allocated,logical

def measure():
 global minfree,peakbytes,peaklogical
 free=shutil.disk_usage(WORK).free;allocated,logical=usage()
 minfree=free if minfree is None else min(minfree,free)
 peakbytes=max(peakbytes,allocated);peaklogical=max(peaklogical,logical)
 return free,max(allocated,logical)

def fingerprint_corpus():
 files=[];total=0
 for folder,dirs,names in os.walk(CORPUS,followlinks=False):
  for name in dirs:
   assert not (Path(folder)/name).is_symlink()
  for name in names:
   p=Path(folder)/name;assert p.is_file() and not p.is_symlink()
   relative=p.relative_to(CORPUS).as_posix();digest=hashlib.sha256()
   with p.open('rb') as stream:
    for chunk in iter(lambda:stream.read(1024*1024),b''):digest.update(chunk)
   size=p.stat().st_size;total+=size;files.append([relative,size,digest.hexdigest()])
 files.sort();manifest=json.loads((CORPUS/'manifest.json').read_text())
 assert len(files)==626 and len(manifest['files'])==625 and len(manifest['articles'])==199
 assert {f[0] for f in files}=={'manifest.json',*manifest['files'].keys()}
 for relative,size,digest in files:
  if relative!='manifest.json':assert manifest['files'][relative]==digest,relative
 result={'manifest_sha256':sha(CORPUS/'manifest.json'),'corpus_sha256':hashlib.sha256((json.dumps(files,ensure_ascii=False,indent=2)+'\n').encode()).hexdigest(),'corpus_revision':manifest['revision'],'articles':199,'listed_sha_files':625,'files_including_manifest':626,'bytes_including_manifest':total,'png_files':sum(1 for f in files if f[0].lower().endswith('.png'))}
 assert frozen_input is not None and result==frozen_input['corpus'],'new-Hosted-corpus-descriptor-mismatch'
 assert files==frozen_input['corpus_files'],'new-Hosted-corpus-filelist-mismatch'
 return result

def observe_child_environment(row):
 global context_identity
 key=str(row['pid'])
 if key in proof['owned_child_environment_observations']:return
 q=subprocess.run(['/bin/ps','eww','-p',key,'-o','command='],capture_output=True,text=True,timeout=5)
 if q.returncode!=0:return
 assert len(q.stdout.encode())<=1024*1024,'environment-probe-output-limit'
 env=dict(re.findall(r'(?:^|\s)([A-Z_][A-Z0-9_]*)=([^\s]*)',q.stdout))
 if 'TMPDIR' not in env:return
 expected=str(CONTEXT)+'/'
 forbidden=[name for name in ['HOME','DEVELOPER_DIR','SDKROOT','NODE_BINARY','CLANG_MODULE_CACHE_PATH','SWIFT_MODULECACHE_PATH','AILIBRARY_OUTER_ENV_SENTINEL'] if name in env]
 entry={'pid':row['pid'],'ppid':row['ppid'],'pgid':row['pgid'],'comm':row['comm'],'direct_Node_child':bool(child and row['ppid']==child.pid),'observed_env_keys':sorted(env),'TMPDIR':env['TMPDIR'],'PATH':env.get('PATH'),'forbidden_outer_env_keys_observed':forbidden,'probe_stdout_sha256':hashlib.sha256(q.stdout.encode()).hexdigest(),'probe_stdout_bytes':len(q.stdout.encode()),'command_has_whole_module_optimization':'-whole-module-optimization' in q.stdout,'command_has_version_probe':'--version' in q.stdout}
 proof['owned_child_environment_observations'][key]=entry
 assert env['TMPDIR']==expected and not forbidden,'controlled-child-TMPDIR-or-env-mismatch'
 info=CONTEXT.lstat();marker=CONTEXT/'.owner.json';owner=json.loads(marker.read_text())
 assert CONTEXT.resolve()==CONTEXT and not CONTEXT.is_symlink() and info.st_uid==os.getuid() and (info.st_mode&0o7777)==0o700
 assert child and owner['pid']==child.pid and (marker.stat().st_mode&0o7777)==0o600
 observed={'path':str(CONTEXT),'dev':info.st_dev,'ino':info.st_ino,'uid':info.st_uid,'mode':'0700','marker_sha256':sha(marker),'owner_pid':owner['pid'],'token':owner['token']}
 if context_identity is None:context_identity=observed;proof['observed_owned_temp_context']={k:v for k,v in observed.items() if k!='token'}
 else:assert context_identity==observed,'private-context-identity-changed'

def remaining_owned(rows):return [row for row in rows.values() if row['pgid'] in known_groups]

def stop(reason):
 if child is None:return
 rows,_=owned_snapshot()
 entry={'reason':reason,'known_owned_groups':sorted(known_groups),'known_pids':sorted(known_pids),'parent_SIGTERM':False,'SIGKILL_fallback_groups':[]}
 if child.poll() is None:
  try:os.kill(child.pid,signal.SIGTERM);entry['parent_SIGTERM']=True
  except ProcessLookupError:pass
 until=time.monotonic()+2
 while time.monotonic()<until:
  rows,_=owned_snapshot()
  if child.poll() is not None and not remaining_owned(rows):break
  time.sleep(.05)
 rows,_=owned_snapshot()
 for group in sorted({row['pgid'] for row in remaining_owned(rows)}):
  if group in known_groups:
   try:os.killpg(group,signal.SIGKILL);entry['SIGKILL_fallback_groups'].append(group)
   except ProcessLookupError:pass
 try:child.wait(timeout=3)
 except subprocess.TimeoutExpired:entry['parent_wait_timed_out']=True
 until=time.monotonic()+2
 while time.monotonic()<until:
  rows=processes()
  if not remaining_owned(rows):break
  time.sleep(.05)
 entry['remaining_owned_rows']=remaining_owned(rows);entry['all_known_groups_absent']=not entry['remaining_owned_rows']
 proof['cleanup_actions'].append(entry)
 if entry['remaining_owned_rows']:raise RuntimeError('owned-process-group-remained-after-cleanup')

def on_signal(signum,frame):raise RuntimeError('outer-guard-signal:'+str(signum))
signal.signal(signal.SIGINT,on_signal);signal.signal(signal.SIGTERM,on_signal)
try:
 proof['start_free_bytes']=shutil.disk_usage(WORK).free
 if proof['start_free_bytes']<3800000000:raise RuntimeError('insufficient-start-free')
 fd=os.open(LOCK,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 os.write(fd,(json.dumps(owner)+'\n').encode());os.fsync(fd);st=os.fstat(fd);lock_identity=(st.st_dev,st.st_ino,owner['token']);os.close(fd)
 for name in ['xcodebuild','swift-frontend','swiftc','clang','clang++','actool']:
  result=subprocess.run(['/usr/bin/pgrep','-x',re.escape(name)],capture_output=True,text=True,timeout=5)
  proof['preflight_compilers'].append({'name':name,'escaped_pattern':re.escape(name),'exit_code':result.returncode,'pids':result.stdout.split(),'stderr':result.stderr})
  if result.returncode!=1:raise RuntimeError('preexisting-or-unknown-compiler:'+name)
 assert WORK.is_absolute() and not WORK.is_symlink() and WORK.resolve()==WORK and str(WORK).startswith('/private/tmp/ailibrary-core-current-cli-')
 frozen_input=json.loads(INPUT.read_text());proof['cli_input_manifest_SHA256']=sha(INPUT)
 assert re.fullmatch(r'[a-f0-9]{40}',os.environ['EXPECTED_SOURCE_HEAD']) and frozen_input['source_head']==os.environ['EXPECTED_SOURCE_HEAD']
 verify_manifest(REPO,INPUT)
 xcode=Path('/Applications/Xcode_16.4.app/Contents');version=plistlib.loads((xcode/'version.plist').read_bytes())
 assert version['CFBundleShortVersionString']=='16.4' and version['ProductBuildVersion']=='16F6'
 sdk=xcode/'Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.5.sdk'
 assert json.loads((sdk/'SDKSettings.json').read_text())['Version']=='15.5'
 capture=frozen_input['host_capture']
 assert platform.system()=='Darwin' and platform.machine()=='arm64' and platform.mac_ver()[0].startswith('15.')
 assert capture['macOS']==platform.mac_ver()[0] and capture['architecture']==platform.machine()
 assert capture['Xcode']=='16.4' and capture['Xcode_build']=='16F6' and capture['SDK']=='15.5'
 assert capture['SDKSettings_SHA256']==sha(sdk/'SDKSettings.json') and capture['Xcode_version_plist_SHA256']==sha(xcode/'version.plist')
 assert NODE==capture['Node_binary'] and Path(NODE).is_absolute()
 proof['new_Hosted_profile_capture']=capture
 proof['original_guard_SHA256']='6547d8e9b60eb75bab131844cb6aeeb3e3ef354397b4c764c1506267505b0373'
 write(WORK/'corpus-before.json',fingerprint_corpus())
 package=json.loads((REPO/'package.json').read_text())
 assert package['scripts']['ios:benchmark:core']=='bash ios/tests/check-core-performance.sh'
 assert not any(k in package['scripts'] for k in ['preios:benchmark:core','postios:benchmark:core'])
 assert frozen_input['entry']['mode']=='validated-alias-equivalent-direct-Node; npm wrapper not executed'
 proof['entry_equivalence']=frozen_input['entry']
 TMP.mkdir()
 config={'source_revision':frozen_input['source_head'],'source_tree':frozen_input['source_tree'],'repo':str(REPO),'corpus':str(CORPUS),'xcode':{'version':'16.4','build':'16F6','host_sdk':'15.5','target':'arm64-apple-macosx14.0','swift_language_mode':'5'},'comparison_with_historical_b79':'not comparable; separate Hosted profile'}
 write(WORK/'run-config.json',config)
 env={'PATH':'/usr/bin:/bin:/usr/sbin:/sbin','TMPDIR':str(TMP)+'/','DEVELOPER_DIR':str(xcode/'Developer'),'SDKROOT':str(sdk),'CLANG_MODULE_CACHE_PATH':str(CACHE),'SWIFT_MODULECACHE_PATH':str(CACHE)}
 env['NODE_BINARY']=NODE;env['AILIBRARY_OUTER_ENV_SENTINEL']='dummy-must-not-reach-production-children'
 command=[NODE,str(REPO/'ios/tests/core-performance-runner.mjs'),'--run','--repo',str(REPO),'--revision',config['source_revision'],'--corpus',str(CORPUS),'--output',str(WORK/'results'),'--swiftc',str(xcode/'Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/swiftc'),'--sdk',str(sdk),'--target','arm64-apple-macosx14.0','--swift-version','5'];proof['command']=command;proof['status']='running';write(WORK/'guard-proof.json',proof)
 outpath=WORK/'wrapper.stdout.txt';errpath=WORK/'wrapper.stderr.txt'
 free,size=measure()
 assert free>=3200000000 and size<=256*1024*1024,'pre-spawn-resource-floor-or-private-cap'
 assert time.monotonic()-start<180,'total180seconds-before-spawn'
 assert sha(INPUT)==proof['cli_input_manifest_SHA256'],'input-descriptor-changed-before-spawn'
 with outpath.open('xb') as out,errpath.open('xb') as err:
  child=subprocess.Popen(command,cwd=WORK,env=env,stdout=out,stderr=err,start_new_session=True)
  known_groups.add(child.pid);known_pids.add(child.pid);proof['wrapper_pid']=child.pid
  while child.poll() is None:
   rows,rss=owned_snapshot();free,size=measure();reason=None
   if free<3200000000:reason='floor-free'
   elif size>256*1024*1024:reason='private-output-and-cache-limit'
   elif rss>int(1.5*1024**3):reason='owned-process-tree-RSS-limit'
   elif time.monotonic()-start>=180:reason='total180seconds'
   elif outpath.stat().st_size+errpath.stat().st_size>8*1024*1024:reason='wrapper-output-cap'
   # The unchanged CLI enforces its combined1MiB compiler/child pipe cap.
   # The old mismatched outer compile-file placeholder is not claimed as a monitor.
   if reason:proof['resource_abort']=reason;stop(reason);break
   time.sleep(.1)
  proof['wrapper_exit_code']=child.wait();stop('normal-or-failed-wrapper-exit')
  if time.monotonic()-start>=180:proof['resource_abort']='total180seconds-after-return'
 if proof['resource_abort'] or proof['wrapper_exit_code']!=0:raise RuntimeError('first-wrapper-stopped')
 summary=json.loads((WORK/'results/summary.json').read_text());assert len(summary['order'])==19
 assert summary['status']=='observed-host-baseline'
 identity=json.loads((WORK/'results/identity.json').read_text());assert identity['toolchain_selection']['mode']=='explicit'
 assert identity['source_revision']==frozen_input['source_head']
 assert identity['production_source_sha256']==frozen_input['production_source4']
 assert identity['harness_sha256']==frozen_input['files']['ios/tests/PublishedCoreBenchmark.swift']['sha256']
 assert identity['runner_sha256']==frozen_input['files']['ios/tests/core-performance-runner.mjs']['sha256']
 assert identity['query_sha256']==frozen_input['files']['ios/tests/core-performance-queries.json']['sha256']
 assert identity['query_source_sha256']==frozen_input['files']['ios/AILibraryTests/SearchIndexTests.swift']['sha256']
 for key in ['manifest_sha256','corpus_sha256','bytes_including_manifest','files_including_manifest']:
  assert identity[key]==frozen_input['corpus'][key]
 assert identity['corpus_revision']==frozen_input['corpus']['corpus_revision']
 write(WORK/'corpus-after.json',fingerprint_corpus());assert (WORK/'corpus-before.json').read_bytes()==(WORK/'corpus-after.json').read_bytes()
 assert identity['spawn_environment']['TMPDIR']==str(CONTEXT)+'/'
 assert not CONTEXT.exists(),'private-context-not-cleaned-by-CLI'
 assert identity['compiler_flags'][:9]==['-parse-as-library','-swift-version','5','-O','-whole-module-optimization','-target','arm64-apple-macosx14.0','-sdk',str(sdk.resolve())]
 proof['status']='passed-Hosted-current-CLI-one-compile19processes'
except BaseException as error:
 proof['error']=repr(error);proof['status']='stopped-no-repeat'
 try:stop('outer-exception')
 except BaseException as cleanup_error:proof['cleanup_error']=repr(cleanup_error)
finally:
 measure();proof['seconds']=round(time.monotonic()-start,3);proof['minimum_observed_free_bytes']=minfree;proof['peak_private_allocated_bytes']=peakbytes;proof['peak_private_logical_bytes']=peaklogical;proof['peak_owned_tree_sum_RSS_bytes']=peakrss
 proof['resource_sampling_interval_seconds']=.1;proof['resource_interpretation']='Outer sampled disk/cache/tree-RSS envelopes are separate from benchmark Swift self ru_maxrss metric; not instantaneous unsampled maxima.'
 proof['known_owned_groups']=sorted(known_groups)
 try:
  assert sha(INPUT)==proof['cli_input_manifest_SHA256'],'input-descriptor-changed'
  verify_manifest(REPO,INPUT)
  proof['source_snapshot_unchanged']=True
 except BaseException as e:proof['source_snapshot_unchanged']=False;proof['freeze_error']=repr(e);proof['status']='stopped-no-repeat'
 proof['output_before_cleanup']={str(p.relative_to(WORK)):{'bytes':p.stat().st_size,'SHA256':sha(p)} for p in [WORK/'results/published-core-benchmark',WORK/'results/compiler.stderr.txt',WORK/'results/identity.json',WORK/'results/summary.json'] if p.is_file()}
 context_cleanup={'CLI_context_absent':not CONTEXT.exists(),'outer_removed_verified_owned_context':False}
 if CONTEXT.exists():
  try:
   assert context_identity is not None,'context-ownership-not-previously-observed'
   current=CONTEXT.lstat();marker=CONTEXT/'.owner.json';owner=json.loads(marker.read_text())
   assert CONTEXT.resolve()==CONTEXT and not CONTEXT.is_symlink() and current.st_uid==context_identity['uid'] and (current.st_dev,current.st_ino)==(context_identity['dev'],context_identity['ino'])
   assert owner['pid']==context_identity['owner_pid'] and owner['token']==context_identity['token'] and not marker.is_symlink()
   shutil.rmtree(CONTEXT);context_cleanup['outer_removed_verified_owned_context']=True
  except BaseException as e:context_cleanup['error']=repr(e);proof['status']='stopped-no-repeat';proof['context_cleanup_error']=repr(e)
 proof['context_cleanup']=context_cleanup
 cleaned=[]
 for p in [CACHE,TMP]:
  if p in [CACHE,TMP] and p.is_dir() and not p.is_symlink() and str(p.resolve()).startswith(str(WORK)+'/'):cleaned.append({'path':p.name,'bytes':sum(f.stat().st_size for f in p.rglob('*') if f.is_file())});shutil.rmtree(p)
 proof['cleaned_owned_cache_and_tmp_only']=cleaned
 proof['controlled_context_absent_after_CLI']=not CONTEXT.exists()
 # Preserve the executable identity in identity.json/proof, retain small raw outputs only.
 binary=WORK/'results/published-core-benchmark'
 if binary.is_file():proof['removed_owned_executable_after_recording_SHA256']=binary.name;binary.unlink()
 if lock_identity:
  try:
   st=LOCK.stat();current=json.loads(LOCK.read_text())
   if (st.st_dev,st.st_ino,current.get('token'))==lock_identity:LOCK.unlink();proof['owned_lock_inode_token_released']=True
   else:proof['owned_lock_inode_token_released']=False
  except BaseException as e:proof['lock_cleanup_error']=repr(e)
 proof['finished_at']=now();proof['final_free_bytes']=shutil.disk_usage(WORK).free;write(WORK/'guard-proof.json',proof)
 print(json.dumps({'status':proof['status'],'error':proof.get('error'),'seconds':proof['seconds'],'peak_RSS':peakrss,'minimum_free':minfree,'proof_SHA256':sha(WORK/'guard-proof.json')}),flush=True)
if proof['status']!='passed-Hosted-current-CLI-one-compile19processes':raise SystemExit(1)
